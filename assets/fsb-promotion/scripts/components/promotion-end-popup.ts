import { _decorator, Button, Label } from "cc";
import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import Observer from "observer";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
const { render, handle } = Observer;

const { ccclass, property } = _decorator;

@ccclass("promotion_end_popup")
export default class PromotionEndPopup extends ObserverComponent {
    @property(Label) labelTitle: Label = null;
    @property(Label) labelMainMessage: Label = null;
    @property(Label) labelSubMessage: Label = null;
    @property(Label) labelTotalWin: Label = null;
    @property(Button) closeButton: Button = null;
    public static hasShown = false;

    private currentSpinCount = 0;

    @render(FSBPromotionUIStore, (store) => store.currentSpinCount)
    updateCurrentSpinCount(currentSpinCount: number) {
        this.currentSpinCount = currentSpinCount;
    }

    @render(FSBPromotionStore, (store) => store.finishPromotion)
    public show(finishPromotion: GameServiceMessageSlot.FinishPromotion) {
        if (!finishPromotion) {
            return;
        }
        PromotionEndPopup.hasShown = true;
        const { totalWin } = finishPromotion;
        this.closeFSBBanner();
        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(totalWin, 2, false);
        this.node.active = true;
        this.setupContent(totalWin);
        this.setShowFreeSpinMessage();
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.CLOSE_FSB_BANNER))
    closeFSBBanner() {}

    private setupContent(totalWin: number) {
        const usedAll = this.currentSpinCount === 0;
        const T = (suffix: string) => (suffix ? gc.Translator.translate(`FreeSpinBonus.${suffix}`) : "");

        const withRemaining = [
            "FSB_end_notification_unusedFS",
            "FSB_end_notification_unusedFS_message",
            "FSB_end_notification_unusedFS_message1",
        ] as const;

        const allUsedWin = ["FSB_notification_para1a", "FSB_end_notification", "FSB_end_notification_message"] as const;

        const allUsedZero = ["FSB_end_notification_zero_win", "", "FSB_end_notification_zero_win_message"] as const;

        const [titleK, mainK, subK] = usedAll ? (totalWin > 0 ? allUsedWin : allUsedZero) : withRemaining;

        this.labelTitle.string = T(titleK).toUpperCase();
        this.labelMainMessage.string = T(mainK);
        this.labelSubMessage.string = T(subK);
    }

    private onCloseClicked() {
        this.node.getComponent(Dialog)?.hide();
        this.openTurnOverRequired();
        this.handlePromotion();
    }

    @handle(FSBPromotionHandlers, (handler) => handler.handlePromotion(null))
    handlePromotion() {
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.openTurnOverRequired("end-promotion"))
    private openTurnOverRequired() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.setShowFreeSpinMessage(false))
    setShowFreeSpinMessage() {}
}
