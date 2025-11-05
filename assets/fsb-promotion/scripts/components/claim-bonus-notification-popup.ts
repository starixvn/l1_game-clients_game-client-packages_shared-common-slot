import { _decorator, Label } from "cc";
import gc from "@sg/game-client-base";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import Observer from "observer";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents } from "../stores/fsb-promotion-ui-store";
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
 
const { ccclass, property } = _decorator;
const { handle, render } = Observer;
 
@ccclass
export default class ClaimBonusNotificationPopup extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
 
    @render(FSBPromotionStore, (store) => store.claimedAmount)
    public show(claimedAmount: number) {
        if (!claimedAmount) {
            return;
        }
 
        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(claimedAmount, 2, false);
        this.node.active = true;
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.handleChangeUserBalance(true))
    handleChangeUserBalance(change: boolean) {
        return change;
    }
 
    private onCloseClicked() {
        this.node.getComponent(Dialog)?.hide();
        this.updateClaimedAmount();
        this.handleChangeUserBalance(true);
        this.closeClaimedBonusPopup();
        this.handlePromotion();
    }

    @handle(FSBPromotionHandlers, (handler) => handler.handlePromotion(null))
    handlePromotion() {
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.updateStatusClaimedPopup(false))
    closeClaimedBonusPopup() {
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.UPDATE_BALANCE_BONUS))
    updateClaimedAmount() {
    }
}