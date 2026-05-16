import {createDefaultCarryModes, createDefaultSettings, DISCLAIMER} from '../src/constants';

test('default app data is production scoped', () => {
  expect(createDefaultCarryModes().length).toBeGreaterThanOrEqual(7);
  expect(createDefaultSettings().onboardingCompleted).toBe(false);
  expect(DISCLAIMER).toContain('does not replace official physical documents');
});
