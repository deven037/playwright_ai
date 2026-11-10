# New Application — Page Objects (SCAFFOLD)

This folder is reserved for Page Object classes for the new application.
Rename `newApp` to the real app name once it's known (folder, file names,
and the `NewAppFixtures.ts` import paths that will point here).

No page objects exist yet — add them once the application URL/pages are
available, following the same pattern as the existing app's pages
(see `src/pages/login.page.ts` for a full example):

```ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get someLocator(): Locator {
    return this.page.locator('#some-id');
  }

  async waitForPageLoad(): Promise<void> {
    await this.someLocator.waitFor({ state: 'visible' });
  }
}
```

Once a page object is added here, wire it into
`src/fixtures/NewAppFixtures.ts` (uncomment/adjust the example already
sketched out in that file).
