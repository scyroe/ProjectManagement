export const supabaseTransferDiagnosticsStorageKey =
  'supabase-transfer-diagnostics';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getCurrentRoute = () =>
  window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard';

export function createSupabaseTransferFetch() {
  const routeTotals = new Map();
  const pendingMeasurements = new Set();
  let totalPayloadBytes = 0;
  let requestCount = 0;
  let requestsWithMeasuredPayload = 0;
  let totalTransferBytes = 0;
  let requestsWithTransferSize = 0;
  let currentRoute = getCurrentRoute();

  const diagnostics = {
    reset() {
      routeTotals.clear();
      totalPayloadBytes = 0;
      requestCount = 0;
      requestsWithMeasuredPayload = 0;
      totalTransferBytes = 0;
      requestsWithTransferSize = 0;
      console.info('[Supabase transfer] Totals reset.');
    },
    async report() {
      await Promise.all(pendingMeasurements);
      const summary = {
        requests: requestCount,
        requestsWithMeasuredPayload,
        decodedResponsePayloadBytes: totalPayloadBytes,
        decodedResponsePayloadSize: formatBytes(totalPayloadBytes),
        requestsWithTransferSize,
        observedTransferBytes: totalTransferBytes,
        observedTransferSize: formatBytes(totalTransferBytes),
        routes: Array.from(routeTotals, ([route, totals]) => ({
          route,
          requests: totals.requests,
          decodedResponsePayloadBytes: totals.payloadBytes,
          decodedResponsePayloadSize: formatBytes(totals.payloadBytes),
          requestsWithTransferSize: totals.requestsWithTransferSize,
          observedTransferBytes: totals.transferBytes,
          observedTransferSize: formatBytes(totals.transferBytes),
        })),
      };
      console.info('[Supabase transfer] Session total', summary);
      return summary;
    },
  };

  window.__supabaseTransferDiagnostics = diagnostics;
  window.addEventListener('hashchange', () => {
    const nextRoute = getCurrentRoute();
    if (nextRoute === currentRoute) return;
    currentRoute = nextRoute;
    if (
      window.localStorage.getItem(supabaseTransferDiagnosticsStorageKey) ===
      'true'
    ) {
      console.info(`[Supabase transfer] Page changed to "${currentRoute}".`);
      diagnostics.report();
    }
  });

  return async (input, init) => {
    const originalFetch = globalThis.fetch.bind(globalThis);
    if (
      window.localStorage.getItem(supabaseTransferDiagnosticsStorageKey) !==
      'true'
    ) {
      return originalFetch(input, init);
    }

    const requestUrl = input instanceof Request ? input.url : String(input);
    const requestMethod =
      init?.method ?? (input instanceof Request ? input.method : 'GET');
    const requestPath = new URL(requestUrl).pathname;
    const requestRoute = currentRoute;
    const startedAt = performance.now();

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.round(performance.now() - startedAt);
      const timing = performance
        .getEntriesByName(requestUrl, 'resource')
        .filter((entry) => entry.startTime >= startedAt)
        .at(-1);
      const transferBytes = timing?.transferSize ?? 0;
      const routeTotalsForPage = routeTotals.get(requestRoute) ?? {
        payloadBytes: 0,
        requests: 0,
        requestsWithTransferSize: 0,
        transferBytes: 0,
      };
      requestCount += 1;
      routeTotalsForPage.requests += 1;
      if (transferBytes > 0) {
        totalTransferBytes += transferBytes;
        requestsWithTransferSize += 1;
        routeTotalsForPage.transferBytes += transferBytes;
        routeTotalsForPage.requestsWithTransferSize += 1;
      }
      routeTotals.set(requestRoute, routeTotalsForPage);

      let responseBody;
      try {
        responseBody = response.clone().arrayBuffer();
      } catch (error) {
        console.warn(
          `[Supabase transfer] Could not read ${requestMethod.toUpperCase()} ${requestPath} response body.`,
          error,
        );
        return response;
      }
      const measurement = responseBody
        .then((body) => {
          const payloadBytes = body.byteLength;
          totalPayloadBytes += payloadBytes;
          requestsWithMeasuredPayload += 1;
          routeTotalsForPage.payloadBytes += payloadBytes;
          console.info(
            `[Supabase transfer] ${requestMethod.toUpperCase()} ${requestPath}`,
            {
              status: response.status,
              durationMs,
              decodedResponsePayloadBytes: payloadBytes,
              decodedResponsePayloadSize: formatBytes(payloadBytes),
              observedTransferBytes: transferBytes || 'unavailable',
              cumulativePayloadSize: formatBytes(totalPayloadBytes),
              page: requestRoute,
            },
          );
        })
        .catch((error) => {
          console.warn(
            `[Supabase transfer] Could not measure ${requestMethod.toUpperCase()} ${requestPath} response body.`,
            error,
          );
        })
        .finally(() => pendingMeasurements.delete(measurement));
      pendingMeasurements.add(measurement);
      return response;
    } catch (error) {
      console.info(
        `[Supabase transfer] ${requestMethod.toUpperCase()} ${requestPath} failed`,
        {
          durationMs: Math.round(performance.now() - startedAt),
          page: requestRoute,
        },
      );
      throw error;
    }
  };
}
