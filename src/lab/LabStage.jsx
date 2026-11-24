// src/lab/LabStage.jsx
//
// Shared building blocks for the dev-only graphics lab. A proposal owns its
// camera and its before/after scene; the stage provides the same night sky,
// moonlight, and floor the game uses so the preview is comparable.
import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { SkyGradient } from '../components/SkyGradient';
import { Floor } from '../components/Floor';

const DEFAULT_LIGHT_TARGET = [4.25, 0, 4.6];

const UNIT_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

export function LabCamera({ position, target, fov = 70 }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.fov = fov;
    camera.near = 0.05;
    camera.far = 500;
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, position, target, fov]);

  return null;
}

export function LabStage({
  children,
  skyIndex = 0,
  showFloor = true,
  lightPosition = [9.25, 12, 11],
  lightTarget = DEFAULT_LIGHT_TARGET,
}) {
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(lightTarget[0], lightTarget[1], lightTarget[2]);
    return object;
  }, [lightTarget]);

  return (
    <>
      <SkyGradient skyIndex={skyIndex} />

      {/* The game lights the maze with a single cool directional moonlight. */}
      <ambientLight intensity={0.18} />
      <primitive object={target} />
      <directionalLight
        position={lightPosition}
        target={target}
        intensity={3}
        color="#dfe8ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {showFloor && <Floor />}
      {children}
    </>
  );
}

function ReadySignal({ id, onReady }) {
  const frames = useRef(0);
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) {
      return;
    }

    frames.current += 1;

    if (frames.current >= 3) {
      reported.current = true;
      onReady(id);
    }
  });

  return null;
}

export function LabViewport({ id, camera, children, onReady }) {
  return (
    <Canvas
      className="lab-canvas"
      style={{ width: '100%', height: '100%' }}
      shadows
      dpr={[1, 2]}
      camera={{
        position: camera.position,
        fov: camera.fov ?? 70,
        near: 0.05,
        far: 500,
      }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#05070f');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <LabCamera
        position={camera.position}
        target={camera.target}
        fov={camera.fov ?? 70}
      />
      <LabStage skyIndex={camera.skyIndex ?? 0}>
        {children}
      </LabStage>
      <ReadySignal id={id} onReady={onReady} />
    </Canvas>
  );
}

// A single scaled box with the game's white face + white edge treatment.
// Pass `faceColor` to reuse the same primitive for darker material studies.
export function WallBox({
  position,
  size,
  faceColor = '#FFFFFF',
  edgeColor = '#FFFFFF',
  castShadow = true,
  receiveShadow = true,
}) {
  return (
    <group position={position} scale={size}>
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={faceColor}
          metalness={0}
          roughness={0.5}
        />
      </mesh>
      <lineSegments geometry={UNIT_EDGES}>
        <lineBasicMaterial color={edgeColor} linewidth={2} />
      </lineSegments>
    </group>
  );
}
