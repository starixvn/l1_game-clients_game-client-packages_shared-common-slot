import gc from "@sg/game-client-base";
import { _decorator, Component, Node, RichText, tween } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export class FSBPromotionBottomMessage extends Component {
    @property(RichText)
    msgText: RichText = null;

    @property(Node)
    msgNode: Node = null;
    private readonly DELAY_TIME = 3;

    onLoad() {
        this.showMessage();
    }
    showMessage() {
        const message = gc.Translator.translate("FreeSpinBonus.FSB_pending_freespin_msg");
        this.msgText.string = message;

        this.msgNode.active = true;

        tween(this.msgNode)
            .delay(this.DELAY_TIME)
            .call(() => {
                this.msgNode.active = false;
            })
            .start();
    }
}
