import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../game-message-slot";

import Observer from "observer";
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
        this.dragDetailPanel();
    }

    dragDetailPanel() {
        const draggableItem = this.getComponent(DraggableItem);
        if (draggableItem) {
            draggableItem.touchCallback.end = (isClicked) => {
                if (isClicked) {
                    this.onCollapseMenu();
                }
            };
        }
    }
    onCollapseMenu() {}

    @render(FSBPromotionStore, (store) => store.promotion)
    onFSBPromotionInfo(promotion: GameServiceMessageSlot.Promotion) {
        const { coinValue, totalWin, remainingBonusItems } = promotion;

        const totalBet = this.calculateTotalBet(coinValue);
        this.updateLabels(totalWin, remainingBonusItems, totalBet);
    }

    private calculateTotalBet(coinValue: number): number {
        return +(this.BET_LEVEL * coinValue * this.BET_MULTIPLIER).toFixed(1);
    }

    private updateLabels(totalWin: number, remaining: number, totalBet: number) {
        this.labelTotalWin.string = totalWin.toString();
        this.labelFSB.string = remaining.toString();
        this.labelTotalBet.string = totalBet.toString();
    }
}
