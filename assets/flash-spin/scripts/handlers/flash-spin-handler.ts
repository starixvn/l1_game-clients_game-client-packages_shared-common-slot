import gc from "@sg/game-client-base";
import inversify from "inversify";

import { DialogName, FlashSpinEvent, SettlementInfo } from "../flash-spin-definitions";
import { FlashSpinStore } from "./flash-spin-store";

const { injectable, inject } = inversify;

@injectable()
export class FlashSpinHandler implements gc.Shared.IHandler<number> {
    @inject(FlashSpinStore) protected readonly flashSpinStore: FlashSpinStore;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;

    private hyperSpinBatchStartTime = 0;
    private hyperSpinBatchEndTime = 0;
    private checkNextRoundTimeout: number | null = null;
    private isCancelled = false;

    get isBatchCancelled(): boolean {
        return this.isCancelled;
    }

    handle() { }

    clickHyperSpin() {
        this.triggerOpenDialog(DialogName.HYPER_SPIN);
        this.showHyperSpinBetControl();
    }

    triggerOpenDialog(name: string) {
        this.flashSpinStore.event = { action: "openDialog", name }
    }

    openHyperSpinPopup() {
        this.flashSpinStore.isOpenHyperSpinPopup = true;
        this.flashSpinStore.selectedRoundOnPopup = this.flashSpinStore.roundsList[2];
    }

    updateHyperSpinRounds(rounds: number) {
        this.flashSpinStore.selectedRoundOnPopup = rounds;
    }

    changeHyperSpinRounds(increase: boolean) {
        const currentRounds = this.flashSpinStore.selectedRoundOnPopup;
        const roundsList = this.flashSpinStore.roundsList;
        const currentIndex = roundsList.indexOf(currentRounds);

        if (increase && currentIndex < roundsList.length - 1) {
            this.updateHyperSpinRounds(roundsList[currentIndex + 1]);
        } else if (!increase && currentIndex > 0) {
            this.updateHyperSpinRounds(roundsList[currentIndex - 1]);
        }
    }

    confirmHyperSpinRoundsAndStart() {
        this.flashSpinStore.roundsHyperSpin = this.flashSpinStore.selectedRoundOnPopup;
        this.flashSpinStore.isOpenHyperSpinPopup = false;

        this.startHyperSpinWithRounds();
    }

    private startHyperSpinWithRounds() {
        this.flashSpinStore.setHyperSpinActive(true);
    }

    showHyperSpinBetControl() {
        this.flashSpinStore.isOpenHyperSpinBetControlPopup = true;

        if (this.flashSpinStore.selectedRoundOnPopup === 0) {
            this.flashSpinStore.selectedRoundOnPopup = this.flashSpinStore.roundsList[2];
        }

        if (this.isCancelled && !this.flashSpinStore.isActiveHyperSpin) {
            this.isCancelled = false;
        }

        if (this.flashSpinStore.spinBatchData?.summary.hyperSpinStatus === "Cancel") {
            this.flashSpinStore.clearBatchData();
        }

        if (!this.flashSpinStore.isActiveHyperSpin) {
            this.flashSpinStore.setHyperSpinActive(false);
        }
    }

    closeHyperSpinBetControl() {
        this.flashSpinStore.isOpenHyperSpinBetControlPopup = false;

        if (this.flashSpinStore.isActiveHyperSpin) {
            this.cancelHyperSpin();
        }
    }

    changeTotalBet(increase: boolean) {
        this.flashSpinStore.event = { action: FlashSpinEvent.CHANGE_TOTAL_BET, increase };
    }

    setTotalBetFromSlider(progress: number) {
        this.flashSpinStore.event = { action: FlashSpinEvent.CHANGE_TOTAL_BET_SLIDER, progress };
    }

    changeStopOnProfit(increase: boolean) {
        this.flashSpinStore.changeStopOnProfit(increase);
    }

    setStopOnProfitFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.flashSpinStore.minStopOnProfit;
        const max = this.flashSpinStore.maxStopOnProfit;
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const value = min + (max - min) * clampedProgress;

