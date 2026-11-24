import { PROPOSALS, getProposal } from './index';
import optionLedger from '../option-ledger.json';

const ALLOWED_OPTION_STATUSES = new Set([
  'awaiting-review',
  'approved',
  'implemented',
  'verified',
  'not-selected',
]);

describe('visual lab proposal registry', () => {
  test('every proposal has a baseline and exactly three numbered options', () => {
    expect(PROPOSALS.length).toBeGreaterThan(0);

    const allNumbers = PROPOSALS.flatMap((proposal) =>
      proposal.options.map((option) => option.number)
    );

    expect(new Set(allNumbers).size).toBe(allNumbers.length);
    expect(optionLedger.nextNumber).toBeGreaterThan(Math.max(...allNumbers));

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

        const ledgerEntry = optionLedger.options.find(
          (entry) => entry.number === option.number
        );

        expect(ledgerEntry).toBeTruthy();
        expect(ledgerEntry.proposal).toBe(proposal.id);
        expect(ALLOWED_OPTION_STATUSES.has(ledgerEntry.status)).toBe(true);
      }
    }
  });

  test('the option ledger never reuses a number', () => {
    const numbers = optionLedger.options.map((entry) => entry.number);

    expect(new Set(numbers).size).toBe(numbers.length);
    expect(optionLedger.nextNumber).toBeGreaterThan(Math.max(...numbers));
  });
});
