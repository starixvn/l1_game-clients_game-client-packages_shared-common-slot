import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Sprite } from "cc";
const { ccclass, property } = _decorator;
@ccclass
export default class FlashSpinMultiplierView extends Component {
    @property(Label)
    lblMultiplier: Label = null;

    @property(Sprite)
    spriteBg: Sprite = null;

    setMultiplier(multiplier: number, winLevel: number) {
        if (this.lblMultiplier) {
            this.lblMultiplier.string = `${gc.FormatUtils.numberWithCommas(multiplier, 2)}x`;
        }
        this.activateWinTagSprite(winLevel);
    }

    private activateWinTagSprite(winLevel: number) {
        if (!this.spriteBg) {
            return;
        }

        if (winLevel < 0) {
            this.spriteBg.node.active = false;
            return;
        }

        const dict = ["bronze", "silver", "gold", "amethyst"];
        const spriteFrameName = `multiplier-${dict[winLevel]}-tag`;
        const spriteFrame = this.spriteBg.spriteAtlas.getSpriteFrame(spriteFrameName);

        if (spriteFrame) {
            this.spriteBg.spriteFrame = spriteFrame;
            this.spriteBg.node.active = true;
        } else {
            this.spriteBg.node.active = false;
        }
    }
}
