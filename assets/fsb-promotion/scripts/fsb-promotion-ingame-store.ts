import inversify from "inversify";
import mobx from "mobx";
import { GameServiceMessageSlot } from "../../game-message-slot";
const { injectable } = inversify;

@injectable()
export class FSBPromotionInGameStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    redeemResult = 0;
    claimedAmount = 0;
    promotion?: GameServiceMessageSlot.Promotion;
    finishPromotion?: GameServiceMessageSlot.FinishPromotion;
    promotionTOProgress?: GameServiceMessageSlot.PromotionTOProgress;
    redemptionNotice?: GameServiceMessageSlot.RedemptionNotice;

    get isRedeemSuccess() {
        return this.redeemResult === 1;
    }

    get isGiftCode() {
        return this.promotion?.isGiftCode;
    }

    get isClaimed() {
        return this.promotion?.isClaimed;
    }
}
