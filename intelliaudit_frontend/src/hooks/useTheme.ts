import { useTheme as useNextTheme } from 'next-themes';

// Re-export the hook with the same interface that the custom hook provided
export const useTheme = () => {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  
  const currentTheme = resolvedTheme || 'light';
  const isDarkMode = currentTheme === 'dark';
  
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };
  
  const toggleDarkMode = toggleTheme;
  const setDarkMode = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  };
  
  return {
    currentTheme,
    setTheme,
    toggleTheme,
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  };
}; 