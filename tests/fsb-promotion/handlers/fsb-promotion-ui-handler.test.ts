import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionUIHandler } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameClientMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    Connection: { ConnectionStore: jest.fn() },
    Configs: { SiteConfigs: jest.fn() },
    Auth: { AuthStore: jest.fn() },
    Notices: { NoticeErrorsHandlers: { AutoSignOutHandler: jest.fn() } },
    sentryLogger: { logError: jest.fn() },
    UrlUtils: { getRootDomain: jest.fn(), buildUrl: jest.fn() },
    GameUtils: { base64Encode: jest.fn() },
    Player: { PlayerStore: jest.fn(), MainPlayerStore: jest.fn() },
    Shared: {
        utils: {
            StorageManager: {
                setPrefixKey: jest.fn(),
            },
        },
    },
}));

jest.mock("mobx", () => ({
    makeAutoObservable: jest.fn(),
    reaction: jest.fn(),
}));

jest.mock("inversify", () => ({
    injectable: jest.fn(() => (target: any) => target),
    inject: jest.fn(() => (target: any, propertyKey: string) => { }),
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
    RedeemStatus: { Idle: 0, Success: 1, Failed: -1 },
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
        ClaimBonusWin: { eventName: "ClaimBonusWin" },
        RedeemGifCode: { eventName: "RedeemGifCode" },
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

        // Create simple mocks
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
            promotionTOProgress: { promotionId: "test-123" },
            finishPromotion: { totalWin: 1000 },
            redemptionNotice: { errorCode: "SUCCESS" },
            redeemResult: RedeemStatus.Idle,
        };

        mockFSBPromotionUIStore = {
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

        // Setup game client base mocks
        mockGc = require("@sg/game-client-base");
        mockGc.UrlUtils.getRootDomain.mockReturnValue("example.com");
        mockGc.UrlUtils.buildUrl.mockImplementation((protocol: string, fullPath: string) => {
            return `${protocol}://example.com${fullPath}`;
        });
        mockGc.GameUtils.base64Encode.mockReturnValue("dGVzdC1zZXNzaW9u");

        // Create handler and inject dependencies
        handler = new FSBPromotionUIHandler();
        (handler as any).connectionStore = mockConnectionStore;
        (handler as any).siteConfigs = mockSiteConfigs;
        (handler as any).fsbPromotionStore = mockFSBPromotionStore;
        (handler as any).fsbPromotionUIStore = mockFSBPromotionUIStore;
        (handler as any).authStore = mockAuthStore;
        (handler as any).betControlHandlers = mockBetControlHandlers;
        (handler as any).cascadingUIStore = mockCascadingUIStore;
        (handler as any).noticeErrorsHandlers = mockNoticeErrorsHandlers;
    });

    describe("initialization", () => {
        it("should create handler instance with proper dependencies", () => {
            expect(handler).toBeInstanceOf(FSBPromotionUIHandler);
        });
    });

    describe("handlePromotionDisplay", () => {
        it("should not display promotion when transition effect is active", () => {
            mockFSBPromotionUIStore.activeTransitionEffect = true;

            handler.handlePromotionDisplay();

            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should not display promotion when no promo available", () => {
            mockFSBPromotionUIStore.hasPromo.mockReturnValue(false);

            handler.handlePromotionDisplay();

            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should not display promotion in trial mode", () => {
            mockFSBPromotionUIStore.isTrialMode = true;

            handler.handlePromotionDisplay();

            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should not display promotion when should skip", () => {
            mockFSBPromotionUIStore.shouldSkipPromo.mockReturnValue(true);

            handler.handlePromotionDisplay();

            expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
        });

        it("should display promotion when all conditions met", () => {
            handler.handlePromotionDisplay();

            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO, false
            );
        });

        it("should log error when display fails", () => {
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
        it("should show gift code for valid unclaimed promotion", () => {
            mockFSBPromotionStore.promotion = {
                isGiftCode: true,
                isClaimed: false
            };
            mockFSBPromotionUIStore.isTrialMode = false;

            const result = (handler as any).shouldShowGiftCode();

            expect(result).toBe(true);
        });

        it("should not show gift code in trial mode", () => {
            mockFSBPromotionStore.promotion = {
                isGiftCode: true,
                isClaimed: false
            };
            mockFSBPromotionUIStore.isTrialMode = true;

            const result = (handler as any).shouldShowGiftCode();

            expect(result).toBe(false);
        });

        it("should not show gift code for claimed promotion", () => {
            mockFSBPromotionStore.promotion = {
                isGiftCode: true,
                isClaimed: true
            };
            mockFSBPromotionUIStore.isTrialMode = false;

            const result = (handler as any).shouldShowGiftCode();

            expect(result).toBe(false);
        });

        it("should not show gift code for non gift promotion", () => {
            mockFSBPromotionStore.promotion = {
                isGiftCode: false,
                isClaimed: false
            };
            mockFSBPromotionUIStore.isTrialMode = false;

            const result = (handler as any).shouldShowGiftCode();

            expect(result).toBe(false);
        });
    });

    describe("URL Management", () => {
        describe("buildPromotionSiteUrl", () => {
            it("should build secure url with subdomain", () => {
                const result = (handler as any).buildPromotionSiteUrl();

                expect(result).toBe("https://promo.example.com");
            });
        });

        describe("buildProxyUrl", () => {
            it("should build proxy url with environment path", () => {
                const result = (handler as any).buildProxyUrl("/test");

                expect(result).toBe("http://example.com/prod/test");
            });

            it("should build proxy url without environment when empty", () => {
                mockSiteConfigs.env = "";

                const result = (handler as any).buildProxyUrl("/test");

                expect(result).toBe("http://example.com/test");
            });
        });

        describe("getPromoUrl", () => {
            it("should build url with promotion id from store", () => {
                const result = handler.getPromoUrl();

                expect(result).toContain("promotionId=test-123");
            });

            it("should fallback to promotion to progress when no promotion", () => {
                mockFSBPromotionStore.promotion = null;

                const result = handler.getPromoUrl();

                expect(result).toContain("promotionId=test-123");
            });

            it("should include game offers in url", () => {
                mockFSBPromotionUIStore.gameOffers = [{ gameId: 1, name: "Test Game" }];

                const result = handler.getPromoUrl();

                expect(result).toContain("game=");
            });

            it("should use announcement details endpoint when active", () => {
                mockFSBPromotionUIStore.activeDetailPromo = true;

                const result = handler.getPromoUrl();

                expect(result).toContain("announcement-details");
            });
        });

        describe("buildParams", () => {
            it("should build authentication parameters", () => {
                const result = (handler as any).buildParams();

                expect(result).toEqual({
                    sessionId: "dGVzdC1zZXNzaW9u",
                    username: "testuser",
                    language: "en",
                });
            });
        });

        describe("getQueryString", () => {
            it("should build complete query string with all parameters", () => {
                const result = (handler as any).getQueryString("test-123", [{ gameId: 1, name: "Test" }]);

                expect(result).toContain("sessionId=");
                expect(result).toContain("username=");
                expect(result).toContain("language=");
                expect(result).toContain("promotionId=test-123");
                expect(result).toContain("game=");
            });

            it("should build basic query string without optional parameters", () => {
                const result = (handler as any).getQueryString();

                expect(result).not.toContain("promotionId=");
                expect(result).not.toContain("game=");
            });
        });
    });

    describe("Promotion State Management", () => {
        describe("setCurrentSpinCount", () => {
            it("should update current spin count", () => {
                handler.setCurrentSpinCount(5);

                expect(mockFSBPromotionUIStore.currentSpinCount).toBe(5);
            });
        });

        describe("tryShowEndedPopup", () => {
            it("should show ended popup when server confirms finish", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = true;

                handler.tryShowEndedPopup();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL
                );
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should not show ended popup when no server finish", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = false;

                handler.tryShowEndedPopup();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("changeUIPendingEvent", () => {
            it("should add pending ui event with data", () => {
                handler.changeUIPendingEvent("TEST_EVENT", { data: "test" });

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith("TEST_EVENT", { data: "test" });
            });
        });

        describe("removeUIPendingEvent", () => {
            it("should remove pending ui event", () => {
                handler.removeUIPendingEvent();

                expect(mockFSBPromotionUIStore.removePendingUIEvent).toHaveBeenCalled();
            });
        });
    });

    describe("FSB (Free Spin Bonus) Management", () => {
        describe("tryConsumeFSB", () => {
            it("should consume fsb and update count when successful", () => {
                mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(true);

                handler.tryConsumeFSB();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                    0
                );
            });

            it("should not update count when fsb consumption fails", () => {
                mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(false);

                handler.tryConsumeFSB();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("undoLastFSBSpin", () => {
            it("should undo fsb spin and update count when successful", () => {
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
            it("should commit fsb spins", () => {
                handler.commitFSBSpins();

                expect(mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
            });
        });

        describe("markFSBEndFromServer", () => {
            it("should mark end and show popup when server confirms and not consumed", () => {
                mockFSBPromotionUIStore.hasServerFinishPromotion = true;
                mockFSBPromotionUIStore.fsbConsumedThisRound = false;

                handler.markFSBEndFromServer();

                expect(mockFSBPromotionUIStore.markServerConfirmedEnd).toHaveBeenCalled();
                expect(mockCascadingUIStore.fsbPromotionInProgress).toBe(false);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should not show popup when fsb consumed this round", () => {
                mockFSBPromotionUIStore.fsbConsumedThisRound = true;

                handler.markFSBEndFromServer();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });
        });
    });

    describe("Turn Over Panel Eligibility", () => {
        describe("isEligibleForTurnOverPanel", () => {
            it("should be eligible when has total win and no current spins", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 1000 };
                mockFSBPromotionUIStore.currentSpinCount = 0;

                const result = handler.isEligibleForTurnOverPanel();

                expect(result).toBe(true);
            });

            it("should not be eligible when no total win", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 0 };
                mockFSBPromotionUIStore.currentSpinCount = 0;

                const result = handler.isEligibleForTurnOverPanel();

                expect(result).toBe(false);
            });

            it("should not be eligible when has current spins", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 1000 };
                mockFSBPromotionUIStore.currentSpinCount = 5;

                const result = handler.isEligibleForTurnOverPanel();

                expect(result).toBe(false);
            });
        });
    });

    describe("Socket Communication", () => {
        describe("claimBonusWin", () => {
            it("should send claim bonus win event to server", () => {
                handler.claimBonusWin();

                expect(mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.ClaimBonusWin.eventName,
                    null
                );
            });
        });

        describe("redeemGiftCode", () => {
            it("should send redeem gift code event with code", () => {
                handler.redeemGiftCode("TESTCODE");

                expect(mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.RedeemGifCode.eventName,
                    { giftCode: "TESTCODE" }
                );
            });
        });

        describe("handleRedemptionNotice", () => {
            it("should handle redemption notice with error message", () => {
                handler.handleRedemptionNotice();

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.REDEMPTION_NOTICE,
                    "FreeSpinBonus.Invalide_gift_code_error_message"
                );
            });
        });

        describe("resetFSBRedemptionState", () => {
            it("should reset redeem result to idle state", () => {
                handler.resetFSBRedemptionState();

                expect(mockFSBPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
            });
        });
    });

    describe("Error Code Mapping", () => {
        describe("mapErrorCodeToMessageKey", () => {
            it("should map sb3019 to gift code error message", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3019");

                expect(result).toBe("FreeSpinBonus.gift_code_error_message");
            });

            it("should map sb3020 to invalid gift code error message", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3020");

                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });

            it("should map sb3021 to unexpected gift code error message", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("SB3021");

                expect(result).toBe("FreeSpinBonus.Unexpected_gift_code_error_message");
            });

            it("should return default message for unknown error code", () => {
                const result = (handler as any).mapErrorCodeToMessageKey("UNKNOWN");

                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });
        });
    });

    describe("FSB Total Win Management", () => {
        describe("updateTotalWin", () => {
            it("should update total win and resume promotion when enabled", () => {
                handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });

                expect(mockFSBPromotionUIStore.resumedFSBPromotion).toBe(true);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                    500
                );
            });

            it("should not update when total win update disabled", () => {
                mockFSBPromotionUIStore.isUpdateTotalWin = false;

                handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should commit fsb and end promotion when no free spins remaining", () => {
                handler.updateTotalWin({ win: 500, totalFreeSpins: 0 });

                expect(mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
                expect(mockFSBPromotionUIStore.resumedFSBPromotion).toBe(false);
            });
        });

        describe("setFSBInfoReady", () => {
            it("should set fsb info ready status", () => {
                handler.setFSBInfoReady(true);

                expect(mockFSBPromotionUIStore.setFSBInfoReady).toHaveBeenCalledWith(true);
            });
        });

        describe("setIsClickPlayNow", () => {
            it("should set click play now status", () => {
                handler.setIsClickPlayNow(true);

                expect(mockFSBPromotionUIStore.isClickPlayNow).toBe(true);
            });
        });
    });

    describe("FSB Manual Trigger Management", () => {
        describe("triggerFSBManual", () => {
            it("should not trigger fsb when already consumed this round", () => {
                mockFSBPromotionUIStore.fsbConsumedThisRound = true;

                handler.triggerFSBManual();

                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger fsb when in free spins mode", () => {
                mockCascadingUIStore.isFreeSpins = true;

                handler.triggerFSBManual();

                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger fsb when no current spin count", () => {
                mockFSBPromotionUIStore.currentSpinCount = 0;

                handler.triggerFSBManual();

                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should not trigger fsb when promotion resumed", () => {
                mockFSBPromotionUIStore.resumedFSBPromotion = true;

                handler.triggerFSBManual();

                expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
            });
        });
    });

    describe("Turn Over Required Management", () => {
        describe("activeDetailPromo", () => {
            it("should set active detail promo status", () => {
                handler.activeDetailPromo(true);

                expect(mockFSBPromotionUIStore.activeDetailPromo).toBe(true);
            });
        });

        describe("updatePromotionURL", () => {
            it("should update promotion url", () => {
                handler.updatePromotionURL();

                expect(mockFSBPromotionUIStore.promotionUrl).toBeDefined();
            });
        });

        describe("onReceivedTOProgressData", () => {
            it("should update to progress and add event when data changed", () => {
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };

                handler.onReceivedTOProgressData(progressData);

                expect(mockFSBPromotionUIStore.updateTOProgress).toHaveBeenCalledWith(progressData);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED,
                    progressData
                );
            });

            it("should not add event when to progress data unchanged", () => {
                mockFSBPromotionUIStore.updateTOProgress.mockReturnValue(false);
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };

                handler.onReceivedTOProgressData(progressData);

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("openTurnOverRequired", () => {
            it("should set pending open to when finish promotion exists for in game", () => {
                handler.openTurnOverRequired("in-game");

                expect(mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(true);
            });

            it("should open to immediately when no finish promotion for in game", () => {
                mockFSBPromotionStore.finishPromotion = null;

                handler.openTurnOverRequired("in-game");

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
            });

            it("should open to when eligible for end promotion", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 1000 };
                mockFSBPromotionUIStore.currentSpinCount = 0;

                handler.openTurnOverRequired("end-promotion");

                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
                expect(mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(false);
            });

            it("should not open to when not eligible for end promotion", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 0 };

                handler.openTurnOverRequired("end-promotion");

                expect(mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });
    });

    describe("Notice and Trial Mode Management", () => {
        describe("showNoticeError", () => {
            it("should show notice error with error code", () => {
                handler.showNoticeError("ERROR_CODE");

                expect(mockNoticeErrorsHandlers.showErrorNotice).toHaveBeenCalledWith("ERROR_CODE");
            });
        });

        describe("handleTrialMode", () => {
            it("should set trial mode status", () => {
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
    });
});