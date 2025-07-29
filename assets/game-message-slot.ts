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
        totalTO: number;
        minTO: number;
        remainTO: number;
        progress: number;
        canClaim: boolean;
        expire: string;
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
        redeemResult: number;

        static eventName = "redeemResult";
    }

    export class RedemptionNotice {
        errorCode: string;

        static eventName = "redemptionNotice";
    }
    export class ClaimedAmount {
        claimedAmount: number;
        static eventName = "claimedAmount";
    }
}

