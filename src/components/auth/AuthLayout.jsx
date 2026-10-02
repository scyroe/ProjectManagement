import {
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { useStrings } from '@/lib/i18n';

const AuthLayout = ({ children, onSwitch, signUp }) => {
  const t = useStrings().auth.layout;

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-[24rem] overflow-hidden bg-slate-950 lg:block">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85"
          alt="Team collaborating around a project plan"
          className="absolute inset-0 size-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-950">
              <BriefcaseBusiness className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              {t.brand}
            </span>
          </div>
          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-white/75">
              <Sparkles className="size-4" />
              {t.tagline}
            </p>
            <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              {t.heading}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">
              {t.description}
            </p>
            <div className="mt-8 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-300" />{' '}
                {t.featureOwnership}
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />{' '}
                {t.featurePrivate}
              </span>
            </div>
          </div>
          <p className="text-xs text-white/50">{t.footer}</p>
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <Frame className="w-full max-w-md" stacked maximizable={false}>
          <FrameHeader className="gap-4 pb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden">
              <BriefcaseBusiness className="size-5" />
            </div>
            <div>
              <FrameTitle className="text-2xl">
                {signUp ? t.signUpTitle : t.signInTitle}
              </FrameTitle>
              <FrameDescription className="mt-1">
                {signUp ? t.signUpDescription : t.signInDescription}
              </FrameDescription>
            </div>
          </FrameHeader>
          <FramePanel>{children}</FramePanel>
          <FrameFooter className="items-center border-t pt-5">
            <Button type="button" variant="link" onClick={onSwitch}>
              {signUp ? t.switchToSignIn : t.switchToSignUp}
            </Button>
          </FrameFooter>
        </Frame>
      </section>
    </main>
  );
};

export default AuthLayout;
