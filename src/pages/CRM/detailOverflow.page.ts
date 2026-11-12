import { BasePage } from '../../core/BasePage';
import { Page, expect } from '@playwright/test';
import { VIEWPORT_HEIGHT } from '../../data/detailOverflow.data';

// Account and Contact detail pages must not overflow horizontally (AIO-346 / AIO-T157–T160).
export class DetailOverflowPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    private get accountDetail() {
        return this.page.getByTestId('account-detail-page');
    }

    private get contactDetail() {
        return this.page.getByTestId('contact-detail-page');
    }

    private get detailValues() {
        return this.page.locator('.detail-list dd');
    }

    private get websiteLink() {
        return this.page.locator('.detail-list dd a').first();
    }

    private get contactRows() {
        return this.page.locator('tbody tr.row-clickable');
    }

    // Relative to the origin of the page the user is signed in on.
    private async gotoPath(path: string) {
        await this.helpers.navigateTo(new URL(path, this.page.url()).href);
    }

    async setViewport(width: number) {
        await this.helpers.setViewport({ width, height: VIEWPORT_HEIGHT });
    }

    async gotoAccount(id: string) {
        await this.gotoPath('/accounts/' + id);
        await expect(this.accountDetail).toBeVisible();
        await expect(this.detailValues.first()).toBeVisible();
    }

    async openFirstContact() {
        await this.gotoPath('/contacts');
        await this.helpers.click(this.contactRows.first(), 'first contact row');
        await expect(this.contactDetail).toBeVisible();
    }

    async assertDetailValuesVisible() {
        await expect(this.detailValues.first()).toBeVisible();
    }

    // Reproduces the manual edge case in the rendered DOM without persisting account changes.
    async injectLongWebsite(length: number) {
        await expect(this.websiteLink).toBeVisible();
        await this.websiteLink.evaluate((element, size) => {
            element.textContent = 'https://' + 'a'.repeat(size) + '.example';
        }, length);
    }

    async assertNoHorizontalOverflow() {
        const width = this.page.viewportSize()!.width;
        await expect.poll(() => this.page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
        }))).toEqual({ scroll: width, client: width });
        const outside = await this.detailValues.evaluateAll(elements =>
            elements.filter(element => {
                const box = element.getBoundingClientRect();
                return box.left < 0 || box.right > document.documentElement.clientWidth ||
                    element.scrollWidth > element.clientWidth + 1;
            }).length);
        expect(outside, 'detail values fit inside the viewport and their column').toBe(0);
    }
}
