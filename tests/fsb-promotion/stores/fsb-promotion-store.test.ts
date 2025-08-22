import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionStore, RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("mobx");
jest.mock("inversify");

// Test Data Factories (following Factory Pattern - SRP)
class PromotionTestDataFactory {
    static createBasicPromotion(overrides?: Partial<GameServiceMessageSlot.Promotion>): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "test-123",
            initialBonusItem: 10,
            isClaimed: false,
            isGiftCode: false,
            ...overrides
        };
    }

    static createClaimedPromotion(): GameServiceMessageSlot.Promotion {
        return this.createBasicPromotion({ isClaimed: true });
    }

    static createGiftCodePromotion(): GameServiceMessageSlot.Promotion {
        return this.createBasicPromotion({ isGiftCode: true });
    }
}

class FinishPromotionTestDataFactory {
    static createBasicFinishPromotion(overrides?: Partial<GameServiceMessageSlot.FinishPromotion>): GameServiceMessageSlot.FinishPromotion {
        return {
            endPromotion: true,
            totalWin: 500,
            ...overrides
        };
    }
}

class PromotionTOProgressTestDataFactory {
    static createBasicTOProgress(overrides?: Partial<GameServiceMessageSlot.PromotionTOProgress>): GameServiceMessageSlot.PromotionTOProgress {
        return {
            win: 100,
            totalTO: 1000,
            minTO: 100,
            remainTO: 500,
            progress: 0.5,
            canClaim: true,
            expire: "2024-12-31",
            ...overrides
        };
    }

    static createCompletedTOProgress(): GameServiceMessageSlot.PromotionTOProgress {
        return this.createBasicTOProgress({
            progress: 1.0,
            remainTO: 0,
            canClaim: true
        });
    }
}

class RedemptionNoticeTestDataFactory {
    static createSuccessNotice(): GameServiceMessageSlot.RedemptionNotice {
        return { errorCode: "SUCCESS" };
    }

    static createFailureNotice(errorCode?: string): GameServiceMessageSlot.RedemptionNotice {
        return { errorCode: errorCode || "FAILED" };
    }
}

// Test Helpers (following SRP - each helper has single responsibility)
class StoreTestHelper {
    static createFreshStore(): FSBPromotionStore {
        return new FSBPromotionStore();
    }

    static assertInitialState(store: FSBPromotionStore): void {
        expect(store.claimedAmount).toBe(0);
        expect(store.promotion).toBeUndefined();
        expect(store.finishPromotion).toBeUndefined();
        expect(store.promotionTOProgress).toBeUndefined();
        expect(store.redemptionNotice).toBeUndefined();
        expect(store.claimedBonusFailed).toBeUndefined();
        expect(store.isRedeemSuccess).toBe(false);
    }

    static setupCompletePromotion(store: FSBPromotionStore): void {
        store.promotion = PromotionTestDataFactory.createClaimedPromotion();
        store.finishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion();
        store.promotionTOProgress = PromotionTOProgressTestDataFactory.createCompletedTOProgress();
        store.redemptionNotice = RedemptionNoticeTestDataFactory.createSuccessNotice();
        store.claimedAmount = 1000;
        store.redeemResult = RedeemStatus.Success;
    }
}

// Property Test Helper (ISP - focused interface for property testing)
class PropertyTestHelper {
    static testPropertyGetterSetter<T>(
        store: FSBPromotionStore,
        propertyName: keyof FSBPromotionStore,
        testValue: T,
        expectedValue: T = testValue
    ): void {
        (store as any)[propertyName] = testValue;
        expect((store as any)[propertyName]).toEqual(expectedValue);
    }

    static testPropertyNullHandling(
        store: FSBPromotionStore,
        propertyName: keyof FSBPromotionStore
    ): void {
        (store as any)[propertyName] = null;
        expect((store as any)[propertyName]).toBeNull();
    }

    static testPropertyUndefinedHandling(
        store: FSBPromotionStore,
        propertyName: keyof FSBPromotionStore
    ): void {
        (store as any)[propertyName] = undefined;
        expect((store as any)[propertyName]).toBeUndefined();
    }
}

// Specialized helper for redeem status testing (SRP - single responsibility)
class RedeemStatusTestHelper {
    static testRedeemStatusScenario(
        store: FSBPromotionStore,
        status: RedeemStatus,
        expectedSuccess: boolean
    ): void {
        store.redeemResult = status;
        expect(store.isRedeemSuccess).toBe(expectedSuccess);
    }

