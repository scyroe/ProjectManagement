import { useAuthForm } from '@/hooks/use-auth-form';
import AuthForm from './AuthForm';
import AuthLayout from './AuthLayout';

const SignUpScreen = ({ onSwitch }) => {
  const auth = useAuthForm({ signUp: true });

  return (
    <AuthLayout onSwitch={onSwitch} signUp>
      <AuthForm auth={auth} signUp />
    </AuthLayout>
  );
};

export default SignUpScreen;
