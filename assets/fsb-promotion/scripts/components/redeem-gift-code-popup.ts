import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { _decorator, EditBox, Label, Node, sys, tween, Vec3 } from "cc";
import Observer from "observer";
import gc from "@sg/game-client-base";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { CustomTransitionDialog } from "./custom-transition-dialog";
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

    onEnable() {
        this.errorLabel.string = "";
    }

    @handle(FSBPromotionUIHandler, (handle, giftCode: string) => handle.redeemGiftCode(giftCode))
    @handle(FSBPromotionUIHandler, (handle) => handle.resetRedeemResult())
    onClickRedeemGifCode() {
        return this.giftCodeInput.string.trim().toUpperCase();
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    @handle(FSBPromotionUIHandler, (handle) => handle.changeUIPendingEvent(FreeSpinsPromotionEvents.CLOSE_GIFT_CODE_REDEEM_POPUP))
    onClosePopup() {
        this.node.getComponent(CustomTransitionDialog)?.hide();
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    renderRedemptionNotice(pendingUIEvent: { event: string; data: any }) {
        if (pendingUIEvent?.event === FreeSpinsPromotionEvents.REDEMPTION_NOTICE) {
            this.errorLabel.string = gc.Translator.translate(pendingUIEvent?.data);
        }
    }

    @render(FSBPromotionStore, (store) => store.isRedeemSuccess)
    renderRedeemSuccess(isRedeemSuccess: boolean) {
        if (isRedeemSuccess) {
            this.onClosePopup();
            this.openTransitionCoinEffect();
            this.onCloseGiftCodeIcon();
        }
    }

    @handle(FSBPromotionUIHandler, (handle) => handle.changeUIPendingEvent(FreeSpinsPromotionEvents.EFFECT_COIN_ANIMATION))
    openTransitionCoinEffect() {}

    @handle(FSBPromotionUIHandler, (handle) => handle.changeUIPendingEvent(FreeSpinsPromotionEvents.CLOSE_GIFT_CODE_ICON))
    onCloseGiftCodeIcon() {}

    async onPasteClicked() {
        let text = "";

        try {
            text = await navigator.clipboard.readText();
            this.giftCodeInput.string = text.trim().toUpperCase();
        } catch (e) {
            console.warn("Clipboard read failed", e);
        }
    }
    triggerResize(editBox: EditBox) {
        const upper = editBox?.string?.toUpperCase();
        if (editBox?.string !== upper) {
            editBox.string = upper;
        }
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 200);
    }
}