    static testRedeemStatusTransition(
        store: FSBPromotionStore,
        fromStatus: RedeemStatus,
        toStatus: RedeemStatus,
        expectedFinalSuccess: boolean
    ): void {
        store.redeemResult = fromStatus;
        store.redeemResult = toStatus;
        expect(store.isRedeemSuccess).toBe(expectedFinalSuccess);
    }
}

// Integration Test Scenarios Helper (SRP - focused on complex scenarios)
class IntegrationTestHelper {
    static setupFailedRedemptionScenario(store: FSBPromotionStore): void {
        store.promotion = PromotionTestDataFactory.createClaimedPromotion();
        store.redeemResult = RedeemStatus.Failed;
        store.claimedBonusFailed = "Redemption failed due to insufficient funds";
    }

    static setupGiftCodeScenario(store: FSBPromotionStore): void {
        store.promotion = PromotionTestDataFactory.createGiftCodePromotion();
        store.redemptionNotice = RedemptionNoticeTestDataFactory.createSuccessNotice();
        store.promotionTOProgress = PromotionTOProgressTestDataFactory.createBasicTOProgress({
            progress: 0.1,
            canClaim: true,
        });
    }

    static setupComplexStateForReset(store: FSBPromotionStore): void {
        store.claimedAmount = 1000;
        store.promotion = PromotionTestDataFactory.createBasicPromotion({
            promotionId: "test-123",
            initialBonusItem: 20,
            isClaimed: true,
        });
        store.finishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion({
            totalWin: 2000,
        });
        store.promotionTOProgress = PromotionTOProgressTestDataFactory.createBasicTOProgress({
            win: 500,
            totalTO: 2000,
            minTO: 200,
            remainTO: 500,
            progress: 0.25,
        });
        store.redemptionNotice = RedemptionNoticeTestDataFactory.createSuccessNotice();
        store.claimedBonusFailed = "Some error";
        store.redeemResult = RedeemStatus.Success;
    }
}

