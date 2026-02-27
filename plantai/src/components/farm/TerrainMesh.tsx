'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TerrainMeshProps {
    size?: number;
    resolution?: number;
    elevation?: number;
}

export default function TerrainMesh({ size = 20, resolution = 64, elevation = 0.5 }: TerrainMeshProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
        const positions = geo.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getY(i);
            // Terrain heightmap using Perlin-like noise approximation
            const height =
                Math.sin(x * 0.3) * Math.cos(z * 0.4) * elevation * 0.5 +
                Math.sin(x * 0.7 + 1) * Math.cos(z * 0.5 + 2) * elevation * 0.3 +
                Math.sin(x * 1.5 + 3) * Math.cos(z * 1.2 + 1) * elevation * 0.15;
            positions.setZ(i, height);
        }

        geo.computeVertexNormals();
        return geo;
    }, [size, resolution, elevation]);

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial
                color="#3d5e2f"
                roughness={0.9}
                metalness={0.0}
                flatShading={false}
            />
        </mesh>
    );
}
