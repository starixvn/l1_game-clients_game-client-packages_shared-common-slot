import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionHandlers } from "../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers";
import { RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// SOLID: Interface Segregation Principle - Define focused interfaces
interface IPromotionStore {
    promotion: GameServiceMessageSlot.Promotion | null;
    promotionTOProgress: GameServiceMessageSlot.PromotionTOProgress | null;
    claimedAmount: number;
    redeemResult: RedeemStatus;
    finishPromotion: GameServiceMessageSlot.FinishPromotion | null;
    redemptionNotice: GameServiceMessageSlot.RedemptionNotice | null;
    claimedBonusFailed: string | null;
}

interface IConnectionStore {
    send: jest.Mock;
}

interface IPromotionUIHandler {
    handlePromotionDisplay: jest.Mock;
    openTurnOverRequired: jest.Mock;
    onReceivedTOProgressData: jest.Mock;
    claimedBonusSuccess: jest.Mock;
    markFSBEndFromServer: jest.Mock;
    handleRedemptionNotice: jest.Mock;
}

interface IPromotionUIStore {
    toProgress: GameServiceMessageSlot.PromotionTOProgress | null;
    addPendingUIEvent: jest.Mock;
}

interface INotificationStore {
    connection: {
        on: jest.Mock;
    };
}

// SOLID: Dependency Inversion - Abstract test data factory
class TestDataFactory {
    static createPromotionData(overrides?: Partial<GameServiceMessageSlot.Promotion>): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "test-123",
            initialBonusItem: 10,
            remainingBonusItems: 10,
            isClaimed: false,
            isGiftCode: false,
            coinValue: 1,
            betLevel: 1,
            ...overrides,
        };
    }

    static createTOProgressData(overrides?: Partial<GameServiceMessageSlot.PromotionTOProgress>): GameServiceMessageSlot.PromotionTOProgress {
        return {
            promotionId: "test-123",
            win: 100,
            totalTO: 1000,
            minTO: 100,
            progress: 0.1,
            remainTO: 900,
            canClaim: false,
            expire: "2024-12-31",
            ...overrides,
        };
    }

    static createFinishPromotionData(overrides?: Partial<GameServiceMessageSlot.FinishPromotion>): GameServiceMessageSlot.FinishPromotion {
        return {
            totalWin: 1000,
            endPromotion: true,
            ...overrides,
        };
    }

    static createRedemptionNoticeData(overrides?: Partial<GameServiceMessageSlot.RedemptionNotice>): GameServiceMessageSlot.RedemptionNotice {
        return {
            errorCode: "SUCCESS",
            ...overrides,
        };
    }
}

// SOLID: Dependency Inversion - Abstract mock factory
class MockFactory {
    static createPromotionStore(): IPromotionStore {
        return {
            promotion: null,
            promotionTOProgress: null,
            claimedAmount: 0,
            redeemResult: RedeemStatus.Idle,
            finishPromotion: null,
            redemptionNotice: null,
            claimedBonusFailed: null,
        };
    }

    static createConnectionStore(): IConnectionStore {
        return {
            send: jest.fn(),
        };
    }

    static createPromotionUIHandler(): IPromotionUIHandler {
        return {
            handlePromotionDisplay: jest.fn(),
            openTurnOverRequired: jest.fn(),
            onReceivedTOProgressData: jest.fn(),
            claimedBonusSuccess: jest.fn(),
            markFSBEndFromServer: jest.fn(),
            handleRedemptionNotice: jest.fn(),
        };
    }

    static createPromotionUIStore(): IPromotionUIStore {
        return {
            toProgress: null,
            addPendingUIEvent: jest.fn(),
        };
    }

    static createNotificationStore(): INotificationStore {
        return {
            connection: {
                on: jest.fn(),
            },
        };
    }
}

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

// SOLID: Dependency Inversion - Test context setup
class TestContext {
    public handlers: FSBPromotionHandlers;
    public mockPromotionStore: IPromotionStore;
    public mockConnectionStore: IConnectionStore;
    public mockFSBPromotionUIHandler: IPromotionUIHandler;
    public mockFSBPromotionUIStore: IPromotionUIStore;
    public mockNotificationStore: INotificationStore;

    constructor() {
        this.setupMocks();
        this.setupHandlers();
    }

