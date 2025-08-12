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
const { render, handle } = Observer;

const { ccclass, property } = _decorator;

@ccclass("PromotionEndedPopup")
export default class PromotionEndedPopup extends ObserverComponent {
    @property(Label) labelTitle: Label = null;
    @property(Label) labelMainMessage: Label = null;
    @property(Label) labelSubMessage: Label = null;
    @property(Label) labelTotalWin: Label = null;
    @property(Button) closeButton: Button = null;
    public static hasShown = false;

    @render(FSBPromotionStore, (store) => [store.finishPromotion, store.promotion])
    public show([finishPromotion, promotion]: [GameServiceMessageSlot.FinishPromotion, GameServiceMessageSlot.Promotion]) {
        if (!finishPromotion) {
            return;
        }
        PromotionEndedPopup.hasShown = true;
        const { totalWin } = finishPromotion;
        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(totalWin, 2);
        this.node.active = true;
        this.setupContent(totalWin, promotion);
    }

    private setupContent(totalWin: number, promotion: GameServiceMessageSlot.Promotion) {
        const hasUsedAllBonusSpins = promotion.remainingBonusItems === 0;

        let titleKey = "";
        let mainMessageKey = "";
        let subMessageKey = "";

        if (totalWin > 0) {
            if (hasUsedAllBonusSpins) {
                titleKey = "FreeSpinBonus.FSB_notification_para1a";
                mainMessageKey = "FreeSpinBonus.FSB_end_notification";
                subMessageKey = "FreeSpinBonus.FSB_end_notification_message";
            } else {
                titleKey = "FreeSpinBonus.FSB_end_notification_unusedFS";
                mainMessageKey = "FreeSpinBonus.FSB_end_notification_unusedFS_message";
                subMessageKey = "FreeSpinBonus.FSB_end_notification_unusedFS_message1";
            }
        } else {
            titleKey = "FreeSpinBonus.FSB_end_notification_zero_win";
            subMessageKey = "FreeSpinBonus.FSB_end_notification_zero_win_message";
        }

        this.labelTitle.string = i18n.t(titleKey).toUpperCase();
        this.labelMainMessage.string = mainMessageKey ? i18n.t(mainMessageKey) : "";
        this.labelSubMessage.string = subMessageKey ? i18n.t(subMessageKey) : "";
    }

    private onCloseClicked() {
        this.node.getComponent(Dialog)?.hide();
        this.openTurnOverRequired();
    }

    @handle(FSBPromotionHandlers, (handler) => handler.handleFinishPromotion(null))
    onDestroy() {}

    @handle(FSBPromotionUIHandler, (handler) => handler.openTurnOverRequired("end-promotion"))
    private openTurnOverRequired() {}
}
