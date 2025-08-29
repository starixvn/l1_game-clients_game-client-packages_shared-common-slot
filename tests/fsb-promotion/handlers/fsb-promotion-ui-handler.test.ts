import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionUIHandler } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameClientMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies following Dependency Inversion Principle
jest.mock("@sg/game-client-base", () => ({
    Connection: { ConnectionStore: jest.fn() },
    Configs: { SiteConfigs: jest.fn() },
    Auth: { AuthStore: jest.fn() },
    Notices: { NoticeErrorsHandlers: { AutoSignOutHandler: jest.fn() } },
    sentryLogger: { logError: jest.fn() },
    UrlUtils: { getRootDomain: jest.fn(), buildUrl: jest.fn() },
    GameUtils: { base64Encode: jest.fn() },
    Player: { PlayerStore: jest.fn(), MainPlayerStore: jest.fn() },
}));

jest.mock("mobx", () => ({
    makeAutoObservable: jest.fn(),
    reaction: jest.fn(),
}));

jest.mock("inversify", () => ({
    injectable: jest.fn(() => (target: any) => target),
    inject: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

// Removed cascading slot dependencies - not available in current codebase

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

// Mock Factory Functions - Interface Segregation Principle
interface MockConnectionStore {
    send: jest.Mock;
}

interface MockSiteConfigs {
    subPromotionDomain: string;
    ssl: boolean;
    env: string;
}

interface MockPromotion {
    promotionId: string;
    initialBonusItem: number;
    remainingBonusItems: number;
    isClaimed: boolean;
    isGiftCode: boolean;
    coinValue: number;
    betLevel: number;
}

interface MockFSBPromotionStore {
    promotion: MockPromotion | null;
    promotionTOProgress: { promotionId: string };
    finishPromotion: { totalWin: number } | null;
    redemptionNotice: { errorCode: string };
    redeemResult: number;
}

interface MockFSBPromotionUIStore {
    isTrialMode: boolean;
    hasPromo: jest.Mock;
    shouldSkipPromo: jest.Mock;
    skipGiftCode: boolean;
    addPendingUIEvent: jest.Mock;
    removePendingUIEvent: jest.Mock;
    currentSpinCount: number;
    fsbConsumedThisRound: boolean;
    hasServerFinishPromotion: boolean;
    tryConsumeFSB: jest.Mock;
    undoLastFSBSpin: jest.Mock;
    commitFSB: jest.Mock;
    markServerConfirmedEnd: jest.Mock;
    activeDetailPromo: boolean;
    promotionUrl: string;
    gameOffers: any[];
    isUpdateTotalWin: boolean;
    resumedFSBPromotion: boolean;
    setFSBInfoReady: jest.Mock;
    isClickPlayNow: boolean;
    updateTOProgress: jest.Mock;
    pendingOpenTOAfterFinish: boolean;
    isFSBInfoReady: boolean;
    activeTransitionEffect: boolean;
}

// Factory functions following Single Responsibility Principle
const createMockConnectionStore = (): MockConnectionStore => ({
    send: jest.fn(),
});

const createMockSiteConfigs = (): MockSiteConfigs => ({
    subPromotionDomain: "promo",
    ssl: true,
    env: "prod",
});

const createMockPromotion = (overrides?: Partial<MockPromotion>): MockPromotion => ({
    promotionId: "test-123",
    initialBonusItem: 10,
    remainingBonusItems: 10,
    isClaimed: false,
    isGiftCode: false,
    coinValue: 1,
    betLevel: 1,
    ...overrides,
});

const createMockFSBPromotionStore = (overrides?: Partial<MockFSBPromotionStore>): MockFSBPromotionStore => ({
    promotion: createMockPromotion(),
    promotionTOProgress: { promotionId: "test-123" },
    finishPromotion: { totalWin: 1000 },
    redemptionNotice: { errorCode: "SUCCESS" },
    redeemResult: RedeemStatus.Idle,
    ...overrides,
});

const createMockFSBPromotionUIStore = (overrides?: Partial<MockFSBPromotionUIStore>): MockFSBPromotionUIStore => ({
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
    ...overrides,
});

const createMockAuthStore = () => ({
    session: "test-session",
    username: "testuser",
    language: "en",
});

const createMockBetControlHandlers = () => ({
    init: jest.fn(),
});

const createMockCascadingUIStore = () => ({
    fsbPromotionInProgress: false,
    isFreeSpins: false,
});

const createMockNoticeErrorsHandlers = () => ({
    showErrorNotice: jest.fn(),
});

// Base test setup following Single Responsibility Principle
class FSBPromotionUIHandlerTestSetup {
    handler: FSBPromotionUIHandler;
    mockConnectionStore: MockConnectionStore;
    mockSiteConfigs: MockSiteConfigs;
    mockFSBPromotionStore: MockFSBPromotionStore;
    mockFSBPromotionUIStore: MockFSBPromotionUIStore;
    mockAuthStore: any;
    mockBetControlHandlers: any;
    mockCascadingUIStore: any;
    mockNoticeErrorsHandlers: any;
    mockGc: any;

    constructor() {
        this.setupMocks();
        this.setupHandler();
    }

    private setupMocks(): void {
        this.mockConnectionStore = createMockConnectionStore();
        this.mockSiteConfigs = createMockSiteConfigs();
        this.mockFSBPromotionStore = createMockFSBPromotionStore();
        this.mockFSBPromotionUIStore = createMockFSBPromotionUIStore();
        this.mockAuthStore = createMockAuthStore();
        this.mockBetControlHandlers = createMockBetControlHandlers();
        this.mockCascadingUIStore = createMockCascadingUIStore();
        this.mockNoticeErrorsHandlers = createMockNoticeErrorsHandlers();

        this.mockGc = require("@sg/game-client-base");
        this.mockGc.UrlUtils.getRootDomain.mockReturnValue("example.com");
        this.mockGc.UrlUtils.buildUrl.mockImplementation((protocol: string, fullPath: string) => {
            return `${protocol}://example.com${fullPath}`;
        });
        this.mockGc.GameUtils.base64Encode.mockReturnValue("dGVzdC1zZXNzaW9u");
    }

    private setupHandler(): void {
        this.handler = new FSBPromotionUIHandler();
        this.injectDependencies();
    }

    private injectDependencies(): void {
        (this.handler as any).connectionStore = this.mockConnectionStore;
        (this.handler as any).siteConfigs = this.mockSiteConfigs;
        (this.handler as any).fsbPromotionStore = this.mockFSBPromotionStore;
        (this.handler as any).fsbPromotionUIStore = this.mockFSBPromotionUIStore;
        (this.handler as any).authStore = this.mockAuthStore;
        (this.handler as any).betControlHandlers = this.mockBetControlHandlers;
        (this.handler as any).cascadingUIStore = this.mockCascadingUIStore;
        (this.handler as any).noticeErrorsHandlers = this.mockNoticeErrorsHandlers;
    }

    updateFSBPromotionStore(overrides: Partial<MockFSBPromotionStore>): void {
        Object.assign(this.mockFSBPromotionStore, overrides);
    }

    updateFSBPromotionUIStore(overrides: Partial<MockFSBPromotionUIStore>): void {
        Object.assign(this.mockFSBPromotionUIStore, overrides);
    }

    clearAllMocks(): void {
        jest.clearAllMocks();
    }
}

describe("FSBPromotionUIHandler", () => {
    let testSetup: FSBPromotionUIHandlerTestSetup;

    beforeEach(() => {
        testSetup = new FSBPromotionUIHandlerTestSetup();
    });

    describe("Initialization", () => {
        it("should_create_handler_instance_with_proper_dependencies", () => {
            expect(testSetup.handler).toBeInstanceOf(FSBPromotionUIHandler);
        });
    });

    // Test suite for Promotion Display Responsibility
    describe("Promotion Display Management", () => {
        describe("handlePromotionDisplay", () => {
            it("should_not_display_promotion_when_transition_effect_is_active", () => {
                testSetup.updateFSBPromotionUIStore({ activeTransitionEffect: true });
                
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should_not_display_promotion_when_no_promo_available", () => {
                testSetup.mockFSBPromotionUIStore.hasPromo.mockReturnValue(false);
                
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should_not_display_promotion_in_trial_mode", () => {
                testSetup.updateFSBPromotionUIStore({ isTrialMode: true });
                
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should_not_display_promotion_when_should_skip", () => {
                testSetup.mockFSBPromotionUIStore.shouldSkipPromo.mockReturnValue(true);
                
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should_display_promotion_when_all_conditions_met", () => {
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO
                );
            });

            it("should_log_error_when_display_fails", () => {
                testSetup.mockFSBPromotionUIStore.hasPromo.mockImplementation(() => {
                    throw new Error("Test error");
                });
                
                testSetup.handler.handlePromotionDisplay();
                
                expect(testSetup.mockGc.sentryLogger.logError).toHaveBeenCalledWith(
                    "handlePromotionDisplay error: Test error"
                );
            });
        });

        describe("shouldShowGiftCode", () => {
            it("should_show_gift_code_for_valid_unclaimed_promotion", () => {
                testSetup.updateFSBPromotionStore({ 
                    promotion: createMockPromotion({ isGiftCode: true, isClaimed: false })
                });
                testSetup.updateFSBPromotionUIStore({ isTrialMode: false });
                
                const result = (testSetup.handler as any).shouldShowGiftCode();
                
                expect(result).toBe(true);
            });

            it("should_not_show_gift_code_in_trial_mode", () => {
                testSetup.updateFSBPromotionStore({ 
                    promotion: createMockPromotion({ isGiftCode: true, isClaimed: false })
                });
                testSetup.updateFSBPromotionUIStore({ isTrialMode: true });
                
                const result = (testSetup.handler as any).shouldShowGiftCode();
                
                expect(result).toBe(false);
            });

            it("should_not_show_gift_code_for_claimed_promotion", () => {
                testSetup.updateFSBPromotionStore({ 
                    promotion: createMockPromotion({ isGiftCode: true, isClaimed: true })
                });
                testSetup.updateFSBPromotionUIStore({ isTrialMode: false });
                
                const result = (testSetup.handler as any).shouldShowGiftCode();
                
                expect(result).toBe(false);
            });

            it("should_not_show_gift_code_for_non_gift_promotion", () => {
                testSetup.updateFSBPromotionStore({ 
                    promotion: createMockPromotion({ isGiftCode: false, isClaimed: false })
                });
                testSetup.updateFSBPromotionUIStore({ isTrialMode: false });
                
                const result = (testSetup.handler as any).shouldShowGiftCode();
                
                expect(result).toBe(false);
            });
        });
    });

    // Test suite for URL Building Responsibility
    describe("URL Management", () => {
        describe("buildPromotionSiteUrl", () => {
            it("should_build_secure_url_with_subdomain", () => {
                const result = (testSetup.handler as any).buildPromotionSiteUrl();
                
                expect(result).toBe("https://promo.example.com");
            });
        });

        describe("buildProxyUrl", () => {
            it("should_build_proxy_url_with_environment_path", () => {
                const result = (testSetup.handler as any).buildProxyUrl("/test");
                
                expect(result).toBe("http://example.com/prod/test");
            });

            it("should_build_proxy_url_without_environment_when_empty", () => {
                testSetup.mockSiteConfigs.env = "";
                
                const result = (testSetup.handler as any).buildProxyUrl("/test");
                
                expect(result).toBe("http://example.com/test");
            });
        });

        describe("getPromoUrl", () => {
            it("should_build_url_with_promotion_id_from_store", () => {
                const result = testSetup.handler.getPromoUrl();
                
                expect(result).toContain("promotionId=test-123");
            });

            it("should_fallback_to_promotion_to_progress_when_no_promotion", () => {
                testSetup.updateFSBPromotionStore({ promotion: null });
                
                const result = testSetup.handler.getPromoUrl();
                
                expect(result).toContain("promotionId=test-123");
            });

            it("should_include_game_offers_in_url", () => {
                testSetup.updateFSBPromotionUIStore({ 
                    gameOffers: [{ gameId: 1, name: "Test Game" }] 
                });
                
                const result = testSetup.handler.getPromoUrl();
                
                expect(result).toContain("game=");
            });

            it("should_use_announcement_details_endpoint_when_active", () => {
                testSetup.updateFSBPromotionUIStore({ activeDetailPromo: true });
                
                const result = testSetup.handler.getPromoUrl();
                
                expect(result).toContain("announcement-details");
            });
        });

        describe("buildParams", () => {
            it("should_build_authentication_parameters", () => {
                const result = (testSetup.handler as any).buildParams();
                
                expect(result).toEqual({
                    sessionId: "dGVzdC1zZXNzaW9u",
                    username: "testuser",
                    language: "en",
                });
            });
        });

        describe("getQueryString", () => {
            it("should_build_complete_query_string_with_all_parameters", () => {
                const result = (testSetup.handler as any).getQueryString("test-123", [{ gameId: 1, name: "Test" }]);
                
                expect(result).toContain("sessionId=");
                expect(result).toContain("username=");
                expect(result).toContain("language=");
                expect(result).toContain("promotionId=test-123");
                expect(result).toContain("game=");
            });

            it("should_build_basic_query_string_without_optional_parameters", () => {
                const result = (testSetup.handler as any).getQueryString();
                
                expect(result).not.toContain("promotionId=");
                expect(result).not.toContain("game=");
            });
        });
    });

    // Test suite for Promotion State Management Responsibility
    describe("Promotion State Management", () => {
        describe("setCurrentSpinCount", () => {
            it("should_update_current_spin_count", () => {
                testSetup.handler.setCurrentSpinCount(5);
                
                expect(testSetup.mockFSBPromotionUIStore.currentSpinCount).toBe(5);
            });
        });

        describe("tryShowEndedPopup", () => {
            it("should_show_ended_popup_when_server_confirms_finish", () => {
                testSetup.updateFSBPromotionUIStore({ hasServerFinishPromotion: true });
                
                testSetup.handler.tryShowEndedPopup();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.CLOSE_PROMOTION_DETAILS_PANEL
                );
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should_not_show_ended_popup_when_no_server_finish", () => {
                testSetup.updateFSBPromotionUIStore({ hasServerFinishPromotion: false });
                
                testSetup.handler.tryShowEndedPopup();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("changeUIPendingEvent", () => {
            it("should_add_pending_ui_event_with_data", () => {
                testSetup.handler.changeUIPendingEvent("TEST_EVENT", { data: "test" });
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith("TEST_EVENT", { data: "test" });
            });
        });

        describe("removeUIPendingEvent", () => {
            it("should_remove_pending_ui_event", () => {
                testSetup.handler.removeUIPendingEvent();
                
                expect(testSetup.mockFSBPromotionUIStore.removePendingUIEvent).toHaveBeenCalled();
            });
        });
    });

    // Test suite for FSB Management Responsibility
    describe("FSB (Free Spin Bonus) Management", () => {
        describe("tryConsumeFSB", () => {
            it("should_consume_fsb_and_update_count_when_successful", () => {
                testSetup.mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(true);
                
                testSetup.handler.tryConsumeFSB();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                    0
                );
            });

            it("should_not_update_count_when_fsb_consumption_fails", () => {
                testSetup.mockFSBPromotionUIStore.tryConsumeFSB.mockReturnValue(false);
                
                testSetup.handler.tryConsumeFSB();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("undoLastFSBSpin", () => {
            it("should_undo_fsb_spin_and_update_count_when_successful", () => {
                testSetup.mockFSBPromotionUIStore.undoLastFSBSpin.mockReturnValue(true);
                
                testSetup.handler.undoLastFSBSpin();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                    0
                );
            });

            it("should_not_update_count_when_undo_fails", () => {
                testSetup.mockFSBPromotionUIStore.undoLastFSBSpin.mockReturnValue(false);
                
                testSetup.handler.undoLastFSBSpin();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("commitFSBSpins", () => {
            it("should_commit_fsb_spins", () => {
                testSetup.handler.commitFSBSpins();
                
                expect(testSetup.mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
            });
        });

        describe("markFSBEndFromServer", () => {
            it("should_mark_end_and_show_popup_when_server_confirms_and_not_consumed", () => {
                testSetup.updateFSBPromotionUIStore({ 
                    hasServerFinishPromotion: true, 
                    fsbConsumedThisRound: false 
                });
                
                testSetup.handler.markFSBEndFromServer();
                
                expect(testSetup.mockFSBPromotionUIStore.markServerConfirmedEnd).toHaveBeenCalled();
                expect(testSetup.mockCascadingUIStore.fsbPromotionInProgress).toBe(false);
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });

            it("should_not_show_popup_when_fsb_consumed_this_round", () => {
                testSetup.updateFSBPromotionUIStore({ fsbConsumedThisRound: true });
                
                testSetup.handler.markFSBEndFromServer();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP
                );
            });
        });
    });

    // Test suite for Turn Over Panel Eligibility
    describe("Turn Over Panel Eligibility", () => {
        describe("isEligibleForTurnOverPanel", () => {
            it("should_be_eligible_when_has_total_win_and_no_current_spins", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: { totalWin: 1000 } });
                testSetup.updateFSBPromotionUIStore({ currentSpinCount: 0 });
                
                const result = testSetup.handler.isEligibleForTurnOverPanel();
                
                expect(result).toBe(true);
            });

            it("should_not_be_eligible_when_no_total_win", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: { totalWin: 0 } });
                testSetup.updateFSBPromotionUIStore({ currentSpinCount: 0 });
                
                const result = testSetup.handler.isEligibleForTurnOverPanel();
                
                expect(result).toBe(false);
            });

            it("should_not_be_eligible_when_has_current_spins", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: { totalWin: 1000 } });
                testSetup.updateFSBPromotionUIStore({ currentSpinCount: 5 });
                
                const result = testSetup.handler.isEligibleForTurnOverPanel();
                
                expect(result).toBe(false);
            });
        });
    });

    // Test suite for Socket Communication Responsibility
    describe("Socket Communication", () => {
        describe("claimBonusWin", () => {
            it("should_send_claim_bonus_win_event_to_server", () => {
                testSetup.handler.claimBonusWin();
                
                expect(testSetup.mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.ClaimBonusWin.eventName,
                    null
                );
            });
        });

        describe("redeemGiftCode", () => {
            it("should_send_redeem_gift_code_event_with_code", () => {
                testSetup.handler.redeemGiftCode("TESTCODE");
                
                expect(testSetup.mockConnectionStore.send).toHaveBeenCalledWith(
                    GameClientMessageSlot.RedeemGifCode.eventName,
                    { giftCode: "TESTCODE" }
                );
            });
        });

        describe("handleRedemptionNotice", () => {
            it("should_handle_redemption_notice_with_error_message", () => {
                testSetup.handler.handleRedemptionNotice();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.REDEMPTION_NOTICE,
                    "FreeSpinBonus.Invalide_gift_code_error_message"
                );
            });
        });

        describe("resetFSBRedemptionState", () => {
            it("should_reset_redeem_result_to_idle_state", () => {
                testSetup.handler.resetFSBRedemptionState();
                
                expect(testSetup.mockFSBPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
            });
        });


    });

    // Test suite for Error Code Mapping Responsibility
    describe("Error Code Mapping", () => {
        describe("mapErrorCodeToMessageKey", () => {
            it("should_map_sb3019_to_gift_code_error_message", () => {
                const result = (testSetup.handler as any).mapErrorCodeToMessageKey("SB3019");
                
                expect(result).toBe("FreeSpinBonus.gift_code_error_message");
            });

            it("should_map_sb3020_to_invalid_gift_code_error_message", () => {
                const result = (testSetup.handler as any).mapErrorCodeToMessageKey("SB3020");
                
                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });

            it("should_map_sb3021_to_unexpected_gift_code_error_message", () => {
                const result = (testSetup.handler as any).mapErrorCodeToMessageKey("SB3021");
                
                expect(result).toBe("FreeSpinBonus.Unexpected_gift_code_error_message");
            });

            it("should_return_default_message_for_unknown_error_code", () => {
                const result = (testSetup.handler as any).mapErrorCodeToMessageKey("UNKNOWN");
                
                expect(result).toBe("FreeSpinBonus.Invalide_gift_code_error_message");
            });
        });
    });

    // Test suite for FSB Total Win Management
    describe("FSB Total Win Management", () => {
        describe("updateTotalWin", () => {
            it("should_update_total_win_and_resume_promotion_when_enabled", () => {
                testSetup.handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });
                
                expect(testSetup.mockFSBPromotionUIStore.resumedFSBPromotion).toBe(true);
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                    500
                );
            });

            it("should_not_update_when_total_win_update_disabled", () => {
                testSetup.updateFSBPromotionUIStore({ isUpdateTotalWin: false });
                
                testSetup.handler.updateTotalWin({ win: 500, totalFreeSpins: 5 });
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });

            it("should_commit_fsb_and_end_promotion_when_no_free_spins_remaining", () => {
                testSetup.handler.updateTotalWin({ win: 500, totalFreeSpins: 0 });
                
                expect(testSetup.mockFSBPromotionUIStore.commitFSB).toHaveBeenCalled();
                expect(testSetup.mockFSBPromotionUIStore.resumedFSBPromotion).toBe(false);
            });
        });

        describe("setFSBInfoReady", () => {
            it("should_set_fsb_info_ready_status", () => {
                testSetup.handler.setFSBInfoReady(true);
                
                expect(testSetup.mockFSBPromotionUIStore.setFSBInfoReady).toHaveBeenCalledWith(true);
            });
        });

        describe("setIsClickPlayNow", () => {
            it("should_set_click_play_now_status", () => {
                testSetup.handler.setIsClickPlayNow(true);
                
                expect(testSetup.mockFSBPromotionUIStore.isClickPlayNow).toBe(true);
            });
        });
    });

    // Test suite for FSB Manual Trigger Management
    describe("FSB Manual Trigger Management", () => {
        describe("triggerFSBManual", () => {
            it("should_not_trigger_fsb_when_already_consumed_this_round", () => {
                testSetup.updateFSBPromotionUIStore({ fsbConsumedThisRound: true });
                
                testSetup.handler.triggerFSBManual();
                
                expect(testSetup.mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should_not_trigger_fsb_when_in_free_spins_mode", () => {
                Object.assign(testSetup.mockCascadingUIStore, { isFreeSpins: true });
                
                testSetup.handler.triggerFSBManual();
                
                expect(testSetup.mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should_not_trigger_fsb_when_no_current_spin_count", () => {
                testSetup.updateFSBPromotionUIStore({ currentSpinCount: 0 });
                
                testSetup.handler.triggerFSBManual();
                
                expect(testSetup.mockBetControlHandlers.init).not.toHaveBeenCalled();
            });

            it("should_not_trigger_fsb_when_promotion_resumed", () => {
                testSetup.updateFSBPromotionUIStore({ resumedFSBPromotion: true });
                
                testSetup.handler.triggerFSBManual();
                
                expect(testSetup.mockBetControlHandlers.init).not.toHaveBeenCalled();
            });
        });
    });

    // Test suite for Turn Over Required Management Responsibility
    describe("Turn Over Required Management", () => {
        describe("activeDetailPromo", () => {
            it("should_set_active_detail_promo_status", () => {
                testSetup.handler.activeDetailPromo(true);
                
                expect(testSetup.mockFSBPromotionUIStore.activeDetailPromo).toBe(true);
            });
        });

        describe("updatePromotionURL", () => {
            it("should_update_promotion_url", () => {
                testSetup.handler.updatePromotionURL();
                
                expect(testSetup.mockFSBPromotionUIStore.promotionUrl).toBeDefined();
            });
        });

        describe("onReceivedTOProgressData", () => {
            it("should_update_to_progress_and_add_event_when_data_changed", () => {
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };
                
                testSetup.handler.onReceivedTOProgressData(progressData);
                
                expect(testSetup.mockFSBPromotionUIStore.updateTOProgress).toHaveBeenCalledWith(progressData);
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED,
                    progressData
                );
            });

            it("should_not_add_event_when_to_progress_data_unchanged", () => {
                testSetup.mockFSBPromotionUIStore.updateTOProgress.mockReturnValue(false);
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };
                
                testSetup.handler.onReceivedTOProgressData(progressData);
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });

        describe("openTurnOverRequired", () => {
            it("should_set_pending_open_to_when_finish_promotion_exists_for_in_game", () => {
                testSetup.handler.openTurnOverRequired("in-game");
                
                expect(testSetup.mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(true);
            });

            it("should_open_to_immediately_when_no_finish_promotion_for_in_game", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: null });
                
                testSetup.handler.openTurnOverRequired("in-game");
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
            });

            it("should_open_to_when_eligible_for_end_promotion", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: { totalWin: 1000 } });
                testSetup.updateFSBPromotionUIStore({ currentSpinCount: 0 });
                
                testSetup.handler.openTurnOverRequired("end-promotion");
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.OPEN_TURN_OVER_REQUIRED
                );
                expect(testSetup.mockFSBPromotionUIStore.pendingOpenTOAfterFinish).toBe(false);
            });

            it("should_not_open_to_when_not_eligible_for_end_promotion", () => {
                testSetup.updateFSBPromotionStore({ finishPromotion: { totalWin: 0 } });
                
                testSetup.handler.openTurnOverRequired("end-promotion");
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).not.toHaveBeenCalled();
            });
        });
    });

    // Test suite for Notice and Trial Mode Management
    describe("Notice and Trial Mode Management", () => {
        describe("showNoticeError", () => {
            it("should_show_notice_error_with_error_code", () => {
                testSetup.handler.showNoticeError("ERROR_CODE");
                
                expect(testSetup.mockNoticeErrorsHandlers.showErrorNotice).toHaveBeenCalledWith("ERROR_CODE");
            });
        });

        describe("handleTrialMode", () => {
            it("should_set_trial_mode_status", () => {
                testSetup.handler.handleTrialMode(true);
                
                expect(testSetup.mockFSBPromotionUIStore.isTrialMode).toBe(true);
            });
        });

        describe("claimedBonusSuccess", () => {
            it("should_add_claimed_bonus_success_event", () => {
                testSetup.handler.claimedBonusSuccess();
                
                expect(testSetup.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                    FreeSpinsPromotionEvents.CLAIMED_BONUS_SUCCESS
                );
            });
        });
    });
});
