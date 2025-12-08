import { _decorator } from 'cc';
import { FlashSpinStore } from 'db://shared-common-slot/flash-spin/scripts/handlers/flash-spin-store';
import { LazyloadNodeContainer } from 'db://shared-components/shared/common-components/node-container/lazyload-node-container';
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("FlashSpinContainer")
export class FlashSpinContainer extends LazyloadNodeContainer {

    @render(FlashSpinStore, (store) => store.isOpenBetControlPopup)
    private setIsOpenHyperSpinBetControlPopup(isOpenHyperSpinBetControlPopup: boolean) {
        if (!isOpenHyperSpinBetControlPopup) {
            return;
        }
        this.createNodeAsync();
    }
}


