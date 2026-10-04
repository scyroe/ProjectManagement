import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function DashboardOnboarding({
  completedSetupSteps,
  guidedSteps,
  onDismiss,
  onReopen,
  setupComplete,
  setupLoading,
  setupUnavailable,
  showOnboarding,
  t,
}) {
  return (
    <>
      <section className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t.heading}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.description}
            </p>
          </div>
          {!showOnboarding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReopen}
            >
              <Sparkles aria-hidden="true" />
              {t.showOnboarding}
            </Button>
          )}
        </div>
      </section>
      {showOnboarding && (
        <section
          className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4"
          aria-labelledby="onboarding-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                <h2 id="onboarding-title" className="text-sm font-semibold">
                  {t.onboardingTitle}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.onboardingDescription}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {setupLoading
                  ? t.onboardingLoading
                  : setupUnavailable
                    ? t.onboardingLoadError
                    : setupComplete
                      ? t.onboardingComplete
                      : `${t.onboardingProgress}: ${completedSetupSteps}/${guidedSteps.length}`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.dismissOnboarding}
              onClick={onDismiss}
            >
              <X />
            </Button>
          </div>
          <ol className="mt-4 grid gap-2 lg:grid-cols-3">
            {guidedSteps.map((step, index) => {
              const StepIcon = step.Icon;
              return (
                <li
                  key={step.title}
                  className={`rounded-lg border bg-background/80 p-3 ${
                    step.complete ? 'border-primary/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {step.complete ? (
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[0.625rem] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <StepIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {step.title}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                      {step.complete ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <CheckCircle2
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {t.onboardingStepComplete}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant={step.canStart ? 'outline' : 'ghost'}
                          className="mt-3"
                          disabled={
                            !step.canStart || setupLoading || setupUnavailable
                          }
                          onClick={step.onClick}
                        >
                          {setupUnavailable
                            ? t.onboardingLoadError
                            : setupLoading
                              ? t.onboardingLoading
                              : step.canStart
                                ? step.action
                                : t.onboardingStepLocked}
                          {step.canStart && <ArrowRight aria-hidden="true" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
  );
}

export default DashboardOnboarding;
