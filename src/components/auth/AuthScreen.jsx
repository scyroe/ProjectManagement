import { useAuthScreen } from '@/hooks/use-auth-screen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';

const AuthScreen = () => {
  const { signUp, toggleMode } = useAuthScreen();

  return signUp ? (
    <SignUpScreen onSwitch={toggleMode} />
  ) : (
    <LoginScreen onSwitch={toggleMode} />
  );
};

export default AuthScreen;
