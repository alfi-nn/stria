import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ParticleText from './ParticleText';
import GeometricBackground from './GeometricBackground';

const Welcome = ({ onStart }) => {
    const { theme, toggleTheme } = useTheme();
    const [explode, setExplode] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExplode(true);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative z-20 overflow-hidden">
            <GeometricBackground />
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-30">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-transparent border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all hover:border-slate-400 dark:hover:border-white/40"
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-5xl px-0 w-full mx-auto"
            >
                {/* 
                   Height here (220px) must match the height prop passed to ParticleText 
                   to ensure vertical alignment centers are identical.
                */}
                <div className="mb-2 relative w-full flex justify-center items-center h-[220px]">
                    <div className="absolute inset-0 bg-accent-primary/10 blur-[100px] rounded-full" />

                    {/* Layer 1: Particle Animation (Explodes Out) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ParticleText text="Stria" height={220} isExploding={explode} />
                    </div>

                    {/* Layer 2: Static Text (Resolves In - After Particles Fade) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <motion.h1
                            initial={{ opacity: 0, scale: 1, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 2.5, delay: 4.2, ease: "easeOut" }}
                            className="text-8xl md:text-9xl lg:text-[10rem] font-bold font-brand bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-white dark:to-white/60 leading-none tracking-tighter drop-shadow-2xl"
                        >
                            Stria
                        </motion.h1>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 6.5, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <h2 className="text-xl md:text-2xl text-slate-800 dark:text-white/80 font-light mb-6 font-brand transition-colors">
                        Precision Algorithmic Artistry
                    </h2>

                    <p className="text-slate-500 dark:text-white/50 text-base mb-10 leading-relaxed transition-colors max-w-xl">
                        Transform your images into stunning thread art masterpieces using advanced computational geometry.
                        Experience the perfect blend of mathematics and aesthetic design.
                    </p>

                    <div className="flex flex-col gap-2.5 items-center w-full max-w-[200px] mx-auto">
                        <button
                            onClick={onStart}
                            className="w-full py-2 rounded-md bg-transparent border border-slate-300 dark:border-white/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-sm hover:shadow-md"
                        >
                            Log In
                        </button>

                        <button
                            onClick={onStart}
                            className="w-full py-2 rounded-md bg-transparent border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-all"
                        >
                            Sign Up
                        </button>

                        <button
                            onClick={onStart}
                            className="mt-0.5 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-colors text-[10px] font-medium tracking-wide border-b border-transparent hover:border-slate-400 dark:hover:border-white/40 pb-0.5"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-10 w-24 h-24 border border-slate-200 dark:border-white/5 rounded-full animate-pulse opacity-50 dark:opacity-100 transition-colors" />
            <div className="absolute bottom-20 right-20 w-32 h-32 border border-slate-200 dark:border-white/5 rounded-full animate-pulse delay-700 opacity-50 dark:opacity-100 transition-colors" />
        </div>
    );
};

export default Welcome;
