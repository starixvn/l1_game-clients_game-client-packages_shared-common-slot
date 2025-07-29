import { _decorator, Component, Node } from 'cc';
import DraggableItem from 'db://shared-components/shared/common-components/draggable/draggable-item';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
const { ccclass, property } = _decorator;

@ccclass('gift_code')
export class gift_code extends ObserverComponent {
    @property(Node)
    icon: Node = null;

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
    }
}


