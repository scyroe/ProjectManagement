import { createContext, useContext } from 'react';

const AnimationPreferencesContext = createContext(true);

export function AnimationPreferencesProvider({ children, enabled }) {
  return (
    <AnimationPreferencesContext.Provider value={enabled}>
      {children}
    </AnimationPreferencesContext.Provider>
  );
}

export function useAnimationsEnabled() {
  return useContext(AnimationPreferencesContext);
}
