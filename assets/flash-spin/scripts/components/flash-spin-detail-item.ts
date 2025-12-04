import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Node } from "cc";
import { DetailRecord } from "../handlers/flash-spin-store";
import FlashSpinMultiplierView from "./flash-spin-multiplier-view";
const { ccclass, property } = _decorator;
@ccclass
export default class FlashSpinDetailItem extends Component {
    @property(Label)
    lblWinAmount: Label = null;

    @property(FlashSpinMultiplierView)
    multiplierView: FlashSpinMultiplierView = null;

    @property(Node)
    nodeArrow: Node = null;

    showArrow(show: boolean) {
        this.nodeArrow.active = show;
    }

    setData(data: DetailRecord) {
        this.lblWinAmount.string = gc.FormatUtils.numberWithCommas(data.winAmount, 2, false);
        this.multiplierView.setMultiplier(data.multiplier, data.winLevel);
    }
}
