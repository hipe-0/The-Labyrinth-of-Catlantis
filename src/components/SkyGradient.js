// src/components/SkyGradient.js
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';

const { SKY } = GAME_CONFIG;

const paletteToTarget = (palette) => ({
  topColor: new THREE.Color(palette.top),
  mid1Color: new THREE.Color(palette.mid1),
  mid2Color: new THREE.Color(palette.mid2),
  horizonColor: new THREE.Color(palette.horizon),
  glowColor: new THREE.Color(palette.glow),
  glowStrength: palette.glowStrength ?? SKY.GLOW_STRENGTH,
});

const vertexShader = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 topColor;
  uniform vec3 mid1Color;
  uniform vec3 mid2Color;
  uniform vec3 horizonColor;
  uniform vec3 glowColor;
  uniform vec3 moonPosition;
  uniform float glowStrength;
  uniform float glowPower;

  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(vWorldPosition - cameraPosition);
    float height = clamp(viewDir.y, 0.0, 1.0);

    vec3 color = horizonColor;
    color = mix(color, mid2Color, smoothstep(0.0, 0.18, height));
    color = mix(color, mid1Color, smoothstep(0.12, 0.5, height));
    color = mix(color, topColor, smoothstep(0.45, 1.0, height));

    // The halo is centred on the moon, not on the bottom of the screen.
    vec3 moonDir = normalize(moonPosition - cameraPosition);
    float moonDot = max(dot(viewDir, moonDir), 0.0);
    color += glowColor * pow(moonDot, glowPower) * glowStrength;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function SkyGradient({ skyIndex = 0, moonPositionRef }) {
  const targetRef = useRef(paletteToTarget(SKY.GRADIENTS[0]));

  const uniforms = useMemo(() => ({
    topColor: { value: new THREE.Color(SKY.GRADIENTS[0].top) },
    mid1Color: { value: new THREE.Color(SKY.GRADIENTS[0].mid1) },
    mid2Color: { value: new THREE.Color(SKY.GRADIENTS[0].mid2) },
    horizonColor: { value: new THREE.Color(SKY.GRADIENTS[0].horizon) },
    glowColor: { value: new THREE.Color(SKY.GRADIENTS[0].glow) },
    moonPosition: { value: new THREE.Vector3(0, 30, 0) },
    glowStrength: { value: SKY.GRADIENTS[0].glowStrength ?? SKY.GLOW_STRENGTH },
    glowPower: { value: SKY.GLOW_POWER },
  }), []);

  useEffect(() => {
    const palette = SKY.GRADIENTS[
      Math.min(Math.max(skyIndex, 0), SKY.GRADIENTS.length - 1)
    ];
    targetRef.current = paletteToTarget(palette);
  }, [skyIndex]);

  useFrame((state, delta) => {
    if (moonPositionRef?.current) {
      uniforms.moonPosition.value.copy(moonPositionRef.current);
    }

    const blend = 1 - Math.exp(-SKY.TRANSITION_SPEED * delta);
    const target = targetRef.current;

    uniforms.topColor.value.lerp(target.topColor, blend);
    uniforms.mid1Color.value.lerp(target.mid1Color, blend);
    uniforms.mid2Color.value.lerp(target.mid2Color, blend);
    uniforms.horizonColor.value.lerp(target.horizonColor, blend);
    uniforms.glowColor.value.lerp(target.glowColor, blend);
    uniforms.glowStrength.value +=
      (target.glowStrength - uniforms.glowStrength.value) * blend;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[SKY.DOME_RADIUS, 32, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
