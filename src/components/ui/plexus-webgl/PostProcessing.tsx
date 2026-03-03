import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { PlexusTheme } from './usePlexusTheme';

interface PostProcessingProps {
  theme: PlexusTheme;
}

export function PostProcessing({ theme }: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      theme.bloom.strength,
      theme.bloom.radius,
      theme.bloom.threshold,
    );
    comp.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    comp.addPass(new OutputPass());
    return comp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    if (bloomPassRef.current) {
      bloomPassRef.current.resolution.set(size.width, size.height);
    }
  }, [size, composer]);

  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = theme.bloom.strength;
      bloomPassRef.current.radius = theme.bloom.radius;
      bloomPassRef.current.threshold = theme.bloom.threshold;
    }
  }, [theme]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
