import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FSBPromotionStore, RedeemStatus } from "../stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "./fsb-promotion-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionHandlers implements gc.Shared.IMultipleHandlers {
    @inject(FSBPromotionStore) protected readonly promotionStore: FSBPromotionStore;
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(FSBPromotionUIHandler) protected readonly fsbPromotionUIHandler: FSBPromotionUIHandler;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.Notification.NotificationStore) protected readonly notificationStore: gc.Notification.NotificationStore;

    handlePromotion(data: GameServiceMessageSlot.Promotion) {
        if (this.fsbPromotionUIStore.hasServerFinishPromotion || this.fsbPromotionUIStore.hasClaimedBonus) {
            this.promotionStore.nextPromotion = data;
            return;
        }
        this.updatePromotion(data);
    }

    handleNextPromotion() {
        if(this.promotionStore.nextPromotion) {
            this.updatePromotion(this.promotionStore.nextPromotion);
        }
    }

    updatePromotion(data: GameServiceMessageSlot.Promotion) {
        this.fsbPromotionUIStore.reset();
        this.promotionStore.promotion = data;
        this.promotionStore.nextPromotion = null;
        this.fsbPromotionUIHandler.handlePromotionDisplay();
    }

    handlePromotionTOProgress(data: GameServiceMessageSlot.PromotionTOProgress) {
        if (!data?.promotionId) {
            data.promotionId = this.promotionStore.promotionId;
            this.promotionStore.promotionId = "";
        }
        this.promotionStore.promotionTOProgress = data;
        this.fsbPromotionUIStore.toProgress = data;
        this.fsbPromotionUIHandler.openTurnOverRequired("in-game");
        this.initNotificationListeners();
    }

    initNotificationListeners() {
        this.notificationStore.connection.on("promotionProgress", this.handleNotificationReceived);
    }

    removeNotificationListeners() {
        this.notificationStore.connection.off("promotionProgress", this.handleNotificationReceived);
    }

    handleNotificationReceived = (data: GameServiceMessageSlot.PromotionTOProgress) => {
        this.fsbPromotionUIHandler.onReceivedTOProgressData(data);
    }

    handleClaimedAmount(claimedAmount: number) {
        this.fsbPromotionUIStore.hasClaimedBonus = true;
        this.promotionStore.claimedAmount = claimedAmount;
        this.fsbPromotionUIHandler.claimedBonusSuccess();
    }

    handleRedeemResult(redeemResult: number) {
        this.promotionStore.redeemResult = redeemResult;
    }

    handleFinishPromotion(data: GameServiceMessageSlot.FinishPromotion) {
        this.promotionStore.promotionId = this.promotionStore.promotion?.promotionId;
        this.promotionStore.reset();
        this.promotionStore.finishPromotion = data;
        this.fsbPromotionUIHandler.markFSBEndFromServer();
    }

    handleRedemptionNotice(data: GameServiceMessageSlot.RedemptionNotice) {
        this.promotionStore.redemptionNotice = data;
        this.fsbPromotionUIHandler.handleRedemptionNotice();
    }

    handleClaimedBonusFailed(errorCode: string) {
        this.promotionStore.claimedBonusFailed = errorCode;
        if (errorCode === "SB3023") {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS, errorCode);
        }
        if (errorCode === "SB3030") {
            this.promotionStore.reset();
            this.fsbPromotionUIStore.reset();
            this.fsbPromotionUIStore.resetFinishPromotion();
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.CANCEL_PROMOTION, errorCode);
        }
        else {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR, errorCode);
        }
    }

    resetRedeemSuccess() {
        this.promotionStore.redeemResult = RedeemStatus.Idle;
    }

    eventHandleList = [
        {
            name: GameServiceMessageSlot.Promotion.eventName,
            handle: this.handlePromotion,
        },
        {
            name: GameServiceMessageSlot.PromotionTOProgress.eventName,
            handle: this.handlePromotionTOProgress,
        },
        {
            name: GameServiceMessageSlot.ClaimedAmount.eventName,
            handle: this.handleClaimedAmount,
        },
        {
            name: GameServiceMessageSlot.RedeemResult.eventName,
            handle: this.handleRedeemResult,
        },
        {
            name: GameServiceMessageSlot.FinishPromotion.eventName,
            handle: this.handleFinishPromotion,
        },
        {
            name: GameServiceMessageSlot.RedemptionNotice.eventName,
            handle: this.handleRedemptionNotice,
        },
        {
            name: GameServiceMessageSlot.ClaimedBonusFailed.eventName,
            handle: this.handleClaimedBonusFailed,
        },
    ];
}
