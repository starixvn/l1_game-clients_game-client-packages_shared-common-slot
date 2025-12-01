import { _decorator } from 'cc';
import { HyperSpinStore } from 'db://shared-cascading-slot/stores/hyper-spin-store';
import { LazyloadNodeContainer } from 'db://shared-components/shared/common-components/node-container/lazyload-node-container';
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("FlashSpinContainer")
export class FlashSpinContainer extends LazyloadNodeContainer {

    @render(HyperSpinStore, (store) => store.isOpenHyperSpinBetControlPopup)
    private setIsOpenHyperSpinBetControlPopup(isOpenHyperSpinBetControlPopup: boolean) {
        if (!isOpenHyperSpinBetControlPopup) {
            return;
        }
        this.createNodeAsync();
    }
}


