import { _decorator, Label, Node, ProgressBar } from "cc";
import gc from "@sg/game-client-base";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore, ITurnOverRequired } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { GameServiceMessageSlot } from "../../../game-message-slot";

import * as i18n from "db://i18n/LanguageData";
import SimpleClaimButton from "./simple-claim-button";

import Observer from "observer";
const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export default class TurnOverRequiredPanel extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
    @property(Label) labelTotalTurnover: Label = null;
    @property(Label) labelPercentage: Label = null;
    @property(ProgressBar) progressBar: ProgressBar = null;
    @property(Node) claimButton: Node = null;
    @property(Label) labelTimer: Label = null;
    @property(Label) labelMainMessage: Label = null;
    @property(Label) labelSubMessage: Label = null;

    private totalWinAmount = 0;
    private totalTurnover = 0;
    private minRequiredTurnover = 0;
    private progressPercentage = 0;
    private endTime = 0;

    onEnable() {
        this.schedule(this.updateTimer, 1);
        this.dragTurnOverRequired();
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    private updatePendingUIEvent(data: { event: string; data?: any }) {
        if (data.event === FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR) {
            this.showNoticeError(data.data as string);
        }
        if (data.event === FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS) {
            this.hidePanel();
        }
    }

    showNoticeError(errorCode: string) {
        this.showTONoticeError(errorCode);
        const claimBtnCtrl = this.claimButton.getComponent(SimpleClaimButton);
        if (claimBtnCtrl) {
            claimBtnCtrl.setClaimable(this.progressPercentage >= 100);
            claimBtnCtrl.startClaimButtonPulse();
        }
    }

    dragTurnOverRequired() {
        const draggableItem = this.getComponent(DraggableItem);
        if (draggableItem) {
            draggableItem.touchCallback.end = (isClicked) => {
                if (isClicked) {
                    this.collapseMenu();
                }
            };
        }
    }

    public updateBonusWallet(data: ITurnOverRequired) {
        this.totalWinAmount = data?.win;
        this.totalTurnover = data?.totalTO;
        this.minRequiredTurnover = data?.minTO;
        this.progressPercentage = data?.progress;
        this.endTime = new Date(data?.expire).getTime();

        this.updateProgressUI();
        this.updateTimer();
    }

    public updateTotalWinAndTurnover(totalWin: number, turnover: number) {
        this.totalWinAmount = totalWin;
        this.totalTurnover = turnover;
        this.updateProgressUI();
    }

    private updateProgressUI() {
        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(this.totalWinAmount, 2);

        const formattedTotalTO = gc.FormatUtils.numberWithCommas(this.totalTurnover, 2);
        const formattedMinRequiredTO = gc.FormatUtils.numberWithCommas(this.minRequiredTurnover, 2);
        this.labelTotalTurnover.string = `${formattedTotalTO} / ${formattedMinRequiredTO}`;

        this.labelPercentage.string = `${this.progressPercentage}%`;
        this.progressBar.progress = this.progressPercentage / 100;

        this.getProgressMessage();

        const isReadyToClaim = this.progressPercentage >= 100;
        const claimBtnCtrl = this.claimButton.getComponent(SimpleClaimButton);
        if (claimBtnCtrl) {
            claimBtnCtrl.setClaimable(isReadyToClaim);
            if (isReadyToClaim) {
                claimBtnCtrl.startClaimButtonPulse();
            } else {
                claimBtnCtrl.stopClaimButtonPulse();
            }
        }
    }

    private updateTimer() {
        if (!this.endTime) {
            return;
        }

        const now = Date.now();
        const remaining = Math.max(0, this.endTime - now);

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        const dayText = i18n.t("FreeSpinBonus.FSB_days");
        this.labelTimer.string = `${days} ${dayText} ${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    public onClickClaim() {
        const claimBtnCtrl = this.claimButton.getComponent(SimpleClaimButton);
        if (claimBtnCtrl) {
            claimBtnCtrl.setClaimable(false);
            claimBtnCtrl.stopClaimButtonPulse();
        }
        this.collapseMenu();
        this.claimBonusWin();
    }

    onClickInfoIcon() {
        this.activeDetailPromo();
        this.updatePromotionURL();
        this.openFreeSpinsPromotion();
    }

    private getProgressMessage() {
        const value = this.progressPercentage;
        let mainMessageKey = "";
        let subMessageKey = "";

        if (value >= 100) {
            mainMessageKey = "FreeSpinBonus.FSB_notification_para1a";
            subMessageKey = "FreeSpinBonus.TO_requirement_state4_message";
        } else if (value >= 81) {
            mainMessageKey = "FreeSpinBonus.TO_requirement_state3_message";
            subMessageKey = "FreeSpinBonus.TO_requirement_state3_message1";
        } else if (value >= 41) {
            mainMessageKey = "FreeSpinBonus.TO_requirement_state2_message";
            subMessageKey = "FreeSpinBonus.TO_requirement_state2_message1";
        } else {
            mainMessageKey = "FreeSpinBonus.TO_requirement_state1_message";
            subMessageKey = "FreeSpinBonus.TO_requirement_state1_message1";
        }

        this.labelMainMessage.string = i18n.t(mainMessageKey).toUpperCase();
        this.labelSubMessage.string = i18n.t(subMessageKey);
    }

    hidePanel() {
        this.node.active = false;
    }

    @render(FSBPromotionStore, (store) => store.promotionTOProgress)
    private updateTOProgress(data: GameServiceMessageSlot.PromotionTOProgress) {
        this.updateBonusWallet(data);
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    private updatePromotionProgress(data: { event: string; data?: any }) {
        if (data.event === FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED) {
            this.updateBonusWallet(data.data as ITurnOverRequired);
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.COLLAPSE_MENU))
    private collapseMenu() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION))
    private openFreeSpinsPromotion() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.claimBonusWin())
    private claimBonusWin() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.activeDetailPromo(true))
    private activeDetailPromo() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.updatePromotionURL())
    private updatePromotionURL() {}

    @handle(FSBPromotionUIHandler, (handler, errorCode) => handler.showNoticeError(errorCode as string))
    private showTONoticeError(errorCode: string) {
        return errorCode;
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    private updateClaimedBonusSuccess(data: { event: string; data?: any }) {
        if (data.event === FreeSpinsPromotionEvents.CLAIMED_BONUS_SUCCESS) {
            this.hidePanel();
            this.openClaimBonusNotification();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_CLAIM_BONUS_NOTIFICATION))
    private openClaimBonusNotification() {}
}
