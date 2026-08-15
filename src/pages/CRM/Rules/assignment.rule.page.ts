import { BasePage } from "@core/BasePage";
import { expect, Page } from "@playwright/test";

export class AssignmentRulePage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async gotoAssignmentRules() {
    const assignmentRules = this.page.locator("//a[contains(@class, 'toolbox-link') and contains(@href, '/setup/assignment-rules')]");
    await this.helpers.click(assignmentRules, 'Assignment Rules');
    await this.waitForPageLoad();
  }

  async clickNewAssignmentRule() {
    const newAssignmentRuleBtn = this.page.locator("//div[@class='template-create-tile']/button");
    await this.helpers.click(newAssignmentRuleBtn, 'New Assignment Rule');
  }

  async fillAssignmentRuleDetails(ruleName: string, assignToUser: string, isActive?: boolean, conditions?: { field: string, value: string }[], module?: string, ) {
    const rule = `${ruleName}_${Date.now().toPrecision(4)}`;
    const ruleNameInput = this.page.locator("//input[@data-testid='assignment-rule-name']");
    await this.helpers.fill(ruleNameInput, rule, 'Rule Name Input');

    const moduleDropdown = this.page.locator("//button[@data-testid='assignment-rule-module']");
    await this.helpers.click(moduleDropdown, 'Module Dropdown')
    const moduleOptions = this.page.getByRole('option', { name: module });
    await this.helpers.click(moduleOptions, `Module ${module}`);

    const assignToDropdown = this.page.locator("//button[@data-testid='assignment-rule-assignto']");
    await this.helpers.click(assignToDropdown, 'Assign to dropdown');
    const userOption = this.page.getByRole('option', { name: assignToUser });
    await this.helpers.click(userOption, `${assignToUser}`);

    if (conditions && conditions.length) {
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        const fieldInput = this.page.locator(`//button[@data-testid='assignment-rule-condition-field-${i}']`);
        const valueLocator = this.page.locator(`//*[@data-testid='assignment-rule-condition-value-${i}']`);

        
        await this.helpers.click(fieldInput, `Field Dropdown opened`);
        const fieldOption = this.page.getByRole('option', { name: condition.field });
        await this.helpers.click(fieldOption, `Condition ${i} Field Selected`);

        const selectedFieldText =  this.page.locator(`//button[@data-testid='assignment-rule-condition-field-${i}']/span`).first();
        const text = await this.helpers.getText(selectedFieldText);
        expect(text).toBe(condition.field);
        await valueLocator.waitFor({ state: 'visible' }).catch(() => {});

        const count = await valueLocator.count();
        if (count === 0) {
          const alt = this.page.locator(`//button[@data-testid='assignment-rule-condition-value-${i}']`);
          await alt.click();
          const valueOption = this.page.getByRole('option', { name: condition.value });
          await this.helpers.click(valueOption, `Condition ${i + 1} Value Selected`);
        } else {
          const tagName = await valueLocator.evaluate((el: Element) => el.tagName.toLowerCase());
          if (tagName === 'input' || tagName === 'textarea') {
            await this.helpers.fill(valueLocator, condition.value, `Condition ${i} Value`);
          } else {
            await this.helpers.click(valueLocator, `Value Dropdown`);
            const valueOption = this.page.getByRole('option', { name: condition.value });
            await this.helpers.click(valueOption, `Condition ${i} Value Selected`);
          }
        }

        const addConditionBtn = this.page.locator("//button[text()='+ Add condition']");
        if (i < conditions.length - 1) {
          await this.helpers.click(addConditionBtn, `Add Condition Button clicked for condition ${i}`);
        }
      }
    }

    if (isActive) {
      const checkboxInput = this.page.locator(
        "//label[contains(@class,'checkbox-label')]/input[@type='checkbox']"
      );
      if ((await checkboxInput.count()) > 0) {
        await checkboxInput.check();
      } else {
        const labelLocator = this.page.locator("//label[contains(@class,'checkbox-label')]");
        await labelLocator.click();
      }
    }
    return rule;
  }

  async saveRule() {
    const saveBtn = this.page.locator("//button[@data-testid='assignment-rule-save-btn']");
    await this.helpers.click(saveBtn, "Rule Save Button");
    this.logger.info("Rule Saved");
  }

  async verifyRuleCreated(createdRuleName: string) {
    const gallary = this.page.locator("//div[@class='template-gallery']");
    await gallary.waitFor({state: 'visible'});

    const ruleCard = this.page.locator("//div[@class='template-card']");
    const rulesCount = await ruleCard.count();

    for(let i=0; i < rulesCount; i++) {
        const ruleName = this.page.locator("//div[@class='template-card-name']").nth(i);
        const rule = await this.helpers.getText(ruleName);

        if(rule == createdRuleName){
            expect(rule).toBe(createdRuleName);
            break;
        }
    }
  }
}