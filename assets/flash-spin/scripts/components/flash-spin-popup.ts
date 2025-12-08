import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { FlashSpinHandler } from "../handlers/flash-spin-handler";
import { FlashSpinStore } from "../handlers/flash-spin-store";
import FlashSpinRoundNumber from "./flash-spin-round-number";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class FlashSpinPopup extends ObserverComponent {
    @property(Node)
    nodeContent: Node = null;

    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @render(FlashSpinStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        this.nodeContent.destroyAllChildren();

        roundsList.forEach((round, index) => {
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(FlashSpinRoundNumber);
            roundNumber?.setValue(round);
            this.nodeContent.addChild(node);
        });

    }

    @render(FlashSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.nodeContent.children.forEach((child, index) => {
            const roundNumber = child.getComponent(FlashSpinRoundNumber);
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
        });

    }

    @handle(FlashSpinHandler, (handle) => handle.closeHyperSpinPopup())
    onClickclosePopup() {
        this.playSoundClick();
    }

    @handle(FlashSpinHandler, (handle) => handle.confirmHyperSpinRoundsAndStart())
    onClickStartButton() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}

