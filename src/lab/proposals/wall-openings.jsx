// src/lab/proposals/wall-openings.jsx
//
// PROPOSAL ONLY. The lab renders these scenes; the game does not import this
// file. It previews the window-opening idea from doc/GEOMETRY_PROPOSAL.md.
import React from 'react';

import { CuteCat } from '../../components/CuteCat';
import { WallBox } from '../LabStage';

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

const WINDOW = {
  width: 0.9,
  sill: 0.35,
  height: 0.35,
};

const jambWidth = (ROOM.width - WINDOW.width) / 2;
const lintelHeight = ROOM.height - WINDOW.sill - WINDOW.height;

function SolidBackWall() {
  return (
    <WallBox
      position={[ROOM.centerX, ROOM.height / 2, ROOM.backZ]}
      size={[ROOM.width, ROOM.height, ROOM.thickness]}
    />
  );
}

function WindowBackWall() {
  const holeX = ROOM.centerX;
  const jambY = WINDOW.sill + WINDOW.height / 2;

  return (
    <>
      {/* Sill and lintel span the full wall width. */}
      <WallBox
        position={[holeX, WINDOW.sill / 2, ROOM.backZ]}
        size={[ROOM.width, WINDOW.sill, ROOM.thickness]}
      />
      <WallBox
        position={[
          holeX,
          WINDOW.sill + WINDOW.height + lintelHeight / 2,
          ROOM.backZ,
        ]}
        size={[ROOM.width, lintelHeight, ROOM.thickness]}
      />

      {/* Jambs fill the two strips beside the opening, between sill and lintel. */}
      <WallBox
        position={[
          holeX - WINDOW.width / 2 - jambWidth / 2,
          jambY,
          ROOM.backZ,
        ]}
        size={[jambWidth, WINDOW.height, ROOM.thickness]}
      />
      <WallBox
        position={[
          holeX + WINDOW.width / 2 + jambWidth / 2,
          jambY,
          ROOM.backZ,
        ]}
        size={[jambWidth, WINDOW.height, ROOM.thickness]}
      />
    </>
  );
}

function RoomScene({ withWindow }) {
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

      {withWindow ? <WindowBackWall /> : <SolidBackWall />}

      {/* A small black cat gives scale without covering the opening. */}
      <group
        position={[5.25, 0, 4.9]}
        rotation={[0, 0.15, 0]}
        scale={0.8}
      >
        <CuteCat color="black" />
      </group>
    </>
  );
}

const SolidRoom = () => <RoomScene withWindow={false} />;
const WindowRoom = () => <RoomScene withWindow />;

const camera = {
  position: [4.25, 0.62, 6.6],
  target: [4.25, 0.55, 4.1],
  fov: 70,
  // The blue in-game palette makes the open hole read as sky rather than a
  // dark panel. Both variants use the same palette, so the comparison is fair.
  skyIndex: 1,
};

const proposal = {
  id: 'wall-openings',
  title: 'Window openings in maze walls',
  subtitle:
    'A solid wall panel becomes a sill, a lintel, and two jambs. Same low-poly language, with a real hole for the sky. Lab preview only — the game still renders solid walls.',
  status: 'awaiting-review',
  camera,
  variants: [
    {
      id: 'current',
      label: 'Current',
      tag: 'In-game today',
      description:
        'Solid 1.0-high wall: one white box with the existing white edge outline.',
      render: () => <SolidRoom />,
    },
    {
      id: 'proposed',
      label: 'Proposed',
      tag: 'Lab only',
      description:
        'Sill 0.35 · opening 0.90 × 0.35 · lintel 0.30. Open hole, no glass.',
      render: () => <WindowRoom />,
    },
  ],
  notes: {
    changed: [
      'The back wall is split into four boxes around a 0.90 × 0.35 opening.',
      'The hole is open: the night sky is visible through it, with no glass pane.',
      'The white edges of the four pieces outline the new window frame.',
    ],
    unchanged: [
      'Wall thickness 0.12, height 1.0, white faces, and white edge lines.',
      'Maze generation, cat placement, lighting, and the collision world.',
      'The player still collides with the full wall box, not the hole.',
      'Sky palettes are untouched; the preview uses the in-game blue palette so the opening reads as sky.',
    ],
    decisions: [
      'Open hole or a translucent glass pane?',
      'Interior walls only, or the outer boundary too?',
      'How many eligible segments should receive a window (~10% is the current suggestion)?',
    ],
  },
};

export default proposal;
