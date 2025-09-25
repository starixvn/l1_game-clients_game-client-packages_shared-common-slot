import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { GameClientMessageSlot } from "../../../game-message-slot";
import { FSBPromotionStore, RedeemStatus } from "../stores/fsb-promotion-store";
import {
    endpointConstants,
    FreeSpinSignal,
    FreeSpinsPromotionEvents,
    FSBPromotionUIStore,
    ITurnOverRequired,
} from "../stores/fsb-promotion-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionUIHandler {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.Auth.AuthStore) protected readonly authStore: gc.Auth.AuthStore;

    @inject(gc.Notices.NoticeErrorsHandlers.AutoSignOutHandler)
    protected readonly noticeErrorsHandlers: gc.Notices.NoticeErrorsHandlers.AutoSignOutHandler;

    constructor() {
        setTimeout(() => {
            mobx.reaction(
                () => this.fsbPromotionUIStore.isTrialMode,
                (trial, prev) => {
                    if (trial) {
                        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.HIDE_GIFT_CODE_ICON);
                    }
                    if (!trial && prev === true && this.shouldShowGiftCode()) {
                        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);
                    }
                }
            );
        }, 0);
    }

    /** ========== PROMOTION FLOW ========== */
    public handlePromotionDisplay() {
        try {
            if (
                this.fsbPromotionUIStore.activeTransitionEffect ||
                !this.fsbPromotionUIStore.hasPromo() ||
                this.fsbPromotionUIStore.isTrialMode
            ) {
                return;
            }
            if (this.fsbPromotionUIStore.shouldSkipPromo()) {
                return;
            }

            this.handleDirectOpen();
        } catch (error) {
            gc.sentryLogger.logError(`handlePromotionDisplay error: ${error.message}`);
        }
    }

    private handleDirectOpen() {
        const promotion = this.fsbPromotionStore.promotion;
        const isClaimed = promotion?.isClaimed;
        const remaining = promotion?.remainingBonusItems;
        const initial = promotion?.initialBonusItem;

        if (this.fsbPromotionUIStore.skipGiftCode) {
            this.fsbPromotionUIStore.skipGiftCode = false;
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
            return;
        }

        if (this.shouldShowGiftCode()) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);
        } else if (isClaimed && remaining === initial) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
            this.fsbPromotionUIStore.promotionUrl = this.getPromoUrl();
        } else {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
        }
    }

    private shouldShowGiftCode() {
        const p = this.fsbPromotionStore?.promotion;
        return !this.fsbPromotionUIStore.isTrialMode && p?.isGiftCode && !p?.isClaimed;
    }

    /** ========== URL HELPERS ========== */

    private buildPromotionSiteUrl() {
        if (this.siteConfigs.subPromotionDomain) {
            const ssl = this.siteConfigs.ssl;
            const rootDomain = gc.UrlUtils.getRootDomain(this.siteConfigs);
            const subPromotionDomainText = `${this.siteConfigs.subPromotionDomain}.`;
            return `${"http"}${ssl ? "s" : ""}://${subPromotionDomainText}${rootDomain}`;
        }
        return this.buildProxyUrl(`/promotion`);
    }

    private buildProxyUrl(path) {
        const envPath = this.siteConfigs.env === "" ? "" : `/${this.siteConfigs.env}`;
        const fullPath = `${envPath}${path}`;
        return gc.UrlUtils.buildUrl("http", fullPath, this.siteConfigs);
    }

    getPromoUrl() {
        const promotionId = this.fsbPromotionStore.promotion?.promotionId || this.fsbPromotionStore.promotionTOProgress?.promotionId;
        const queryString = this.getQueryString(promotionId, this.fsbPromotionUIStore.gameOffers);
        const endpoint = this.fsbPromotionUIStore.activeDetailPromo
            ? endpointConstants.announcementDetails
            : endpointConstants.bannerPromotion;
        return `${this.buildPromotionSiteUrl()}/${endpoint}?${queryString}`;
    }

    private buildParams() {
        return {
            sessionId: gc.GameUtils.base64Encode(this.authStore.session || ""),
            username: this.authStore.username,
            language: this.authStore.language,
        };
    }

    private getQueryString(promotionId?: string, gameOffers?: { gameId: number; name: string }[]) {
        const searchParams = new URLSearchParams();
        const params = this.buildParams();
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined) {
                searchParams.append(key, params[key]);
            }
        });

        if (promotionId) {
            searchParams.append("promotionId", promotionId);
        }
        if (gameOffers && Array.isArray(gameOffers)) {
            const jsonString = JSON.stringify(gameOffers);
            searchParams.append("game", jsonString);
        }

        return searchParams.toString();
    }

    /** ========== PROMOTION STATE MANAGEMENT ========== */
    public setCurrentSpinCount(count: number) {
        this.fsbPromotionUIStore.currentSpinCount = count;
    }

    public tryShowEndedPopup() {
        if (this.fsbPromotionUIStore.hasServerFinishPromotion && !this.fsbPromotionUIStore.hasShowFinishPromotion) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL);
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP);

            this.fsbPromotionUIStore.hasShowFinishPromotion = true;
        }
    }

    public tryConsumeFSB() {
        if (this.fsbPromotionUIStore.tryConsumeFSB()) {
            this.fsbPromotionUIStore.addPendingUIEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                this.fsbPromotionUIStore.currentSpinCount
            );
        }
    }

    public undoLastFSBSpin() {
        if (this.fsbPromotionUIStore.undoLastFSBSpin()) {
            this.fsbPromotionUIStore.addPendingUIEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                this.fsbPromotionUIStore.currentSpinCount
            );
        }
    }

    public commitFSBSpins() {
        this.fsbPromotionUIStore.commitFSB();
    }

    public markFSBEndFromServer() {
        this.fsbPromotionUIStore.markServerConfirmedEnd();
        if (!this.fsbPromotionUIStore.fsbConsumedThisRound) {
            this.tryShowEndedPopup();
        }
    }

    public changeUIPendingEvent(event: string, data?: any) {
        this.fsbPromotionUIStore.addPendingUIEvent(event, data);
    }

    public removeUIPendingEvent() {
        this.fsbPromotionUIStore.removePendingUIEvent();
    }

    isEligibleForTurnOverPanel() {
        return this.fsbPromotionStore.finishPromotion?.totalWin > 0 && this.fsbPromotionUIStore.currentSpinCount === 0;
    }

    /** ========== SOCKET COMMUNICATION ========== */
    claimBonusWin() {
        this.connectionStore.send(GameClientMessageSlot.ClaimBonusWin.eventName, null);
    }

    redeemGiftCode(giftCode: string) {
        this.connectionStore.send(GameClientMessageSlot.RedeemGifCode.eventName, { giftCode: giftCode });
    }

    handleRedemptionNotice() {
        const errorCode = this.fsbPromotionStore.redemptionNotice.errorCode;
        const messageKey = this.mapErrorCodeToMessageKey(errorCode);
        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.REDEMPTION_NOTICE, messageKey);
    }

    private mapErrorCodeToMessageKey(errorCode: string): string {
        switch (errorCode) {
            case "SB3019":
                return "FreeSpinBonus.gift_code_error_message";
            case "SB3020":
                return "FreeSpinBonus.Invalide_gift_code_error_message";
            case "SB3021":
                return "FreeSpinBonus.Unexpected_gift_code_error_message";
            default:
                return "FreeSpinBonus.Invalide_gift_code_error_message";
        }
    }

    resetFSBRedemptionState() {
        this.fsbPromotionStore.redeemResult = RedeemStatus.Idle;
    }

    updateTotalWin({ win, totalFreeSpins }: { win: number; totalFreeSpins: number }) {
        if (!this.fsbPromotionUIStore.isUpdateTotalWin) {
            return;
        }
        this.fsbPromotionUIStore.resumedFSBPromotion = totalFreeSpins > 0;
        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN, win);
        const isLastFreeSpin = totalFreeSpins === 0;
        if (isLastFreeSpin) {
            this.commitFSBSpins();
            this.fsbPromotionUIStore.resumedFSBPromotion = false;
        }
    }

    triggerFSBManual() {
        if (
            this.fsbPromotionUIStore.fsbConsumedThisRound ||
            this.fsbPromotionUIStore.isFreeSpinInGame ||
            this.fsbPromotionUIStore.currentSpinCount <= 0 ||
            this.fsbPromotionUIStore.resumedFSBPromotion
        ) {
            return;
        }
        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME);
    }

    setFSBInfoReady(isReady: boolean) {
        this.fsbPromotionUIStore.setFSBInfoReady(isReady);
    }

    setIsClickPlayNow(isClickPlayNow: boolean) {
        this.fsbPromotionUIStore.isClickPlayNow = isClickPlayNow;
    }

    public handleFreeSpin(signal: FreeSpinSignal) {
        const { source, active } = signal;
        this.fsbPromotionUIStore.setActiveFreeSpin(source, active);
    }

    /** ========== TURN OVER REQUIRED MANAGEMENT ========== */

    public activeDetailPromo(isActive: boolean) {
        this.fsbPromotionUIStore.activeDetailPromo = isActive;
    }

    public updatePromotionURL() {
        this.fsbPromotionUIStore.promotionUrl = this.getPromoUrl();
    }

    public onReceivedTOProgressData(data: ITurnOverRequired) {
        const isChanged = this.fsbPromotionUIStore.updateTOProgress(data);

        if (isChanged) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED, data);
        }
    }

    public showNoticeError(errorCode: string) {
        this.noticeErrorsHandlers.showErrorNotice(errorCode);
    }

    public handleTrialMode(isTrialMode: boolean) {
        this.fsbPromotionUIStore.isTrialMode = isTrialMode;
    }

    public setShowFreeSpinMessage(isShowFreeSpinMessage: boolean) {
        this.fsbPromotionUIStore.isShowFreeSpinMessage = isShowFreeSpinMessage;
    }

    public claimedBonusSuccess() {
        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.CLAIMED_BONUS_SUCCESS);
    }

    public openTurnOverRequired(context: "in-game" | "end-promotion") {
        if (context === "in-game") {
            if (this.fsbPromotionStore.finishPromotion) {
                this.fsbPromotionUIStore.pendingOpenTOAfterFinish = true;
                return;
            } else {
                this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED);
            }
        } else if (context === "end-promotion") {
            if (this.fsbPromotionStore.finishPromotion && this.isEligibleForTurnOverPanel()) {
                this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED);
                this.fsbPromotionUIStore.pendingOpenTOAfterFinish = false;
            }
        }
    }

    public handleChangeUserBalance(change: boolean) {
        this.fsbPromotionUIStore.changeUserBalance = change;
    }
}
