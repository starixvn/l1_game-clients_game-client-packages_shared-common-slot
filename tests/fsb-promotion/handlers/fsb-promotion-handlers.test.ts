import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { stub } from "jest-auto-stub";
import { FSBPromotionHandlers } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers";
import { FSBPromotionUIHandler } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    Connection: { ConnectionStore: jest.fn() },
    Notification: { NotificationStore: jest.fn() },
    Shared: { IMultipleHandlers: jest.fn() },
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => {
    return {
        FSBPromotionUIHandler: {
            handlePromotionDisplay: jest.fn(),
            openTurnOverRequired: jest.fn(),
            onReceivedTOProgressData: jest.fn(),
            claimedBonusSuccess: jest.fn(),
            markFSBEndFromServer: jest.fn(),
            handleRedemptionNotice: jest.fn(),
        }
    }
});

jest.mock("inversify", () => ({
    injectable: jest.fn(() => (target: any) => target),
    inject: jest.fn(() => (target: any, propertyKey: string) => { }),
}));

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


jest.mock("../../../assets/game-message-slot", () => ({
    GameServiceMessageSlot: {
        Promotion: { eventName: "Promotion" },
        PromotionTOProgress: { eventName: "PromotionTOProgress" },
        ClaimedAmount: { eventName: "ClaimedAmount" },
        RedeemResult: { eventName: "RedeemResult" },
        FinishPromotion: { eventName: "FinishPromotion" },
        RedemptionNotice: { eventName: "RedemptionNotice" },
        ClaimedBonusFailed: { eventName: "ClaimedBonusFailed" },
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

        // Create simple mocks
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



        mockFSBPromotionUIStore = {
            toProgress: null,
            addPendingUIEvent: jest.fn(),
        };

        mockNotificationStore = {
            connection: {
                on: jest.fn(),
            },
        };

        mockFSBPromotionUIHandler = stub<FSBPromotionUIHandler>();

        // Create handlers and inject dependencies
        handlers = new FSBPromotionHandlers();
        (handlers as any).promotionStore = mockPromotionStore;
        (handlers as any).connectionStore = mockConnectionStore;
        (handlers as any).fsbPromotionUIHandler = mockFSBPromotionUIHandler;
        (handlers as any).fsbPromotionUIStore = mockFSBPromotionUIStore;
        (handlers as any).notificationStore = mockNotificationStore;
    });

    describe("initialization", () => {
        it("should initialize with proper dependencies", () => {
            expect(handlers).toBeInstanceOf(FSBPromotionHandlers);
        });
    });

    describe("handlePromotion", () => {
        it("should set promotion data in store", () => {
            const promotionData = {
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
        });

        it("should trigger promotion display handling", () => {
            const promotionData = {
                promotionId: "test-123",
                initialBonusItem: 10,
                remainingBonusItems: 10,
                isClaimed: false,
                isGiftCode: false,
                coinValue: 1,
                betLevel: 1,
            };

            handlers.handlePromotion(promotionData);

            expect(mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalledTimes(1);
        });

        it("should handle gift code promotion correctly", () => {
            const giftCodePromotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                remainingBonusItems: 10,
                isClaimed: false,
                isGiftCode: true,
                coinValue: 1,
                betLevel: 1,
            };

            handlers.handlePromotion(giftCodePromotion);

            expect(mockPromotionStore.promotion?.isGiftCode).toBe(true);
        });
    });

    describe("handlePromotionTOProgress", () => {
        it("should set TO progress data in both stores", () => {
            const toProgressData = {
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
        });

        it("should open turn over required UI", () => {
            const toProgressData = {
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

            expect(mockFSBPromotionUIHandler.openTurnOverRequired).toHaveBeenCalledWith("in-game");
        });

        it("should register notification listener", () => {
            const toProgressData = {
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

            expect(mockNotificationStore.connection.on).toHaveBeenCalledWith(
                "promotionProgress",
                expect.any(Function)
            );
        });

        it("should handle claimable progress correctly", () => {
            const claimableProgress = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 0,
                canClaim: true,
                expire: "2024-12-31",
            };

            handlers.handlePromotionTOProgress(claimableProgress);

            expect(mockPromotionStore.promotionTOProgress?.canClaim).toBe(true);
        });
    });

    describe("handleNotificationReceived", () => {
        it("should delegate to UI handler", () => {
            const progressData = {
                promotionId: "test-123",
                win: 100,
                totalTO: 1000,
                minTO: 100,
                progress: 0.1,
                remainTO: 900,
                canClaim: false,
                expire: "2024-12-31",
            };

            handlers.handleNotificationReceived(progressData);

            expect(mockFSBPromotionUIHandler.onReceivedTOProgressData).toHaveBeenCalledWith(progressData);
        });
    });

    describe("handleClaimedAmount", () => {
        it("should set claimed amount in store", () => {
            const claimedAmount = 500;

            handlers.handleClaimedAmount(claimedAmount);

            expect(mockPromotionStore.claimedAmount).toBe(claimedAmount);
        });

        it("should trigger claimed bonus success UI", () => {
            const claimedAmount = 500;

            handlers.handleClaimedAmount(claimedAmount);

            expect(mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalledTimes(1);
        });

        it("should handle zero claimed amount", () => {
            handlers.handleClaimedAmount(0);

            expect(mockPromotionStore.claimedAmount).toBe(0);
        });
    });

    describe("handleRedeemResult", () => {
        it("should set successful redeem result", () => {
            handlers.handleRedeemResult(RedeemStatus.Success);

            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Success);
        });

        it("should set failed redeem result", () => {
            handlers.handleRedeemResult(RedeemStatus.Failed);

            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Failed);
        });
    });

    describe("resetRedeemSuccess", () => {
        it("should reset redeem result to idle", () => {
            mockPromotionStore.redeemResult = RedeemStatus.Success;

            handlers.resetRedeemSuccess();

            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });

    describe("handleFinishPromotion", () => {
        it("should set finish promotion data in store", () => {
            const finishPromotionData = {
                totalWin: 1000,
                endPromotion: true,
            };

            handlers.handleFinishPromotion(finishPromotionData);

            expect(mockPromotionStore.finishPromotion).toBe(finishPromotionData);
        });

        it("should mark FSB end from server", () => {
            const finishPromotionData = {
                totalWin: 1000,
                endPromotion: true,
            };

            handlers.handleFinishPromotion(finishPromotionData);

            expect(mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalledTimes(1);
        });

        it("should handle promotion end with zero total win", () => {
            const finishPromotionData = {
                totalWin: 0,
                endPromotion: true,
            };

            handlers.handleFinishPromotion(finishPromotionData);

            expect(mockPromotionStore.finishPromotion?.totalWin).toBe(0);
        });
    });

    describe("handleRedemptionNotice", () => {
        it("should set redemption notice data in store", () => {
            const redemptionNoticeData = {
                errorCode: "SUCCESS",
            };

            handlers.handleRedemptionNotice(redemptionNoticeData);

            expect(mockPromotionStore.redemptionNotice).toBe(redemptionNoticeData);
        });

        it("should delegate to UI handler", () => {
            const redemptionNoticeData = {
                errorCode: "SUCCESS",
            };

            handlers.handleRedemptionNotice(redemptionNoticeData);

            expect(mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalledTimes(1);
        });

        it("should handle error redemption notice", () => {
            const errorNotice = {
                errorCode: "ERROR",
            };

            handlers.handleRedemptionNotice(errorNotice);

            expect(mockPromotionStore.redemptionNotice?.errorCode).toBe("ERROR");
        });
    });

    describe("handleClaimedBonusFailed", () => {
        it("should set claimed bonus failed in store", () => {
            const errorCode = "SB3023";

            handlers.handleClaimedBonusFailed(errorCode);

            expect(mockPromotionStore.claimedBonusFailed).toBe(errorCode);
        });

        it("should add EXPIRE_CLAIM_BONUS event for SB3023 error", () => {
            const errorCode = "SB3023";

            handlers.handleClaimedBonusFailed(errorCode);

            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                errorCode
            );
        });

        it("should add SHOW_NOTICE_ERROR event for other errors", () => {
            const errorCode = "OTHER_ERROR";

            handlers.handleClaimedBonusFailed(errorCode);

            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR,
                errorCode
            );
        });

        it("should handle multiple different error codes correctly", () => {
            const testCases = [
                { code: "SB3023", expectedEvent: FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS },
                { code: "SB4001", expectedEvent: FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR },
                { code: "NETWORK_ERROR", expectedEvent: FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR },
            ];

            testCases.forEach(({ code, expectedEvent }) => {
                jest.clearAllMocks();
                handlers.handleClaimedBonusFailed(code);
                expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(expectedEvent, code);
            });
        });
    });

    describe("eventHandleList", () => {
        it("should be defined as an array", () => {
            expect(handlers.eventHandleList).toBeDefined();
            expect(Array.isArray(handlers.eventHandleList)).toBe(true);
        });

        it("should contain all required event names", () => {
            const eventNames = handlers.eventHandleList.map(event => event.name);

            const requiredEvents = [
                GameServiceMessageSlot.Promotion.eventName,
                GameServiceMessageSlot.PromotionTOProgress.eventName,
                GameServiceMessageSlot.ClaimedAmount.eventName,
                GameServiceMessageSlot.RedeemResult.eventName,
                GameServiceMessageSlot.FinishPromotion.eventName,
                GameServiceMessageSlot.RedemptionNotice.eventName,
                GameServiceMessageSlot.ClaimedBonusFailed.eventName,
            ];

            requiredEvents.forEach(eventName => {
                expect(eventNames).toContain(eventName);
            });
        });

        it("should map events to correct handler functions", () => {
            const eventMap = handlers.eventHandleList.reduce((acc, event) => {
                acc[event.name] = event.handle;
                return acc;
            }, {} as Record<string, Function>);

            expect(eventMap[GameServiceMessageSlot.Promotion.eventName]).toBe(handlers.handlePromotion);
            expect(eventMap[GameServiceMessageSlot.PromotionTOProgress.eventName]).toBe(handlers.handlePromotionTOProgress);
            expect(eventMap[GameServiceMessageSlot.ClaimedAmount.eventName]).toBe(handlers.handleClaimedAmount);
            expect(eventMap[GameServiceMessageSlot.RedeemResult.eventName]).toBe(handlers.handleRedeemResult);
            expect(eventMap[GameServiceMessageSlot.FinishPromotion.eventName]).toBe(handlers.handleFinishPromotion);
            expect(eventMap[GameServiceMessageSlot.RedemptionNotice.eventName]).toBe(handlers.handleRedemptionNotice);
            expect(eventMap[GameServiceMessageSlot.ClaimedBonusFailed.eventName]).toBe(handlers.handleClaimedBonusFailed);
        });
    });

    describe("integration scenarios", () => {
        it("should handle successful promotion lifecycle", () => {
            // Step 1: Handle promotion initialization
            const promotionData = {
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
            expect(mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalledTimes(1);

            // Step 2: Handle turnover progress
            const toProgressData = {
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

            // Step 3: Handle successful claim
            handlers.handleClaimedAmount(500);

            expect(mockPromotionStore.claimedAmount).toBe(500);
            expect(mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalledTimes(1);

            // Step 4: Handle promotion completion
            const finishPromotionData = {
                totalWin: 1000,
                endPromotion: true,
            };
            handlers.handleFinishPromotion(finishPromotionData);

            expect(mockPromotionStore.finishPromotion).toBe(finishPromotionData);
            expect(mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalledTimes(1);
        });

        it("should handle promotion with errors and recovery", () => {
            // Handle redemption notice with error
            const errorNotice = {
                errorCode: "ERROR",
            };
            handlers.handleRedemptionNotice(errorNotice);

            expect(mockPromotionStore.redemptionNotice).toBe(errorNotice);
            expect(mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalledTimes(1);

            // Handle claimed bonus failure
            handlers.handleClaimedBonusFailed("SB3023");

            expect(mockPromotionStore.claimedBonusFailed).toBe("SB3023");
            expect(mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                "SB3023"
            );

            // Reset and recover
            handlers.resetRedeemSuccess();
            expect(mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });
});
