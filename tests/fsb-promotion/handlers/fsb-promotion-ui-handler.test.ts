import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionUIHandler } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameClientMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    Connection: {
        ConnectionStore: jest.fn(),
    },
    Configs: {
        SiteConfigs: jest.fn(),
    },
    Auth: {
        AuthStore: jest.fn(),
    },
    Notices: {
        NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(),
        },
    },
    sentryLogger: {
        logError: jest.fn(),
    },
    UrlUtils: {
        getRootDomain: jest.fn(),
        buildUrl: jest.fn(),
    },
    GameUtils: {
        base64Encode: jest.fn(),
    },
    Player: {
        PlayerStore: jest.fn(),
        MainPlayerStore: jest.fn()
    },
}));

jest.mock("mobx", () => ({
    makeAutoObservable: jest.fn(),
    reaction: jest.fn(),
}));

jest.mock("inversify", () => ({
    injectable: jest.fn(() => (target: any) => target),
    inject: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

jest.mock("db://shared-cascading-slot/handlers/bet-control-handlers");
jest.mock("db://shared-cascading-slot/stores/cascading-ui-store");

// Mock the stores to avoid decorator issues
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
    RedeemStatus: {
        Idle: 0,
        Success: 1,
        Failed: -1,
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn(),
    FreeSpinsPromotionEvents: {
        OPEN_PROMOTION_INFO: "OPEN_PROMOTION_INFO",
        HIDE_GIFT_CODE_ICON: "HIDE_GIFT_CODE_ICON",
        OPEN_GIFT_CODE: "OPEN_GIFT_CODE",
        CLOSE_PROMOTION_DETAILS_PANEL: "CLOSE_PROMOTION_DETAILS_PANEL",
        OPEN_PROMOTION_ENDED_POPUP: "OPEN_PROMOTION_ENDED_POPUP",
        UPDATE_FSB_COUNT: "UPDATE_FSB_COUNT",
        UPDATE_TOTAL_WIN: "UPDATE_TOTAL_WIN",
        REDEMPTION_NOTICE: "REDEMPTION_NOTICE",
        UPDATE_TURN_OVER_REQUIRED: "UPDATE_TURN_OVER_REQUIRED",
        CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
        OPEN_TURN_OVER_REQUIRED: "OPEN_TURN_OVER_REQUIRED",
        OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
    },
    endpointConstants: {
        announcementDetails: "announcement-details",
        bannerPromotion: "banner-promotion",
    },
}));

jest.mock("../../../assets/game-message-slot", () => ({
    GameClientMessageSlot: {
        ClaimBonusWin: {
            eventName: "ClaimBonusWin",
        },
        RedeemGifCode: {
            eventName: "RedeemGifCode",
        },
    },
}));

describe("FSBPromotionUIHandler", () => {
    let handler: FSBPromotionUIHandler;
    let mockConnectionStore: any;
    let mockSiteConfigs: any;
    let mockFSBPromotionStore: any;
    let mockFSBPromotionUIStore: any;
    let mockAuthStore: any;
    let mockBetControlHandlers: any;
    let mockCascadingUIStore: any;
    let mockNoticeErrorsHandlers: any;
    let mockGc: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockConnectionStore = {
            send: jest.fn(),
        };

        mockSiteConfigs = {
            subPromotionDomain: "promo",
            ssl: true,
            env: "prod",
        };

        mockFSBPromotionStore = {
            promotion: {
                promotionId: "test-123",
                initialBonusItem: 10,
                remainingBonusItems: 10,
                isClaimed: false,
                isGiftCode: false,
                coinValue: 1,
                betLevel: 1,
            },
            promotionTOProgress: {
                promotionId: "test-123",
            },
            finishPromotion: {
                totalWin: 1000,
            },
            redemptionNotice: {
                errorCode: "SUCCESS",
            },
            redeemResult: RedeemStatus.Idle,
        };

        mockFSBPromotionUIStore = {
            shouldOpenPromotionInfo: false,
            isTrialMode: false,
            hasPromo: jest.fn(() => true),
            shouldSkipPromo: jest.fn(() => false),
            skipGiftCode: false,
            addPendingUIEvent: jest.fn(),
            removePendingUIEvent: jest.fn(),
            currentSpinCount: 0,
            fsbConsumedThisRound: false,
            hasServerFinishPromotion: false,
            tryConsumeFSB: jest.fn(() => true),
            undoLastFSBSpin: jest.fn(() => true),
            commitFSB: jest.fn(),
            markServerConfirmedEnd: jest.fn(),
            activeDetailPromo: false,
            promotionUrl: "",
            gameOffers: [],
            isUpdateTotalWin: true,
            resumedFSBPromotion: false,
            setFSBInfoReady: jest.fn(),
            isClickPlayNow: false,
            updateTOProgress: jest.fn(() => true),
            pendingOpenTOAfterFinish: false,
            isFSBInfoReady: true,
            activeTransitionEffect: false,
        };

        mockAuthStore = {
            session: "test-session",
            username: "testuser",
            language: "en",
        };

        mockBetControlHandlers = {
            init: jest.fn(),
        };

        mockCascadingUIStore = {
            fsbPromotionInProgress: false,
            isFreeSpins: false,
        };

        mockNoticeErrorsHandlers = {
            showErrorNotice: jest.fn(),
        };

        mockGc = require("@sg/game-client-base");
        mockGc.UrlUtils.getRootDomain.mockReturnValue("example.com");
        mockGc.UrlUtils.buildUrl.mockImplementation((protocol, fullPath, config) => {
            return `${protocol}://example.com${fullPath}`;
        });
        mockGc.GameUtils.base64Encode.mockReturnValue("dGVzdC1zZXNzaW9u");

        // Create handler instance with mocked dependencies
        handler = new FSBPromotionUIHandler();
        
        // Manually inject mocks
        (handler as any).connectionStore = mockConnectionStore;
        (handler as any).siteConfigs = mockSiteConfigs;
        (handler as any).fsbPromotionStore = mockFSBPromotionStore;
        (handler as any).fsbPromotionUIStore = mockFSBPromotionUIStore;
        (handler as any).authStore = mockAuthStore;
        (handler as any).betControlHandlers = mockBetControlHandlers;
        (handler as any).cascadingUIStore = mockCascadingUIStore;
        (handler as any).noticeErrorsHandlers = mockNoticeErrorsHandlers;
    });

    describe("constructor", () => {
        it("should initialize with dependencies", () => {
            expect(handler).toBeInstanceOf(FSBPromotionUIHandler);
        });
    });

    describe("handlePromotionDisplay", () => {
        it("should return early when activeTransitionEffect is true", () => {
            mockFSBPromotionUIStore.activeTransitionEffect = true;
            handler.handlePromotionDisplay();
            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should return early when hasPromo returns false", () => {
            mockFSBPromotionUIStore.hasPromo.mockReturnValue(false);
            handler.handlePromotionDisplay();
            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should return early when isTrialMode is true", () => {
            mockFSBPromotionUIStore.isTrialMode = true;
            handler.handlePromotionDisplay();
            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should return early when shouldSkipPromo returns true", () => {
            mockFSBPromotionUIStore.shouldSkipPromo.mockReturnValue(true);
            handler.handlePromotionDisplay();
            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should handle direct open when conditions are met", () => {
            handler.handlePromotionDisplay();
            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO
            );
        });

        it("should handle error and log to sentry", () => {
            mockFSBPromotionUIStore.hasPromo.mockImplementation(() => {
                throw new Error("Test error");
            });
            handler.handlePromotionDisplay();
            expect(mockGc.sentryLogger.logError).toHaveBeenCalledWith(
                "handlePromotionDisplay error: Test error"
            );
        });
    });

    describe("shouldShowGiftCode", () => {
        it("should return true for gift code promotion", () => {
            mockFSBPromotionStore.promotion.isGiftCode = true;
            mockFSBPromotionStore.promotion.isClaimed = false;
            mockFSBPromotionUIStore.isTrialMode = false;
            
            const result = (handler as any).shouldShowGiftCode();
            expect(result).toBe(true);
        });

        it("should return false when in trial mode", () => {
            mockFSBPromotionStore.promotion.isGiftCode = true;
            mockFSBPromotionStore.promotion.isClaimed = false;
            mockFSBPromotionUIStore.isTrialMode = true;
            
            const result = (handler as any).shouldShowGiftCode();
            expect(result).toBe(false);
        });

        it("should return false when promotion is claimed", () => {
            mockFSBPromotionStore.promotion.isGiftCode = true;
            mockFSBPromotionStore.promotion.isClaimed = true;
            mockFSBPromotionUIStore.isTrialMode = false;
            
            const result = (handler as any).shouldShowGiftCode();
            expect(result).toBe(false);
        });

        it("should return false when not a gift code", () => {
            mockFSBPromotionStore.promotion.isGiftCode = false;
            mockFSBPromotionStore.promotion.isClaimed = false;
            mockFSBPromotionUIStore.isTrialMode = false;
            
            const result = (handler as any).shouldShowGiftCode();
            expect(result).toBe(false);
        });
    });

    describe("URL helpers", () => {
        describe("buildPromotionSiteUrl", () => {
            it("should build URL with sub domain", () => {
                const result = (handler as any).buildPromotionSiteUrl();
                expect(result).toBe("https://promo.example.com");
            });
        });

        describe("buildProxyUrl", () => {
            it("should build proxy URL with env path", () => {
                const result = (handler as any).buildProxyUrl("/test");
                expect(result).toBe("http://example.com/prod/test");
            });

            it("should build proxy URL without env path", () => {
                mockSiteConfigs.env = "";
                const result = (handler as any).buildProxyUrl("/test");
                expect(result).toBe("http://example.com/test");
            });
        });

        describe("getPromoUrl", () => {
            it("should build URL with promotion ID from promotion", () => {
                const result = handler.getPromoUrl();
                expect(result).toContain("promotionId=test-123");
            });

            it("should build URL with promotion ID from promotionTOProgress", () => {
                mockFSBPromotionStore.promotion = null;
                const result = handler.getPromoUrl();
                expect(result).toContain("promotionId=test-123");
            });

            it("should build URL with game offers", () => {
                mockFSBPromotionUIStore.gameOffers = [{ gameId: 1, name: "Test Game" }];
                const result = handler.getPromoUrl();
                expect(result).toContain("game=");
            });

            it("should build URL with announcement details endpoint", () => {
                mockFSBPromotionUIStore.activeDetailPromo = true;
                const result = handler.getPromoUrl();
                expect(result).toContain("announcement-details");
            });
        });

        describe("buildParams", () => {
            it("should build params with auth data", () => {
                const result = (handler as any).buildParams();
                expect(result).toEqual({
                    sessionId: "dGVzdC1zZXNzaW9u",
                    username: "testuser",
                    language: "en",
                });
            });
        });

        describe("getQueryString", () => {
            it("should build query string with all params", () => {
                const result = (handler as any).getQueryString("test-123", [{ gameId: 1, name: "Test" }]);
                expect(result).toContain("sessionId=");
                expect(result).toContain("username=");
                expect(result).toContain("language=");
                expect(result).toContain("promotionId=test-123");
                expect(result).toContain("game=");
            });

            it("should build query string without optional params", () => {
                const result = (handler as any).getQueryString();
                expect(result).not.toContain("promotionId=");
                expect(result).not.toContain("game=");
            });
        });
    });

    describe("promotion state management", () => {
        describe("setCurrentSpinCount", () => {
            it("should set current spin count", () => {
                handler.setCurrentSpinCount(5);
                expect(mockFSBPromotionUIStore.currentSpinCount).toBe(5);
            });
        });

        describe("tryShowEndedPopup", () => {
            it("should show ended popup when has server finish promotion", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = true;
                handler.tryShowEndedPopup();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL
                );
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should not show ended popup when no server finish promotion", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = false;
                handler.tryShowEndedPopup();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("tryConsumeFSB", () => {
            it("should consume FSB and update count", () => {
                mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(true);
                handler.tryConsumeFSB();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                    0
                );
            });

            it("should not update count when FSB consumption fails", () => {
                mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(false);
                handler.tryConsumeFSB();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("undoLastFSBSpin", () => {
            it("should undo FSB spin and update count", () => {
                mockFSBPromotionUIStore.undoLastFSBSpin.mockReturnValue(true);
                handler.undoLastFSBSpin();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                    0
                );
            });

            it("should not update count when undo fails", () => {
                mockFSBPromotionUIStore.undoLastFSBSpin.mockReturnValue(false);
                handler.undoLastFSBSpin();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("commitFSBSpins", () => {
            it("should commit FSB", () => {
                handler.commitFSBSpins();
                expect(mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
            });
        });

        describe("markFSBEndFromServer", () => {
            it("should mark server confirmed end and show popup", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = true;
                mockFSBPromotionUIStore.fsbConsumedThisRound = false;
                handler.markFSBEndFromServer();
                expect(mockFSBPromotionUIStore.markServerConfirmedEnd).toHaveBeenCalled();
                expect(mockCascadingUIStore.fsbPromotionInProgress).toBe(false);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should not show popup when FSB consumed this round", () => {
                mockFSBPromotionUIStore.fsbConsumedThisRound = true;
                handler.markFSBEndFromServer();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });
        });

        describe("changeUIPendingEvent", () => {
            it("should add pending UI event", () => {
                handler.changeUIPendingEvent("TEST_EVENT", { data: "test" });
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith("TEST_EVENT", { data: "test" });
            });
        });

        describe("removeUIPendingEvent", () => {
            it("should remove pending UI event", () => {
                handler.removeUIPendingEvent();
                expect(mockFSBPromotionUIStore.removePendingUIEvent).toHaveBeenCalled();
            });
        });

        describe("isEligibleForTurnOverPanel", () => {
            it("should return true when conditions are met", () => {
                mockFSBPromotionStore.finishPromotion.totalWin = 1000;
                mockFSBPromotionUIStore.currentSpinCount = 0;
                const result = handler.isEligibleForTurnOverPanel();
                expect(result).toBe(true);
            });

            it("should return false when total win is 0", () => {
                mockFSBPromotionStore.finishPromotion.totalWin = 0;
                mockFSBPromotionUIStore.currentSpinCount = 0;
                const result = handler.isEligibleForTurnOverPanel();
                expect(result).toBe(false);
            });

            it("should return false when current spin count is not 0", () => {
                mockFSBPromotionStore.finishPromotion.totalWin = 1000;
                mockFSBPromotionUIStore.currentSpinCount = 5;
                const result = handler.isEligibleForTurnOverPanel();
                expect(result).toBe(false);
            });
        });
    });

    describe("socket communication", () => {
        describe("claimBonusWin", () => {
            it("should send claim bonus win event", () => {
                handler.claimBonusWin();
                expect(mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.ClaimBonusWin.eventName,
                    null
                );
            });
        });

        describe("redeemGiftCode", () => {
            it("should send redeem gift code event", () => {
                handler.redeemGiftCode("TESTCODE");
                expect(mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.RedeemGifCode.eventName,
                    { giftCode: "TESTCODE" }
                );
            });
        });

        describe("handleRedemptionNotice", () => {
            it("should handle redemption notice with error code", () => {
                handler.handleRedemptionNotice();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.REDEMPTION_NOTICE,
                    "FreeSpinBonus.Invalide_gift_code_error_message"
                );
            });
        });

        describe("mapErrorCodeToMessageKey", () => {
            it("should map SB3019 error code", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3019");
                expect(result).toBe("FreeSpinBonus.gift_code_error_message");
            });

            it("should map SB3020 error code", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3020");
                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });

            it("should map SB3021 error code", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3021");
                expect(result).toBe("FreeSpinBonus.Unexpected_gift_code_error_message");
            });

            it("should return default for unknown error code", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("UNKNOWN");
                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });
        });

        describe("resetFSBRedemptionState", () => {
            it("should reset redeem result to idle", () => {
                handler.resetFSBRedemptionState();
                expect(mockFSBPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
            });
        });

        describe("syncFSBBetControl", () => {
            it("should sync bet control with promotion data", () => {
                handler.syncFSBBetControl();
                expect(mockBetControlHandlers.init).toHaveBeenCalledWith(1, 1);
            });
        });
    });

    describe("FSB management", () => {
        describe("updateTotalWin", () => {
            it("should update total win when isUpdateTotalWin is true", () => {
                handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });
                expect(mockFSBPromotionUIStore.resumedFSBPromotion).toBe(true);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                    500
                );
            });

            it("should not update when isUpdateTotalWin is false", () => {
                mockFSBPromotionUIStore.isUpdateTotalWin = false;
                handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should commit FSB spins when total free spins is 0", () => {
                handler.updateTotalWin({ win: 500, totalFreeSpins: 0 });
                expect(mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
                expect(mockFSBPromotionUIStore.resumedFSBPromotion).toBe(false);
            });
        });

        describe("triggerFSBManual", () => {
            it("should trigger FSB when conditions are met", () => {
                mockFSBPromotionUIStore.fsbConsumedThisRound = false;
                mockCascadingUIStore.isFreeSpins = false;
                mockFSBPromotionUIStore.currentSpinCount = 5;
                mockFSBPromotionUIStore.resumedFSBPromotion = false;
                handler.triggerFSBManual();
                expect(mockBetControlHandlers.init).toHaveBeenCalled();
                expect(mockFSBPromotionUIStore.tryConsumeFSB).toHaveBeenCalled();
            });

            it("should not trigger FSB when already consumed", () => {
                mockFSBPromotionUIStore.fsbConsumedThisRound = true;
                handler.triggerFSBManual();
                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger FSB when in free spins", () => {
                mockCascadingUIStore.isFreeSpins = true;
                handler.triggerFSBManual();
                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger FSB when current spin count is 0", () => {
                mockFSBPromotionUIStore.currentSpinCount = 0;
                handler.triggerFSBManual();
                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger FSB when resumed promotion", () => {
                mockFSBPromotionUIStore.resumedFSBPromotion = true;
                handler.triggerFSBManual();
                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });
        });

        describe("setFSBInfoReady", () => {
            it("should set FSB info ready", () => {
                handler.setFSBInfoReady(true);
                expect(mockFSBPromotionUIStore.setFSBInfoReady).toHaveBeenCalledWith(true);
            });
        });

        describe("setIsClickPlayNow", () => {
            it("should set is click play now", () => {
                handler.setIsClickPlayNow(true);
                expect(mockFSBPromotionUIStore.isClickPlayNow).toBe(true);
            });
        });
    });

    describe("turn over required management", () => {
        describe("activeDetailPromo", () => {
            it("should set active detail promo", () => {
                handler.activeDetailPromo(true);
                expect(mockFSBPromotionUIStore.activeDetailPromo).toBe(true);
            });
        });

        describe("updatePromotionURL", () => {
            it("should update promotion URL", () => {
                handler.updatePromotionURL();
                expect(mockFSBPromotionUIStore.promotionUrl).toBeDefined();
            });
        });

        describe("onReceivedTOProgressData", () => {
            it("should update TO progress and add event when changed", () => {
                const data = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };
                handler.onReceivedTOProgressData(data);
                expect(mockFSBPromotionUIStore.updateTOProgress).toHaveBeenCalledWith(data);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED,
                    data
                );
            });

            it("should not add event when not changed", () => {
                mockFSBPromotionUIStore.updateTOProgress.mockReturnValue(false);
                const data = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };
                handler.onReceivedTOProgressData(data);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("showNoticeError", () => {
            it("should show notice error", () => {
                handler.showNoticeError("ERROR_CODE");
                expect(mockNoticeErrorsHandlers.showErrorNotice).toHaveBeenCalledWith("ERROR_CODE");
            });
        });

        describe("handleTrialMode", () => {
            it("should handle trial mode", () => {
                handler.handleTrialMode(true);
                expect(mockFSBPromotionUIStore.isTrialMode).toBe(true);
            });
        });

        describe("claimedBonusSuccess", () => {
            it("should add claimed bonus success event", () => {
                handler.claimedBonusSuccess();
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.CLAIMED_BONUS_SUCCESS
                );
            });
        });

        describe("openTurnOverRequired", () => {
            it("should open TO required in-game when finish promotion exists", () => {
                handler.openTurnOverRequired("in-game");
                expect(mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(true);
            });

            it("should open TO required in-game when no finish promotion", () => {
                mockFSBPromotionStore.finishPromotion = null;
                handler.openTurnOverRequired("in-game");
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
            });

            it("should open TO required end-promotion when eligible", () => {
                mockFSBPromotionStore.finishPromotion.totalWin = 1000;
                mockFSBPromotionUIStore.currentSpinCount = 0;
                handler.openTurnOverRequired("end-promotion");
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
                expect(mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(false);
            });

            it("should not open TO required end-promotion when not eligible", () => {
                mockFSBPromotionStore.finishPromotion.totalWin = 0;
                handler.openTurnOverRequired("end-promotion");
                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });
    });
});
