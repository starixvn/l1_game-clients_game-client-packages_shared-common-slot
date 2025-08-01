import { _decorator, Node, tween, UIOpacity } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class EffectUnboxGift extends ObserverComponent {
    @property(Node)
    background: Node = null;
    onLoad() {
        super.onLoad();
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT)
    hideBackground(isOpenRedeemGiftCodePopup: boolean) {
        if (isOpenRedeemGiftCodePopup) {
            this.scheduleOnce(() => {
                if (this.background) {
                    const uiOpacity = this.background.getComponent(UIOpacity) || this.background.addComponent(UIOpacity);
                    tween(uiOpacity)
                        .to(1, { opacity: 0 }, { easing: "sineOut" })
                        .call(() => {
                            this.background.active = false;
                        })
                        .start();
                }
            }, 0.8);
        }
    }
}
