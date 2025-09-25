import gc from "@sg/game-client-base";
import { settings } from "db://assets/game/scripts/game-settings";
import inversify from "inversify";
import mobx from "mobx";
import { FSBPromotionStore } from "./fsb-promotion-store";

const { injectable, inject } = inversify;

export enum FreeSpinSource {
    GAME = "game",
    PROMOTION = "promotion",
}

export interface FreeSpinSignal {
    source: FreeSpinSource;
    active: boolean;
}

export const endpointConstants = {
    bannerPromotion: "banner-promotions",
    announcementDetails: "announcement-detail",
};

export enum FSBPromotionState {
    Idle = "IDLE",
    Ready = "READY",
    Spinning = "SPINNING",
    Finished = "FINISHED",
    Resumed = "RESUMED",
}

export interface ITurnOverRequired {
    win: number;
    totalTO: number;
    minTO: number;
    expire?: string;
    progress: number;
}

export const TurnOverRequiredDataKey = {
    PROMOTION_TO_PROGRESS: "promotionProgress",
};

export const FreeSpinsPromotionEvents = {
    OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
    OPEN_GIFT_CODE: "OPEN_GIFT_CODE",
    OPEN_GIFT_CODE_REDEEM_POPUP: "OPEN_GIFT_CODE_REDEEM_POPUP",
    OPEN_PROMOTION_INFO: "OPEN_PROMOTION_INFO",
    SPIN_ON_FSB_PROMOTION: "SPIN_ON_FSB_PROMOTION",
    OPEN_PROMOTION_ENDED_POPUP: "OPEN_PROMOTION_ENDED_POPUP",
    OPEN_REDEEM_TRANSITION_EFFECT: "OPEN_REDEEM_TRANSITION_EFFECT",
    COLLAPSE_MENU: "COLLAPSE_MENU",
    DESTROY_GIFT_CODE_NODE: "DESTROY_GIFT_CODE_NODE",
    DESTROY_BANNER_NODE: "DESTROY_BANNER_NODE",
    DESTROY_PROMOTION_ENDED_POPUP_NODE: "DESTROY_PROMOTION_ENDED_POPUP_NODE",
    CLOSE_PROMOTION_DETAILS_PANEL: "CLOSE_PROMOTION_DETAILS_PANEL",
    CLOSE_FREE_SPINS_PROMOTION: "CLOSE_FREE_SPINS_PROMOTION",
    UPDATE_FSB_COUNT: "UPDATE_FSB_COUNT",
    UPDATE_TOTAL_WIN: "UPDATE_TOTAL_WIN",
    EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
    SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
    CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
    REDEEM_GIFT_CODE_ERROR: "REDEEM_GIFT_CODE_ERROR",
    EFFECT_UNBOX_GIFT: "EFFECT_UNBOX_GIFT",
    REDEMPTION_NOTICE: "REDEMPTION_NOTICE",
    CLOSE_GIFT_CODE_ICON: "CLOSE_GIFT_CODE_ICON",
    CLOSE_GIFT_CODE_REDEEM_POPUP: "CLOSE_GIFT_CODE_REDEEM_POPUP",
    EFFECT_COIN_ANIMATION: "EFFECT_COIN_ANIMATION",
    OPEN_TURN_OVER_REQUIRED: "OPEN_TURN_OVER_REQUIRED",
    UPDATE_TURN_OVER_REQUIRED: "UPDATE_TURN_OVER_REQUIRED",
    OPEN_CLAIM_BONUS_NOTIFICATION: "OPEN_CLAIM_BONUS_NOTIFICATION",
    UPDATE_BALANCE_BONUS: "UPDATE_BALANCE_BONUS",
    SPIN_ON_FSB_PROMOTION_FIRST_TIME: "SPIN_ON_FSB_PROMOTION_FIRST_TIME",
    SHOW_FREE_SPIN_MESSAGE: "SHOW_FREE_SPIN_MESSAGE",
    HIDE_GIFT_CODE_ICON: "HIDE_GIFT_CODE_ICON",
    EFFECT_REDEEM_SUCCESS: "EFFECT_REDEEM_SUCCESS",
    CLOSE_FSB_BANNER: "CLOSE_FSB_BANNER",
    BEGIN_USING_FBS: "BEGIN_USING_FBS",
};

@injectable()
export class FSBPromotionUIStore {
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    private readonly storageKey = "free-spins-promotion-dont-show-again";

    // State properties
    public receivedPromotionInGame = false;
    private _skipGiftCode = false;
    private _activeTransitionEffect = false;
    private _activeDetailPromo = false;
    private _currentSpinCount = -1;
    private readonly fallbackGameOffers: { name: string; gameId: number }[] = [];
    public resumedFSBPromotion = false;
    public hasServerFinishPromotion = false;
    public hasShowFinishPromotion = false;
    public fsbConsumedThisRound = false;
    public changeUserBalance = false;
    public isSpinningFSB = false;
    public promotionUrl = "";
    public gameOffers: { name: string; gameId: number }[] = [{ name: settings.name.toLowerCase(), gameId: settings.id }];
    public isWebViewLoading = false;

    public isFSBInfoReady = false;

    public isTrialMode = false;
    public pendingOpenTOAfterFinish = false;

    public isClickPlayNow = false;

    public isShowFreeSpinMessage = false;

    // TurnOverRequired state properties
    private _toProgress: ITurnOverRequired = null;
    public readonly turnOverRequiredDataKey = [TurnOverRequiredDataKey.PROMOTION_TO_PROGRESS];

    // UI Events state
    public pendingUIEvent: { event: string; data?: any } = null;
    public event: { event: string; data?: any } = null;

