import gc from "@sg/game-client-base";
import { _decorator, Component, Label } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { DetailRecord } from "../flash-spin-definitions";
import FlashSpinMultiplierView from "./flash-spin-multiplier-view";
const { ccclass, property } = _decorator;
@ccclass
export default class FlashSpinDetailItem extends Component {
    @property(Label)
    lblWinAmount: Label = null;

    @property(FlashSpinMultiplierView)
    multiplierView: FlashSpinMultiplierView = null;

    data: DetailRecord = null;

    setData(data: DetailRecord) {
        this.data = data;
        this.updateDisplay(data.winAmount, data.multiplier, data.winLevel);
    }

    applyBonusMultiplier() {
        if (this.data.bonusMultiplier) {
            const winAmount = this.data.winAmount * this.data.bonusMultiplier;
            const multiplier = this.data.multiplier * this.data.bonusMultiplier;
            const winLevel = this.data.bonusWinLevel;
            this.animateDisplay(winAmount, multiplier, winLevel);
        }
    }

    animateDisplay(winAmount: number, multiplier: number, winLevel: number) {
        const duration = 0.2;
        AnimationUtils.numberTween(this.data.winAmount, winAmount, duration, (value) => {
            this.lblWinAmount.string = gc.FormatUtils.numberWithCommas(value, 2, false);
        });
        AnimationUtils.numberTween(this.data.multiplier, multiplier, duration, (value) => {
            this.multiplierView.setMultiplier(value);
        }).then(() => {
            this.multiplierView.setWinLevel(winLevel);
        });
    }

    private updateDisplay(winAmount: number, multiplier: number, winLevel: number) {
        this.lblWinAmount.string = gc.FormatUtils.numberWithCommas(winAmount, 2, false);
        this.multiplierView.setInfo(multiplier, winLevel);
    }
}
