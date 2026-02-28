'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { WeatherCondition } from '@/lib/store';

interface WeatherSystemProps {
    condition: WeatherCondition;
    terrainSize?: number;
}

function RainSystem({ terrainSize = 30 }: { terrainSize: number }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dropCount = 3000;

    const dropData = useMemo(() => {
        const positions = new Float32Array(dropCount * 3);
        const velocities = new Float32Array(dropCount);
        const spread = terrainSize * 0.7;

        for (let i = 0; i < dropCount; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
            velocities[i] = 15 + Math.random() * 10;
        }
        return { positions, velocities, spread };
    }, [dropCount, terrainSize]);

    const dropGeometry = useMemo(() => new THREE.CylinderGeometry(0.005, 0.005, 0.3, 3), []);
    const dropMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#a8c4d4',
        transparent: true,
        opacity: 0.4,
    }), []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const { positions, velocities, spread } = dropData;

        for (let i = 0; i < dropCount; i++) {
            positions[i * 3 + 1] -= velocities[i] * delta;

            if (positions[i * 3 + 1] < -0.5) {
                positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
                positions[i * 3 + 1] = 18 + Math.random() * 5;
                positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
            }

            dummy.position.set(
                positions[i * 3 + 0],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[dropGeometry, dropMaterial, dropCount]}
            frustumCulled={false}
        />
    );
}

function SnowSystem({ terrainSize = 30 }: { terrainSize: number }) {
    return (
        <Sparkles
            count={800}
            scale={[terrainSize * 0.7, 15, terrainSize * 0.7]}
            size={3}
            speed={0.3}
            color="#ffffff"
            opacity={0.8}
            noise={1}
        />
    );
}

export default function WeatherSystem({ condition, terrainSize = 30 }: WeatherSystemProps) {
    if (condition === 'clear') return null;

    return (
        <>
            {condition === 'rain' && <RainSystem terrainSize={terrainSize} />}
            {condition === 'snow' && <SnowSystem terrainSize={terrainSize} />}
        </>
    );
}
