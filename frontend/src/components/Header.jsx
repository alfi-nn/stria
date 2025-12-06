import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Github, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Header = ({ currentView, onNavigate, onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-6 flex justify-between items-center z-50 relative"
        >
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
                    <Palette className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-brand bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-white dark:to-white/60 tracking-tight transition-all">
                        Stria
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-widest font-semibold transition-colors">
                        Precision Algorithmic Artistry
                    </p>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-slate-200/50 hover:bg-slate-300/50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {currentView !== 'dashboard' && (
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="px-4 py-2 rounded-lg bg-slate-200/50 hover:bg-slate-300/50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-medium transition-colors"
                    >
                        Back to Dashboard
                    </button>
                )}

                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-200 hover:text-red-700 dark:hover:text-white transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>
        </motion.header>
    );
};

export default Header;
