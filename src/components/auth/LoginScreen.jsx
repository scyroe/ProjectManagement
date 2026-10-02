import { useAuthForm } from '@/hooks/use-auth-form';
import AuthForm from './AuthForm';
import AuthLayout from './AuthLayout';

const LoginScreen = ({ onSwitch }) => {
  const auth = useAuthForm({ signUp: false });

  return (
    <AuthLayout onSwitch={onSwitch} signUp={false}>
      <AuthForm auth={auth} signUp={false} />
    </AuthLayout>
  );
};

export default LoginScreen;
