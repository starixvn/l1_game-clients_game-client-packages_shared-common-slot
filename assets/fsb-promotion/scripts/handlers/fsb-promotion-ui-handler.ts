import { _decorator } from "cc";
import { FreeSpinsPromotionEvents, endpointConstants, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import gc from "@sg/game-client-base";
import inversify from "inversify";
import { FSBPromotionStore, RedeemStatus } from "../stores/fsb-promotion-store";
import { GameClientMessageSlot } from "../../../game-message-slot";
import { BetControlHandlers } from "db://shared-cascading-slot/handlers/bet-control-handlers";
import { CascadingUIHandler } from "db://shared-cascading-slot/handlers/cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionUIHandler {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.Auth.AuthStore) protected readonly authStore: gc.Auth.AuthStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;

    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;

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
        this.cascadingUIHandler.handleFreeSpinsTotal(this.fsbPromotionStore.promotion.remainingBonusItems);
        this.setCurrentSpinCount(this.fsbPromotionStore.promotion.remainingBonusItems);
    }
}
