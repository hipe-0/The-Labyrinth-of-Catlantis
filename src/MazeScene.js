// src/MazeScene.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { generateMaze, getStartRotation } from './utils/mazeGeneration';
import { createMovementController } from './utils/movementController';
import { createGamepadTracker } from './utils/gamepad';
import { getMazeWallSegments } from './utils/mazeWalls';
import { getTakeoffPose } from './utils/takeoff';
import { GAME_CONFIG } from './config/gameConfig';
import { CuteCat } from './components/CuteCat';
import { RocketCat } from './components/RocketCat';
import { StarField } from './components/StarField';
import { SkyGradient } from './components/SkyGradient';
import { Moon } from './components/Moon';
import { Floor } from './components/Floor';
import { HorizonMountains } from './components/HorizonMountains';
import { ExitBeacon } from './components/ExitBeacon';

const MAZE_CENTER = (GAME_CONFIG.MAZE_WIDTH - 1) / 2;
const { SHADOW, PLAYER, CAMERA, LEVEL, WALL } = GAME_CONFIG;

export function MazeScene({
  isGameStarted,
  moveInputRef,
  lookInputRef,
  jumpRequestRef,
  audio,
  levelStartRequest = 0,
  onLevelComplete,
}) {
  const { camera, gl } = useThree();
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
    pitch: 0,
    movementAccumulator: 0,
    jumpVelocity: 0,
    jumpHeight: 0,
    isJumping: false,
    collectedCats: new Set()
  });

  const [collectedCats, setCollectedCats] = useState(new Set());
  const [departingCats, setDepartingCats] = useState([]);
  const [skyIndex, setSkyIndex] = useState(0);

  const movementController = useMemo(() => {
    return createMovementController(
      generatedMaze,
      playerRef,
      setCollectedCats,
      setSkyIndex,
      cats,
      (catIndex) => {
        audio?.meow();

        const cat = cats[catIndex];

        if (!cat) {
          return;
        }

        setDepartingCats((current) => [
          ...current,
          {
            index: catIndex,
            x: cat.x,
            z: cat.y,
            color: cat.color,
          },
        ]);
      }
    );
  }, [generatedMaze, cats, audio]);

  // Polling the Gamepad API each frame handles hot-plugging without listeners.
  const gamepadTracker = useMemo(() => createGamepadTracker(), []);

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
    // Yaw first, then pitch around the local X axis. This keeps negative pitch
    // pointing down regardless of which way the player is facing.
    camera.rotation.order = 'YXZ';
  }, [camera, gl]);

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

  // Standard FPS mouse look: click the canvas to capture the pointer, move the
  // mouse to look, and press Esc (browser default) to release it. Touch and pen
  // pointers are ignored so the on-screen sticks keep working on hybrids.
  useEffect(() => {
    if (!isGameStarted) {
      return undefined;
    }

    const canvas = gl.domElement;
    let isLocked = false;

    const handlePointerLockChange = () => {
      isLocked = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (event) => {
      if (!isLocked || phaseRef.current !== 'playing') {
        return;
      }

      movementController.handleMouseMove(
        event.movementX || 0,
        event.movementY || 0
      );
    };

    const requestPointerLock = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }

      if (document.pointerLockElement === canvas) {
        return;
      }

      try {
        const request = canvas.requestPointerLock?.();
        request?.catch?.(() => {});
      } catch {
        // Pointer lock is optional. The game remains playable with the sticks,
        // and keyboard movement still works without mouse look.
      }
    };

    canvas.addEventListener('pointerdown', requestPointerLock);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('pointerdown', requestPointerLock);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock?.();
      }
    };
  }, [gl, isGameStarted, movementController]);

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
    player.pitch = 0;
    player.movementAccumulator = 0;
    player.jumpVelocity = 0;
    player.jumpHeight = 0;
    player.isJumping = false;
    player.collectedCats = new Set();

    movementController.resetInput();
    lastJumpRequestRef.current = jumpRequestRef?.current ?? 0;
    if (moveInputRef?.current) {
      moveInputRef.current.x = 0;
      moveInputRef.current.y = 0;
    }
    if (lookInputRef?.current) {
      lookInputRef.current.x = 0;
      lookInputRef.current.y = 0;
    }

    setCollectedCats(new Set());
    setDepartingCats([]);
    setSkyIndex(0);

    phaseRef.current = 'playing';
    takeoffRef.current = null;
    cameraFollowRef.current = { x: 1, z: 1 };
    camera.position.set(1, CAMERA.EYE_HEIGHT, 1);
    camera.rotation.set(0, nextStartRotation, 0);
    gl.shadowMap.needsUpdate = true;
  }, [camera, gl, levelStartRequest, movementController, moveInputRef, lookInputRef, jumpRequestRef]);

  const checkExit = useCallback(() => {
    const player = playerRef.current;
    const dx = player.x - exitX;
    const dz = player.y - exitY;

    return dx * dx + dz * dz <= PLAYER.EXIT_REACH_RADIUS * PLAYER.EXIT_REACH_RADIUS &&
           player.collectedCats.size === cats.length;
  }, [exitX, exitY, cats.length]);

  // Build one thin box per unique cell-edge wall. The same segment list feeds
  // the collision world, so the visible walls and collision always agree.
  const wallElements = useMemo(() => (
    getMazeWallSegments(generatedMaze).map((segment) => {
      const width = segment.maxX - segment.minX;
      const depth = segment.maxZ - segment.minZ;
      const centerX = (segment.minX + segment.maxX) / 2;
      const centerZ = (segment.minZ + segment.maxZ) / 2;

      return (
        <group
          key={segment.key}
          position={[centerX, WALL.HEIGHT / 2, centerZ]}
        >
          <mesh
            scale={[width, WALL.HEIGHT, depth]}
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
          <lineSegments scale={[width, WALL.HEIGHT, depth]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color="white" linewidth={2} />
          </lineSegments>
        </group>
      );
    })
  ), [generatedMaze]);

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

    movementController.resetInput();
    if (document.pointerLockElement === gl.domElement) {
      document.exitPointerLock?.();
    }

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

    // Apply analog stick input from refs instead of React state. This keeps
    // continuous thumb movement out of the render path.
    const moveInput = moveInputRef?.current;
    movementController.setMoveInput(
      moveInput?.x ?? 0,
      moveInput?.y ?? 0
    );

    const lookInput = lookInputRef?.current;
    movementController.setLookInput(
      lookInput?.x ?? 0,
      lookInput?.y ?? 0
    );

    const gamepad = gamepadTracker.poll();
    movementController.setGamepadInput(
      gamepad.move.x,
      gamepad.move.y,
      gamepad.look.x,
      gamepad.look.y
    );
    if (gamepad.jump) {
      movementController.requestJump();
    }

    const jumpRequest = jumpRequestRef?.current ?? 0;
    if (jumpRequest !== lastJumpRequestRef.current) {
      lastJumpRequestRef.current = jumpRequest;
      movementController.requestJump();
    }

    if (checkExit()) {
      beginTakeoff();
      return;
    }

    const previousX = player.x;
    const previousZ = player.y;
    movementController.updatePlayerMovement(player, delta);

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
    camera.rotation.set(player.pitch || 0, player.rotation, 0);

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
      {departingCats.map((cat) => (
        <RocketCat
          key={`rocket-${cat.index}`}
          x={cat.x}
          z={cat.z}
          color={cat.color}
          onComplete={() =>
            setDepartingCats((current) =>
              current.filter((item) => item.index !== cat.index)
            )
          }
        />
      ))}

      {wallElements}
    </>
  );
}
