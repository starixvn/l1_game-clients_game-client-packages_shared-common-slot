import { _decorator, Node} from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import Observer from "observer";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { DialogTransition } from "db://shared-components/shared/common-components/dialogs/transition/dialog-transition";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
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
    }

    playGameNow() {
        this.closeDialog();
        this.onPlayGameNow();
        if (this.isFreeSpins) {
            this.showFreeSpinMessage();
        } else {
            this.openPromotionDetailsPanel();
        }
    }

    @handle(FSBPromotionUIHandler, (handle) => handle.setIsClickPlayNow(true))
    onPlayGameNow() {}

    @render(CascadingUIStore, (store) => store.isFreeSpins)
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
        if (isWebViewLoading) {
            this.background.getComponent(DialogTransition)?.show(false);
        } else {
            this.background.getComponent(DialogTransition)?.show(true);
        }
        if (this.playNow) {
            this.playNow.active = !isWebViewLoading && !this.activeDetailPromo;
        }
        if (this.playLater) {
            this.playLater.active = !isWebViewLoading && !this.activeDetailPromo;
        }
        if (this.closeButton) {
            this.closeButton.active = this.activeDetailPromo;
        }
    }

    @render(FSBPromotionUIStore, (store) => store.activeDetailPromo)
    setActiveAnnouncement(activeDetailPromo: boolean) {
        this.activeDetailPromo = activeDetailPromo;
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO, true))
    openPromotionDetailsPanel() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.SHOW_FREE_SPIN_MESSAGE))
    showFreeSpinMessage() {}

    @handle(FSBPromotionHandlers, (handler) => handler.resetRedeemSuccess())
    resetRedeemSuccess() {
    }
}
