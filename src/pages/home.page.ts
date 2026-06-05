import { BasePage } from "@core/BasePage";
import { Locator, Page } from "node_modules/playwright-core/types/types";

export class HomePage extends BasePage {

    constructor(page: Page) {
        super(page);
      }
      
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async hoverOptionMenu(option: string): Promise<void> {
        const menuOption = this.page.getByRole('link', { name: option });
        await menuOption.hover();
    }

    async clickSubMenu(subOption: string): Promise<void> {
        const subMenuOption = this.page.getByRole('link', { name: subOption });
        await this.helpers.click(subMenuOption, `Click on submenu: ${subOption}`);
        await this.page.waitForLoadState('networkidle');
    }
}