import { useState } from 'react';

export function useAuthScreen() {
  const [signUp, setSignUp] = useState(false);

  const toggleMode = () => setSignUp((current) => !current);

  return { signUp, toggleMode };
}
