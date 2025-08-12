import inversify from "inversify";
import mobx from "mobx";
import { GameServiceMessageSlot } from "../../../game-message-slot";
const { injectable } = inversify;
export enum RedeemStatus {
    Idle = 0,
    Success = 1,
    Failed = -1,
}

@injectable()
export class FSBPromotionStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    claimedAmount = 0;
    promotion?: GameServiceMessageSlot.Promotion;
    finishPromotion?: GameServiceMessageSlot.FinishPromotion;
    promotionTOProgress?: GameServiceMessageSlot.PromotionTOProgress;
    redemptionNotice?: GameServiceMessageSlot.RedemptionNotice;
    claimedBonusFailed?: string;
    private _redeemStatus: RedeemStatus = RedeemStatus.Idle;

    get isRedeemSuccess() {
        return this._redeemStatus === RedeemStatus.Success;
    }

    set redeemResult(statusCode: number) {
        this._redeemStatus = statusCode;
    }

    get isClaimed() {
        return this.promotion?.isClaimed;
    }
}