        this.flashSpinStore.setStopOnProfit(value);
    }

    changeStopOnLoss(increase: boolean) {
        this.flashSpinStore.changeStopOnLoss(increase);
    }

    setStopOnLossFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.flashSpinStore.minStopOnLoss;
        const max = this.flashSpinStore.maxStopOnLoss;
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const value = min + (max - min) * clampedProgress;

        this.flashSpinStore.setStopOnLoss(value);
    }

    toggleStopOnFeature() {
        this.flashSpinStore.stopOnFeature = !this.flashSpinStore.stopOnFeature;
    }

    toggleSettings() {
        if (this.flashSpinStore.spinBatchData?.summary.hyperSpinStatus === "Playing") {
            return;
        }

        this.flashSpinStore.isSettingsOpen = !this.flashSpinStore.isSettingsOpen;
    }

    closeHyperSpinPopup() {
        this.flashSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();
    }

    onClickPlayButton() {
        const isPaused = this.flashSpinStore.spinBatchData?.summary.hyperSpinStatus === "Paused";

        if (this.flashSpinStore.isActiveHyperSpin) {
            if (isPaused) {
                this.resumeHyperSpinBatch();
            }
            return;
        }

        this.flashSpinStore.roundsHyperSpin = this.flashSpinStore.selectedRoundOnPopup;
        this.startHyperSpinWithCurrentSettings();
    }

    private startHyperSpinWithCurrentSettings() {
        this.isCancelled = false;

        this.hyperSpinBatchStartTime = Date.now();

        this.flashSpinStore.setHyperSpinActive(true);
        this.flashSpinStore.startHyperSpinBatch();

        this.flashSpinStore.startHyperSpinSessionTracking();

        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        if (this.isCancelled) {
            return;
        }
        this.flashSpinStore.event = { action: FlashSpinEvent.PLACE_BET };
    }


    private getStopReason(): string {
        const reasons = [];

        if (this.flashSpinStore.stopOnProfit > 0) {
            const currentProfit = this.calculateCurrentProfit();
            if (currentProfit >= this.flashSpinStore.stopOnProfit) {
                reasons.push(`Profit reached: ${currentProfit} >= ${this.flashSpinStore.stopOnProfit}`);
            }
        }

        if (this.flashSpinStore.stopOnLoss > 0) {
            const currentLoss = this.calculateCurrentLoss();
            if (currentLoss >= this.flashSpinStore.stopOnLoss) {
                reasons.push(`Loss reached: ${currentLoss} >= ${this.flashSpinStore.stopOnLoss}`);
            }
        }

        if (this.flashSpinStore.roundsHyperSpin <= 0) {
            reasons.push("All rounds completed");
        }

        return reasons.length > 0 ? reasons.join(", ") : "Unknown";
    }

    private shouldStopHyperSpin(): boolean {
        const currentProfit = this.calculateCurrentProfit();
        const currentLoss = this.calculateCurrentLoss();

        const roundsExhausted = this.flashSpinStore.roundsHyperSpin <= 0;
        if (roundsExhausted) {
            return true;
        }

        if (this.flashSpinStore.stopOnFeature && this.flashSpinStore.freeSpinsTotal > 0) {
            return true;
        }

        if (this.flashSpinStore.stopOnProfit > 0) {
            const profitConditionMet = currentProfit >= this.flashSpinStore.stopOnProfit;

            if (profitConditionMet) {
                return true;
            }
        }

        if (this.flashSpinStore.stopOnLoss > 0) {
            const lossConditionMet = currentLoss >= this.flashSpinStore.stopOnLoss;

            if (lossConditionMet) {
                return true;
            }
        }

        return false;
    }

    private calculateCurrentProfit(): number {
        this.flashSpinStore.updateHyperSpinProfitLoss();
        return this.flashSpinStore.getCurrentHyperSpinProfit();
    }

    private calculateCurrentLoss(): number {
        this.flashSpinStore.updateHyperSpinProfitLoss();
        return this.flashSpinStore.getCurrentHyperSpinLoss();
    }

    public stopHyperSpin() {
        const isRoundsExhausted = this.flashSpinStore.roundsHyperSpin <= 0;

        if (!isRoundsExhausted) {
            const batchAge = Date.now() - this.hyperSpinBatchStartTime;
            if (batchAge < 1000 && this.hyperSpinBatchStartTime > 0) {
                return;
            }
        }

        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.flashSpinStore.setHyperSpinActive(false);
        this.flashSpinStore.stopHyperSpinSessionTracking();
        this.flashSpinStore.completeHyperSpinBatch();

        this.flashSpinStore.isOpenHyperSpinPopup = false;

        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        this.showHyperSpinStoppedMessage();
    }

    private completeHyperSpin() {
        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.flashSpinStore.setHyperSpinActive(false);
        this.flashSpinStore.stopHyperSpinSessionTracking();
        this.flashSpinStore.completeHyperSpinBatch();

        this.flashSpinStore.roundsHyperSpin = 0;
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        this.showHyperSpinCompletedMessage();
    }

    private showHyperSpinStoppedMessage() {
        this.noticeStore.addWarning("Hyper-Spin stopped due to stop conditions.");
    }

    private showHyperSpinCompletedMessage() {
        this.noticeStore.addWarning("Hyper-Spin completed successfully!");
    }

    pauseHyperSpinBatch() {
        this.flashSpinStore.pauseHyperSpinBatch();
    }

    resumeHyperSpinBatch() {
        if (this.isCancelled) {
            return;
        }

        this.flashSpinStore.resumeHyperSpinBatch();
        this.checkSpinNextRound();
    }

    checkSpinNextRound() {
        if (!this.isHyperSpinValidForNextRound()) {
            return;
        }

        if (this.isPaused()) {
            return;
        }

        if (this.flashSpinStore.roundsHyperSpin === 0) {
            this.completeHyperSpin();
            return;
        }

        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        this.placeHyperSpinBet();
    }

    private isHyperSpinValidForNextRound(): boolean {
        if (this.isCancelled) {
            return false;
        }

        if (!this.flashSpinStore.isActiveHyperSpin) {
            return false;
        }

        return true;
    }

    private isPaused(): boolean {
        return this.flashSpinStore.spinBatchData?.summary.hyperSpinStatus === "Paused";
    }

    private handleBatchInterruption() {


        if (this.flashSpinStore.spinBatchData) {
            this.flashSpinStore.spinBatchData.summary.hyperSpinStatus = "Interrupted";
        }

        this.showBatchInterruptionMessage();
    }

    private showBatchInterruptionMessage() {
        const message = "Hyper-Spin batch was interrupted. You can resume or restart the batch.";
        if (this.noticeStore) {
            this.noticeStore.addWarning(message);
        }
    }

    hasInterruptedBatch() {
        return !!(this.flashSpinStore.spinBatchData &&
            this.flashSpinStore.spinBatchData.summary.hyperSpinStatus === "Interrupted" &&
            this.flashSpinStore.roundsHyperSpin > 0);
    }

    getInterruptedBatchInfo() {
        if (!this.hasInterruptedBatch()) {
            return null;
        }

        const batchData = this.flashSpinStore.spinBatchData;
        const totalRounds = this.flashSpinStore.roundsList[this.flashSpinStore.roundsList.indexOf(this.flashSpinStore.selectedRoundOnPopup)] || this.flashSpinStore.selectedRoundOnPopup;
        const completedRounds = totalRounds - this.flashSpinStore.roundsHyperSpin;

        return {
            totalRounds,
            completedRounds,
            roundsRemaining: this.flashSpinStore.roundsHyperSpin,
            totalBet: batchData.summary.totalBet,
            totalWin: batchData.summary.totalWin,
            currentProfit: this.calculateCurrentProfit(),
            currentLoss: this.calculateCurrentLoss()
        };
    }

    cancelHyperSpin() {
        this.isCancelled = true;

        this.clearAllPendingTimeouts();

        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
        }

        this.flashSpinStore.setHyperSpinActive(false);

        this.updateHyperSpinRounds(0);

        if (this.flashSpinStore.spinBatchData) {
            this.flashSpinStore.spinBatchData.summary.hyperSpinStatus = "Cancel";
        } else {
            this.flashSpinStore.clearBatchData();
        }

        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

    }

    private clearAllPendingTimeouts() {
        let clearedCount = 0;

        if (this.checkNextRoundTimeout !== null) {
            clearTimeout(this.checkNextRoundTimeout);
            this.checkNextRoundTimeout = null;
            clearedCount++;
        }

    }

    updateSettlementSingleSpin(info: SettlementInfo) {
        this.flashSpinStore.updateSettlementSingleSpin(info);
    }
}
