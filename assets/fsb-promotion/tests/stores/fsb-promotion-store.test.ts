import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionStore, RedeemStatus } from "../../scripts/stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../game-message-slot";

// Mock dependencies
jest.mock("mobx");
jest.mock("inversify");

describe("FSBPromotionStore", () => {
    let store: FSBPromotionStore;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create store instance
        store = new FSBPromotionStore();
    });

    describe("constructor and initial state", () => {
        it("should initialize with default values", () => {
            expect(store.claimedAmount).toBe(0);
            expect(store.promotion).toBeUndefined();
            expect(store.finishPromotion).toBeUndefined();
            expect(store.promotionTOProgress).toBeUndefined();
            expect(store.redemptionNotice).toBeUndefined();
            expect(store.claimedBonusFailed).toBeUndefined();
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should have correct RedeemStatus enum values", () => {
            expect(RedeemStatus.Idle).toBe(0);
            expect(RedeemStatus.Success).toBe(1);
            expect(RedeemStatus.Failed).toBe(-1);
        });
    });

    describe("claimedAmount property", () => {
        it("should get claimedAmount correctly", () => {
            expect(store.claimedAmount).toBe(0);
        });

        it("should set claimedAmount to positive numbers", () => {
            store.claimedAmount = 100;
            expect(store.claimedAmount).toBe(100);
        });

        it("should set claimedAmount to zero", () => {
            store.claimedAmount = 0;
            expect(store.claimedAmount).toBe(0);
        });

        it("should set claimedAmount to negative numbers", () => {
            store.claimedAmount = -50;
            expect(store.claimedAmount).toBe(-50);
        });

        it("should set claimedAmount to decimal numbers", () => {
            store.claimedAmount = 99.99;
            expect(store.claimedAmount).toBe(99.99);
        });
    });

    describe("promotion property", () => {
        it("should get promotion correctly when undefined", () => {
            expect(store.promotion).toBeUndefined();
        });

        it("should set promotion to valid data", () => {
            const mockPromotion: GameServiceMessageSlot.Promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: false,
                isGiftCode: false,
            };
            store.promotion = mockPromotion;
            expect(store.promotion).toEqual(mockPromotion);
        });

        it("should set promotion to null", () => {
            store.promotion = null;
            expect(store.promotion).toBeNull();
        });

        it("should update promotion with new data", () => {
            const initialPromotion: GameServiceMessageSlot.Promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: false,
                isGiftCode: false,
            };
            store.promotion = initialPromotion;

            const updatedPromotion: GameServiceMessageSlot.Promotion = {
                promotionId: "test-456",
                initialBonusItem: 20,
                isClaimed: true,
                isGiftCode: true,
            };
            store.promotion = updatedPromotion;
            expect(store.promotion).toEqual(updatedPromotion);
        });
    });

    describe("finishPromotion property", () => {
        it("should get finishPromotion correctly when undefined", () => {
            expect(store.finishPromotion).toBeUndefined();
        });

        it("should set finishPromotion to valid data", () => {
            const mockFinishPromotion: GameServiceMessageSlot.FinishPromotion = {
                endPromotion: true,
                totalWin: 500,
            };
            store.finishPromotion = mockFinishPromotion;
            expect(store.finishPromotion).toEqual(mockFinishPromotion);
        });

        it("should set finishPromotion to null", () => {
            store.finishPromotion = null;
            expect(store.finishPromotion).toBeNull();
        });

        it("should update finishPromotion with new data", () => {
            const initialFinishPromotion: GameServiceMessageSlot.FinishPromotion = {
                endPromotion: false,
                totalWin: 100,
            };
            store.finishPromotion = initialFinishPromotion;

            const updatedFinishPromotion: GameServiceMessageSlot.FinishPromotion = {
                endPromotion: true,
                totalWin: 200,
            };
            store.finishPromotion = updatedFinishPromotion;
            expect(store.finishPromotion).toEqual(updatedFinishPromotion);
        });
    });

    describe("promotionTOProgress property", () => {
        it("should get promotionTOProgress correctly when undefined", () => {
            expect(store.promotionTOProgress).toBeUndefined();
        });

        it("should set promotionTOProgress to valid data", () => {
            const mockTOProgress: GameServiceMessageSlot.PromotionTOProgress = {
                win: 100,
                totalTO: 1000,
                minTO: 100,
                remainTO: 500,
                progress: 0.5,
                canClaim: true,
                expire: "2024-12-31",
            };
            store.promotionTOProgress = mockTOProgress;
            expect(store.promotionTOProgress).toEqual(mockTOProgress);
        });

        it("should set promotionTOProgress to null", () => {
            store.promotionTOProgress = null;
            expect(store.promotionTOProgress).toBeNull();
        });

        it("should update promotionTOProgress with new data", () => {
            const initialTOProgress: GameServiceMessageSlot.PromotionTOProgress = {
                win: 50,
                totalTO: 500,
                minTO: 50,
                remainTO: 250,
                progress: 0.1,
                canClaim: false,
                expire: "2024-06-30",
            };
            store.promotionTOProgress = initialTOProgress;

            const updatedTOProgress: GameServiceMessageSlot.PromotionTOProgress = {
                win: 100,
                totalTO: 1000,
                minTO: 100,
                remainTO: 500,
                progress: 0.2,
                canClaim: true,
                expire: "2024-12-31",
            };
            store.promotionTOProgress = updatedTOProgress;
            expect(store.promotionTOProgress).toEqual(updatedTOProgress);
        });
    });

    describe("redemptionNotice property", () => {
        it("should get redemptionNotice correctly when undefined", () => {
            expect(store.redemptionNotice).toBeUndefined();
        });

        it("should set redemptionNotice to valid data", () => {
            const mockRedemptionNotice: GameServiceMessageSlot.RedemptionNotice = {
                errorCode: "SUCCESS",
            };
            store.redemptionNotice = mockRedemptionNotice;
            expect(store.redemptionNotice).toEqual(mockRedemptionNotice);
        });

        it("should set redemptionNotice to null", () => {
            store.redemptionNotice = null;
            expect(store.redemptionNotice).toBeNull();
        });

        it("should update redemptionNotice with new data", () => {
            const initialNotice: GameServiceMessageSlot.RedemptionNotice = {
                errorCode: "Initial notice",
            };
            store.redemptionNotice = initialNotice;

            const updatedNotice: GameServiceMessageSlot.RedemptionNotice = {
                errorCode: "Updated notice",
            };
            store.redemptionNotice = updatedNotice;
            expect(store.redemptionNotice).toEqual(updatedNotice);
        });
    });

    describe("claimedBonusFailed property", () => {
        it("should get claimedBonusFailed correctly when undefined", () => {
            expect(store.claimedBonusFailed).toBeUndefined();
        });

        it("should set claimedBonusFailed to string", () => {
            store.claimedBonusFailed = "Bonus claim failed";
            expect(store.claimedBonusFailed).toBe("Bonus claim failed");
        });

        it("should set claimedBonusFailed to null", () => {
            store.claimedBonusFailed = null;
            expect(store.claimedBonusFailed).toBeNull();
        });

        it("should set claimedBonusFailed to empty string", () => {
            store.claimedBonusFailed = "";
            expect(store.claimedBonusFailed).toBe("");
        });

        it("should update claimedBonusFailed with new message", () => {
            store.claimedBonusFailed = "First error message";
            store.claimedBonusFailed = "Second error message";
            expect(store.claimedBonusFailed).toBe("Second error message");
        });
    });

    describe("isRedeemSuccess getter", () => {
        it("should return false when redeem status is Idle", () => {
            store.redeemResult = RedeemStatus.Idle;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should return true when redeem status is Success", () => {
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should return false when redeem status is Failed", () => {
            store.redeemResult = RedeemStatus.Failed;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should return false when redeem status is not set", () => {
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should return false when redeem status is set to other values", () => {
            store.redeemResult = 999;
            expect(store.isRedeemSuccess).toBe(false);
        });
    });

    describe("redeemResult setter", () => {
        it("should set redeem status to Idle", () => {
            store.redeemResult = RedeemStatus.Idle;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should set redeem status to Success", () => {
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should set redeem status to Failed", () => {
            store.redeemResult = RedeemStatus.Failed;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should set redeem status to custom values", () => {
            store.redeemResult = 42;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should update redeem status multiple times", () => {
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);

            store.redeemResult = RedeemStatus.Failed;
            expect(store.isRedeemSuccess).toBe(false);

            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });
    });

    describe("isClaimed getter", () => {
        it("should return undefined when promotion is undefined", () => {
            expect(store.isClaimed).toBeUndefined();
        });

        it("should return undefined when promotion is null", () => {
            store.promotion = null;
            expect(store.isClaimed).toBeUndefined();
        });

        it("should return false when promotion.isClaimed is false", () => {
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: false,
                isGiftCode: false,
            };
            expect(store.isClaimed).toBe(false);
        });

        it("should return true when promotion.isClaimed is true", () => {
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: true,
                isGiftCode: false,
            };
            expect(store.isClaimed).toBe(true);
        });

        it("should return undefined when promotion.isClaimed is undefined", () => {
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isGiftCode: false,
            } as any;
            expect(store.isClaimed).toBeUndefined();
        });

        it("should return null when promotion.isClaimed is null", () => {
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: null,
                isGiftCode: false,
            } as any;
            expect(store.isClaimed).toBeNull();
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle rapid property changes", () => {
            for (let i = 0; i < 10; i++) {
                store.claimedAmount = i;
                store.redeemResult = i % 3;
                expect(store.claimedAmount).toBe(i);
                expect(store.isRedeemSuccess).toBe(i % 3 === 1);
            }
        });

        it("should handle same value assignments", () => {
            store.claimedAmount = 100;
            store.claimedAmount = 100;
            expect(store.claimedAmount).toBe(100);

            store.redeemResult = RedeemStatus.Success;
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should handle extreme values", () => {
            store.claimedAmount = Number.MAX_SAFE_INTEGER;
            expect(store.claimedAmount).toBe(Number.MAX_SAFE_INTEGER);

            store.claimedAmount = Number.MIN_SAFE_INTEGER;
            expect(store.claimedAmount).toBe(Number.MIN_SAFE_INTEGER);

            store.redeemResult = Number.MAX_SAFE_INTEGER;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should handle null and undefined values", () => {
            store.promotion = null;
            expect(store.promotion).toBeNull();
            expect(store.isClaimed).toBeUndefined();

            store.promotion = undefined;
            expect(store.promotion).toBeUndefined();
            expect(store.isClaimed).toBeUndefined();

            store.finishPromotion = null;
            expect(store.finishPromotion).toBeNull();

            store.finishPromotion = undefined;
            expect(store.finishPromotion).toBeUndefined();
        });

        it("should handle empty and invalid data", () => {
            store.claimedBonusFailed = "";
            expect(store.claimedBonusFailed).toBe("");

            store.claimedBonusFailed = "   ";
            expect(store.claimedBonusFailed).toBe("   ");

            store.promotion = {} as any;
            expect(store.isClaimed).toBeUndefined();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete promotion lifecycle", () => {
            // Initial state
            expect(store.claimedAmount).toBe(0);
            expect(store.isRedeemSuccess).toBe(false);
            expect(store.isClaimed).toBeUndefined();

            // Set up promotion
            const mockPromotion: GameServiceMessageSlot.Promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: false,
                isGiftCode: false,
            };
            store.promotion = mockPromotion;
            expect(store.isClaimed).toBe(false);

            // Claim promotion
            store.promotion = {
                ...mockPromotion,
                isClaimed: true,
            };
            expect(store.isClaimed).toBe(true);

            // Set claimed amount
            store.claimedAmount = 500;
            expect(store.claimedAmount).toBe(500);

            // Set redeem result
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);

            // Set finish promotion
            const mockFinishPromotion: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 1000,
                endPromotion: true,
            };
            store.finishPromotion = mockFinishPromotion;
            expect(store.finishPromotion).toEqual(mockFinishPromotion);
        });

        it("should handle failed redemption scenario", () => {
            // Set up promotion
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 10,
                isClaimed: true,
                isGiftCode: false,
            };

            // Attempt redemption
            store.redeemResult = RedeemStatus.Failed;
            expect(store.isRedeemSuccess).toBe(false);

            // Set error message
            store.claimedBonusFailed = "Redemption failed due to insufficient funds";
            expect(store.claimedBonusFailed).toBe("Redemption failed due to insufficient funds");

            // Retry redemption
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should handle gift code promotion", () => {
            // Set up gift code promotion
            store.promotion = {
                promotionId: "gift-123",
                initialBonusItem: 5,
                isClaimed: false,
                isGiftCode: true,
            };

            // Set redemption notice
            store.redemptionNotice = {
                errorCode: "SUCCESS",
            };

            // Set TO progress
            store.promotionTOProgress = {
                win: 100,
                totalTO: 1000,
                minTO: 100,
                remainTO: 500,
                progress: 0.1,
                canClaim: true,
                expire: "2024-12-31",
            };

            // Verify all properties
            expect(store.isClaimed).toBe(false);
            expect(store.redemptionNotice).toEqual({
                errorCode: "SUCCESS",
            });
            expect(store.promotionTOProgress).toEqual({
                win: 100,
                totalTO: 1000,
                minTO: 100,
                remainTO: 500,
                progress: 0.1,
                canClaim: true,
                expire: "2024-12-31",
            });
        });

        it("should handle state reset scenario", () => {
            // Set up complex state
            store.claimedAmount = 1000;
            store.promotion = {
                promotionId: "test-123",
                initialBonusItem: 20,
                isClaimed: true,
                isGiftCode: false,
            };
            store.finishPromotion = {
                totalWin: 2000,
                endPromotion: true,
            };
            store.promotionTOProgress = {
                win: 500,
                totalTO: 2000,
                minTO: 200,
                remainTO: 500,
                canClaim: true,
                progress: 0.25,
                expire: "2024-12-31",
            };
            store.redemptionNotice = {
                errorCode: "SUCCESS",
            };
            store.claimedBonusFailed = "Some error";
            store.redeemResult = RedeemStatus.Success;

            // Verify all properties are set
            expect(store.claimedAmount).toBe(1000);
            expect(store.isClaimed).toBe(true);
            expect(store.isRedeemSuccess).toBe(true);
            expect(store.finishPromotion).toEqual({
                totalWin: 2000,
                endPromotion: true,
            });
            expect(store.promotionTOProgress).toEqual({
                win: 500,
                totalTO: 2000,
                minTO: 200,
                remainTO: 500,
                canClaim: true,
                progress: 0.25,
                expire: "2024-12-31",
            });
            expect(store.redemptionNotice).toEqual({
                errorCode: "SUCCESS",
            });
            expect(store.claimedBonusFailed).toBe("Some error");
        });
    });
});
