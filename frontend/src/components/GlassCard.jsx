import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const GlassCard = ({ children, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay }}
            className={twMerge(
                clsx(
                    "glass-panel rounded-2xl p-6 relative overflow-hidden",
                    "border border-white/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl",
                    "transition-colors duration-300",
                    className
                )
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
