import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { _decorator, EditBox, Label, sys, Node as CCNode } from "cc";
import Observer from "observer";
import gc from "@sg/game-client-base";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { FunctionUtils } from "db://shared-components/shared/utils";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass()
export class RedeemGiftCodePopup extends ObserverComponent {
    @property(EditBox)
    giftCodeInput: EditBox = null;

    @property(Label)
    errorLabel: Label = null;

    @property(CCNode)
    contentNode: CCNode = null;

    private _debounceTimer: any = null;
    private _originalY = 0;

    private _isKeyboardOpen = false;

    onEnable() {
        this.errorLabel.string = "";
        this._originalY = this.contentNode.position.y;
    }

    @handle(FSBPromotionUIHandler, (handle, giftCode: string) => handle.redeemGiftCode(giftCode))
    redeemGifCode() {
        return this.giftCodeInput.string.trim().toUpperCase();
    }

    @handle(FSBPromotionUIHandler, (handle) => handle.resetFSBRedemptionState())
    resetFSBRedemptionState() {}

    onClickRedeemGifCode() {
        this.redeemGifCode();
        this.resetFSBRedemptionState();
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClosePopup() {
        if (this._isKeyboardOpen) {
            return;
        }
        this.node.getComponent(Dialog)?.hide();
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
        }
    }

    async onPasteClicked() {
        let text = "";

        try {
            text = await navigator.clipboard.readText();
            this.giftCodeInput.string = text.trim().toUpperCase();
        } catch (e) {
            console.warn("Clipboard read failed", e);
        }
    }
    onEditBoxFocus() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            if (sys.isMobile && !FunctionUtils.isPortraitMode()) {
                this.contentNode.y += 200;
                this._isKeyboardOpen = true;
            }
            window.dispatchEvent(new Event("resize"));
        }, 200);
    }

    onInputFinalized(editBox: EditBox) {
        const upper = editBox.string.toUpperCase();
        if (editBox.string !== upper) {
            editBox.string = upper;
        }

        this.onEditBoxBlur();
    }

    onEditBoxBlur() {
        if (sys.isMobile && !FunctionUtils.isPortraitMode()) {
            this.scheduleOnce(() => {
                this.contentNode.y = this._originalY;
                this._isKeyboardOpen = false;
            }, 0.2);
        }
    }
}
