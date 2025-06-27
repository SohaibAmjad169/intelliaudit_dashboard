import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { Zap } from 'lucide-react';
import { useTheme } from "@/hooks/useTheme";

export default function LoadingScreen() {
  const { isDarkMode } = useTheme();

  const glowSpring = useSpring({
    from: { opacity: 0.3, scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 0.7, scale: 1.2 });
        await next({ opacity: 0.3, scale: 1 });
      }
    },
    config: {
      tension: 100,
      friction: 10,
    },
  });

  const lineSpring = useSpring({
    from: { width: '0%', opacity: 0 },
    to: { width: '100%', opacity: isDarkMode ? 0.8 : 0.3 },
    config: {
      tension: 120,
      friction: 14,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        ${isDarkMode ? 'bg-dark-900' : 'bg-white'}
      `}
    >
      <div className="relative mb-8">
        <Zap 
          className={`
            h-12 w-12
            ${isDarkMode ? 'text-yellow-400' : 'text-primary-600'}
          `}
        />
        <animated.div
          style={glowSpring}
          className={`
            absolute inset-0 rounded-full blur-xl
            ${isDarkMode ? 'bg-yellow-400' : 'bg-primary-600'}
          `}
        />
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`
          text-2xl font-bold mb-8
          ${isDarkMode ? 'text-light-50' : 'text-dark-900'}
        `}
      >
        IntelliAudit
      </motion.h1>

      <div className="w-48 h-[2px] relative overflow-hidden">
        <animated.div
          style={lineSpring}
          className={`
            absolute inset-0 h-full
            ${isDarkMode 
              ? 'bg-gradient-to-r from-yellow-500/0 via-yellow-400 to-yellow-500/0'
              : 'bg-gradient-to-r from-primary-500/0 via-primary-400 to-primary-500/0'
            }
          `}
        />
      </div>
    </motion.div>
  );
}
