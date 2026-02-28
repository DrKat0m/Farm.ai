'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import SunCalc from 'suncalc';
import type { WeatherCondition } from '@/lib/store';

interface AtmosphereProps {
    lat: number;
    lng: number;
    hour: number;
    dayOfYear: number;
    weatherCondition: WeatherCondition;
}

export default function Atmosphere({ lat, lng, hour, dayOfYear, weatherCondition }: AtmosphereProps) {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const { scene } = useThree();

    const sunData = useMemo(() => {
        const date = new Date();
        date.setMonth(0, 1);
        date.setDate(date.getDate() + dayOfYear);
        date.setHours(Math.floor(hour), (hour % 1) * 60, 0);

        const pos = SunCalc.getPosition(date, lat, lng);
        const altitude = Math.max(pos.altitude, 0.05);
        const azimuth = pos.azimuth;
        const distance = 30;

        const x = distance * Math.cos(altitude) * Math.sin(azimuth);
        const y = distance * Math.sin(altitude);
        const z = distance * Math.cos(altitude) * Math.cos(azimuth);

        const baseIntensity = Math.max(0.2, Math.sin(altitude) * 2);
        const intensity = weatherCondition === 'rain' ? baseIntensity * 0.4
            : weatherCondition === 'snow' ? baseIntensity * 0.5
            : baseIntensity;

        const color = altitude < 0.15 ? '#ff8c42' : altitude < 0.3 ? '#ffd700' : '#fffbe8';

        const fogColor = weatherCondition === 'rain' ? '#2a3328'
            : weatherCondition === 'snow' ? '#3a4038'
            : altitude < 0.15 ? '#1a1008'
            : altitude < 0.3 ? '#1a1a0a'
            : '#0a0d0a';

        const ambientIntensity = weatherCondition === 'clear' ? 0.3
            : weatherCondition === 'rain' ? 0.5
            : 0.45;

        return { x, y, z, intensity, color, altitude, fogColor, ambientIntensity };
    }, [lat, lng, hour, dayOfYear, weatherCondition]);

    const skyProps = useMemo(() => ({
        sunPosition: [sunData.x, sunData.y, sunData.z] as [number, number, number],
        turbidity: weatherCondition === 'rain' ? 20 : weatherCondition === 'snow' ? 15 : 8,
        rayleigh: weatherCondition === 'clear' ? 2 : 0.5,
        mieCoefficient: weatherCondition === 'rain' ? 0.1 : 0.005,
        mieDirectionalG: 0.8,
    }), [sunData, weatherCondition]);

    useFrame(() => {
        const fogColor = new THREE.Color(sunData.fogColor);
        if (!(scene.fog instanceof THREE.FogExp2)) {
            scene.fog = new THREE.FogExp2(sunData.fogColor, 0.015);
        } else {
            scene.fog.color.copy(fogColor);
        }

        if (lightRef.current) {
            lightRef.current.position.set(sunData.x, sunData.y, sunData.z);
            lightRef.current.intensity = sunData.intensity;
        }
    });

    const cloudOpacity = weatherCondition === 'rain' ? 0.9
        : weatherCondition === 'snow' ? 0.85
        : 0.4;

    const cloudCount = weatherCondition === 'clear' ? 3 : 8;

    return (
        <>
            <Sky {...skyProps} />

            <directionalLight
                ref={lightRef}
                position={[sunData.x, sunData.y, sunData.z]}
                intensity={sunData.intensity}
                color={sunData.color}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-camera-near={0.5}
                shadow-camera-far={80}
                shadow-bias={-0.0005}
            />

            <ambientLight intensity={sunData.ambientIntensity} color="#c4dbe0" />

            <hemisphereLight
                args={[
                    weatherCondition === 'clear' ? '#87CEEB' : '#5a6a5e',
                    '#3d5e2f',
                    0.15,
                ]}
            />

            <Clouds>
                {Array.from({ length: cloudCount }).map((_, i) => (
                    <Cloud
                        key={i}
                        position={[
                            (i - cloudCount / 2) * 12 + Math.sin(i * 2.1) * 8,
                            15 + Math.sin(i * 1.3) * 3,
                            -10 + Math.cos(i * 1.7) * 15,
                        ]}
                        speed={0.2}
                        opacity={cloudOpacity}
                        bounds={[10 + Math.sin(i) * 5, 2 + Math.cos(i) * 1, 4]}
                        segments={20}
                        volume={6}
                        color={weatherCondition === 'clear' ? '#ffffff' : '#b0b0b0'}
                    />
                ))}
            </Clouds>
        </>
    );
}
