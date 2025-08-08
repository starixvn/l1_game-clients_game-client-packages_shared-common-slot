import { _decorator } from "cc";
import { FreeSpinsPromotionEvents, endpointConstants, FSBPromotionUIStore, ITurnOverRequired, TurnOverRequiredDataKey } from "../stores/fsb-promotion-ui-store";
import gc from "@sg/game-client-base";
import inversify from "inversify";
import { FSBPromotionStore, RedeemStatus } from "../stores/fsb-promotion-store";
import { GameClientMessageSlot } from "../../../game-message-slot";
import { BetControlHandlers } from "db://shared-cascading-slot/handlers/bet-control-handlers";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import mobx from "mobx";
import { NoticeErrorsHandlers } from "@sg/game-client-base/dist/game/notices/notice-errors-handlers";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionUIHandler {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.Auth.AuthStore) protected readonly authStore: gc.Auth.AuthStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(NoticeErrorsHandlers.AutoSignOutHandler) protected readonly noticeErrorsHandlers: NoticeErrorsHandlers.AutoSignOutHandler;

    constructor() {
        setTimeout(() => {
            mobx.reaction(
                () => ({
                    isFSBUsed: this.cascadingUIStore?.isUsedFSBPromotionBonus ?? false,
                    isClaimed: this.fsbPromotionStore?.isClaimed ?? false,
                    isFSBInfoReady: this.fsbPromotionUIStore.isFSBInfoReady ?? false,
                }),
                ({ isFSBUsed, isClaimed, isFSBInfoReady }) => {
                    if (isFSBUsed && isClaimed && !isFSBInfoReady) {
                        this.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
                    }
                }
            );
        }, 0);
    }

    /** ========== PROMOTION FLOW ========== */
    public handlePromotionDisplay() {
        try {
            if (this.fsbPromotionUIStore.activeTransitionEffect || !this.fsbPromotionUIStore.hasPromo()) {
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
        const isGiftCode = promotion?.isGiftCode;
        const isClaimed = promotion?.isClaimed;
        const remaining = promotion?.remainingBonusItems;
        const initial = promotion?.initialBonusItem;

        if (this.fsbPromotionUIStore.skipGiftCode) {
            this.fsbPromotionUIStore.skipGiftCode = false;
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
            return;
        }

        if (isGiftCode && !isClaimed) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);
        } else if (isClaimed && remaining === initial) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
            this.fsbPromotionUIStore.promotionUrl = this.getPromoUrl();
        } else {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
        }
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
        if (this.fsbPromotionUIStore.hasServerFinishPromotion) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL);
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP);
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

    syncFSBBetControl() {
        this.betControlHandlers.init(this.fsbPromotionStore.promotion.coinValue, this.fsbPromotionStore.promotion.betLevel);
    }

    updateTotalWin({ win, totalFreeSpins }: { win: number; totalFreeSpins: number }) {
        if (!this.fsbPromotionUIStore.isUpdateTotalWin) {
            return;
        }

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
            this.cascadingUIStore.isFreeSpins ||
            this.fsbPromotionUIStore.currentSpinCount <= 0
        ) {
            return;
        }

        this.syncFSBBetControl();
        this.tryConsumeFSB();
    }

    setFSBInfoReady(isReady: boolean) {
        this.fsbPromotionUIStore.setFSBInfoReady(isReady);
    }

    /** ========== TURN OVER REQUIRED MANAGEMENT ========== */

    public activeDetailPromo(isActive: boolean) {
        this.fsbPromotionUIStore.activeDetailPromo = isActive;
    }

    public initTurnOverRequiredEvents() {
        this.clearTurnOverRequiredObservers();
        
        this.fsbPromotionUIStore.turnOverRequiredDataKey.forEach((key) => {
            this.addTurnOverRequiredDataObserver(key, key);
        });
    }

    public clearTurnOverRequiredObservers() {
        this.fsbPromotionUIStore.turnOverRequiredDataKey.forEach((key) => {
            this.removeTurnOverRequiredDataObserver(key, key);
        });
    }

    private addTurnOverRequiredDataObserver(dataType: string, dataKey: string) {
        let callback;
        if (dataType === TurnOverRequiredDataKey.PROMOTION_TO_PROGRESS) {
            callback = (data: ITurnOverRequired) => this.onReceivedTOProgressData(data);
        }
        // Note: You'll need to replace this with your actual notification service implementation
        // NotificationService.getInstance().addDataObserver(dataType, dataKey, callback);
    }

    private onReceivedTOProgressData(data: ITurnOverRequired) {
        const isChanged = this.fsbPromotionUIStore.updateTOProgress(data);

        if (isChanged) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED, data);
        }
    }

    private removeTurnOverRequiredDataObserver(dataType: string, dataKey: string) {
        // Note: You'll need to replace this with your actual notification service implementation
        // NotificationService.getInstance().removeDataObserver(dataType, dataKey);
    }

    public displayTurnOverRequired() {
        this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED);
    }

    public emitTurnOverRequiredEvent(eventName: string, data: ITurnOverRequired) {
        // Note: You'll need to replace this with your actual notification service implementation
        // NotificationService.getInstance().emitEvent(eventName, data);
        this.fsbPromotionUIStore.addPendingUIEvent(eventName, data);
    }

    public getTurnOverProgress(): ITurnOverRequired | null {
        return this.fsbPromotionUIStore.toProgress;
    }

    public hasTurnOverProgress(): boolean {
        return this.fsbPromotionUIStore.hasTOProgress();
    }

    public showNoticeError(errorCode: string) {
        this.noticeErrorsHandlers.showErrorNotice(errorCode);
    }
}
