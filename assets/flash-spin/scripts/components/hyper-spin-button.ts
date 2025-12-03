import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { FlashSpinHandler } from "../handlers/flash-spin-handler";

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

    @render(CascadingUIStore, (store) => store.disabledHyperSpin)
    disabledHyperSpin(disabledHyperSpin: boolean) {
        this.nodeDisabled.active = disabledHyperSpin;
    }
}

