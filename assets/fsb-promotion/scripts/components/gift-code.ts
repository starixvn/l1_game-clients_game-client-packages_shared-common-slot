import { _decorator, Node } from 'cc';
import DraggableItem from 'db://shared-components/shared/common-components/draggable/draggable-item';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FreeSpinsPromotionEvents } from '../stores/fsb-promotion-ui-store';
import { FSBPromotionUIHandler } from '../handlers/fsb-promotion-ui-handler';
import Observer from 'observer';
//import { CascadingUIStore } from 'db://shared-cascading-slot/stores/cascading-ui-store';
//import { CascadingSlotState } from 'db://shared-cascading-slot/cascading-slot-state';
const { ccclass, property } = _decorator;
const { handle, render } = Observer;


@ccclass('gift_code')
export class GiftCode extends ObserverComponent {
    @property(Node)
    icon: Node = null;
    private isProcessing = false;
    //private cascadingState = CascadingSlotState.NOT_READY_BET;



    onEnable() {
        this.dragGiftCode();
    }

    dragGiftCode() {
        const draggableItem = this.getComponent(DraggableItem);
        if (draggableItem) {
            draggableItem.touchCallback.end = (isClicked) => {
                if (isClicked) {
                    this.onClickGiftCode();
                }
            };
        }
    }

    onClickGiftCode() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        this.openGiftCodeRedeemPopup();

        this.scheduleOnce(() => {
            this.isProcessing = false;
        }, 1);
    }

   /*  @render(CascadingUIStore, (store) => store.cascadingState)
    private updateClaimedBonusSuccess(cascadingState: string) {
        this.cascadingState = cascadingState;
    } */

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT))
    private openGiftCodeRedeemPopup() {
    }
}