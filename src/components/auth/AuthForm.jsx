import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStrings } from '@/lib/i18n';

const AuthForm = ({ signUp, auth }) => {
  const { form: t } = useStrings().auth;

  return (
    <form className="space-y-5" onSubmit={auth.handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="auth-email">{t.emailLabel}</Label>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          required
          value={auth.email}
          onChange={(event) => auth.setEmail(event.target.value)}
          placeholder={t.emailPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="auth-password">{t.passwordLabel}</Label>
          {!signUp && (
            <span className="text-xs text-muted-foreground">
              {t.secureAccess}
            </span>
          )}
        </div>
        <Input
          id="auth-password"
          type="password"
          autoComplete={signUp ? 'new-password' : 'current-password'}
          minLength={6}
          required
          value={auth.password}
          onChange={(event) => auth.setPassword(event.target.value)}
          placeholder={t.passwordPlaceholder}
        />
      </div>
      {auth.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {auth.error}
        </p>
      )}
      {auth.message && (
        <p className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success-foreground">
          {auth.message}
        </p>
      )}
      <Button type="submit" className="h-10 w-full" disabled={auth.submitting}>
        {auth.submitting
          ? t.submitting
          : signUp
            ? t.signUpSubmit
            : t.signInSubmit}
      </Button>
    </form>
  );
};

export default AuthForm;
