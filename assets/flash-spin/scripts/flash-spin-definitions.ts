export const STEP_DURATION = 0.5;

export enum DialogName {
    FLASH_SPIN = "FLASH_SPIN"
}

export enum FlashSpinEvent {
    PLACE_BET = "PLACE_BET",
    OPEN_DIALOG = "OPEN_DIALOG",
    CHANGE_TOTAL_BET = "CHANGE_TOTAL_BET",
    CHANGE_TOTAL_BET_SLIDER = "CHANGE_TOTAL_BET_SLIDER"
}

export type FlashSpinStatus = "Ready" | "Playing" | "Paused" | "Interrupted" | "Cancel";
// Win tag types for multipliers

export type WinTag = "Bronze" | "Silver" | "Gold" | "Amethyst" | null;
// Individual cascade step within a winning spin

export interface DetailRecord {
    winAmount: number;
    multiplier: number;
    winLevel: number;
    bonusMultiplier?: number;
    bonusWinLevel?: number;
}

export interface FlashSpinSingleSpinData {
    spinId: number;
    isFreeSpin: boolean;
    balanceBefore: number;
    bet: number;

    totalWin?: number;
    totalMultiplier?: number;
    winLevel?: number;
    balanceAfter?: number;
    detailRecords?: DetailRecord[];
}

export interface FlashSpinBatchSummary {
    totalBet: number;
    status: FlashSpinStatus; // Current batch status
    totalWin: number;
    startingBalance: number;
    endBalance: number;
}

export interface FlashSpinBatchData {
    summary: FlashSpinBatchSummary; // Batch summary info
    spins: FlashSpinSingleSpinData[]; // Array of individual spin data
}

export interface SettlementInfo {
    totalWin: number;
    balanceAfter: number;
    detailRecords?: DetailRecord[];
}
