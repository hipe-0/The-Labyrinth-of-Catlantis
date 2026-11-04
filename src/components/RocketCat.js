// src/components/RocketCat.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { CuteCat } from './CuteCat';
import { GAME_CONFIG } from '../config/gameConfig';
import { getCatRocketPose } from '../utils/rocket';

export function RocketCat({ x, z, color, onComplete }) {
  const groupRef = useRef();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const { CAT_ROCKET } = GAME_CONFIG;

  useFrame((state, delta) => {
    const group = groupRef.current;

    if (!group || completedRef.current) {
      return;
    }

    elapsedRef.current = Math.min(
      elapsedRef.current + Math.min(delta, 0.1),
      CAT_ROCKET.DURATION
    );

    const pose = getCatRocketPose({
      elapsed: elapsedRef.current,
      delay: CAT_ROCKET.DELAY,
      duration: CAT_ROCKET.DURATION,
      height: CAT_ROCKET.HEIGHT,
      spinSpeed: CAT_ROCKET.SPIN_SPEED,
      endScale: CAT_ROCKET.END_SCALE,
    });

    group.position.set(x, pose.y, z);
    group.rotation.y = pose.spin;
    group.scale.setScalar(pose.scale);

    if (elapsedRef.current >= CAT_ROCKET.DURATION) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <CuteCat color={color} />
    </group>
  );
}
