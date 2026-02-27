'use client';

interface ProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    className?: string;
}

export default function ProgressRing({
    value,
    max = 100,
    size = 80,
    strokeWidth = 6,
    color = 'var(--color-primary)',
    label,
    className = '',
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const dashOffset = circumference * (1 - progress);

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span
                    className="text-sm font-medium"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
                >
                    {Math.round(value)}
                </span>
                {label && (
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}
