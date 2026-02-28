'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TerrainMesh from './TerrainMesh';
import CropModel from './CropModel';
import Atmosphere from './Atmosphere';
import WeatherSystem from './WeatherSystem';
import PostProcessing from './PostProcessing';
import type { CropScore, WeatherCondition } from '@/lib/store';

interface FarmSceneProps {
    crops: CropScore[];
    layout: string;
    lat: number;
    lng: number;
    hour: number;
    dayOfYear: number;
    acreage: number;
    weatherCondition: WeatherCondition;
}

function generateCropPositions(crops: CropScore[], layout: string, acreage: number): { type: string; pos: [number, number, number] }[] {
    const positions: { type: string; pos: [number, number, number] }[] = [];
    const gridSize = Math.ceil(Math.sqrt(acreage) * 3);
    const topCrops = crops.slice(0, layout === 'max-yield' ? 4 : layout === 'low-maint' ? 3 : 4);

    if (topCrops.length === 0) return positions;

    const spacing = 1.8;
    const startX = -(gridSize * spacing) / 2;
    const startZ = -(gridSize * spacing) / 2;

    let cropIndex = 0;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const crop = topCrops[cropIndex % topCrops.length];
            const x = startX + col * spacing + (Math.random() - 0.5) * 0.3;
            const z = startZ + row * spacing + (Math.random() - 0.5) * 0.3;
            const distFromCenter = Math.sqrt(x * x + z * z);

            if (distFromCenter < gridSize * 0.8) {
                positions.push({
                    type: crop.name,
                    pos: [x, 0, z],
                });
            }
            cropIndex++;
        }
    }

    return positions;
}

export default function FarmScene({ crops, layout, lat, lng, hour, dayOfYear, acreage, weatherCondition }: FarmSceneProps) {
    const cropPositions = useMemo(
        () => generateCropPositions(crops, layout, acreage),
        [crops, layout, acreage]
    );

    return (
        <Canvas
            camera={{ position: [0, 15, 20], fov: 45 }}
            shadows
            gl={{ antialias: true, toneMapping: 6, toneMappingExposure: 1.0 }}
            style={{ background: '#0a0d0a' }}
        >
            <Suspense fallback={null}>
                <Atmosphere
                    lat={lat}
                    lng={lng}
                    hour={hour}
                    dayOfYear={dayOfYear}
                    weatherCondition={weatherCondition}
                />

                <WeatherSystem condition={weatherCondition} terrainSize={30} />

                <TerrainMesh size={30} resolution={48} elevation={0.4} weatherCondition={weatherCondition} />

                {cropPositions.map((crop, i) => (
                    <CropModel
                        key={`${layout}-${i}`}
                        type={crop.type}
                        position={crop.pos}
                        scale={0.8 + Math.random() * 0.4}
                    />
                ))}

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={5}
                    maxDistance={50}
                />

                <PostProcessing />
            </Suspense>
        </Canvas>
    );
}
