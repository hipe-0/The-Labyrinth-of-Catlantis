// Shared wall-room mockup for the wall-openings options.
import React from 'react';

import { WallBox } from '../../LabStage';

const ROOM = {
  centerX: 4.25,
  width: 2.8,
  height: 1,
  thickness: 0.12,
  backZ: 4.1,
  leftX: 2.85,
  rightX: 5.65,
  sideDepth: 2.7,
  sideCenterZ: 5.45,
};

export const WINDOW_SPECS = {
  56: { width: 0.9, sill: 0.35, height: 0.35 },
  57: { width: 0.55, sill: 0.3, height: 0.55 },
  58: { width: 1.6, sill: 0.4, height: 0.3 },
};

function SolidBackWall() {
  return (
    <WallBox
      position={[ROOM.centerX, ROOM.height / 2, ROOM.backZ]}
      size={[ROOM.width, ROOM.height, ROOM.thickness]}
    />
  );
}

function WindowBackWall({ spec }) {
  const holeX = ROOM.centerX;
  const jambWidth = (ROOM.width - spec.width) / 2;
  const lintelHeight = ROOM.height - spec.sill - spec.height;
  const jambY = spec.sill + spec.height / 2;

  return (
    <>
      <WallBox
        position={[holeX, spec.sill / 2, ROOM.backZ]}
        size={[ROOM.width, spec.sill, ROOM.thickness]}
      />
      <WallBox
        position={[
          holeX,
          spec.sill + spec.height + lintelHeight / 2,
          ROOM.backZ,
        ]}
        size={[ROOM.width, lintelHeight, ROOM.thickness]}
      />
      <WallBox
        position={[holeX - spec.width / 2 - jambWidth / 2, jambY, ROOM.backZ]}
        size={[jambWidth, spec.height, ROOM.thickness]}
      />
      <WallBox
        position={[holeX + spec.width / 2 + jambWidth / 2, jambY, ROOM.backZ]}
        size={[jambWidth, spec.height, ROOM.thickness]}
      />
    </>
  );
}

export function RoomScene({ windowSpec }) {
  return (
    <>
      <WallBox
        position={[ROOM.leftX, ROOM.height / 2, ROOM.sideCenterZ]}
        size={[ROOM.thickness, ROOM.height, ROOM.sideDepth]}
      />
      <WallBox
        position={[ROOM.rightX, ROOM.height / 2, ROOM.sideCenterZ]}
        size={[ROOM.thickness, ROOM.height, ROOM.sideDepth]}
      />

      {windowSpec ? (
        <WindowBackWall spec={windowSpec} />
      ) : (
        <SolidBackWall />
      )}
    </>
  );
}
