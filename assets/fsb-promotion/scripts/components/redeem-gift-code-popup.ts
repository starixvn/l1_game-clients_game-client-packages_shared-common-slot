import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { _decorator, EditBox, Label, Node, sys, tween, UIOpacity, v3 } from "cc";
import Observer from "observer";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import gc from "@sg/game-client-base";
import { FSBPromotionStore } from "../fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FSBPromotionUIHandler } from "../fsb-promotion-ui-handler";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass()
export class RedeemGiftCodePopup extends ObserverComponent {
    @property(EditBox)
    giftCodeInput: EditBox = null;

    @property(Node)
    nodeRedeemButton: Node = null;

    @property(Label)
    errorLabel: Label = null;
    private _debounceTimer: any = null;
    private readonly _originalY = 0;

    onEnable() {
        this.errorLabel.string = "";
        this.nodeRedeemButton.on("click", this.onClickRedeemGifCode, this);
        this.giftCodeInput.node.on("editing-did-began", this.onEditBoxFocus, this);
        this.giftCodeInput.node.on("editing-did-ended", this.onInputFinalized, this);
    }

    onDisable() {
        this.nodeRedeemButton.off("click", this.onClickRedeemGifCode, this);
        this.giftCodeInput.node.off("editing-did-began", this.onEditBoxFocus, this);
        this.giftCodeInput.node.off("editing-did-ended", this.onInputFinalized, this);
    }

    @handle(FSBPromotionUIHandler, (handle, giftCode: string) => handle.redeemGiftCode(giftCode))
    onClickRedeemGifCode() {
        return this.giftCodeInput.string.trim().toUpperCase();
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClosePopup() {
        this.node.getComponent(Dialog)?.hide();
    }

    @render(FSBPromotionStore, (store) => store.redemptionNotice)
    renderRedemptionNotice(redemptionNotice: GameServiceMessageSlot.RedemptionNotice) {
        this.errorLabel.string = redemptionNotice.errorCode;
    }

    @render(FSBPromotionStore, (store) => store.isRedeemSuccess)
    renderRedeemSuccess(isRedeemSuccess: boolean) {
        if (isRedeemSuccess) {
            this.onCloseClicked();
        }
    }

    startRedeemButtonPulse() {
        const node = this.nodeRedeemButton;
        node.scale = v3(1, 1, 1);

        tween(node)
            .repeatForever(
                tween()
                    .to(0.2, { scale: 0.93 }, { easing: "sineIn" })
                    .to(0.4, { scale: 1.05 }, { easing: "sineOut" })
                    .to(0.3, { scale: 1.0 }, { easing: "sineInOut" })
            )
            .start();
    }
    onInputFinalized(editBox: EditBox) {
        const upper = editBox.string.toUpperCase();
        if (editBox.string !== upper) {
            editBox.string = upper;
        }

        this.onEditBoxBlur();
    }
    onEditBoxFocus() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            if (sys.isMobile) {
                this.node.y += 200;
            }
            window.dispatchEvent(new Event("resize"));
        }, 200);
    }

    onEditBoxBlur() {
        if (sys.isMobile) {
            this.node.y = this._originalY;
        }
    }

    async onPasteClicked() {
        this.giftCodeInput.blur();
        let text = "";

        try {
            text = await navigator.clipboard.readText();
            this.giftCodeInput.string = text.trim().toUpperCase();
        } catch (e) {
            console.warn("Clipboard read failed", e);
        }
    }

    onCloseClicked() {
        const uiOpacity = this.node.getComponent(UIOpacity);

        tween(uiOpacity)
            .to(0.3, { opacity: 0 }, { easing: "backIn" })
            .call(() => this.node.destroy())
            .start();
    }
}
