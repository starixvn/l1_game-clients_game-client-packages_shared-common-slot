import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import Observer from "observer";
import { AutoPlayHandler } from "db://shared-cascading-slot/handlers/auto-play-handlers";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";

const { render, handle } = Observer;
const { ccclass, property } = _decorator;

@ccclass()
export class FSBPromotionInfo extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
    @property(Label) labelFSB: Label = null;
    @property(Label) labelTotalBet: Label = null;

    private readonly BET_MULTIPLIER = 20;
    private readonly BET_LEVEL = 1;

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
        const { coinValue = 0, totalWin = 0, remainingBonusItems = 0 } = promotion;
        const totalBet = this.calculateTotalBet(coinValue);
        this.updateUI({ totalWin, remainingBonusItems, totalBet });
    }

    private calculateTotalBet(coinValue: number): number {
        return +(this.BET_LEVEL * coinValue * this.BET_MULTIPLIER).toFixed(1);
    }

    private updateUI({ totalWin, remainingBonusItems, totalBet }: { totalWin?: number; remainingBonusItems?: number; totalBet?: number }) {
        this.labelTotalWin.string = totalWin.toString();

        this.labelFSB.string = remainingBonusItems.toString();

        this.labelTotalBet.string = totalBet.toString();

        this.placeBet();
    }

    @handle(AutoPlayHandler, (handler) => handler.placeBet())
    placeBet() {}

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    onPendingUIEvent(event: { event: string; data?: any }) {
        if (!event) return;

        const { event: type, data } = event;

        switch (type) {
            case FreeSpinsPromotionEvents.UPDATE_FSB_COUNT:
                if (this.labelFSB) {
                    this.labelFSB.string = data?.toString();
                }
                break;
            case FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN:
                if (this.labelTotalWin) {
                    this.labelTotalWin.string = data.toString();
                }
                break;
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION))
    onClickInfoIcon() {}
}
