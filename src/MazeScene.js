// src/MazeScene.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { generateMaze, getStartRotation } from './utils/mazeGeneration';
import { createMovementController } from './utils/movementController';
import { getTakeoffPose } from './utils/takeoff';
import { GAME_CONFIG } from './config/gameConfig';
import { CuteCat } from './components/CuteCat';
import { StarField } from './components/StarField';
import { SkyGradient } from './components/SkyGradient';
import { Moon } from './components/Moon';
import { Floor } from './components/Floor';
import { HorizonMountains } from './components/HorizonMountains';
import { ExitBeacon } from './components/ExitBeacon';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const TOUCH_KEY_MAP = {
  forward: 'ArrowUp',
  backward: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

const MAZE_CENTER = (GAME_CONFIG.MAZE_WIDTH - 1) / 2;
const { SHADOW, PLAYER, CAMERA, LEVEL } = GAME_CONFIG;

export function MazeScene({
  isGameStarted,
  touchDirectionRef,
  jumpRequestRef,
  audio,
  levelStartRequest = 0,
  onLevelComplete,
}) {
  const { camera, gl } = useThree();
  const lastTouchDirectionRef = useRef(null);
  const lastJumpRequestRef = useRef(0);
  const lightRef = useRef();
  const moonPositionRef = useRef(new THREE.Vector3(30, 30, 30));
  const shadowUpdateTimerRef = useRef(0);
  const lastShadowFocusRef = useRef({ x: 1, z: 1 });
  const cameraFollowRef = useRef({ x: 1, z: 1 });
  const phaseRef = useRef('playing');
  const takeoffRef = useRef(null);
  const lastLevelStartRequestRef = useRef(levelStartRequest);

  const [level, setLevel] = useState(1);
  const [mazeData, setMazeData] = useState(() => generateMaze());
  const { maze: generatedMaze, exitX, exitY, cats } = mazeData;
  const startRotation = getStartRotation(generatedMaze);

  const playerRef = useRef({
    x: 1,
    y: 1,
    rotation: startRotation,
    targetRotation: startRotation,
    movementAccumulator: 0,
    jumpVelocity: 0,
    jumpHeight: 0,
    isJumping: false,
    collectedCats: new Set()
  });

  const [collectedCats, setCollectedCats] = useState(new Set());
  const [skyIndex, setSkyIndex] = useState(0);

  const movementController = useMemo(() => {
    return createMovementController(
      generatedMaze,
      playerRef,
      setCollectedCats,
      setSkyIndex,
      cats,
      () => audio?.meow()
    );
  }, [generatedMaze, cats, audio]);

  // Wall height/width variations must stay fixed for a given maze. Computing
  // Math.random() during render makes every touch press re-roll the walls.
  const wallVariations = useMemo(() => (
    generatedMaze.map((row) => row.map(() => ({
      horizontal: Math.random() < 0.1 ? Math.random() * 0.3 + 0.85 : 1,
      vertical: Math.random() < 0.2 ? Math.random() * 2.5 + 0.5 : 1,
    })))
  ), [generatedMaze]);

  // The moonlight aims at the shadow focus, which follows the player. The
  // light position is shifted by the same offset in the frame loop, so the
  // moonlight direction stays constant while the shadow zone moves.
  const lightTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(MAZE_CENTER, 0, MAZE_CENTER);
    return target;
  }, []);

  // Shadows are enabled on the Canvas before the first render (see App.js), so
  // every material compiles with shadow support. The moonlight moves slowly, so
  // the shadow map is refreshed periodically in the frame loop and immediately
  // on maze changes.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  useEffect(() => {
    gl.shadowMap.needsUpdate = true;
    shadowUpdateTimerRef.current = 0;
    lastShadowFocusRef.current = { x: 1, z: 1 };
  }, [gl, generatedMaze]);

  // Add keyboard event listeners
  useEffect(() => {
    if (isGameStarted) {
      document.addEventListener('keydown', movementController.handleKeyDown);
      document.addEventListener('keyup', movementController.handleKeyUp);
      return () => {
        document.removeEventListener('keydown', movementController.handleKeyDown);
        document.removeEventListener('keyup', movementController.handleKeyUp);
      };
    }
  }, [isGameStarted, movementController]);

  // Start a fresh maze when the splash screen's Start button fires. The Canvas
  // stays mounted, so the overlay can sit on top of the final fly-up frame.
  useEffect(() => {
    if (levelStartRequest === lastLevelStartRequestRef.current) {
      return;
    }

    lastLevelStartRequestRef.current = levelStartRequest;

    const nextMazeData = generateMaze();
    setMazeData(nextMazeData);
    setLevel((current) => current + 1);

    const player = playerRef.current;
    player.x = 1;
    player.y = 1;
    const nextStartRotation = getStartRotation(nextMazeData.maze);
    player.rotation = nextStartRotation;
    player.targetRotation = nextStartRotation;
    player.movementAccumulator = 0;
    player.jumpVelocity = 0;
    player.jumpHeight = 0;
    player.isJumping = false;
    player.collectedCats = new Set();

    setCollectedCats(new Set());
    setSkyIndex(0);

    phaseRef.current = 'playing';
    takeoffRef.current = null;
    cameraFollowRef.current = { x: 1, z: 1 };
    camera.position.set(1, CAMERA.EYE_HEIGHT, 1);
    camera.rotation.set(0, nextStartRotation, 0);
    gl.shadowMap.needsUpdate = true;
  }, [camera, gl, levelStartRequest]);

  const checkExit = useCallback(() => {
    const player = playerRef.current;
    const dx = player.x - exitX;
    const dz = player.y - exitY;

    return dx * dx + dz * dz <= PLAYER.EXIT_REACH_RADIUS * PLAYER.EXIT_REACH_RADIUS &&
           player.collectedCats.size === cats.length;
  }, [exitX, exitY, cats.length]);

  // Build the wall elements once per maze. React can reuse the same element
  // tree when cats or the sky change, avoiding a new BoxGeometry per wall.
  const wallElements = useMemo(() => (
    generatedMaze.map((row, z) =>
      row.map((cell, x) => {
        if (cell === 1) {
          const { horizontal: horizontalScaleX, vertical: verticalScale } =
            wallVariations[z][x];

          return (
            <group key={`${x}-${z}`} position={[x, verticalScale / 2, z]}>
              <mesh
                scale={[horizontalScaleX, verticalScale, 1]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                  color="#FFFFFF"
                  metalness={0}
                  roughness={0.5}
                />
              </mesh>
              <lineSegments scale={[horizontalScaleX, verticalScale, 1]}>
                <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                <lineBasicMaterial color="white" linewidth={2} />
              </lineSegments>
            </group>
          );
        }
        return null;
      })
    )
  ), [generatedMaze, wallVariations]);

  const beginTakeoff = () => {
    const player = playerRef.current;

    phaseRef.current = 'takeoff';
    takeoffRef.current = {
      elapsed: 0,
      duration: LEVEL.TAKEOFF_DURATION,
      fromX: camera.position.x,
      fromZ: camera.position.z,
      fromY: camera.position.y,
      fromYaw: player.rotation,
      announced: false,
    };

    ARROW_KEYS.forEach((key) => movementController.handleKeyUp({ key }));
    audio?.levelComplete();

    // Stop the walking ambience immediately; the beacon is left out of this
    // update by omitting exitX/exitY.
    audio?.update({
      moving: false,
      speed: 0,
      x: player.x,
      z: player.y,
      rotation: player.rotation,
    }, 0);
  };

  const updateTakeoff = (delta) => {
    const takeoff = takeoffRef.current;

    if (!takeoff) {
      return;
    }

    takeoff.elapsed = Math.min(
      takeoff.elapsed + Math.min(delta, 0.1),
      takeoff.duration
    );

    const pose = getTakeoffPose({
      fromX: takeoff.fromX,
      fromZ: takeoff.fromZ,
      fromYaw: takeoff.fromYaw,
      elapsed: takeoff.elapsed,
      duration: takeoff.duration,
      mazeCenter: MAZE_CENTER,
      height: LEVEL.TAKEOFF_HEIGHT,
      pitch: LEVEL.TAKEOFF_PITCH,
      startHeight: takeoff.fromY,
    });

    camera.position.set(pose.x, pose.y, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0);

    if (takeoff.elapsed >= takeoff.duration && !takeoff.announced) {
      takeoff.announced = true;
      phaseRef.current = 'between-levels';
      onLevelComplete?.(level);
    }
  };

  useFrame((state, delta) => {
    if (phaseRef.current === 'takeoff') {
      updateTakeoff(delta);
      return;
    }

    if (phaseRef.current !== 'playing') {
      return;
    }

    const player = playerRef.current;

    // Apply touch input from refs instead of React state. This keeps touch
    // presses out of the render path and makes them feel like keyboard input.
    const touchDirection = touchDirectionRef?.current ?? null;
    if (touchDirection !== lastTouchDirectionRef.current) {
      lastTouchDirectionRef.current = touchDirection;
      ARROW_KEYS.forEach((key) => movementController.handleKeyUp({ key }));
      const key = TOUCH_KEY_MAP[touchDirection];
      if (key) {
        movementController.handleKeyDown({ key });
      }
    }

    const jumpRequest = jumpRequestRef?.current ?? 0;
    if (jumpRequest !== lastJumpRequestRef.current) {
      lastJumpRequestRef.current = jumpRequest;
      movementController.handleKeyDown({ key: ' ' });
    }

    if (checkExit()) {
      beginTakeoff();
      return;
    }

    const previousX = player.x;
    const previousZ = player.y;
    movementController.updatePlayerMovement(player, delta, cats, setCollectedCats, setSkyIndex);

    // Sound follows the distance the circle actually travelled: walking into a
    // wall produces no footsteps and no wind.
    const travelled = Math.hypot(player.x - previousX, player.y - previousZ);
    const speed = delta > 0 ? travelled / delta : 0;

    audio?.update({
      moving: travelled > 1e-5,
      speed,
      x: player.x,
      z: player.y,
      rotation: player.rotation,
      exitX,
      exitY,
    }, delta);

    // The camera follows the collision circle with a short, clamped delay.
    const follow = cameraFollowRef.current;
    const followBlend = 1 - Math.exp(-CAMERA.FOLLOW_SMOOTHING * delta);

    follow.x += (player.x - follow.x) * followBlend;
    follow.z += (player.y - follow.z) * followBlend;

    const lagX = follow.x - player.x;
    const lagZ = follow.z - player.y;
    const lag = Math.hypot(lagX, lagZ);

    if (lag > CAMERA.MAX_LAG) {
      const scale = CAMERA.MAX_LAG / lag;
      follow.x = player.x + lagX * scale;
      follow.z = player.y + lagZ * scale;
    }

    camera.position.x = follow.x;
    camera.position.z = follow.z;
    camera.position.y = CAMERA.EYE_HEIGHT + player.jumpHeight;
    camera.rotation.set(0, player.rotation, 0);

    // Moon.js has already copied the moon's world position into the light this
    // frame (child layout effects subscribe first). Shift both the light and
    // its target by the player's offset from the maze centre: the moonlight
    // direction stays constant while the shadow frustum follows the player.
    const shadowOffsetX = player.x - MAZE_CENTER;
    const shadowOffsetZ = player.y - MAZE_CENTER;
    if (lightRef.current) {
      lightRef.current.position.x += shadowOffsetX;
      lightRef.current.position.z += shadowOffsetZ;
    }
    lightTarget.position.set(player.x, 0, player.y);

    // Refresh the shadow map immediately while walking, and at 5 Hz while
    // standing still so the slowly moving moon still updates the light.
    shadowUpdateTimerRef.current += delta;
    const shadowMoved =
      Math.abs(player.x - lastShadowFocusRef.current.x) > SHADOW.MOVE_THRESHOLD ||
      Math.abs(player.y - lastShadowFocusRef.current.z) > SHADOW.MOVE_THRESHOLD;
    if (shadowMoved || shadowUpdateTimerRef.current >= SHADOW.IDLE_UPDATE_INTERVAL) {
      lastShadowFocusRef.current = { x: player.x, z: player.y };
      shadowUpdateTimerRef.current = 0;
      gl.shadowMap.needsUpdate = true;
    }
  });

  return (
    <>
      <SkyGradient skyIndex={skyIndex} moonPositionRef={moonPositionRef} />

      {/* Moon.js sets the moonlight direction; the target follows the player. */}
      <primitive object={lightTarget} />
      <directionalLight
        ref={lightRef}
        target={lightTarget}
        position={[30, 30, 30]}
        intensity={3}
        color="#dfe8ff"
        castShadow
        shadow-mapSize-width={SHADOW.MAP_SIZE}
        shadow-mapSize-height={SHADOW.MAP_SIZE}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-SHADOW.ZONE_HALF_SIZE}
        shadow-camera-right={SHADOW.ZONE_HALF_SIZE}
        shadow-camera-top={SHADOW.ZONE_HALF_SIZE}
        shadow-camera-bottom={-SHADOW.ZONE_HALF_SIZE}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      <Moon lightRef={lightRef} positionRef={moonPositionRef} />
      <StarField />
      <Floor />
      <HorizonMountains />
      <ExitBeacon exitX={exitX} exitY={exitY} />
      {cats.map((cat, index) =>
        collectedCats.has(index) ? null : (
          <group key={`cat-${index}`} position={[cat.x, 0, cat.y]}>
            <CuteCat color={cat.color} />
          </group>
        )
      )}

      {wallElements}
    </>
  );
}
