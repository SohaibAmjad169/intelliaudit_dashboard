// Brand Colors - Tesla Inspired
export const colors = {
  primary: {
    50: '#f0f7ff',
    100: '#e0efff',
    200: '#baddff',
    300: '#7cc0ff',
    400: '#36a5ff',
    500: '#0088ff',
    600: '#006fd4',
    700: '#0058aa',
    800: '#004a8c',
    900: '#003e73',
  },
  dark: {
    50: '#f7f7f8',
    100: '#eeeef0',
    200: '#d9d9dc',
    300: '#b6b7bc',
    400: '#8e8f97',
    500: '#6c6d77',
    600: '#55565f',
    700: '#1e1f23',  // Main background
    800: '#18191d',  // Card/container background
    900: '#141518',  // Header/top-level background
  },
  light: {
    50: '#ffffff',
    100: '#fafafa',
    200: '#f5f5f5',
    300: '#e5e7eb',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Animation variants - Tesla-style smooth animations
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.3 }
  },
  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.01,
    transition: { duration: 0.2 }
  }
};
