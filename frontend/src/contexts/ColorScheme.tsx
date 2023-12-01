import { ReactNode, createContext, useEffect, useState } from 'react';

const getPrefersColorScheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

type colorMode = 'dark' | 'light';
const defaultValues = {
  colorScheme: getPrefersColorScheme(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setColorScheme: (_mode: colorMode) => {},
};

export const ColorSchemeContext = createContext(defaultValues);
export const ColorSchemeProvider = ({ children }: { children?: ReactNode }) => {
  const [colorScheme, setColorScheme] = useState<colorMode>(
    (localStorage.theme === 'dark' ? 'dark' : 'light') ||
      (!('theme' in localStorage) && getPrefersColorScheme())
  );

  const setMode = (mode: colorMode | null) => {
    if (mode === null) {
      localStorage.removeItem('theme');
      setColorScheme(getPrefersColorScheme());
      return;
    }

    localStorage.setItem('theme', mode);
    setColorScheme(mode);
  };

  useEffect(() => {
    if (colorScheme === 'light') document.body.classList.remove('dark');
    else document.body.classList.add('dark');
  }, [colorScheme]);

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme: setMode }}>
      {children}
    </ColorSchemeContext.Provider>
  );
};
