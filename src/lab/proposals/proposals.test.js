import { PROPOSALS, getProposal } from './index';

describe('visual lab proposals', () => {
  test('each proposal has a baseline and exactly three numbered options', () => {
    expect(PROPOSALS.length).toBeGreaterThan(0);

    const allNumbers = PROPOSALS.flatMap((proposal) =>
      proposal.options.map((option) => option.number)
    );

    expect(new Set(allNumbers).size).toBe(allNumbers.length);

    for (const proposal of PROPOSALS) {
      expect(getProposal(proposal.id)).toBe(proposal);
      expect(proposal.title).toBeTruthy();
      expect(proposal.subtitle).toBeTruthy();
      expect(proposal.camera.position).toHaveLength(3);
      expect(proposal.camera.target).toHaveLength(3);
      expect(proposal.baseline).toBeTruthy();
      expect(typeof proposal.baseline.render).toBe('function');
      expect(proposal.options).toHaveLength(3);

      for (const option of proposal.options) {
        expect(Number.isInteger(option.number)).toBe(true);
        expect(option.number).toBeGreaterThan(0);
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
        expect(typeof option.render).toBe('function');
      }
    }
  });
});