describe("FSBPromotionStore", () => {
    let store: FSBPromotionStore;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Create store instance using helper
        store = StoreTestHelper.createFreshStore();
    });

    describe("constructor and initial state", () => {
        it("should initialize with default values", () => {
            StoreTestHelper.assertInitialState(store);
        });

        it("should have correct RedeemStatus enum values", () => {
            expect(RedeemStatus.Idle).toBe(0);
            expect(RedeemStatus.Success).toBe(1);
            expect(RedeemStatus.Failed).toBe(-1);
        });
    });

    describe("claimedAmount property", () => {
        const testCases = [
            { value: 100, description: "positive numbers" },
            { value: 0, description: "zero" },
            { value: -50, description: "negative numbers" },
            { value: 99.99, description: "decimal numbers" },
            { value: Number.MAX_SAFE_INTEGER, description: "maximum safe integer" },
            { value: Number.MIN_SAFE_INTEGER, description: "minimum safe integer" }
        ];

        testCases.forEach(({ value, description }) => {
            it(`should handle ${description}`, () => {
                PropertyTestHelper.testPropertyGetterSetter(store, 'claimedAmount', value);
            });
        });
    });

    describe("promotion property", () => {
        it("should get promotion correctly when undefined", () => {
            PropertyTestHelper.testPropertyUndefinedHandling(store, 'promotion');
        });

        it("should set promotion to valid basic data", () => {
            const basicPromotion = PromotionTestDataFactory.createBasicPromotion();
            PropertyTestHelper.testPropertyGetterSetter(store, 'promotion', basicPromotion);
        });

        it("should set promotion to claimed promotion", () => {
            const claimedPromotion = PromotionTestDataFactory.createClaimedPromotion();
            PropertyTestHelper.testPropertyGetterSetter(store, 'promotion', claimedPromotion);
        });

        it("should set promotion to gift code promotion", () => {
            const giftCodePromotion = PromotionTestDataFactory.createGiftCodePromotion();
            PropertyTestHelper.testPropertyGetterSetter(store, 'promotion', giftCodePromotion);
        });

        it("should set promotion to null", () => {
            PropertyTestHelper.testPropertyNullHandling(store, 'promotion');
        });

        it("should update promotion with new data", () => {
            // Arrange
            const initialPromotion = PromotionTestDataFactory.createBasicPromotion();
            const updatedPromotion = PromotionTestDataFactory.createBasicPromotion({
                promotionId: "test-456",
                initialBonusItem: 20,
                isClaimed: true,
                isGiftCode: true,
            });

            // Act & Assert
            store.promotion = initialPromotion;
            expect(store.promotion).toEqual(initialPromotion);

            store.promotion = updatedPromotion;
            expect(store.promotion).toEqual(updatedPromotion);
        });
    });

    describe("finishPromotion property", () => {
        it("should get finishPromotion correctly when undefined", () => {
            PropertyTestHelper.testPropertyUndefinedHandling(store, 'finishPromotion');
        });

        it("should set finishPromotion to valid data", () => {
            const finishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion();
            PropertyTestHelper.testPropertyGetterSetter(store, 'finishPromotion', finishPromotion);
        });

        it("should set finishPromotion to null", () => {
            PropertyTestHelper.testPropertyNullHandling(store, 'finishPromotion');
        });

        it("should update finishPromotion with new data", () => {
            // Arrange
            const initialFinishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion({
                endPromotion: false,
                totalWin: 100,
            });
            const updatedFinishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion({
                endPromotion: true,
                totalWin: 200,
            });

            // Act & Assert
            store.finishPromotion = initialFinishPromotion;
            expect(store.finishPromotion).toEqual(initialFinishPromotion);

            store.finishPromotion = updatedFinishPromotion;
            expect(store.finishPromotion).toEqual(updatedFinishPromotion);
        });
    });

    describe("promotionTOProgress property", () => {
        it("should get promotionTOProgress correctly when undefined", () => {
            PropertyTestHelper.testPropertyUndefinedHandling(store, 'promotionTOProgress');
        });

        it("should set promotionTOProgress to valid data", () => {
            const toProgress = PromotionTOProgressTestDataFactory.createBasicTOProgress();
            PropertyTestHelper.testPropertyGetterSetter(store, 'promotionTOProgress', toProgress);
        });

        it("should set promotionTOProgress to completed progress", () => {
            const completedProgress = PromotionTOProgressTestDataFactory.createCompletedTOProgress();
            PropertyTestHelper.testPropertyGetterSetter(store, 'promotionTOProgress', completedProgress);
        });

        it("should set promotionTOProgress to null", () => {
            PropertyTestHelper.testPropertyNullHandling(store, 'promotionTOProgress');
        });

        it("should update promotionTOProgress with new data", () => {
            // Arrange
            const initialTOProgress = PromotionTOProgressTestDataFactory.createBasicTOProgress({
                win: 50,
                totalTO: 500,
                minTO: 50,
                remainTO: 250,
                progress: 0.1,
                canClaim: false,
                expire: "2024-06-30",
            });
            const updatedTOProgress = PromotionTOProgressTestDataFactory.createBasicTOProgress({
                win: 100,
                totalTO: 1000,
                minTO: 100,
                remainTO: 500,
                progress: 0.2,
                canClaim: true,
                expire: "2024-12-31",
            });

            // Act & Assert
            store.promotionTOProgress = initialTOProgress;
            expect(store.promotionTOProgress).toEqual(initialTOProgress);

            store.promotionTOProgress = updatedTOProgress;
            expect(store.promotionTOProgress).toEqual(updatedTOProgress);
        });
    });

    describe("redemptionNotice property", () => {
        it("should get redemptionNotice correctly when undefined", () => {
            PropertyTestHelper.testPropertyUndefinedHandling(store, 'redemptionNotice');
        });

        it("should set redemptionNotice to success notice", () => {
            const successNotice = RedemptionNoticeTestDataFactory.createSuccessNotice();
            PropertyTestHelper.testPropertyGetterSetter(store, 'redemptionNotice', successNotice);
        });

        it("should set redemptionNotice to failure notice", () => {
            const failureNotice = RedemptionNoticeTestDataFactory.createFailureNotice("PAYMENT_ERROR");
            PropertyTestHelper.testPropertyGetterSetter(store, 'redemptionNotice', failureNotice);
        });

        it("should set redemptionNotice to null", () => {
            PropertyTestHelper.testPropertyNullHandling(store, 'redemptionNotice');
        });

        it("should update redemptionNotice with new data", () => {
            // Arrange
            const initialNotice = RedemptionNoticeTestDataFactory.createFailureNotice("Initial notice");
            const updatedNotice = RedemptionNoticeTestDataFactory.createFailureNotice("Updated notice");

            // Act & Assert
            store.redemptionNotice = initialNotice;
            expect(store.redemptionNotice).toEqual(initialNotice);

            store.redemptionNotice = updatedNotice;
            expect(store.redemptionNotice).toEqual(updatedNotice);
        });
    });

    describe("claimedBonusFailed property", () => {
        const testCases = [
            { value: "Bonus claim failed", description: "error message string" },
            { value: "", description: "empty string" },
            { value: "   ", description: "whitespace string" },
        ];

        testCases.forEach(({ value, description }) => {
            it(`should handle ${description}`, () => {
                PropertyTestHelper.testPropertyGetterSetter(store, 'claimedBonusFailed', value);
            });
        });

        it("should handle null values", () => {
            PropertyTestHelper.testPropertyNullHandling(store, 'claimedBonusFailed');
        });

        it("should handle undefined values", () => {
            PropertyTestHelper.testPropertyUndefinedHandling(store, 'claimedBonusFailed');
        });

        it("should update claimedBonusFailed with new message", () => {
            // Arrange
            const firstMessage = "First error message";
            const secondMessage = "Second error message";

            // Act & Assert
            store.claimedBonusFailed = firstMessage;
            expect(store.claimedBonusFailed).toBe(firstMessage);

            store.claimedBonusFailed = secondMessage;
            expect(store.claimedBonusFailed).toBe(secondMessage);
        });
    });

    describe("isRedeemSuccess getter", () => {
        const statusTestCases = [
            { status: RedeemStatus.Idle, expected: false, description: "Idle status" },
            { status: RedeemStatus.Success, expected: true, description: "Success status" },
            { status: RedeemStatus.Failed, expected: false, description: "Failed status" },
            { status: 999, expected: false, description: "custom values" },
        ];

        statusTestCases.forEach(({ status, expected, description }) => {
            it(`should return ${expected} for ${description}`, () => {
                RedeemStatusTestHelper.testRedeemStatusScenario(store, status, expected);
            });
        });

        it("should return false when redeem status is not set", () => {
            expect(store.isRedeemSuccess).toBe(false);
        });
    });

    describe("redeemResult setter", () => {
        const statusTestCases = [
            { status: RedeemStatus.Idle, expected: false, description: "Idle" },
            { status: RedeemStatus.Success, expected: true, description: "Success" },
            { status: RedeemStatus.Failed, expected: false, description: "Failed" },
            { status: 42, expected: false, description: "custom values" },
        ];

        statusTestCases.forEach(({ status, expected, description }) => {
            it(`should handle ${description} status`, () => {
                RedeemStatusTestHelper.testRedeemStatusScenario(store, status, expected);
            });
        });

        it("should handle multiple status transitions", () => {
            const transitions = [
                { from: RedeemStatus.Idle, to: RedeemStatus.Success, expected: true },
                { from: RedeemStatus.Success, to: RedeemStatus.Failed, expected: false },
                { from: RedeemStatus.Failed, to: RedeemStatus.Success, expected: true },
            ];

            transitions.forEach(({ from, to, expected }) => {
                RedeemStatusTestHelper.testRedeemStatusTransition(store, from, to, expected);
            });
        });
    });

    describe("isClaimed getter", () => {
        const isClaimedTestCases = [
            { setup: () => {}, expected: undefined, description: "promotion is undefined" },
            { setup: () => store.promotion = null, expected: undefined, description: "promotion is null" },
            { setup: () => store.promotion = PromotionTestDataFactory.createBasicPromotion(), expected: false, description: "promotion.isClaimed is false" },
            { setup: () => store.promotion = PromotionTestDataFactory.createClaimedPromotion(), expected: true, description: "promotion.isClaimed is true" },
            { 
                setup: () => store.promotion = { ...PromotionTestDataFactory.createBasicPromotion(), isClaimed: undefined } as any, 
                expected: undefined, 
                description: "promotion.isClaimed is undefined" 
            },
            { 
                setup: () => store.promotion = { ...PromotionTestDataFactory.createBasicPromotion(), isClaimed: null } as any, 
                expected: null, 
                description: "promotion.isClaimed is null" 
            },
        ];

        isClaimedTestCases.forEach(({ setup, expected, description }) => {
            it(`should return ${expected} when ${description}`, () => {
                // Arrange
                setup();
                
                // Act & Assert
                expect(store.isClaimed).toBe(expected);
            });
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle rapid property changes", () => {
            const iterations = 10;
            for (let i = 0; i < iterations; i++) {
                PropertyTestHelper.testPropertyGetterSetter(store, 'claimedAmount', i);
                RedeemStatusTestHelper.testRedeemStatusScenario(store, i % 3, i % 3 === 1);
            }
        });

        it("should handle same value assignments", () => {
            const testValue = 100;
            PropertyTestHelper.testPropertyGetterSetter(store, 'claimedAmount', testValue);
            PropertyTestHelper.testPropertyGetterSetter(store, 'claimedAmount', testValue);

            RedeemStatusTestHelper.testRedeemStatusScenario(store, RedeemStatus.Success, true);
            RedeemStatusTestHelper.testRedeemStatusScenario(store, RedeemStatus.Success, true);
        });

        it("should handle extreme numerical values", () => {
            const extremeValues = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
            
            extremeValues.forEach(value => {
                PropertyTestHelper.testPropertyGetterSetter(store, 'claimedAmount', value);
                RedeemStatusTestHelper.testRedeemStatusScenario(store, value, false);
            });
        });

        it("should handle null and undefined values consistently", () => {
            const nullableProperties: (keyof FSBPromotionStore)[] = [
                'promotion', 'finishPromotion', 'promotionTOProgress', 
                'redemptionNotice', 'claimedBonusFailed'
            ];

            nullableProperties.forEach(property => {
                PropertyTestHelper.testPropertyNullHandling(store, property);
                PropertyTestHelper.testPropertyUndefinedHandling(store, property);
            });

            // Test derived properties
            expect(store.isClaimed).toBeUndefined();
        });

        it("should handle empty and invalid data gracefully", () => {
            const emptyStringValues = ["", "   "];
            emptyStringValues.forEach(value => {
                PropertyTestHelper.testPropertyGetterSetter(store, 'claimedBonusFailed', value);
            });

            // Test with malformed promotion object
            store.promotion = {} as any;
            expect(store.isClaimed).toBeUndefined();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete promotion lifecycle", () => {
            // Arrange - Start with fresh state
            StoreTestHelper.assertInitialState(store);

            // Act - Set up basic promotion
            const basicPromotion = PromotionTestDataFactory.createBasicPromotion();
            store.promotion = basicPromotion;
            expect(store.isClaimed).toBe(false);

            // Act - Claim promotion
            store.promotion = PromotionTestDataFactory.createClaimedPromotion();
            expect(store.isClaimed).toBe(true);

            // Act - Set claimed amount and redeem
            store.claimedAmount = 500;
            store.redeemResult = RedeemStatus.Success;
            
            // Act - Complete promotion
            const finishPromotion = FinishPromotionTestDataFactory.createBasicFinishPromotion({
                totalWin: 1000,
            });
            store.finishPromotion = finishPromotion;

            // Assert - Verify final state
            expect(store.claimedAmount).toBe(500);
            expect(store.isRedeemSuccess).toBe(true);
            expect(store.finishPromotion).toEqual(finishPromotion);
        });

        it("should handle failed redemption with retry scenario", () => {
            // Arrange
            IntegrationTestHelper.setupFailedRedemptionScenario(store);

            // Assert initial failure state
            expect(store.isRedeemSuccess).toBe(false);
            expect(store.claimedBonusFailed).toBe("Redemption failed due to insufficient funds");

            // Act - Retry redemption successfully
            store.redeemResult = RedeemStatus.Success;
            
            // Assert successful retry
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should handle gift code promotion scenario", () => {
            // Arrange & Act
            IntegrationTestHelper.setupGiftCodeScenario(store);

            // Assert - Verify gift code specific properties
            expect(store.isClaimed).toBe(false);
            expect(store.promotion?.isGiftCode).toBe(true);
            expect(store.redemptionNotice?.errorCode).toBe("SUCCESS");
            expect(store.promotionTOProgress?.progress).toBe(0.1);
            expect(store.promotionTOProgress?.canClaim).toBe(true);
        });

        it("should handle comprehensive state management", () => {
            // Arrange & Act - Set up complex state
            IntegrationTestHelper.setupComplexStateForReset(store);

            // Assert - Verify all properties are correctly set
            const expectedState = {
                claimedAmount: 1000,
                isClaimed: true,
                isRedeemSuccess: true,
                claimedBonusFailed: "Some error"
            };

            Object.entries(expectedState).forEach(([property, expectedValue]) => {
                expect((store as any)[property]).toBe(expectedValue);
            });

            // Assert complex objects
            expect(store.finishPromotion?.totalWin).toBe(2000);
            expect(store.promotionTOProgress?.progress).toBe(0.25);
            expect(store.redemptionNotice?.errorCode).toBe("SUCCESS");
        });
    });
});
