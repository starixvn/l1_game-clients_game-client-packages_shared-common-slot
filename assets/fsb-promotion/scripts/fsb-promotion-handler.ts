import { _decorator, Component } from 'cc';
import { FreeSpinsPromotionEvents, endpointConstants, FSBPromotionStore } from './fsb-promotion-store';
import gc, { Shared } from "@sg/game-client-base";
import { inject } from 'inversify';
const { ccclass } = _decorator;


@ccclass('fsb_promotion_handler')
export class FSBPromotionHandler {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;

    /** ========== PROMOTION FLOW ========== */
    public handlePromotionDisplay() {
        try {
            if (this.fsbPromotionStore.activeTransitionEffect || !this.fsbPromotionStore.hasPromo()) {
                return;
            }
            if (this.fsbPromotionStore.shouldSkipPromo()) {
                return;
            }

            if (this.fsbPromotionStore.receivedPromotionInGame) {
                this.handleDirectOpen();
                return;
            }

            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
        } catch (error) {
            gc.sentryLogger.logError(`handlePromotionDisplay error: ${error.message}`);
        }
    }

    private handleDirectOpen() {
        const promotion = this.fsbPromotionStore.promotionData?.promotion;
        const isGiftCode = promotion?.isGiftCode;
        const isClaimed = promotion?.isClaimed;
        const remaining = promotion?.remainingBonusItems;
        const initial = promotion?.initialBonusItem;

        if (this.fsbPromotionStore.skipGiftCode) {
            this.fsbPromotionStore.skipGiftCode = false;
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL, true);
            return;
        }

        if (isGiftCode && !isClaimed) {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);
        } else if (isClaimed && remaining === initial) {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
        } else {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL);
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
        const promotionId = this.fsbPromotionStore.promotionData?.promotion?.promotionId || this.fsbPromotionStore.promotionIdFromTO;
        const gameOffers = this.fsbPromotionStore.getGameOffered();
        const queryString = this.getQueryString(promotionId, gameOffers);
        const endpoint = this.fsbPromotionStore.activeDetailPromo ? endpointConstants.announcementDetails : endpointConstants.bannerPromotion;
        return `${this.buildPromotionSiteUrl()}/${endpoint}?${queryString}`;
    }

    private buildParams() {
        const sessionInfo = Shared.utils.StorageManager.get(Shared.utils.localStorageKeys.session) as gc.Auth.ISessionInfo;
        return {
            sessionId: gc.GameUtils.base64Encode(sessionInfo?.session || ""),
            username: sessionInfo?.username,
            language: sessionInfo?.language
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
    public tryShowEndedPopup() {
        if (this.fsbPromotionStore.hasServerFinishPromotion) {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL);
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP);
        }
    }

    public tryConsumeFSB() {
        if (this.fsbPromotionStore.tryConsumeFSB()) {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.UPDATE_FSB_COUNT, this.fsbPromotionStore.currentSpinCount);
        }
    }

    public revertLastFSB() {
        if (this.fsbPromotionStore.revertLastFSB()) {
            this.fsbPromotionStore.addPendingUIEvent(FreeSpinsPromotionEvents.UPDATE_FSB_COUNT, this.fsbPromotionStore.currentSpinCount);
        }
    }

    public commitFSB() {
        this.fsbPromotionStore.commitFSB();
    }

    public markServerConfirmedEnd() {
        this.fsbPromotionStore.markServerConfirmedEnd();
        if (!this.fsbPromotionStore.fsbConsumedThisRound) {
            this.tryShowEndedPopup();
        }
    }

    /** ========== SOCKET COMMUNICATION ========== */
    claimBonusWin() {
        this.connectionStore.send("claim-bonus-win", {});
    }

    redeemGiftCode(giftCode: string) {
        this.connectionStore.send("redeem", { giftCode: giftCode });
    }
}