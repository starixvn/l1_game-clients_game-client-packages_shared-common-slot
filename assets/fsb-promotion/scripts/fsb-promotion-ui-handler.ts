import { _decorator } from "cc";
import { FreeSpinsPromotionEvents, endpointConstants, FSBPromotionUIStore } from "./fsb-promotion-ui-store";
import gc, { Shared } from "@sg/game-client-base";
import inversify from "inversify";
import { FSBPromotionStore } from "./fsb-promotion-store";
import GatewayGameItem from "db://shared-components/game-baccarat/gateway-panel/scripts/gateway-game-item";
import { GameClientMessageSlot } from "../../game-message-slot";

const { injectable, inject } = inversify;

@injectable()
export class FSBPromotionUIHandler {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(GatewayGameItem) protected readonly gatewayGameItem: GatewayGameItem;

    /** ========== PROMOTION FLOW ========== */
    public handlePromotionDisplay() {
        try {
            if (this.fsbPromotionUIStore.activeTransitionEffect || !this.fsbPromotionUIStore.hasPromo()) {
                return;
            }
            if (this.fsbPromotionUIStore.shouldSkipPromo()) {
                return;
            }

            if (this.fsbPromotionUIStore.receivedPromotionInGame) {
                this.handleDirectOpen();
                return;
            }

            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
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
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL, true);
            return;
        }

        if (isGiftCode && !isClaimed) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);
        } else if (isClaimed && remaining === initial) {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
        } else {
            this.fsbPromotionUIStore.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL);
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
        const gameOffers = [{ gameId: this.gatewayGameItem.gameId, name: this.gatewayGameItem.gameName }];
        const queryString = this.getQueryString(promotionId, gameOffers);
        const endpoint = this.fsbPromotionUIStore.activeDetailPromo
            ? endpointConstants.announcementDetails
            : endpointConstants.bannerPromotion;
        return `${this.buildPromotionSiteUrl()}/${endpoint}?${queryString}`;
    }

    private buildParams() {
        const sessionInfo = Shared.utils.StorageManager.get(Shared.utils.localStorageKeys.session) as gc.Auth.ISessionInfo;
        return {
            sessionId: gc.GameUtils.base64Encode(sessionInfo?.session || ""),
            username: sessionInfo?.username,
            language: sessionInfo?.language,
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

    public revertLastFSB() {
        if (this.fsbPromotionUIStore.revertLastFSB()) {
            this.fsbPromotionUIStore.addPendingUIEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                this.fsbPromotionUIStore.currentSpinCount
            );
        }
    }

    public commitFSB() {
        this.fsbPromotionUIStore.commitFSB();
    }

    public markServerConfirmedEnd() {
        this.fsbPromotionUIStore.markServerConfirmedEnd();
        if (!this.fsbPromotionUIStore.fsbConsumedThisRound) {
            this.tryShowEndedPopup();
        }
    }

    /** ========== SOCKET COMMUNICATION ========== */
    claimBonusWin() {
        this.connectionStore.send(GameClientMessageSlot.ClaimBonusWin.eventName, null);
    }

    redeemGiftCode(giftCode: string) {
        this.connectionStore.send(GameClientMessageSlot.RedeemGifCode.eventName, { giftCode: giftCode });
    }
}
