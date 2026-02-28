'use client';

import {
    EffectComposer,
    DepthOfField,
    Bloom,
    Vignette,
    HueSaturation,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostProcessing() {
    return (
        <EffectComposer multisampling={4}>
            <DepthOfField
                focusDistance={0}
                focalLength={0.05}
                bokehScale={3}
                height={480}
            />
            <Bloom
                luminanceThreshold={0.8}
                luminanceSmoothing={0.3}
                intensity={0.4}
                mipmapBlur
            />
            <Vignette
                offset={0.3}
                darkness={0.6}
                blendFunction={BlendFunction.NORMAL}
            />
            <HueSaturation
                hue={0}
                saturation={0.15}
                blendFunction={BlendFunction.NORMAL}
            />
        </EffectComposer>
    );
}
