// Deals Harbor redesign (AIO-392 / AIO-T192–T195). Seed data of the staging CRM.
export const DEAL_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export const MOVE_DEAL = 'Marble Pilot';
export const MOVE_FROM_STAGE = 'Qualification';
export const MOVE_TO_STAGE = 'Proposal';

export const CARD_DEAL = 'Zenith Expansion';
export const CARD_ACCOUNT = 'Solaris Systems';
export const CARD_AMOUNT = '$114,000';
export const CARD_PROBABILITY = '80%';
export const CARD_CLOSE = 'Close: Feb 4, 2027';
export const CARD_DEAL_URL = /\/deals\/deal-1$/;

export const LIST_COLUMNS = ['Deal', 'Account', 'Stage', 'Amount', 'Probability', 'Expected close', 'Owner'];
export const LIST_ROW_COUNT = 25;
export const SMALLEST_AMOUNT = '$17,000';
export const NEGOTIATION_STAGE = 'Negotiation';
export const NEGOTIATION_COUNT = 5;
export const SEARCH_TERM = 'pilot';
export const NO_MATCH_TERM = 'zzzz';

export const DEALS_WIDTHS = [375, 768, 1440];
export const DEALS_VIEWPORT_HEIGHT = 900;