    private setupMocks(): void {
        this.mockPromotionStore = MockFactory.createPromotionStore();
        this.mockConnectionStore = MockFactory.createConnectionStore();
        this.mockFSBPromotionUIHandler = MockFactory.createPromotionUIHandler();
        this.mockFSBPromotionUIStore = MockFactory.createPromotionUIStore();
        this.mockNotificationStore = MockFactory.createNotificationStore();
    }

    private setupHandlers(): void {
        this.handlers = new FSBPromotionHandlers();
        
        // Inject dependencies
        (this.handlers as any).promotionStore = this.mockPromotionStore;
        (this.handlers as any).connectionStore = this.mockConnectionStore;
        (this.handlers as any).fsbPromotionUIHandler = this.mockFSBPromotionUIHandler;
        (this.handlers as any).fsbPromotionUIStore = this.mockFSBPromotionUIStore;
        (this.handlers as any).notificationStore = this.mockNotificationStore;
    }

    public reset(): void {
        jest.clearAllMocks();
        this.setupMocks();
        this.setupHandlers();
    }
}

// SOLID: Single Responsibility Principle - Promotion Data Handler Tests
describe("FSBPromotionHandlers - Promotion Data Handling", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("initialization", () => {
        it("should initialize with proper dependencies", () => {
            expect(testContext.handlers).toBeInstanceOf(FSBPromotionHandlers);
        });
    });

    describe("handlePromotion", () => {
        it("should set promotion data in store", () => {
            const promotionData = TestDataFactory.createPromotionData();

            testContext.handlers.handlePromotion(promotionData);

            expect(testContext.mockPromotionStore.promotion).toBe(promotionData);
        });

        it("should trigger promotion display handling", () => {
            const promotionData = TestDataFactory.createPromotionData();

            testContext.handlers.handlePromotion(promotionData);

            expect(testContext.mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalledTimes(1);
        });

        it("should handle gift code promotion correctly", () => {
            const giftCodePromotion = TestDataFactory.createPromotionData({ isGiftCode: true });

            testContext.handlers.handlePromotion(giftCodePromotion);

            expect(testContext.mockPromotionStore.promotion?.isGiftCode).toBe(true);
        });
    });
});

// SOLID: Single Responsibility Principle - Turn Over Progress Handler Tests
describe("FSBPromotionHandlers - Turn Over Progress Handling", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("handlePromotionTOProgress", () => {
        it("should set TO progress data in both stores", () => {
            const toProgressData = TestDataFactory.createTOProgressData();

            testContext.handlers.handlePromotionTOProgress(toProgressData);

            expect(testContext.mockPromotionStore.promotionTOProgress).toBe(toProgressData);
            expect(testContext.mockFSBPromotionUIStore.toProgress).toBe(toProgressData);
        });

        it("should open turn over required UI", () => {
            const toProgressData = TestDataFactory.createTOProgressData();

            testContext.handlers.handlePromotionTOProgress(toProgressData);

            expect(testContext.mockFSBPromotionUIHandler.openTurnOverRequired).toHaveBeenCalledWith("in-game");
        });

        it("should register notification listener", () => {
            const toProgressData = TestDataFactory.createTOProgressData();

            testContext.handlers.handlePromotionTOProgress(toProgressData);

            expect(testContext.mockNotificationStore.connection.on).toHaveBeenCalledWith(
                "promotionProgress",
                expect.any(Function)
            );
        });

        it("should handle claimable progress correctly", () => {
            const claimableProgress = TestDataFactory.createTOProgressData({ canClaim: true, remainTO: 0 });

            testContext.handlers.handlePromotionTOProgress(claimableProgress);

            expect(testContext.mockPromotionStore.promotionTOProgress?.canClaim).toBe(true);
        });
    });

    describe("handleNotificationReceived", () => {
        it("should delegate to UI handler", () => {
            const progressData = TestDataFactory.createTOProgressData();

            testContext.handlers.handleNotificationReceived(progressData);

            expect(testContext.mockFSBPromotionUIHandler.onReceivedTOProgressData).toHaveBeenCalledWith(progressData);
        });
    });
});

