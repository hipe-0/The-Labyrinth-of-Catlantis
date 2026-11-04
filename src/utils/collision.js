// src/utils/collision.js
//
// Reusable 2D circle-vs-AABB collision. Walls and future props are registered
// as axis-aligned boxes in a spatial hash, so the per-substep cost stays low as
// the maze gains more objects.

import { getMazeWallSegments } from './mazeWalls';

const EPSILON = 1e-6;
const BUCKET_SIZE = 1;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export const circleIntersectsBox = (x, z, radius, box) => {
  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;
  const safeRadius = Math.max(0, radius - EPSILON);

  return dx * dx + dz * dz < safeRadius * safeRadius;
};

export const createCollisionWorld = () => {
  const buckets = new Map();
  let nextId = 1;

  const bucketKey = (x, z) => `${x},${z}`;

  const addBox = ({ minX, minZ, maxX, maxZ }) => {
    const box = {
      id: nextId++,
      minX: Math.min(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxX: Math.max(minX, maxX),
      maxZ: Math.max(minZ, maxZ),
    };

    const firstX = Math.floor(box.minX / BUCKET_SIZE);
    const lastX = Math.floor(box.maxX / BUCKET_SIZE);
    const firstZ = Math.floor(box.minZ / BUCKET_SIZE);
    const lastZ = Math.floor(box.maxZ / BUCKET_SIZE);

    for (let cellX = firstX; cellX <= lastX; cellX += 1) {
      for (let cellZ = firstZ; cellZ <= lastZ; cellZ += 1) {
        const key = bucketKey(cellX, cellZ);
        let bucket = buckets.get(key);

        if (!bucket) {
          bucket = [];
          buckets.set(key, bucket);
        }

        bucket.push(box);
      }
    }

    return box;
  };

  const collectNearbyBoxes = (x, z, radius) => {
    const firstX = Math.floor((x - radius) / BUCKET_SIZE);
    const lastX = Math.floor((x + radius) / BUCKET_SIZE);
    const firstZ = Math.floor((z - radius) / BUCKET_SIZE);
    const lastZ = Math.floor((z + radius) / BUCKET_SIZE);
    const boxes = [];
    const seen = new Set();

    for (let cellX = firstX; cellX <= lastX; cellX += 1) {
      for (let cellZ = firstZ; cellZ <= lastZ; cellZ += 1) {
        const bucket = buckets.get(bucketKey(cellX, cellZ));

        if (!bucket) {
          continue;
        }

        for (const box of bucket) {
          if (!seen.has(box.id)) {
            seen.add(box.id);
            boxes.push(box);
          }
        }
      }
    }

    return boxes;
  };

  const overlappingBoxes = (x, z, radius) =>
    collectNearbyBoxes(x, z, radius).filter((box) =>
      circleIntersectsBox(x, z, radius, box)
    );

  const overlapsCircle = (x, z, radius) =>
    collectNearbyBoxes(x, z, radius).some((box) =>
      circleIntersectsBox(x, z, radius, box)
    );

  // Safety net for spawns, teleports, or a prop added on top of the player.
  // The hard rule is that the player circle must never overlap a box.
  const resolvePenetration = (x, z, radius) => {
    let px = x;
    let pz = z;

    for (let pass = 0; pass < 4; pass += 1) {
      const overlaps = overlappingBoxes(px, pz, radius);

      if (overlaps.length === 0) {
        break;
      }

      for (const box of overlaps) {
        const closestX = clamp(px, box.minX, box.maxX);
        const closestZ = clamp(pz, box.minZ, box.maxZ);
        const dx = px - closestX;
        const dz = pz - closestZ;
        const distanceSquared = dx * dx + dz * dz;

        if (distanceSquared > EPSILON * EPSILON) {
          const distance = Math.sqrt(distanceSquared);
          const push = radius - distance + EPSILON;
          px += (dx / distance) * push;
          pz += (dz / distance) * push;
          continue;
        }

        // The centre is inside the box. Push it to the nearest face.
        const exits = [
          { x: box.minX - radius - EPSILON, z: pz },
          { x: box.maxX + radius + EPSILON, z: pz },
          { x: px, z: box.minZ - radius - EPSILON },
          { x: px, z: box.maxZ + radius + EPSILON },
        ];
        let nearest = exits[0];
        let nearestDistance = Infinity;

        for (const candidate of exits) {
          const candidateDistance =
            (candidate.x - px) * (candidate.x - px) +
            (candidate.z - pz) * (candidate.z - pz);

          if (candidateDistance < nearestDistance) {
            nearest = candidate;
            nearestDistance = candidateDistance;
          }
        }

        px = nearest.x;
        pz = nearest.z;
      }
    }

    return { x: px, z: pz };
  };

  return {
    addBox,
    collectNearbyBoxes,
    overlappingBoxes,
    overlapsCircle,
    resolvePenetration,
  };
};

// Axis-separated movement keeps the circle out of every box and lets the
// remaining axis slide along the obstacle. Displacement is subdivided so a
// large or stalled frame cannot tunnel through a wall.
export const moveCircle = (world, x, z, dx, dz, radius) => {
  const resolved = world.overlapsCircle(x, z, radius)
    ? world.resolvePenetration(x, z, radius)
    : { x, z };
  let px = resolved.x;
  let pz = resolved.z;

  const distance = Math.hypot(dx, dz);

  if (distance < EPSILON) {
    return { x: px, z: pz, blockedX: false, blockedZ: false };
  }

  const maxStep = Math.max(radius * 0.5, 0.01);
  const steps = Math.max(1, Math.ceil(distance / maxStep));
  const stepX = dx / steps;
  const stepZ = dz / steps;
  const xFirst = Math.abs(stepX) >= Math.abs(stepZ);
  let blockedX = false;
  let blockedZ = false;

  const tryX = (currentX, currentZ) => {
    if (Math.abs(stepX) < EPSILON) {
      return { x: currentX, blocked: false };
    }

    const nextX = currentX + stepX;

    if (world.overlapsCircle(nextX, currentZ, radius)) {
      return { x: currentX, blocked: true };
    }

    return { x: nextX, blocked: false };
  };

  const tryZ = (currentX, currentZ) => {
    if (Math.abs(stepZ) < EPSILON) {
      return { z: currentZ, blocked: false };
    }

    const nextZ = currentZ + stepZ;

    if (world.overlapsCircle(currentX, nextZ, radius)) {
      return { z: currentZ, blocked: true };
    }

    return { z: nextZ, blocked: false };
  };

  for (let step = 0; step < steps; step += 1) {
    if (xFirst) {
      const xResult = tryX(px, pz);
      px = xResult.x;
      blockedX = blockedX || xResult.blocked;

      const zResult = tryZ(px, pz);
      pz = zResult.z;
      blockedZ = blockedZ || zResult.blocked;
    } else {
      const zResult = tryZ(px, pz);
      pz = zResult.z;
      blockedZ = blockedZ || zResult.blocked;

      const xResult = tryX(px, pz);
      px = xResult.x;
      blockedX = blockedX || xResult.blocked;
    }
  }

  return { x: px, z: pz, blockedX, blockedZ };
};

// Every wall cell becomes a 1x1 box. Four outer boxes act as a safety fence so
// the player cannot leave the maze even if a future generator opens a border.
export const createMazeCollisionWorld = (maze) => {
  const world = createCollisionWorld();
  const height = maze.length;
  const width = maze[0]?.length ?? 0;

  if (height === 0 || width === 0) {
    return world;
  }

  const edgeBased =
    maze[0]?.[0] &&
    typeof maze[0][0] === 'object' &&
    maze[0][0].walls !== undefined;

  if (edgeBased) {
    getMazeWallSegments(maze).forEach((segment) => {
      world.addBox({
        minX: segment.minX,
        minZ: segment.minZ,
        maxX: segment.maxX,
        maxZ: segment.maxZ,
      });
    });
  } else {
    for (let z = 0; z < height; z += 1) {
      for (let x = 0; x < width; x += 1) {
        if (maze[z][x] === 1) {
          world.addBox({
            minX: x - 0.5,
            minZ: z - 0.5,
            maxX: x + 0.5,
            maxZ: z + 0.5,
          });
        }
      }
    }
  }

  const margin = 2;
  const outerMinX = -0.5;
  const outerMaxX = width - 0.5;
  const outerMinZ = -0.5;
  const outerMaxZ = height - 0.5;

  world.addBox({
    minX: outerMinX - margin,
    minZ: outerMinZ - margin,
    maxX: outerMinX,
    maxZ: outerMaxZ + margin,
  });
  world.addBox({
    minX: outerMaxX,
    minZ: outerMinZ - margin,
    maxX: outerMaxX + margin,
    maxZ: outerMaxZ + margin,
  });
  world.addBox({
    minX: outerMinX - margin,
    minZ: outerMinZ - margin,
    maxX: outerMaxX + margin,
    maxZ: outerMinZ,
  });
  world.addBox({
    minX: outerMinX - margin,
    minZ: outerMaxZ,
    maxX: outerMaxX + margin,
    maxZ: outerMaxZ + margin,
  });

  return world;
};
