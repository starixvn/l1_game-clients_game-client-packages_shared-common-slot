import { _decorator, CCFloat } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
const { fadeIn, stopFade } = AnimationUtils;
const { ccclass, property } = _decorator;

@ccclass
export class CustomTransitionDialog extends Dialog {
    @property(CCFloat)
    duration = 0.8;

    async show() {
        console.log("show", this.duration);
        const promises = [];
        const dialog = this.node.getComponent(CustomTransitionDialog);
        if (dialog.nodeFadeBackground) {
            dialog.nodeFadeBackground.active = true;
            stopFade(dialog.nodeFadeBackground);
            promises.push(fadeIn(dialog.nodeFadeBackground, this.duration));
        }

        if (dialog.nodeBody) {
            const transition = dialog.getBodyTransition();
            promises.push(transition.show(true));
        }

        await Promise.all(promises);
        dialog.onShowComplete?.();
    }
}