    private _freeSpinActiveBySource: Record<FreeSpinSource, boolean> = {
        [FreeSpinSource.GAME]: false,
        [FreeSpinSource.PROMOTION]: false,
    };

    get isAnyFreeSpinActive() {
        return this._freeSpinActiveBySource[FreeSpinSource.GAME] || this._freeSpinActiveBySource[FreeSpinSource.PROMOTION];
    }

    get isFreeSpinInGame() {
        return this._freeSpinActiveBySource[FreeSpinSource.GAME];
    }

    set isFreeSpinInGame(v: boolean) {
        this._freeSpinActiveBySource[FreeSpinSource.GAME] = v;
    }

    get isUsedFSBPromotionBonus() {
        return this._freeSpinActiveBySource[FreeSpinSource.PROMOTION];
    }

    set isUsedFSBPromotionBonus(v: boolean) {
        this._freeSpinActiveBySource[FreeSpinSource.PROMOTION] = v;
    }

    setActiveFreeSpin(source: FreeSpinSource, active: boolean) {
        this._freeSpinActiveBySource[source] = active;
    }

    getStorageKey() {
        return this.storageKey;
    }

    setFSBInfoReady(isReady: boolean) {
        this.isFSBInfoReady = isReady;
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

    get isEligibleForNextFSBSpin() {
        return this.isUsedFSBPromotionBonus && this.currentSpinCount > 0 && this.isFSBInfoReady;
    }

    get canSpinNextFSB() {
        return this.isEligibleForNextFSBSpin && !this.hasServerFinishPromotion;
    }

    get isFSBPromotionInProgress() {
        return this.fsbState === FSBPromotionState.Ready || this.fsbState === FSBPromotionState.Spinning || this.isPromotionConsumed();
    }
    get isUpdateTotalWin() {
        return this.fsbConsumedThisRound || this.resumedFSBPromotion;
    }

    get fsbState(): FSBPromotionState {
        if (!this.hasPromo()) {
            return FSBPromotionState.Idle;
        }

        if (this.hasServerFinishPromotion) {
            return FSBPromotionState.Finished;
        }

        if (this.resumedFSBPromotion) {
            return FSBPromotionState.Resumed;
        }

        if (this.currentSpinCount >= 0 && this.fsbConsumedThisRound) {
            return FSBPromotionState.Spinning;
        }

        if (this.currentSpinCount >= 0) {
            return FSBPromotionState.Ready;
        }

        return FSBPromotionState.Idle;
    }

    // TurnOverRequired state management methods
    get toProgress() {
        return this._toProgress;
    }

    set toProgress(promotionTOProgress: ITurnOverRequired) {
        this._toProgress = promotionTOProgress;
    }

    public updateTOProgress(data: ITurnOverRequired): boolean {
        const oldData = this.toProgress;
        const isChanged = !oldData || oldData.totalTO !== data.totalTO || oldData.win !== data.win || oldData.progress !== data.progress;

        this.toProgress = data;
        return isChanged;
    }

    public hasTOProgress(): boolean {
        return !!this._toProgress;
    }

    public resetTOProgress() {
        this._toProgress = null;
    }

    // State management methods
    public reset() {
        this.receivedPromotionInGame = false;
        this.skipGiftCode = false;
        this.resumedFSBPromotion = false;
        this.activeTransitionEffect = false;
        this.activeDetailPromo = false;
        this.hasServerFinishPromotion = false;
        this.fsbConsumedThisRound = false;
        this.currentSpinCount = -1;
        this.resetTOProgress();
    }

    hasPromo(): boolean {
        return !!this.fsbPromotionStore.promotion;
    }

    isPromotionConsumed(): boolean {
        if (!this.fsbPromotionStore.promotion) {
            return false;
        }
        const { isClaimed, remainingBonusItems, initialBonusItem } = this.fsbPromotionStore.promotion;
        return isClaimed && remainingBonusItems < initialBonusItem && !this.hasServerFinishPromotion;
    }

    shouldSkipPromo(): boolean {
        const storageData = gc.StorageManager.get(this.storageKey) as any;
        const skipPromo = storageData?.dontShowAgain;
        const isSC = this.siteConfigs.systemType.toUpperCase() === "SC";
        const isGiftCode = this.fsbPromotionStore.promotion?.isGiftCode;
        if (skipPromo && !isGiftCode) {
            return true;
        }

        return isSC;
    }

    isEligibleForTurnOverPanel() {
        return this.fsbPromotionStore.finishPromotion?.totalWin > 0 && this.currentSpinCount === 0;
    }

    // FSB consumption methods
    tryConsumeFSB() {
        if (this.currentSpinCount > 0 && !this.fsbConsumedThisRound) {
            this.currentSpinCount--;
            this.fsbConsumedThisRound = true;
            if (this.currentSpinCount === this.fsbPromotionStore.promotion.initialBonusItem - 1) {
                this.setEvent(FreeSpinsPromotionEvents.BEGIN_USING_FBS);
            }
            return true;
        }
        return false;
    }

    undoLastFSBSpin(): boolean {
        if (this.fsbConsumedThisRound && !this.resumedFSBPromotion) {
            this.fsbConsumedThisRound = false;
            this.currentSpinCount++;
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

    addPendingUIEvent(event: string, data?: any) {
        this.pendingUIEvent = { event, data };
    }

    setEvent(event: string, data?: any) {
        this.event = { event, data };
    }

    removePendingUIEvent() {
        this.pendingUIEvent = null;
    }

    isRedeemSuccess() {
        return this.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION && this.fsbPromotionStore.isRedeemSuccess;
    }

    isShowFsbBanner() {
        return this.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION && !this.fsbPromotionStore.isRedeemSuccess;
    }

    setWebViewLoading(isLoading: boolean) {
        this.isWebViewLoading = isLoading;
    }
}
