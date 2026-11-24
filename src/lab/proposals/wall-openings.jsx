// src/lab/proposals/wall-openings.jsx
//
// PROPOSAL ONLY. The lab renders these scenes; the game does not import this
// file. It explores three window proportions for the opening idea in
// doc/GEOMETRY_PROPOSAL.md.
import React from 'react';

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

const WINDOW_SPECS = {
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
      {/* Sill and lintel span the full wall width. */}
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

      {/* Jambs fill the two strips beside the opening, between sill and lintel. */}
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

function RoomScene({ windowSpec }) {
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

const Baseline = () => <RoomScene windowSpec={null} />;
const Option56 = () => <RoomScene windowSpec={WINDOW_SPECS[56]} />;
const Option57 = () => <RoomScene windowSpec={WINDOW_SPECS[57]} />;
const Option58 = () => <RoomScene windowSpec={WINDOW_SPECS[58]} />;

const camera = {
  position: [4.25, 0.62, 6.6],
  target: [4.25, 0.55, 4.1],
  fov: 70,
  // The blue in-game palette makes an opening read as sky rather than a dark
  // panel. All views use the same palette, so the comparison is fair.
  skyIndex: 1,
};

const proposal = {
  id: 'wall-openings',
  title: 'Window openings in maze walls',
  subtitle:
    'Three window proportions for the same 1.0-high wall. Same low-poly language, a real hole for the sky. Lab preview only — the game still renders solid walls.',
  status: 'awaiting-review',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description: 'Solid 1.0-high wall: one white box with the existing white edge outline.',
    render: () => <Baseline />,
  },
  options: [
    {
      number: 56,
      label: 'Low window',
      description: '0.90 wide × 0.35 high · sill 0.35 · lintel 0.30',
      render: () => <Option56 />,
    },
    {
      number: 57,
      label: 'Tall slit',
      description: '0.55 wide × 0.55 high · sill 0.30 · lintel 0.15',
      render: () => <Option57 />,
    },
    {
      number: 58,
      label: 'Wide ribbon',
      description: '1.60 wide × 0.30 high · sill 0.40 · lintel 0.30',
      render: () => <Option58 />,
    },
  ],
  notes: {
    changed: [
      'The back wall is split into four boxes around an opening: sill, lintel, and two jambs.',
      'Option 56 is the original low window; 57 is a tall slit; 58 is a wide ribbon.',
      'The hole is open: the sky is visible through it, with no glass pane.',
      'The white edges of the four pieces outline the window frame.',
    ],
    unchanged: [
      'Wall thickness 0.12, height 1.0, white faces, and white edge lines.',
      'Maze generation, cat placement, lighting, and the collision world.',
      'The player still collides with the full wall box, not the hole.',
      'Sky palettes are untouched; the preview uses the in-game blue palette so the opening reads as sky.',
    ],
    decisions: [
      'Which option number should be approved: 56, 57, or 58?',
      'Open hole or a translucent glass pane?',
      'Interior walls only, or the outer boundary too?',
      'How many eligible segments should receive a window (~10% is the current suggestion)?',
    ],
  },
};

export default proposal;
