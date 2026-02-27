'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export default function AnimatedNumber({
    value,
    duration = 1.5,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
}: AnimatedNumberProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    const spring = useSpring(0, {
        stiffness: 50,
        damping: 20,
        duration: duration * 1000,
    });

    const display = useTransform(spring, (v) => {
        return `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                    spring.set(value);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, spring, isVisible]);

    return (
        <motion.span
            ref={ref}
            className={`font-mono tabular-nums ${className}`}
            style={{ fontFamily: 'var(--font-mono)' }}
        >
            {display}
        </motion.span>
    );
}
