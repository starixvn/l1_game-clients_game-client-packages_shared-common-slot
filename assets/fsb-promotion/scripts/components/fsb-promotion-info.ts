import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import Observer from "observer";
import { AutoPlayHandler } from "db://shared-cascading-slot/handlers/auto-play-handlers";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import gc from "@sg/game-client-base";

const { render, handle } = Observer;
const { ccclass, property } = _decorator;
const { Bet } = gc;

@ccclass()
export class FSBPromotionInfo extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
    @property(Label) labelFSB: Label = null;
    @property(Label) labelTotalBet: Label = null;
    private readonly BET_MULTIPLIER = 20;

    private totalWin = 0;

    onEnable() {
        this.setupDraggable();
    }

    private setupDraggable() {
        const draggableItem = this.getComponent(DraggableItem);
        draggableItem?.touchCallback?.end &&
            (draggableItem.touchCallback.end = (isClicked) => {
                if (isClicked) {
                    this.onCollapseMenu();
                }
            });
    }

    private onCollapseMenu() {}

    @render(FSBPromotionStore, (store) => store.promotion)
    onFSBPromotionInfo(promotion: GameServiceMessageSlot.Promotion) {
        const { coinValue = 0, betLevel = 0, totalWin = 0, remainingBonusItems = 0 } = promotion;
        this.totalWin = totalWin;
        const totalBet = this.calculateTotalBet(coinValue, betLevel);
        this.updateUI({ totalWin, remainingBonusItems, totalBet });
        this.setCurrentSpinCount(remainingBonusItems);
    }

    private calculateTotalBet(coinValue: number, betLevel: number): number {
        return +(betLevel * coinValue * this.BET_MULTIPLIER).toFixed(1);
    }

    private updateUI({ totalWin, remainingBonusItems, totalBet }: { totalWin?: number; remainingBonusItems?: number; totalBet?: number }) {
        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(totalWin, 2, false);

        this.labelFSB.string = remainingBonusItems.toString();

        this.labelTotalBet.string = gc.FormatUtils.numberWithCommas(totalBet, 2, false);
    }

    @handle(FSBPromotionUIHandler, (handler, remainingBonusItems: number) => handler.setCurrentSpinCount(remainingBonusItems))
    setCurrentSpinCount(remainingBonusItems: number) {
        return remainingBonusItems;
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME)
    spinOnFSBPromotionFirstTime(isSpinOnFSBPromotionFirstTime: boolean) {
        if (isSpinOnFSBPromotionFirstTime) {
            this.scheduleOnce(() => {
                this.setBetControl();
                this.placeBet();
            }, 0.8);
        }
    }

    @handle(AutoPlayHandler, (handler) => handler.placeBet())
    placeBet() {
        this.tryConsumeFSB();
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.tryConsumeFSB())
    tryConsumeFSB() {}

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    onPendingUIEvent(event: { event: string; data?: any }) {
        if (!event) {
            return;
        }

        const { event: type, data } = event;

        switch (type) {
            case FreeSpinsPromotionEvents.UPDATE_FSB_COUNT:
                if (this.labelFSB) {
                    this.labelFSB.string = data?.toString();
                }
                break;
            case FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN:
                if (this.labelTotalWin) {
                    this.totalWin += data;
                    this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(this.totalWin, 2, false);
                }
                break;
        }
    }

    onClickInfoIcon() {
        this.activeDetailPromo();
        this.updatePromotionURL();
        this.openFreeSpinsPromotion();

    }

    @render(Bet.BetStore, (store) => store.lastReceivedBet, { fireImmediately: false })
    updataRemainingBonus(lastReceivedBet: any) {
        const isReceivedBet = lastReceivedBet.value > 0;
        if (!isReceivedBet) {
            this.revertLastFSB();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.undoLastFSBSpin())
    revertLastFSB() {}

    @render(FSBPromotionUIStore, (store) => [store.isEligibleForNextFSBSpin, store.hasServerFinishPromotion])
    async autoTriggerNextFSBSpin([isEligibleForNextFSBSpin, hasServerFinishPromotion]: [boolean, boolean]) {
        if (isEligibleForNextFSBSpin && !hasServerFinishPromotion) {
            this.setBetControl();
            this.tryConsumeFSB();
            this.placeBet();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.syncFSBBetControl())
    setBetControl() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.updatePromotionURL())
    private updatePromotionURL() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.activeDetailPromo(true))
    private activeDetailPromo() {}

    
    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION))
    private openFreeSpinsPromotion() {}
}
