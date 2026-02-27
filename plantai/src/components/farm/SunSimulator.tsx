'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SunCalc from 'suncalc';

interface SunSimulatorProps {
    lat: number;
    lng: number;
    hour: number; // 0-24
    dayOfYear: number; // 0-365
}

export default function SunSimulator({ lat, lng, hour, dayOfYear }: SunSimulatorProps) {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const sunRef = useRef<THREE.Mesh>(null);

    const sunPosition = useMemo(() => {
        const date = new Date();
        date.setMonth(0, 1);
        date.setDate(date.getDate() + dayOfYear);
        date.setHours(Math.floor(hour), (hour % 1) * 60, 0);

        const pos = SunCalc.getPosition(date, lat, lng);
        const altitude = Math.max(pos.altitude, 0.05); // Keep above horizon
        const azimuth = pos.azimuth;
        const distance = 30;

        return {
            x: distance * Math.cos(altitude) * Math.sin(azimuth),
            y: distance * Math.sin(altitude),
            z: distance * Math.cos(altitude) * Math.cos(azimuth),
            intensity: Math.max(0.2, Math.sin(altitude) * 2),
            color: altitude < 0.15 ? '#ff8c42' : altitude < 0.3 ? '#ffd700' : '#fffbe8',
        };
    }, [lat, lng, hour, dayOfYear]);

    useFrame(() => {
        if (lightRef.current) {
            lightRef.current.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
            lightRef.current.intensity = sunPosition.intensity;
        }
        if (sunRef.current) {
            sunRef.current.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
        }
    });

    return (
        <>
            <directionalLight
                ref={lightRef}
                position={[sunPosition.x, sunPosition.y, sunPosition.z]}
                intensity={sunPosition.intensity}
                color={sunPosition.color}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-15}
                shadow-camera-right={15}
                shadow-camera-top={15}
                shadow-camera-bottom={-15}
            />
            {/* Sun sphere */}
            <mesh ref={sunRef} position={[sunPosition.x, sunPosition.y, sunPosition.z]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color={sunPosition.color} />
            </mesh>
            {/* Ambient light */}
            <ambientLight intensity={0.3} color="#c4dbe0" />
        </>
    );
}
