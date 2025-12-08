import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { FlashSpinHandler } from "../handlers/flash-spin-handler";
import { FlashSpinStore } from "../handlers/flash-spin-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export default class HyperSpinButton extends ObserverComponent {
    @property(Node)
    nodeDisabled: Node = null;

    onClickHyperSpin() {
        AudioUtils.playClick();
        this.triggerHyperSpinHandler();
    }

    @handle(FlashSpinHandler, (handle) => handle.clickHyperSpin())
    triggerHyperSpinHandler() { }

    @render(FlashSpinStore, (store) => store.disabledHyperSpin)
    disabledHyperSpin(disabledHyperSpin: boolean) {
        this.nodeDisabled.active = disabledHyperSpin;
    }
}

