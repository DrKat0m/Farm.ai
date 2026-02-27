'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CropModelProps {
    type: string;
    position: [number, number, number];
    scale?: number;
    onClick?: () => void;
}

const cropColors: Record<string, { stem: string; top: string; topShape: 'sphere' | 'cone' | 'cylinder' }> = {
    'Tomatoes': { stem: '#2d5016', top: '#dc2626', topShape: 'sphere' },
    'Sweet Corn': { stem: '#365314', top: '#eab308', topShape: 'cylinder' },
    'Bell Peppers': { stem: '#2d5016', top: '#f97316', topShape: 'sphere' },
    'Lettuce': { stem: '#4d7c0f', top: '#65a30d', topShape: 'sphere' },
    'Sunflowers': { stem: '#365314', top: '#fbbf24', topShape: 'sphere' },
    'Basil': { stem: '#2d5016', top: '#16a34a', topShape: 'cone' },
    'Potatoes': { stem: '#4d7c0f', top: '#65a30d', topShape: 'cone' },
    'Carrots': { stem: '#4d7c0f', top: '#22c55e', topShape: 'cone' },
    'Kale': { stem: '#2d5016', top: '#15803d', topShape: 'sphere' },
    'default': { stem: '#365314', top: '#4ade80', topShape: 'cone' },
};

export default function CropModel({ type, position, scale = 1, onClick }: CropModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const colors = cropColors[type] || cropColors.default;
    const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

    // Gentle wind sway
    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() + phaseOffset;
            groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
            groupRef.current.rotation.x = Math.cos(t * 0.6) * 0.02;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale} onClick={onClick}>
            {/* Stem */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.06, 0.8, 6]} />
                <meshStandardMaterial color={colors.stem} roughness={0.8} />
            </mesh>

            {/* Top / Fruit */}
            <mesh position={[0, 0.9, 0]} castShadow>
                {colors.topShape === 'sphere' && <sphereGeometry args={[0.2, 8, 8]} />}
                {colors.topShape === 'cone' && <coneGeometry args={[0.2, 0.4, 8]} />}
                {colors.topShape === 'cylinder' && <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />}
                <meshStandardMaterial color={colors.top} roughness={0.6} />
            </mesh>

            {/* Leaves */}
            {[0, 1.2, 2.4, 3.6].map((r, i) => (
                <mesh key={i} position={[Math.cos(r) * 0.15, 0.5 + i * 0.08, Math.sin(r) * 0.15]}
                    rotation={[0.3, r, 0.2]} castShadow>
                    <boxGeometry args={[0.15, 0.02, 0.08]} />
                    <meshStandardMaterial color={colors.stem} roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
}
