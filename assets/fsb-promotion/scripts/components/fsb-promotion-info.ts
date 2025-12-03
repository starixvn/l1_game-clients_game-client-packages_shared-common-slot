import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { formatStringXMode } from "../../../x-mode/scripts/utils/xMode-utils";

const { render, handle } = Observer;
const { ccclass, property } = _decorator;
const { Bet } = gc;

@ccclass()
export class FSBPromotionInfo extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
    @property(Label) labelFSB: Label = null;
    @property(Label) labelTotalBet: Label = null;
    private readonly BET_MULTIPLIER = 20;

    private readonly DEFAULT_LINES = 25;

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

    private onCollapseMenu() { }

    @render(FSBPromotionStore, (store) => store.promotion)
    onFSBPromotionInfo(promotion: GameServiceMessageSlot.Promotion) {
        if (!promotion) {
            return;
        }
        const { coinValue, betLevel = 0, totalWin = 0, remainingBonusItems = 0 } = promotion;
        this.totalWin = totalWin;
        const totalBet = this.calculateTotalBet(coinValue, betLevel);
        this.updateUI({ totalWin, remainingBonusItems, totalBet });
    }

    private calculateTotalBet(coinValue: number, betLevel: number): number {
        if (!coinValue) {
            return +(betLevel * this.DEFAULT_LINES);
        }
        return +(betLevel * coinValue * this.BET_MULTIPLIER).toFixed(1);
    }

    private updateUI({ totalWin, remainingBonusItems, totalBet }: { totalWin?: number; remainingBonusItems?: number; totalBet?: number }) {
        this.labelTotalWin.string = formatStringXMode(totalWin);

        this.labelFSB.string = remainingBonusItems.toString();

        this.labelTotalBet.string = formatStringXMode(totalBet);
    }

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
    revertLastFSB() { }

    @handle(FSBPromotionUIHandler, (handler) => handler.updatePromotionURL())
    private updatePromotionURL() { }

    @handle(FSBPromotionUIHandler, (handler) => handler.activeDetailPromo(true))
    private activeDetailPromo() { }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION))
    private openFreeSpinsPromotion() { }
}
