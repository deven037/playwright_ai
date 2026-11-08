import { test } from '@fixtures/CrmFixtures';

test('Staging warm-up entry point @warmup-live', async ({ warmUpPage }) => {
  test.setTimeout(20 * 45000 + 19 * 10000 + 60000);
  await warmUpPage.warmStaging();
});
