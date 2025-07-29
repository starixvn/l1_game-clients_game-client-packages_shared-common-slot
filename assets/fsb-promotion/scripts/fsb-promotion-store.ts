import { _decorator, Component } from 'cc';
import gc from "@sg/game-client-base";
import { injectable, inject } from 'inversify';

const { ccclass } = _decorator;

export const endpointConstants = {
    bannerPromotion: "banner-promotions",
    announcementDetails: "announcement-detail"
};

export const FreeSpinsPromotionEvents = {
    OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
    OPEN_GIFT_CODE: "OPEN_GIFT_CODE",
    OPEN_GIFT_CODE_REDEEM_POPUP: "OPEN_GIFT_CODE_REDEEM_POPUP",
    OPEN_PROMOTION_DETAILS_PANEL: "OPEN_PROMOTION_DETAILS_PANEL",
    SPIN_ON_FSB_PROMOTION: "SPIN_ON_FSB_PROMOTION",
    OPEN_PROMOTION_ENDED_POPUP: "OPEN_PROMOTION_ENDED_POPUP",
    OPEN_REDEEM_TRANSITION_EFFECT: "OPEN_REDEEM_TRANSITION_EFFECT",
    COLLAPSE_MENU: "COLLAPSE_MENU",
    DESTROY_GIFT_CODE_NODE: "DESTROY_GIFT_CODE_NODE",
    CLOSE_PROMOTION_DETAILS_PANEL: "CLOSE_PROMOTION_DETAILS_PANEL",
    UPDATE_FSB_COUNT: "UPDATE_FSB_COUNT",
    UPDATE_TOTAL_WIN: "UPDATE_TOTAL_WIN",
    EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
    SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
    CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
    REDEEM_GIFT_CODE_ERROR: "REDEEM_GIFT_CODE_ERROR"
};

interface GameOfferPromotion {
    gameId: number;
    name: string;
}

interface StandardPromotionInfo {
    promotionId: string;
    isGiftCode?: boolean;
    isClaimed?: boolean;
    remainingBonusItems?: number;
    initialBonusItem?: number;
    betLevel?: number;
    isActive?: boolean;
    totalWin?: number;
}

interface PromotionData {
    promotion: StandardPromotionInfo;
    gameOfferPromotion?: GameOfferPromotion[];
}

interface FinishPromotion {
    endPromotion: boolean;
    totalWin: number;
}

@ccclass('fsb_promotion_store')
@injectable()
export class FSBPromotionStore extends Component {
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    private readonly storageKey = "free-spins-promotion-dont-show-again";
    
    // State properties
    public receivedPromotionInGame = false;
    private _skipGiftCode = false;
    private _finishPromotion: FinishPromotion;
    private _activeTransitionEffect = false;
    private _activeDetailPromo = false;
    private _currentSpinCount = -1;
    private _promotionIdFromTO = "";
    private readonly fallbackGameOffers: { name: string; gameId: number }[] = [];
    public promotionData: PromotionData;
    public resumedFSBPromotion = false;
    public hasServerFinishPromotion = false;
    public fsbConsumedThisRound = false;

    // Additional properties for event handlers
    public promotionTOProgress: any;
    public redeemResult: any;
    public redemptionNotice: any;
    public claimedAmount: any;
    public promotion: any;

    // UI Events state
    private pendingUIEvents: Array<{ event: string; data?: any }> = [];

    // Getters and Setters
    getStorageKey() {
        return this.storageKey;
    }

    public getFallbackGameOffers() {
        return this.fallbackGameOffers;
    }

    public setFallbackGameOffers({ name, gameId }: { name: string; gameId: number }) {
        if (!name || typeof gameId !== "number") {
            return;
        }

        const exists = this.fallbackGameOffers.some((offer) => offer.gameId === gameId);
        if (!exists) {
            this.fallbackGameOffers.push({ name: name.toLowerCase(), gameId });
        }
    }

