'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode;
    variant?: 'default' | 'bright' | 'popup';
    padding?: string;
    className?: string;
}

export default function GlassCard({
    children,
    variant = 'default',
    padding = 'p-5',
    className = '',
    ...motionProps
}: GlassCardProps) {
    const baseStyles = {
        default: 'glass',
        bright: 'glass-bright',
        popup: 'glass',
    };

    return (
        <motion.div
            className={`${baseStyles[variant]} ${padding} ${className}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
}
