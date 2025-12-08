export const STEP_DURATION = 0.5;

export enum DialogName {
    HYPER_SPIN = "HYPER_SPIN"
}

export enum FlashSpinEvent {
    PLACE_BET = "PLACE_BET",
    OPEN_DIALOG = "OPEN_DIALOG",
    CHANGE_TOTAL_BET = "CHANGE_TOTAL_BET",
    CHANGE_TOTAL_BET_SLIDER = "CHANGE_TOTAL_BET_SLIDER"
}
// Hyper-spin status types

export type HyperSpinStatus = "Ready" | "Playing" | "Paused" | "Interrupted" | "Cancel";
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
// Single spin data within a hyper-spin batch

export interface HyperSpinSingleSpinData {
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
// Hyper-spin batch summary data

export interface HyperSpinBatchSummary {
    totalBet: number;
    hyperSpinStatus: HyperSpinStatus; // Current batch status
    totalWin: number;
    startingBalance: number;
    endBalance: number;
}
// Complete hyper-spin batch data

export interface HyperSpinBatchData {
    summary: HyperSpinBatchSummary; // Batch summary info
    spins: HyperSpinSingleSpinData[]; // Array of individual spin data
}

export interface SettlementInfo {
    totalWin: number;
    balanceAfter: number;
    detailRecords?: DetailRecord[];
}
