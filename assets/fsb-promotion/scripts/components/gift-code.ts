import { _decorator, Node } from 'cc';
import DraggableItem from 'db://shared-components/shared/common-components/draggable/draggable-item';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from '../fsb-promotion-ui-store';
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

    @render(FSBPromotionUIStore, (store) => store.getPendingUIEvent()?.event === FreeSpinsPromotionEvents.OPEN_GIFT_CODE)
    onOpenGiftCodeRedeem() {
        this.node.active = true;
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

    @handle(FSBPromotionUIStore, (store) => store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE_REDEEM_POPUP))
    onClickGiftCode() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

        this.scheduleOnce(() => {
            this.isProcessing = false;
        }, 1);
    }
}


