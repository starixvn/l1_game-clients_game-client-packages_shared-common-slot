import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionStore, RedeemStatus } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("inversify", () => ({
    __esModule: true,
    default: {
        injectable: () => (target: any) => target,
    },
}));

const makeAutoObservableMock = jest.fn();
jest.mock("mobx", () => ({
    __esModule: true,
    default: {
        makeAutoObservable: (...args: any[]) => makeAutoObservableMock(...args),
    },
}));

describe("FSBPromotionStore", () => {
    let store: FSBPromotionStore;

    beforeEach(() => {
        makeAutoObservableMock.mockClear();
        store = new FSBPromotionStore();
    });

    describe("initialization", () => {
        it("should initialize with default values", () => {
            expect(store.claimedAmount).toBe(0);
            expect(store.isRedeemSuccess).toBe(false);
            expect(store.isClaimed).toBeUndefined();
            expect(makeAutoObservableMock).toHaveBeenCalledWith(store);
        });
    });

    describe("redeemResult setter", () => {
        it("should set isRedeemSuccess to true when redeemResult is Success", () => {
            store.redeemResult = RedeemStatus.Success;
            expect(store.isRedeemSuccess).toBe(true);
        });

        it("should set isRedeemSuccess to false when redeemResult is Failed", () => {
            store.redeemResult = RedeemStatus.Failed;
            expect(store.isRedeemSuccess).toBe(false);
        });

        it("should set isRedeemSuccess to false when redeemResult is Idle", () => {
            store.redeemResult = RedeemStatus.Idle;
            expect(store.isRedeemSuccess).toBe(false);
        });
    });

    describe("isClaimed getter", () => {
        it("should return undefined when no promotion exists", () => {
            expect(store.isClaimed).toBeUndefined();
        });

        it("should return true when promotion is claimed", () => {
            store.promotion = { isClaimed: true } as unknown as GameServiceMessageSlot.Promotion;
            expect(store.isClaimed).toBe(true);
        });

        it("should return false when promotion is not claimed", () => {
            store.promotion = { isClaimed: false } as unknown as GameServiceMessageSlot.Promotion;
            expect(store.isClaimed).toBe(false);
        });
    });

    describe("promotion management", () => {
        it("should store promotion data correctly", () => {
            const promotionData = {
                promotionId: "test-123",
                initialBonusItem: 5,
                remainingBonusItems: 3,
                isClaimed: false,
                isGiftCode: false,
                coinValue: 1,
                betLevel: 10
            } as GameServiceMessageSlot.Promotion;

            store.promotion = promotionData;

            expect(store.promotion).toBe(promotionData);
            expect(store.isClaimed).toBe(false);
        });

        it("should handle null promotion", () => {
            store.promotion = null;
            expect(store.promotion).toBeNull();
            expect(store.isClaimed).toBeUndefined();
        });
    });

    describe("claimedAmount management", () => {
        it("should store claimed amount correctly", () => {
            const amount = 1500;
            store.claimedAmount = amount;
            expect(store.claimedAmount).toBe(amount);
        });

        it("should handle zero claimed amount", () => {
            store.claimedAmount = 0;
            expect(store.claimedAmount).toBe(0);
        });

        it("should handle negative claimed amount", () => {
            store.claimedAmount = -100;
            expect(store.claimedAmount).toBe(-100);
        });
    });
});
