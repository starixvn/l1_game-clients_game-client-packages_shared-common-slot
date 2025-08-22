import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionHandlers } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    Connection: {
        ConnectionStore: jest.fn(),
    },
    Notification: {
        NotificationStore: jest.fn(),
    },
    Shared: {
        IMultipleHandlers: jest.fn(),
    },
}));

jest.mock("inversify", () => ({
    injectable: jest.fn(() => (target: any) => target),
    inject: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

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
        EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
        SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: jest.fn(),
}));

jest.mock("../../../assets/game-message-slot", () => ({
    GameServiceMessageSlot: {
        Promotion: {
            eventName: "Promotion",
        },
        PromotionTOProgress: {
            eventName: "PromotionTOProgress",
        },
        ClaimedAmount: {
            eventName: "ClaimedAmount",
        },
        RedeemResult: {
            eventName: "RedeemResult",
        },
        FinishPromotion: {
            eventName: "FinishPromotion",
        },
        RedemptionNotice: {
            eventName: "RedemptionNotice",
        },
        ClaimedBonusFailed: {
            eventName: "ClaimedBonusFailed",
        },
    },
}));

describe("FSBPromotionHandlers", () => {
    let handlers: FSBPromotionHandlers;
    let mockPromotionStore: any;
    let mockConnectionStore: any;
    let mockFSBPromotionUIHandler: any;
    let mockFSBPromotionUIStore: any;
    let mockNotificationStore: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockPromotionStore = {
            promotion: null,
            promotionTOProgress: null,
            claimedAmount: 0,
            redeemResult: RedeemStatus.Idle,
            finishPromotion: null,
            redemptionNotice: null,
            claimedBonusFailed: null,
        };

        mockConnectionStore = {
            send: jest.fn(),
        };

        mockFSBPromotionUIHandler = {
            handlePromotionDisplay: jest.fn(),
            openTurnOverRequired: jest.fn(),
            onReceivedTOProgressData: jest.fn(),
            claimedBonusSuccess: jest.fn(),
            markFSBEndFromServer: jest.fn(),
            handleRedemptionNotice: jest.fn(),
        };

        mockFSBPromotionUIStore = {
            toProgress: null,
            addPendingUIEvent: jest.fn(),
        };

        mockNotificationStore = {
            connection: {
                on: jest.fn(),
            },
        };

        // Create handlers instance with mocked dependencies
        handlers = new FSBPromotionHandlers();
        
        // Manually inject mocks
        (handlers as any).promotionStore = mockPromotionStore;
        (handlers as any).connectionStore = mockConnectionStore;
        (handlers as any).fsbPromotionUIHandler = mockFSBPromotionUIHandler;
        (handlers as any).fsbPromotionUIStore = mockFSBPromotionUIStore;
        (handlers as any).notificationStore = mockNotificationStore;
    });

    describe("constructor", () => {
        it("should initialize with dependencies", () => {
            expect(handlers).toBeInstanceOf(FSBPromotionHandlers);
        });
    });

    describe("handlePromotion", () => {
        it("should set promotion data and handle promotion display", () => {
            const promotionData: GameServiceMessageSlot.Promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                remainingBonusItems: 10,
                isClaimed: false,
                isGiftCode: false,
                coinValue: 1,
                betLevel: 1,
            };

            handlers.handlePromotion(promotionData);

            expect(mockPromotionStore.promotion).toBe(promotionData);
            expect(mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalled();
        });
    });

    describe("handlePromotionTOProgress", () => {
        it("should set promotion TO progress data and open turn over required", () => {
            const toProgressData: GameServiceMessageSlot.PromotionTOProgress = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 900,
                canClaim: false,
                expire: "2024-12-31",
            };

            handlers.handlePromotionTOProgress(toProgressData);

            expect(mockPromotionStore.promotionTOProgress).toBe(toProgressData);
            expect(mockFSBPromotionUIStore.toProgress).toBe(toProgressData);
            expect(mockFSBPromotionUIHandler.openTurnOverRequired).toHaveBeenCalledWith("in-game");
            expect(mockNotificationStore.connection.on).toHaveBeenCalledWith(
                "promotionProgress",
                expect.any(Function)
            );
        });

        it("should handle notification received callback", () => {
            const toProgressData: GameServiceMessageSlot.PromotionTOProgress = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 900,
                canClaim: false,
                expire: "2024-12-31",
            };

            handlers.handlePromotionTOProgress(toProgressData);

            // Get the callback function that was registered
            const callback = mockNotificationStore.connection.on.mock.calls[0][1];
            
            // Test the callback
            callback(toProgressData);
            expect(mockFSBPromotionUIHandler.onReceivedTOProgressData).toHaveBeenCalledWith(toProgressData);
        });
    });

    describe("handleNotificationReceived", () => {
        it("should call onReceivedTOProgressData with the data", () => {
            const data: GameServiceMessageSlot.PromotionTOProgress = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 900,
                canClaim: false,
                expire: "2024-12-31",
            };

            handlers.handleNotificationReceived(data);

            expect(mockFSBPromotionUIHandler.onReceivedTOProgressData).toHaveBeenCalledWith(data);
        });
    });

    describe("handleClaimedAmount", () => {
        it("should set claimed amount and call claimed bonus success", () => {
            const claimedAmount = 500;

            handlers.handleClaimedAmount(claimedAmount);

            expect(mockPromotionStore.claimedAmount).toBe(claimedAmount);
            expect(mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalled();
        });
    });

    describe("handleRedeemResult", () => {
        it("should set redeem result", () => {
            const redeemResult = RedeemStatus.Success;

            handlers.handleRedeemResult(redeemResult);

            expect(mockPromotionStore.redeemResult).toBe(redeemResult);
        });
    });

    describe("handleFinishPromotion", () => {
        it("should set finish promotion data and mark FSB end from server", () => {
            const finishPromotionData: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 1000,
                endPromotion: true,
            };

            handlers.handleFinishPromotion(finishPromotionData);

            expect(mockPromotionStore.finishPromotion).toBe(finishPromotionData);
            expect(mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalled();
        });
    });

    describe("handleRedemptionNotice", () => {
        it("should set redemption notice data and handle redemption notice", () => {
            const redemptionNoticeData: GameServiceMessageSlot.RedemptionNotice = {
                errorCode: "SUCCESS",
            };

            handlers.handleRedemptionNotice(redemptionNoticeData);

            expect(mockPromotionStore.redemptionNotice).toBe(redemptionNoticeData);
            expect(mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalled();
        });
    });

    describe("handleClaimedBonusFailed", () => {
        it("should set claimed bonus failed and add EXPIRE_CLAIM_BONUS event for SB3023", () => {
            const errorCode = "SB3023";

            handlers.handleClaimedBonusFailed(errorCode);

            expect(mockPromotionStore.claimedBonusFailed).toBe(errorCode);
            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                errorCode
            );
        });

        it("should set claimed bonus failed and add SHOW_NOTICE_ERROR event for other error codes", () => {
            const errorCode = "OTHER_ERROR";

            handlers.handleClaimedBonusFailed(errorCode);

            expect(mockPromotionStore.claimedBonusFailed).toBe(errorCode);
            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR,
                errorCode
            );
        });
    });

    describe("resetRedeemSuccess", () => {
        it("should reset redeem result to idle", () => {
            mockPromotionStore.redeemResult = RedeemStatus.Success;

            handlers.resetRedeemSuccess();

            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });

    describe("eventHandleList", () => {
        it("should have correct event handle list structure", () => {
            expect(handlers.eventHandleList).toBeDefined();
            expect(Array.isArray(handlers.eventHandleList)).toBe(true);
        });

        it("should contain all required event handlers", () => {
            const eventNames = handlers.eventHandleList.map(event => event.name);
            
            expect(eventNames).toContain(GameServiceMessageSlot.Promotion.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.PromotionTOProgress.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.ClaimedAmount.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.RedeemResult.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.FinishPromotion.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.RedemptionNotice.eventName);
            expect(eventNames).toContain(GameServiceMessageSlot.ClaimedBonusFailed.eventName);
        });

        it("should have correct handler functions", () => {
            const eventHandlers = handlers.eventHandleList.map(event => event.handle);
            
            expect(eventHandlers).toContain(handlers.handlePromotion);
            expect(eventHandlers).toContain(handlers.handlePromotionTOProgress);
            expect(eventHandlers).toContain(handlers.handleClaimedAmount);
            expect(eventHandlers).toContain(handlers.handleRedeemResult);
            expect(eventHandlers).toContain(handlers.handleFinishPromotion);
            expect(eventHandlers).toContain(handlers.handleRedemptionNotice);
            expect(eventHandlers).toContain(handlers.handleClaimedBonusFailed);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete promotion flow", () => {
            // Step 1: Handle promotion
            const promotionData: GameServiceMessageSlot.Promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                remainingBonusItems: 10,
                isClaimed: false,
                isGiftCode: false,
                coinValue: 1,
                betLevel: 1,
            };
            handlers.handlePromotion(promotionData);
            expect(mockPromotionStore.promotion).toBe(promotionData);
            expect(mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalled();

            // Step 2: Handle TO progress
            const toProgressData: GameServiceMessageSlot.PromotionTOProgress = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 900,
                canClaim: false,
                expire: "2024-12-31",
            };
            handlers.handlePromotionTOProgress(toProgressData);
            expect(mockPromotionStore.promotionTOProgress).toBe(toProgressData);
            expect(mockFSBPromotionUIHandler.openTurnOverRequired).toHaveBeenCalledWith("in-game");

            // Step 3: Handle claimed amount
            handlers.handleClaimedAmount(500);
            expect(mockPromotionStore.claimedAmount).toBe(500);
            expect(mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalled();

            // Step 4: Handle finish promotion
            const finishPromotionData: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 1000,
                endPromotion: true,
            };
            handlers.handleFinishPromotion(finishPromotionData);
            expect(mockPromotionStore.finishPromotion).toBe(finishPromotionData);
            expect(mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalled();
        });

        it("should handle error scenarios", () => {
            // Handle redemption notice with error
            const redemptionNoticeData: GameServiceMessageSlot.RedemptionNotice = {
                errorCode: "ERROR",
            };
            handlers.handleRedemptionNotice(redemptionNoticeData);
            expect(mockPromotionStore.redemptionNotice).toBe(redemptionNoticeData);
            expect(mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalled();

            // Handle claimed bonus failed
            handlers.handleClaimedBonusFailed("SB3023");
            expect(mockPromotionStore.claimedBonusFailed).toBe("SB3023");
            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                "SB3023"
            );

            // Reset redeem success
            handlers.resetRedeemSuccess();
            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });
});
