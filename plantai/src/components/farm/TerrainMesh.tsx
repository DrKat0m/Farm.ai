'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { WeatherCondition } from '@/lib/store';

interface TerrainMeshProps {
    size?: number;
    resolution?: number;
    elevation?: number;
    weatherCondition?: WeatherCondition;
}

function generateGrassNormalMap(width = 256, height = 256): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const len = 2 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;

        const nx = Math.floor(128 + Math.cos(angle) * 40);
        const ny = Math.floor(128 + Math.sin(angle) * 40);

        ctx.strokeStyle = `rgb(${nx}, ${ny}, 220)`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const idx = (py * width + px) * 4;
            const wave = Math.sin(px * 0.05) * Math.cos(py * 0.07) * 15;
            data[idx + 0] = Math.max(0, Math.min(255, data[idx + 0] + wave));
            data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + wave * 0.7));
        }
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

function generateRoughnessMap(width = 256, height = 256): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 5 + Math.random() * 25;
        const roughVal = 150 + Math.random() * 80;
        ctx.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

export default function TerrainMesh({
    size = 20,
    resolution = 64,
    elevation = 0.5,
    weatherCondition = 'clear',
}: TerrainMeshProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
        const positions = geo.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getY(i);
            const height =
                Math.sin(x * 0.3) * Math.cos(z * 0.4) * elevation * 0.5 +
                Math.sin(x * 0.7 + 1) * Math.cos(z * 0.5 + 2) * elevation * 0.3 +
                Math.sin(x * 1.5 + 3) * Math.cos(z * 1.2 + 1) * elevation * 0.15;
            positions.setZ(i, height);
        }

        geo.computeVertexNormals();
        return geo;
    }, [size, resolution, elevation]);

    const { normalMap, roughnessMap } = useMemo(() => {
        if (typeof document === 'undefined') return { normalMap: null, roughnessMap: null };
        return {
            normalMap: generateGrassNormalMap(),
            roughnessMap: generateRoughnessMap(),
        };
    }, []);

    const materialProps = useMemo(() => {
        if (weatherCondition === 'rain') {
            return { roughness: 0.1, metalness: 0.15, color: '#2d4e22', envMapIntensity: 0.8 };
        }
        if (weatherCondition === 'snow') {
            return { roughness: 0.95, metalness: 0.0, color: '#5a6e52', envMapIntensity: 0.2 };
        }
        return { roughness: 0.85, metalness: 0.0, color: '#3d5e2f', envMapIntensity: 0.3 };
    }, [weatherCondition]);

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial
                color={materialProps.color}
                roughness={materialProps.roughness}
                metalness={materialProps.metalness}
                normalMap={normalMap}
                normalScale={new THREE.Vector2(0.5, 0.5)}
                roughnessMap={roughnessMap}
                envMapIntensity={materialProps.envMapIntensity}
                flatShading={false}
            />
        </mesh>
    );
}