    get currentSpinCount() {
        return this._currentSpinCount;
    }

    set currentSpinCount(count: number) {
        this._currentSpinCount = count;
    }

    get activeDetailPromo() {
        return this._activeDetailPromo;
    }

    set activeDetailPromo(isActive: boolean) {
        this._activeDetailPromo = isActive;
    }

    get activeTransitionEffect() {
        return this._activeTransitionEffect;
    }

    set activeTransitionEffect(isActive: boolean) {
        this._activeTransitionEffect = isActive;
    }

    set skipGiftCode(skip: boolean) {
        this._skipGiftCode = skip;
    }

    get skipGiftCode() {
        return this._skipGiftCode;
    }

    set finishPromotion(promotion: FinishPromotion) {
        this._finishPromotion = promotion;
    }

    get finishPromotion() {
        return this._finishPromotion;
    }

    set promotionIdFromTO(promotionId: string) {
        this._promotionIdFromTO = promotionId;
    }

    get promotionIdFromTO() {
        return this._promotionIdFromTO;
    }

    // State management methods
    public reset() {
        this.finishPromotion = null;
        this.receivedPromotionInGame = false;
        this.skipGiftCode = false;
        this.resumedFSBPromotion = false;
        this.activeTransitionEffect = false;
        this.activeDetailPromo = false;
        this.promotionData = null;
        this.hasServerFinishPromotion = false;
        this.fsbConsumedThisRound = false;
        this.currentSpinCount = -1;
    }

    setPromotionData(rawData: PromotionData, isDirectly = false) {
        this.promotionData = rawData;
        this.receivedPromotionInGame = isDirectly;
    }

    // Helper methods for data access
    getGameId() {
        const offers = this.getGameOffered();
        return offers?.[0]?.gameId;
    }

    getGameOffered() {
        return this.promotionData?.gameOfferPromotion?.length > 0 ? this.promotionData.gameOfferPromotion : this.fallbackGameOffers;
    }

    hasPromo(): boolean {
        return !!this.promotionData?.promotion;
    }

    shouldSkipPromo(): boolean {
        const storageData = gc.StorageManager.get(this.storageKey) as any;
        const skipPromo = storageData?.dontShowAgain;
        const isSC = this.siteConfigs.systemType.toUpperCase() === "SC";
        const isGiftCode = this.promotionData?.promotion?.isGiftCode;
        if (skipPromo && !isGiftCode) {
            return true;
        }

        return isSC;
    }

    isPromotionInProgress(): boolean {
        return this.currentSpinCount >= 0 && !this.hasServerFinishPromotion && !this.resumedFSBPromotion;
    }

    isUpdateTotalWin() {
        return this.fsbConsumedThisRound || this.resumedFSBPromotion;
    }

    isEligibleForTurnOverPanel() {
        return this.finishPromotion?.totalWin > 0 && this.currentSpinCount === 0;
    }

    // FSB consumption methods
    tryConsumeFSB() {
        if (this.currentSpinCount > 0 && !this.fsbConsumedThisRound) {
            this.currentSpinCount--;
            this.fsbConsumedThisRound = true;
            return true;
        }
        return false;
    }

    revertLastFSB() {
        if (this.fsbConsumedThisRound) {
            this.currentSpinCount++;
            this.fsbConsumedThisRound = false;
            return true;
        }
        return false;
    }

    commitFSB() {
        if (this.fsbConsumedThisRound) {
            this.fsbConsumedThisRound = false;
        }
    }

    markServerConfirmedEnd() {
        this.hasServerFinishPromotion = true;
    }

    // UI Events management
    addPendingUIEvent(event: string, data?: any) {
        this.pendingUIEvents.push({ event, data });
    }

    getPendingUIEvents(): Array<{ event: string; data?: any }> {
        return this.pendingUIEvents;
    }

    clearPendingUIEvents() {
        this.pendingUIEvents = [];
    }
}


