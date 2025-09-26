import { _decorator, Node } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { DialogTransition } from "db://shared-components/shared/common-components/dialogs/transition/dialog-transition";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass("FsbPromotionDialog")
export class FsbPromotionDialog extends ObserverComponent {
    @property(Node)
    playNow: Node = null;

    @property(Node)
    playLater: Node = null;

    @property(Node)
    closeButton: Node = null;

    @property(Node)
    background: Node = null;

    private isFreeSpins = false;
    private activeDetailPromo = false;

    public gameOffers: { name: string; gameId: number }[] = [];

    closeDialog() {
        this.node.getComponent(Dialog)?.hide();
        this.resetRedeemSuccess();
        this.addPendingUIEvent();
    }

    playGameNow() {
        this.closeDialog();
        this.onPlayGameNow();
        if (this.isFreeSpins) {
            this.setShowFreeSpinMessage();
            this.showFreeSpinMessage();
        } else {
            this.openPromotionDetailsPanel();
        }
    }

    @handle(FSBPromotionUIHandler, (handle) => handle.setIsClickPlayNow(true))
    onPlayGameNow() { }

    @render(FSBPromotionUIStore, (store) => store.isFreeSpinInGame)
    checkFeeSpinInGame(isFreeSpins: boolean) {
        if (isFreeSpins) {
            this.isFreeSpins = true;
        }
    }

    @render(FSBPromotionUIStore, (store) => store.gameOffers)
    setGameOffers(gameOffers: { name: string; gameId: number }[]) {
        this.gameOffers = gameOffers;
    }

    @render(FSBPromotionUIStore, (store) => store.isWebViewLoading)
    controlButtonsVisibility(isWebViewLoading: boolean) {
        if (this.playNow) {
            this.playNow.active = !isWebViewLoading && !this.activeDetailPromo;
        }
        if (this.playLater) {
            this.playLater.active = !isWebViewLoading && !this.activeDetailPromo;
        }
        if (this.closeButton) {
            this.closeButton.active = this.activeDetailPromo;
        }
        this.background.active = !isWebViewLoading;
        this.background.getComponent(DialogTransition)?.show(!isWebViewLoading);
    }

    @render(FSBPromotionUIStore, (store) => store.activeDetailPromo)
    setActiveAnnouncement(activeDetailPromo: boolean) {
        this.activeDetailPromo = activeDetailPromo;
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.openPromotionInfo(true))
    openPromotionDetailsPanel() { }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.SHOW_FREE_SPIN_MESSAGE))
    showFreeSpinMessage() { }

    @handle(FSBPromotionUIHandler, (handler) => handler.setShowFreeSpinMessage(true))
    setShowFreeSpinMessage() { }

    @handle(FSBPromotionHandlers, (handler) => handler.resetRedeemSuccess())
    resetRedeemSuccess() { }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.CLOSE_FSB_BANNER)
    closeFSBBanner(shouldClose: boolean) {
        if (shouldClose) {
            this.closeDialog();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.DESTROY_BANNER_NODE))
    addPendingUIEvent() { }
}
