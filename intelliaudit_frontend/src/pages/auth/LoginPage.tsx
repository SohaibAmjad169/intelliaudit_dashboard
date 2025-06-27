import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from "@/hooks/useTheme";
import { supabase } from '@/clients';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/shared/actions/Button';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-dark-950 text-white' : 'bg-white text-gray-900'
      }`}>
        Loading...
      </div>
    );
  }

  // If we're already logged in, redirect to the intended page or projects
  if (user) {
    const from = location.state?.from?.pathname || '/projects';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Successfully logged in!');
      const from = location.state?.from?.pathname || '/projects';
      navigate(from);
    } catch (error) {
      console.error('Failed to login:', error instanceof Error ? error.message : error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode ? 'bg-dark-950' : 'bg-white'
    }`}>
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
          isDarkMode 
            ? 'hover:bg-dark-800 text-gray-400 hover:text-gray-200' 
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative logo-container mb-4">
            {/* Background glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300/40 via-emerald-400/30 to-transparent opacity-40 blur-[4px]"></div>
            
            {/* Main icon */}
            <Zap 
              className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)] relative z-10"
            />
            
            {/* Power line */}
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.7)]"></div>
          </div>
          
          <h2 className={`text-center text-3xl font-semibold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Sign in to <span className="text-emerald-500">IntelliAudit</span>
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode 
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode 
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className={`text-sm text-red-600 ${isDarkMode ? 'text-red-400' : ''}`}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className={`w-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white ${
              isDarkMode ? 'shadow-emerald-900/20' : 'shadow-emerald-500/20'
            } shadow-lg`}
            isLoading={isLoggingIn}
          >
            Sign in
          </Button>
        </form>

        <div className="flex flex-col items-center space-y-2">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Powered by
          </p>
          <img 
            src="/assets/vertbuild-logo.svg"
            alt="VertBuild.ai" 
            className={`h-6 w-auto ${isDarkMode ? 'drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
