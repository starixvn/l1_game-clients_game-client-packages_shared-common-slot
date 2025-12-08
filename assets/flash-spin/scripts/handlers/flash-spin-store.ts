import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { FlashSpinBatchData, FlashSpinSingleSpinData, SettlementInfo, WinTag } from "../flash-spin-definitions";
const { injectable, inject } = inversify;
const { FormatUtils } = gc;

@injectable()
export class FlashSpinStore {
    constructor() {
        mobx.makeAutoObservable(this);

        // Initialize previous max values after stores are ready
        setTimeout(() => {
            // Clamp stop conditions when total bet changes
            mobx.reaction(
                () => this.totalBet,
                () => {
                    const maxWinPerRound = this.maxWinPerRound ?? 0;
                    const currentMaxStopOnProfit = this.maxStopOnProfit;
                    const currentMaxStopOnLoss = this.maxStopOnLoss;

                    // Clamp stop on profit/loss to new max values
                    if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0 && this.stopOnProfit > currentMaxStopOnProfit) {
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                    if (this.userBalance > 0 && currentMaxStopOnLoss > 0 && this.stopOnLoss > currentMaxStopOnLoss) {
                        this.setStopOnLoss(currentMaxStopOnLoss);
                    }
                }
            );
            // Clamp stop on loss when user balance changes
            mobx.reaction(
                () => this.userBalance,
                (userBalance) => {
                    const currentMaxStopOnLoss = this.maxStopOnLoss;
                    if (userBalance > 0 && currentMaxStopOnLoss > 0) {
                        // Clamp if exceeds new max
                        if (this.stopOnLoss > currentMaxStopOnLoss) {
                            this.setStopOnLoss(currentMaxStopOnLoss);
                        }
                        // Adjust if max decreased and stopOnLoss was at old max
                        else if (this._previousMaxStopOnLoss > 0 && currentMaxStopOnLoss < this._previousMaxStopOnLoss) {
                            const threshold = this._previousMaxStopOnLoss * 0.99;
                            if (this.stopOnLoss >= threshold) {
                                this.setStopOnLoss(currentMaxStopOnLoss);
                            }
                        }
                        this._previousMaxStopOnLoss = currentMaxStopOnLoss;
                    }
                }
            );
            // Clamp stop on profit when total bet changes
            mobx.reaction(
                () => this.totalBet,
                () => {
                    const maxWinPerRound = this.maxWinPerRound ?? 0;
                    const currentMaxStopOnProfit = this.maxStopOnProfit;

                    if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0) {
                        // Clamp if exceeds new max
                        if (this.stopOnProfit > currentMaxStopOnProfit) {
                            this.setStopOnProfit(currentMaxStopOnProfit);
                        }
                        // Adjust if max decreased and stopOnProfit was at old max
                        else if (this._previousMaxStopOnProfit > 0 && currentMaxStopOnProfit < this._previousMaxStopOnProfit) {
                            const threshold = this._previousMaxStopOnProfit * 0.99;
                            if (this.stopOnProfit >= threshold) {
                                this.setStopOnProfit(currentMaxStopOnProfit);
                            }
                        }
                        this._previousMaxStopOnProfit = currentMaxStopOnProfit;
                    }
                }
            );

            const maxWinPerRound = this.maxWinPerRound ?? 0;
            if (maxWinPerRound > 0) {
                const currentMaxStopOnProfit = this.maxStopOnProfit;
                if (currentMaxStopOnProfit > 0) {
                    this._previousMaxStopOnProfit = currentMaxStopOnProfit;
                }
            }
            if (this.userBalance > 0) {
                const currentMaxStopOnLoss = this.maxStopOnLoss;
                if (currentMaxStopOnLoss > 0) {
                    this._previousMaxStopOnLoss = currentMaxStopOnLoss;
                }
            }
        }, 0);
    }

    event: any = null;

    // UI state
    isOpenBetControlPopup = false;

    roundsList = [10, 50, 100, 500, 1000];
    selectedRoundOnPopup = this.roundsList[2]; // Default to 100
    remainingRound = 0;
    isActiveFlashSpin = false;
    winLevelConfig = [2, 5, 10];

    // Stop conditions
    stopOnProfit = 0;
    stopOnLoss = 0;
    stopOnFeature = false;
    isSettingsOpen = true;
    needClearLastSetting = false;

    // Previous max values for clamping logic
    private _previousMaxStopOnProfit = 0;
    private _previousMaxStopOnLoss = 0;

    private _initialBalance = 0;
    private _currentProfit = 0;
    private _currentLoss = 0;

    public totalBet = 0;
    public totalBetSliderProgress = 0;
    public userBalance = 0;
    public freeSpinsTotal = 0;
    public maxWinPerRound = 0;
    public disabledChangeBet = false;
    public disabledFlashSpin = false;
    public interactableTotalBet = { increase: true, decrease: true };

    get initialBalance(): number {
        return this._initialBalance;
    }

    get maxStopOnProfit() {
        const maxWinPerRound = this.maxWinPerRound
        const currentTotalBet = this.totalBet
        return currentTotalBet * maxWinPerRound;
    }

    get minStopOnProfit() {
        return 0;
    }

    get stopOnProfitStep() {
        return this.totalBet;
    }

    changeStopOnProfit(increase: boolean) {
        const step = this.stopOnProfitStep;
        const newValue = increase ? this.stopOnProfit + step : this.stopOnProfit - step;
        this.setStopOnProfit(newValue);
    }

    setStopOnProfit(value: number) {
        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            return;
        }

        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnProfit = clampedValue;
    }

    get maxStopOnLoss() {
        return this.userBalance;
    }

    get minStopOnLoss() {
        return 0;
    }

    get stopOnLossStep() {
        return this.totalBet;
    }

    changeStopOnLoss(increase: boolean) {
        const step = this.stopOnLossStep;
        const newValue = increase ? this.stopOnLoss + step : this.stopOnLoss - step;
        this.setStopOnLoss(newValue);
    }

    setStopOnLoss(value: number) {

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            return;
        }

        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnLoss = clampedValue;

    }

    // Computed properties for UI state - Stop On Profit
    get interactableStopOnProfit(): { increase: boolean; decrease: boolean } {
        return {
            increase: this.stopOnProfit < this.maxStopOnProfit,
            decrease: this.stopOnProfit > this.minStopOnProfit
        };
    }

    get stopOnProfitSliderProgress(): number {
        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        return max > min ? Math.max(0, Math.min(1, (this.stopOnProfit - min) / (max - min))) : 0;
    }

    // Computed properties for UI state - Stop On Loss
    get interactableStopOnLoss(): { increase: boolean; decrease: boolean } {
        return {
            increase: this.stopOnLoss < this.maxStopOnLoss,
            decrease: this.stopOnLoss > this.minStopOnLoss
        };
    }

    get stopOnLossSliderProgress(): number {
        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        return max > min ? Math.max(0, Math.min(1, (this.stopOnLoss - min) / (max - min))) : 0;
    }

    startSessionTracking() {
        this._initialBalance = this.userBalance;
        this._currentProfit = 0;
        this._currentLoss = 0;
    }

    stopSessionTracking() {
        this._initialBalance = 0;
        this._currentProfit = 0;
        this._currentLoss = 0;
    }

    updateProfitLoss() {
        if (this._initialBalance === 0) {
            return;
        }

        const currentBalance = this.userBalance;
        const balanceChange = currentBalance - this._initialBalance;

        if (balanceChange > 0) {
            this._currentProfit = balanceChange;
            this._currentLoss = 0;
        } else if (balanceChange < 0) {
            this._currentProfit = 0;
            this._currentLoss = Math.abs(balanceChange);
        } else {
            this._currentProfit = 0;
            this._currentLoss = 0;
        }
    }

    getCurrentProfit(): number {
        return this._currentProfit;
    }

    getCurrentLoss(): number {
        return this._currentLoss;
    }

    setFlashSpinActive(active: boolean) {
        this.isActiveFlashSpin = active;

        if (active) {
            this.isSettingsOpen = false;
        }
    }


    // Batch data tracking
    private _spinBatchData: FlashSpinBatchData | null = null;
    private _normalSpinCounter = 0;
    private _freeSpinCounter = 0;

    private _singleSpinData: FlashSpinSingleSpinData = null;

    get spinBatchData(): FlashSpinBatchData {
        return this._spinBatchData;
    }

    // Computed property for MobX reactivity
    get spinsLength(): number {
        return this._spinBatchData?.spins?.length || 0;
    }

    initializeBatch() {
        const startingBalanceRaw = this.userBalance;

        this._spinBatchData = {
            summary: {
                totalBet: 0,
                status: "Ready",
                totalWin: 0,
                startingBalance: startingBalanceRaw,
                endBalance: 0
            },
            spins: []
        };

        this._normalSpinCounter = 0;
        this._freeSpinCounter = 0;
    }

    startBatch() {
        if (!this._spinBatchData) {
            this.initializeBatch();
        }
        if (this._spinBatchData) {
            this._spinBatchData.summary.status = "Playing";
        }
    }

    pauseBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.status = "Paused";
        }
    }

    resumeBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.status = "Playing";
        }
    }

    completeBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.status = "Ready";

            const endBalanceRaw = this.userBalance ?? 0;
            this._spinBatchData.summary.endBalance = endBalanceRaw;
        }
    }

    addSpinToBatch() {
        if (this._spinBatchData) {
            const spinData = this.singleSpinData;
            this._spinBatchData.spins.push(spinData);

            // Update totals
            this._spinBatchData.summary.totalBet += spinData.bet;
            this._spinBatchData.summary.totalWin += spinData.totalWin;
        }
    }

    determineWinTag(
        winAmount: number,
        stake: number,
        bigWin: boolean,
        megaWin: boolean,
        superWin: boolean,
        reachMaxWin: boolean
    ): WinTag {
        if (reachMaxWin) {
            return "Amethyst";
        }
        if (megaWin) {
            return "Gold";
        }
        if (superWin) {
            return "Silver";
        }
        if (bigWin) {
            return "Bronze";
        }
        return null;
    }

    getNextNormalSpinId(): number {
        this._normalSpinCounter++;
        return this._normalSpinCounter;
    }

    getNextFreeSpinId(): number {
        this._freeSpinCounter++;
        return this._freeSpinCounter;
    }

    resetBatchCounters() {
        this._normalSpinCounter = 0;
        this._freeSpinCounter = 0;
    }

    clearBatchData() {
        this._spinBatchData = null;
        this.resetBatchCounters();
    }

    recoverInterruptedBatch(): boolean {
        if (!this._spinBatchData || this._spinBatchData.summary.status !== "Interrupted") {
            return false;
        }

        this._spinBatchData.summary.status = "Playing";
        this.setFlashSpinActive(true);
        return true;
    }

    initNewSingleSpinData(info: { isFreeSpin: boolean, bet: number, balance: number }) {
        let spinId: number;
        if (info.isFreeSpin) {
            spinId = this.getNextFreeSpinId();
        } else {
            spinId = this.getNextNormalSpinId();
        }

        this._singleSpinData = {
            spinId,
            isFreeSpin: info.isFreeSpin,
            bet: info.bet,
            balanceBefore: info.balance
        };
        !info.isFreeSpin && this.decreaseSpinRound();
    }

    decreaseSpinRound() {
        this.remainingRound--;
    }

    updateSettlementSingleSpin(info: SettlementInfo) {
        const { multiplier, winLevel } = this.calculateMultiplier(info.totalWin, this._singleSpinData.bet);

        this._singleSpinData = {
            ...this._singleSpinData,
            totalWin: info.totalWin,
            totalMultiplier: multiplier,
            winLevel: winLevel,
            balanceAfter: info.balanceAfter,
            detailRecords: info.detailRecords,
        };
    }

    calculateMultiplier(winAmount: number, stake: number): { multiplier: number, winLevel: number } {
        const multiplier = stake > 0 ? winAmount / stake : 0;
        const winLevel = this.winLevelConfig.findIndex(level => multiplier >= level);
        return { multiplier, winLevel };
    }

    completeCascadeTracking() {
    }

    isCascadeTrackingActive(): boolean {
        return this._singleSpinData !== null;
    }

    get singleSpinData() {
        return this._singleSpinData;
    }
}
