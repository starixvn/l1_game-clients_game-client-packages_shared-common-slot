export namespace GameClientMessageSlot {
    export class ClaimBonusWin {
        static eventName = "claim-bonus-win";
    }

    export class RedeemGifCode {
        giftCode: string;
        static eventName = "redeem";
    }
}
export namespace GameServiceMessageSlot {
    export class PromotionTOProgress {
        win: number;
        totalTO: number;
        minTO: number;
        remainTO: number;
        progress: number;
        canClaim: boolean;
        expire: string;
        promotionId?: string;
        static eventName = "promotionTOProgress";
    }

    export class Promotion {
        promotionId: string;
        isGiftCode?: boolean;
        isClaimed?: boolean;
        remainingBonusItems?: number;
        initialBonusItem: number;
        betLevel?: number;
        coinValue?: number;
        betAmount?: number;
        isActive?: boolean;
        totalWin?: number;
        static eventName = "promotion";
    }
    export class FinishPromotion {
        endPromotion: boolean;
        totalWin: number;
        static eventName = "finishPromotion";
    }

    export class RedeemResult {
        static eventName = "redeemResult";
    }

    export class RedemptionNotice {
        errorCode: string;

        static eventName = "redemptionNotice";
    }
    export class ClaimedAmount {
        static eventName = "claimedAmount";
    }

    export class ClaimedBonusFailed {
        static eventName = "errorCode";
    }
}

