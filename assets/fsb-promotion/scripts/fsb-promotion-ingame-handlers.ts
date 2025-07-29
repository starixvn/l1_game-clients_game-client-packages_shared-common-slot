import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameClientMessageSlot, GameServiceMessageSlot } from "../../game-message-slot";
import { FSBPromotionInGameStore } from "./fsb-promotion-ingame-store";

const { injectable, inject } = inversify;

@injectable()
export class FsbPromotionInGameHandlers implements gc.Shared.IMultipleHandlers {
    @inject(FSBPromotionInGameStore) protected readonly promotionStore: FSBPromotionInGameStore;
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;

    handlePromotion(data: GameServiceMessageSlot.Promotion) {
        this.promotionStore.promotion = data;
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

    redeemGifCode(giftCode: string) {
        this.connectionStore.send(GameClientMessageSlot.RedeemGifCode.eventName, { giftCode });
    }

    claimBonusWin() {
        this.connectionStore.send(GameClientMessageSlot.ClaimBonusWin.eventName, null);
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
