"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  theme: string;
  setTheme: (theme: string) => void;
  className?: string;
}

export default function ThemeToggler({ theme, setTheme, className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isDark = theme === "dark";
  
  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 mt-4 px-2 ${className}`}>
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-3 mt-4 px-2 ${className}`}>
            {/* Sun Icon */}
            <motion.div
              animate={{
                scale: isDark ? 0.8 : 1,
                opacity: isDark ? 0.4 : 1,
              }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }}
              className="relative will-change-transform"
            >
              <Sun className={`h-5 w-5 ${isDark ? "text-muted-foreground" : "text-amber-500"}`} />
            </motion.div>
            
            {/* Switch */}
            <motion.div
              whileHover={reduceMotion ? {} : { scale: 1.05 }}
              whileTap={reduceMotion ? {} : { scale: 0.95 }}
              className="relative"
            >
              <Switch
                checked={isDark}
                onCheckedChange={handleThemeChange}
                className="data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-amber-200 shadow-md hover:shadow-lg "
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                tabIndex={0}
                role="switch"
                aria-checked={isDark}
              />
            </motion.div>
            
            {/* Moon Icon */}
            <motion.div
              animate={{
                scale: isDark ? 1 : 0.8,
                opacity: isDark ? 1 : 0.4,
              }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }}
              className="relative will-change-transform"
            >
              <Moon className={`h-5 w-5 ${isDark ? "text-blue-400" : "text-muted-foreground"}`} />
            </motion.div>
            
            {/* Reduced motion particles */}
            {!reduceMotion && (
              <AnimatePresence>
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 0.5, 0] }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`absolute w-1 h-1 rounded-full ${
                        isDark ? "bg-blue-400" : "bg-amber-400"
                      }`}
                      style={{
                        left: `${30 + i * 15}%`,
                        top: "50%",
                      }}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}