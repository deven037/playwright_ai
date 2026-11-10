# CRM locator notes

Verified on staging 2026-11-09 (AIO-267) and in `src/pages/Accounts.tsx` of the CRM repo.

## Contacts

| Name | Where | Locator |
|---|---|---|
| contact-name (form) | `/contacts/new` | `getByTestId('contact-name')` |
| contact-name (Grid view, default) | `/contacts` | `div.contact-card a.contact-name` |
| contact-name (List view) | `/contacts` | `a[href^="/contacts/"]` in `td[2]` of `tr.row-clickable` (plain link, no class) |

`div.contact-name` matches 0 elements in either view; do not use it.

## Accounts

| Name | Locator |
|---|---|
| accounts page root | `getByTestId('accounts-page')` |
| accounts-empty | `td.empty-cell` inside `[data-testid="accounts-page"]`; text "No accounts match “<query>”."; shown only when the search filters out every row. There is no `accounts-empty` test id. |
| accounts-load-error | Not implemented in the app. `getAll` has no error handling, so a failed load shows only the skeleton rows (`SkeletonRows`). There is no `accounts-load-error` element. |
