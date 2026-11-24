import { PROPOSALS, getProposal } from './index';

describe('visual lab proposal registry', () => {
  test('every registered proposal has a unique id and the schema the lab expects', () => {
    const ids = PROPOSALS.map((proposal) => proposal.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);

    for (const proposal of PROPOSALS) {
      expect(getProposal(proposal.id)).toBe(proposal);
      expect(proposal.title).toBeTruthy();
      expect(proposal.subtitle).toBeTruthy();
      expect(proposal.camera.position).toHaveLength(3);
      expect(proposal.camera.target).toHaveLength(3);

      const variantIds = proposal.variants.map((variant) => variant.id);
      expect(variantIds).toContain('current');
      expect(variantIds).toContain('proposed');

      for (const variant of proposal.variants) {
        expect(typeof variant.render).toBe('function');
      }
    }
  });
});
