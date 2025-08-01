import { _decorator, Node } from 'cc';
import DraggableItem from 'db://shared-components/shared/common-components/draggable/draggable-item';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
import Observer from 'observer';
const { ccclass, property } = _decorator;
const { handle, render } = Observer;


@ccclass('gift_code')
export class GiftCode extends ObserverComponent {
    @property(Node)
    icon: Node = null;
    private isProcessing = false;

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

    @handle(FSBPromotionUIStore, (store) => store.addPendingUIEvent(FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT))
    private openGiftCodeRedeemPopup() {
    }
}