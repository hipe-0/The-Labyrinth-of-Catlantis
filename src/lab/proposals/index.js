// src/lab/proposals/index.js
//
// Register each lab proposal here. Keeping the registry explicit means the lab
// only bundles proposals that are meant to be reviewed, and the CLI can reject
// an unknown slug before opening a browser.
import wallOpenings from './wall-openings';

export const PROPOSALS = [wallOpenings];

export const getProposal = (id) =>
  PROPOSALS.find((proposal) => proposal.id === id);

export const getProposalIds = () => PROPOSALS.map((proposal) => proposal.id);