// SOLID: Single Responsibility Principle - Claims and Redemption Handler Tests
describe("FSBPromotionHandlers - Claims and Redemption Handling", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("handleClaimedAmount", () => {
        it("should set claimed amount in store", () => {
            const claimedAmount = 500;

            testContext.handlers.handleClaimedAmount(claimedAmount);

            expect(testContext.mockPromotionStore.claimedAmount).toBe(claimedAmount);
        });

        it("should trigger claimed bonus success UI", () => {
            const claimedAmount = 500;

            testContext.handlers.handleClaimedAmount(claimedAmount);

            expect(testContext.mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalledTimes(1);
        });

        it("should handle zero claimed amount", () => {
            testContext.handlers.handleClaimedAmount(0);

            expect(testContext.mockPromotionStore.claimedAmount).toBe(0);
        });
    });

    describe("handleRedeemResult", () => {
        it("should set successful redeem result", () => {
            testContext.handlers.handleRedeemResult(RedeemStatus.Success);

            expect(testContext.mockPromotionStore.redeemResult).toBe(RedeemStatus.Success);
        });

        it("should set failed redeem result", () => {
            testContext.handlers.handleRedeemResult(RedeemStatus.Failed);

            expect(testContext.mockPromotionStore.redeemResult).toBe(RedeemStatus.Failed);
        });
    });

    describe("resetRedeemSuccess", () => {
        it("should reset redeem result to idle", () => {
            testContext.mockPromotionStore.redeemResult = RedeemStatus.Success;

            testContext.handlers.resetRedeemSuccess();

            expect(testContext.mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });
});

// SOLID: Single Responsibility Principle - Promotion Lifecycle Handler Tests
describe("FSBPromotionHandlers - Promotion Lifecycle Handling", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("handleFinishPromotion", () => {
        it("should set finish promotion data in store", () => {
            const finishPromotionData = TestDataFactory.createFinishPromotionData();

            testContext.handlers.handleFinishPromotion(finishPromotionData);

            expect(testContext.mockPromotionStore.finishPromotion).toBe(finishPromotionData);
        });

        it("should mark FSB end from server", () => {
            const finishPromotionData = TestDataFactory.createFinishPromotionData();

            testContext.handlers.handleFinishPromotion(finishPromotionData);

            expect(testContext.mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalledTimes(1);
        });

        it("should handle promotion end with zero total win", () => {
            const finishPromotionData = TestDataFactory.createFinishPromotionData({ totalWin: 0 });

            testContext.handlers.handleFinishPromotion(finishPromotionData);

            expect(testContext.mockPromotionStore.finishPromotion?.totalWin).toBe(0);
        });
    });
});

// SOLID: Single Responsibility Principle - Error Handling Tests
describe("FSBPromotionHandlers - Error Handling", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("handleRedemptionNotice", () => {
        it("should set redemption notice data in store", () => {
            const redemptionNoticeData = TestDataFactory.createRedemptionNoticeData();

            testContext.handlers.handleRedemptionNotice(redemptionNoticeData);

            expect(testContext.mockPromotionStore.redemptionNotice).toBe(redemptionNoticeData);
        });

        it("should delegate to UI handler", () => {
            const redemptionNoticeData = TestDataFactory.createRedemptionNoticeData();

            testContext.handlers.handleRedemptionNotice(redemptionNoticeData);

            expect(testContext.mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalledTimes(1);
        });

        it("should handle error redemption notice", () => {
            const errorNotice = TestDataFactory.createRedemptionNoticeData({ errorCode: "ERROR" });

            testContext.handlers.handleRedemptionNotice(errorNotice);

            expect(testContext.mockPromotionStore.redemptionNotice?.errorCode).toBe("ERROR");
        });
    });

    describe("handleClaimedBonusFailed", () => {
        it("should set claimed bonus failed in store", () => {
            const errorCode = "SB3023";

            testContext.handlers.handleClaimedBonusFailed(errorCode);

            expect(testContext.mockPromotionStore.claimedBonusFailed).toBe(errorCode);
        });

        it("should add EXPIRE_CLAIM_BONUS event for SB3023 error", () => {
            const errorCode = "SB3023";

            testContext.handlers.handleClaimedBonusFailed(errorCode);

            expect(testContext.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                errorCode
            );
        });

        it("should add SHOW_NOTICE_ERROR event for other errors", () => {
            const errorCode = "OTHER_ERROR";

            testContext.handlers.handleClaimedBonusFailed(errorCode);

            expect(testContext.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
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
                testContext.reset();
                testContext.handlers.handleClaimedBonusFailed(code);
                expect(testContext.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(expectedEvent, code);
            });
        });
    });

});

// SOLID: Single Responsibility Principle - Event Configuration Tests
describe("FSBPromotionHandlers - Event Configuration", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("eventHandleList", () => {
        it("should be defined as an array", () => {
            expect(testContext.handlers.eventHandleList).toBeDefined();
            expect(Array.isArray(testContext.handlers.eventHandleList)).toBe(true);
        });

        it("should contain all required event names", () => {
            const eventNames = testContext.handlers.eventHandleList.map(event => event.name);
            
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
            const eventMap = testContext.handlers.eventHandleList.reduce((acc, event) => {
                acc[event.name] = event.handle;
                return acc;
            }, {} as Record<string, Function>);
            
            expect(eventMap[GameServiceMessageSlot.Promotion.eventName]).toBe(testContext.handlers.handlePromotion);
            expect(eventMap[GameServiceMessageSlot.PromotionTOProgress.eventName]).toBe(testContext.handlers.handlePromotionTOProgress);
            expect(eventMap[GameServiceMessageSlot.ClaimedAmount.eventName]).toBe(testContext.handlers.handleClaimedAmount);
            expect(eventMap[GameServiceMessageSlot.RedeemResult.eventName]).toBe(testContext.handlers.handleRedeemResult);
            expect(eventMap[GameServiceMessageSlot.FinishPromotion.eventName]).toBe(testContext.handlers.handleFinishPromotion);
            expect(eventMap[GameServiceMessageSlot.RedemptionNotice.eventName]).toBe(testContext.handlers.handleRedemptionNotice);
            expect(eventMap[GameServiceMessageSlot.ClaimedBonusFailed.eventName]).toBe(testContext.handlers.handleClaimedBonusFailed);
        });
    });
});

// SOLID: Single Responsibility Principle - Integration Scenarios
describe("FSBPromotionHandlers - Integration Scenarios", () => {
    let testContext: TestContext;

    beforeEach(() => {
        testContext = new TestContext();
    });

    describe("complete promotion flow", () => {
        it("should handle successful promotion lifecycle", () => {
            // Step 1: Handle promotion initialization
            const promotionData = TestDataFactory.createPromotionData();
            testContext.handlers.handlePromotion(promotionData);
            
            expect(testContext.mockPromotionStore.promotion).toBe(promotionData);
            expect(testContext.mockFSBPromotionUIHandler.handlePromotionDisplay).toHaveBeenCalledTimes(1);

            // Step 2: Handle turnover progress
            const toProgressData = TestDataFactory.createTOProgressData({ promotionId: promotionData.promotionId });
            testContext.handlers.handlePromotionTOProgress(toProgressData);
            
            expect(testContext.mockPromotionStore.promotionTOProgress).toBe(toProgressData);
            expect(testContext.mockFSBPromotionUIHandler.openTurnOverRequired).toHaveBeenCalledWith("in-game");

            // Step 3: Handle successful claim
            testContext.handlers.handleClaimedAmount(500);
            
            expect(testContext.mockPromotionStore.claimedAmount).toBe(500);
            expect(testContext.mockFSBPromotionUIHandler.claimedBonusSuccess).toHaveBeenCalledTimes(1);

            // Step 4: Handle promotion completion
            const finishPromotionData = TestDataFactory.createFinishPromotionData();
            testContext.handlers.handleFinishPromotion(finishPromotionData);
            
            expect(testContext.mockPromotionStore.finishPromotion).toBe(finishPromotionData);
            expect(testContext.mockFSBPromotionUIHandler.markFSBEndFromServer).toHaveBeenCalledTimes(1);
        });
    });

    describe("error scenarios", () => {
        it("should handle promotion with errors and recovery", () => {
            // Handle redemption notice with error
            const errorNotice = TestDataFactory.createRedemptionNoticeData({ errorCode: "ERROR" });
            testContext.handlers.handleRedemptionNotice(errorNotice);
            
            expect(testContext.mockPromotionStore.redemptionNotice).toBe(errorNotice);
            expect(testContext.mockFSBPromotionUIHandler.handleRedemptionNotice).toHaveBeenCalledTimes(1);

            // Handle claimed bonus failure
            testContext.handlers.handleClaimedBonusFailed("SB3023");
            
            expect(testContext.mockPromotionStore.claimedBonusFailed).toBe("SB3023");
            expect(testContext.mockFSBPromotionUIStore.addPendingUIEvent).toHaveBeenCalledWith(
                FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS,
                "SB3023"
            );

            // Reset and recover
            testContext.handlers.resetRedeemSuccess();
            expect(testContext.mockPromotionStore.redeemResult).toBe(RedeemStatus.Idle);
        });
    });
});
