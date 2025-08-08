import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionUIHandler } from "./fsb-promotion-ui-handler";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionHandlers implements gc.Shared.IMultipleHandlers {
    @inject(FSBPromotionStore) protected readonly promotionStore: FSBPromotionStore;
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(FSBPromotionUIHandler) protected readonly fsbPromotionUIHandler: FSBPromotionUIHandler;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;

    handlePromotion(data: GameServiceMessageSlot.Promotion) {
        this.promotionStore.promotion = data;
        this.fsbPromotionUIHandler.handlePromotionDisplay();
    }

    handlePromotionTOProgress(data: GameServiceMessageSlot.PromotionTOProgress) {
        this.promotionStore.promotionTOProgress = data;
        this.fsbPromotionUIStore.toProgress = data;
        this.fsbPromotionUIHandler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED);
    }

    handleClaimedAmount(data: GameServiceMessageSlot.ClaimedAmount) {
        this.promotionStore.claimedAmount = data.claimedAmount;
    }

    handleRedeemResult(redeemResult: number) {
        this.promotionStore.redeemResult = redeemResult;
    }

    handleFinishPromotion(data: GameServiceMessageSlot.FinishPromotion) {
        this.promotionStore.finishPromotion = data;
        this.fsbPromotionUIHandler.markFSBEndFromServer();
    }

    handleRedemptionNotice(data: GameServiceMessageSlot.RedemptionNotice) {
        this.promotionStore.redemptionNotice = data;
        this.fsbPromotionUIHandler.handleRedemptionNotice();
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
    ];
}
