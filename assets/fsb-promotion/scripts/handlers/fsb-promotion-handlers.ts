import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FSBPromotionStore } from "../stores/fsb-promotion-store";
import { FSBPromotionUIHandler } from "./fsb-promotion-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionHandlers implements gc.Shared.IMultipleHandlers {
    @inject(FSBPromotionStore) protected readonly promotionStore: FSBPromotionStore;
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(FSBPromotionUIHandler) protected readonly fsbPromotionUIHandler: FSBPromotionUIHandler;

    handlePromotion(data: GameServiceMessageSlot.Promotion) {
        this.promotionStore.promotion = data;
        this.fsbPromotionUIHandler.handlePromotionDisplay();
    }

    handlePromotionTOProgress(data: GameServiceMessageSlot.PromotionTOProgress) {
        this.promotionStore.promotionTOProgress = data;
    }

    handleClaimedAmount(data: GameServiceMessageSlot.ClaimedAmount) {
        this.promotionStore.claimedAmount = data.claimedAmount;
    }

    handleRedeemResult(data: GameServiceMessageSlot.RedeemResult) {
        this.promotionStore.redeemResult = data.redeemResult;
    }

    handleFinishPromotion(data: GameServiceMessageSlot.FinishPromotion) {
        this.promotionStore.finishPromotion = data;
    }

    handleRedemptionNotice(data: GameServiceMessageSlot.RedemptionNotice) {
        this.promotionStore.redemptionNotice = data;
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
