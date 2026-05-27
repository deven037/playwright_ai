import { BasePage } from "@core/BasePage";
import { Locator, Page } from "node_modules/playwright-core/types/types";

export class HomePage extends BasePage {

    constructor(page: Page) {
        super(page);
      }
      
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    // private get assessoriesMenu(): Locator {
    //     return this.page.getByRole('link', { name: 'Apparel & accessories' });
    // }

    async hoverOptionMenu(option: string): Promise<void> {
        const menuOption = this.page.getByRole('link', { name: option });
        await menuOption.hover();
    }
}