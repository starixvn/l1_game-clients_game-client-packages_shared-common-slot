import { _decorator, Button, Label } from "cc";
import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import * as i18n from "db://i18n/LanguageData";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
import Observer from "observer";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
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

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.CLOSE_FSB_END_BANNER))
    closeFSBBanner() {}

    private setupContent(totalWin: number) {
        const hasUsedAllBonusSpins = this.currentSpinCount === 0;

        const keyMap = {
            win_allUsed: {
                title: "FreeSpinBonus.FSB_notification_para1a",
                main: "FreeSpinBonus.FSB_end_notification",
                sub: "FreeSpinBonus.FSB_end_notification_message",
            },
            win_withRemaining: {
                title: "FreeSpinBonus.FSB_end_notification_unusedFS",
                main: "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                sub: "FreeSpinBonus.FSB_end_notification_unusedFS_message1",
            },
            zero_allUsed: {
                title: "FreeSpinBonus.FSB_end_notification_zero_win",
                main: "",
                sub: "FreeSpinBonus.FSB_end_notification_zero_win_message",
            },
            zero_withRemaining: {
                title: "FreeSpinBonus.FSB_end_notification_unusedFS",
                main: "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                sub: "FreeSpinBonus.FSB_end_notification_unusedFS_message1",
            },
        };

        const conditionKey = `${totalWin > 0 ? "win" : "zero"}_${hasUsedAllBonusSpins ? "allUsed" : "withRemaining"}`;
        const { title, main, sub } = keyMap[conditionKey];

        this.labelTitle.string = i18n.t(title).toUpperCase();
        this.labelMainMessage.string = main ? i18n.t(main) : "";
        this.labelSubMessage.string = sub ? i18n.t(sub) : "";
    }

    private onCloseClicked() {
        this.node.getComponent(Dialog)?.hide();
        this.openTurnOverRequired();
    }

    @handle(FSBPromotionHandlers, (handler) => handler.handleFinishPromotion(null))
    onDestroy() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.openTurnOverRequired("end-promotion"))
    private openTurnOverRequired() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.setShowFreeSpinMessage(false))
    setShowFreeSpinMessage() {}
}
