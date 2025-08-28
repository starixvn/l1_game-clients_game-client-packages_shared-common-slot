import { _decorator, Label } from "cc";
import gc from "@sg/game-client-base";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import Observer from "observer";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents } from "../stores/fsb-promotion-ui-store";
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
//import { CascadingUIHandler } from "db://shared-cascading-slot/handlers/cascading-ui-handler";
 
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
        //this.handleChangeUserBalance(true);
    }

   /*  @handle(CascadingUIHandler, (handler) => handler.handleChangeUserBalance(true))
    handleChangeUserBalance(change: boolean) {
        return change;
    } */
 
    private onCloseClicked() {
        this.node.getComponent(Dialog)?.hide();
        this.updateClaimedAmount();
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.UPDATE_BALANCE_BONUS))
    updateClaimedAmount() {
    }
}