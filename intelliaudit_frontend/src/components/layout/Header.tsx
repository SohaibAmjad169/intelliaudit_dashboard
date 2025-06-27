import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../contexts/AuthContext';
// Remove UserService import since we don't have a users table
// import { UserService, type ProfileResponse } from '../../services/users/userService';
import { 
  LogOut, 
  ChevronDown,
  Upload
} from 'lucide-react';
import { ThemeToggle } from '../shared/actions/ThemeToggle';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const { user, signOut } = useAuth();
  const headerRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Remove profile state since we're not fetching profile data
  // const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  
  // User profile and authentication management
  // Remove the useEffect that fetches user profile
  // useEffect(() => {
  //   if (user) {
  //     UserService.getProfile().then(setProfile).catch(console.error);
  //   }
  // }, [user]);

  // Disable avatar upload functionality
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Comment out functionality since we don't have a users table
    console.log('Avatar upload disabled - no users table available');
    setShowUserMenu(false);
    // const file = e.target.files?.[0];
    // if (file) {
    //   try {
    //     const updatedProfile = await UserService.updateAvatar(file);
    //     setProfile(updatedProfile);
    //     setShowUserMenu(false);
    //   } catch (error) {
    //     console.error('Failed to update avatar:', error);
    //   }
    // }
  };

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
  };

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-emerald-500/10 ${className}`}
      >
        <div className="h-16 px-4 flex items-center justify-between w-full mx-auto">
          {/* Left section - Empty or optional breadcrumbs */}
          <div className="flex-1 flex items-center">
            {/* Space for future breadcrumbs or context-specific controls */}
          </div>

          {/* Center section - Reserved for future use */}
          <div className="hidden md:flex flex-1 justify-center px-4 max-w-md">
            {/* Space reserved for future components */}
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile actions - Reserved for future use */}
            <div className="md:hidden flex-1 mr-2">
              {/* Space reserved for mobile-specific actions */}
            </div>
            
            {/* Theme Toggle */}
            <div className="rounded-md overflow-hidden border border-emerald-500/20">
              <div className="p-1 hover:bg-accent/50 transition-colors">
                <ThemeToggle />
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <div className="rounded-md overflow-hidden border border-emerald-500/20">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-md border border-input"
                >
                  {/* Always use the initials avatar since we don't have profile.avatar_url */}
                  <div 
                    ref={avatarRef}
                    className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-foreground font-medium"
                  >
                    <span className="relative z-10">{user?.email?.[0].toUpperCase()}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-card border border-emerald-500/20 overflow-hidden z-50"
                  >
                    {/* User info header */}
                    <div className="p-3 border-b border-emerald-500/10">
                      <div className="font-medium text-sm">{user?.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">User Account</div>
                    </div>
                    
                    <div className="py-1">
                      {/* Avatar Upload - Disabled */}
                      {/* 
                      <label className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer group">
                        <Upload className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        Change Avatar
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                      
                      <div className="h-px bg-emerald-500/10 my-1 mx-4"></div>
                      */}
                      
                      {/* Logout */}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent group"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}