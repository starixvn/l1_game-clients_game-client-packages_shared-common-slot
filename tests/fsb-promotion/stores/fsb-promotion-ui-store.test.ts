import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionUIStore, FSBPromotionState, FreeSpinsPromotionEvents, TurnOverRequiredDataKey, endpointConstants } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import gc from "@sg/game-client-base";

// Mock dependencies
jest.mock("@sg/game-client-base");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn().mockImplementation(() => ({
        promotion: null,
        finishPromotion: null,
        isRedeemSuccess: false,
        isClaimed: false
    }))
}));
jest.mock("db://assets/game/scripts/game-settings", () => ({
    settings: {
        name: "TestGame",
        id: 123
    }
}));

describe("FSBPromotionUIStore", () => {
    let store: FSBPromotionUIStore;
    let mockFSBPromotionStore: any;
    let mockSiteConfigs: any;
    let mockStorageManager: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create simple mocks
        mockFSBPromotionStore = {
            promotion: null,
            finishPromotion: null,
            isRedeemSuccess: false,
            isClaimed: false
        };

        mockSiteConfigs = {
            systemType: "NORMAL"
        };

        mockStorageManager = {
            get: jest.fn().mockReturnValue(null)
        };

        (gc.StorageManager as any) = mockStorageManager;

        // Create store and inject dependencies
        store = new FSBPromotionUIStore();
        (store as any).fsbPromotionStore = mockFSBPromotionStore;
        (store as any).siteConfigs = mockSiteConfigs;
    });

    describe("initialization", () => {
        it("should initialize with default values", () => {
            expect(store.receivedPromotionInGame).toBe(false);
            expect(store.skipGiftCode).toBe(false);
            expect(store.activeTransitionEffect).toBe(false);
            expect(store.activeDetailPromo).toBe(false);
            expect(store.currentSpinCount).toBe(-1);
            expect(store.resumedFSBPromotion).toBe(false);
            expect(store.hasServerFinishPromotion).toBe(false);
            expect(store.fsbConsumedThisRound).toBe(false);
            expect(store.promotionUrl).toBe("");
            expect(store.gameOffers).toEqual([{ name: "testgame", gameId: 123 }]);
            expect(store.isWebViewLoading).toBe(false);
            expect(store.isFSBInfoReady).toBe(false);
            expect(store.isTrialMode).toBe(false);
            expect(store.pendingOpenTOAfterFinish).toBe(false);
            expect(store.isClickPlayNow).toBe(false);
            expect(store.toProgress).toBeNull();
            expect(store.pendingUIEvent).toBeNull();
        });

        it("should have correct storage key", () => {
            expect(store.getStorageKey()).toBe("free-spins-promotion-dont-show-again");
        });

        it("should have correct turnOverRequiredDataKey", () => {
            expect(store.turnOverRequiredDataKey).toEqual([TurnOverRequiredDataKey.PROMOTION_TO_PROGRESS]);
        });
    });

    describe("constants", () => {
        it("should have correct endpoint constants", () => {
            expect(endpointConstants.bannerPromotion).toBe("banner-promotions");
            expect(endpointConstants.announcementDetails).toBe("announcement-detail");
        });

        it("should have correct TurnOverRequiredDataKey", () => {
            expect(TurnOverRequiredDataKey.PROMOTION_TO_PROGRESS).toBe("promotionProgress");
        });

        it("should have correct FreeSpinsPromotionEvents", () => {
            expect(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION).toBe("OPEN_FREE_SPINS_PROMOTION");
            expect(FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION).toBe("SPIN_ON_FSB_PROMOTION");
            expect(FreeSpinsPromotionEvents.UPDATE_FSB_COUNT).toBe("UPDATE_FSB_COUNT");
        });
    });

    describe("FSBPromotionState enum", () => {
        it("should have correct state values", () => {
            expect(FSBPromotionState.Idle).toBe("IDLE");
            expect(FSBPromotionState.Ready).toBe("READY");
            expect(FSBPromotionState.Spinning).toBe("SPINNING");
            expect(FSBPromotionState.Finished).toBe("FINISHED");
            expect(FSBPromotionState.Resumed).toBe("RESUMED");
        });
    });

    describe("setFSBInfoReady", () => {
        it("should set isFSBInfoReady to true", () => {
            store.setFSBInfoReady(true);
            expect(store.isFSBInfoReady).toBe(true);
        });

        it("should set isFSBInfoReady to false", () => {
            store.setFSBInfoReady(true);
            store.setFSBInfoReady(false);
            expect(store.isFSBInfoReady).toBe(false);
        });
    });

    describe("setFallbackGameOffers", () => {
        it("should add valid game offer", () => {
            store.setFallbackGameOffers({ name: "TestGame", gameId: 456 });
            expect(store.getFallbackGameOffers()).toEqual([{ name: "testgame", gameId: 456 }]);
        });

        it("should not add duplicate game offer", () => {
            store.setFallbackGameOffers({ name: "TestGame", gameId: 456 });
            store.setFallbackGameOffers({ name: "TestGame2", gameId: 456 });
            expect(store.getFallbackGameOffers()).toEqual([{ name: "testgame", gameId: 456 }]);
        });

        it("should not add offer with invalid name", () => {
            store.setFallbackGameOffers({ name: "", gameId: 456 });
            expect(store.getFallbackGameOffers()).toEqual([]);
        });

        it("should not add offer with invalid gameId", () => {
            store.setFallbackGameOffers({ name: "TestGame", gameId: "invalid" as any });
            expect(store.getFallbackGameOffers()).toEqual([]);
        });

        it("should add multiple different offers", () => {
            store.setFallbackGameOffers({ name: "Game1", gameId: 1 });
            store.setFallbackGameOffers({ name: "Game2", gameId: 2 });
            expect(store.getFallbackGameOffers()).toEqual([
                { name: "game1", gameId: 1 },
                { name: "game2", gameId: 2 }
            ]);
        });
    });

    describe("currentSpinCount property", () => {
        it("should get and set currentSpinCount correctly", () => {
            expect(store.currentSpinCount).toBe(-1);

            store.currentSpinCount = 5;
            expect(store.currentSpinCount).toBe(5);

            store.currentSpinCount = 0;
            expect(store.currentSpinCount).toBe(0);

            store.currentSpinCount = -5;
            expect(store.currentSpinCount).toBe(-5);
        });
    });

    describe("activeDetailPromo property", () => {
        it("should get and set activeDetailPromo correctly", () => {
            expect(store.activeDetailPromo).toBe(false);

            store.activeDetailPromo = true;
            expect(store.activeDetailPromo).toBe(true);

            store.activeDetailPromo = false;
            expect(store.activeDetailPromo).toBe(false);
        });
    });

    describe("activeTransitionEffect property", () => {
        it("should get and set activeTransitionEffect correctly", () => {
            expect(store.activeTransitionEffect).toBe(false);

            store.activeTransitionEffect = true;
            expect(store.activeTransitionEffect).toBe(true);

            store.activeTransitionEffect = false;
            expect(store.activeTransitionEffect).toBe(false);
        });
    });

    describe("skipGiftCode property", () => {
        it("should get and set skipGiftCode correctly", () => {
            expect(store.skipGiftCode).toBe(false);

            store.skipGiftCode = true;
            expect(store.skipGiftCode).toBe(true);

            store.skipGiftCode = false;
            expect(store.skipGiftCode).toBe(false);
        });
    });

    describe("FSB Spin Eligibility", () => {
        describe("isEligibleForNextFSBSpin", () => {
            it("should return false when FSB bonus is not used", () => {
                store.isUsedFSBPromotionBonus = false;
                store.currentSpinCount = 5;
                store.isFSBInfoReady = true;

                expect(store.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return false when spin count is depleted", () => {
                store.isUsedFSBPromotionBonus = true;
                store.currentSpinCount = 0;
                store.isFSBInfoReady = true;

                expect(store.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return false when FSB info is not ready", () => {
                store.isUsedFSBPromotionBonus = true;
                store.currentSpinCount = 5;
                store.isFSBInfoReady = false;

                expect(store.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return true when all conditions are satisfied", () => {
                store.isUsedFSBPromotionBonus = true;
                store.currentSpinCount = 5;
                store.isFSBInfoReady = true;

                expect(store.isEligibleForNextFSBSpin).toBe(true);
            });
        });
    });

    describe("isFSBPromotionInProgress", () => {
        it("should return true when state is Ready", () => {
            mockFSBPromotionStore.promotion = {
                isClaimed: false,
                remainingBonusItems: 1,
                initialBonusItem: 1
            };
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = false;
            expect(store.isFSBPromotionInProgress).toBe(true);
        });

        it("should return true when state is Spinning", () => {
            mockFSBPromotionStore.promotion = {
                isClaimed: true,
                remainingBonusItems: 1,
                initialBonusItem: 1
            };
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = true;
            expect(store.isFSBPromotionInProgress).toBe(true);
        });

        it("should return false when state is Idle", () => {
            store.currentSpinCount = -1;
            mockFSBPromotionStore.promotion = {
                isClaimed: false,
                remainingBonusItems: 1,
                initialBonusItem: 1
            };
            expect(store.isFSBPromotionInProgress).toBe(false);
        });

        it("should return false when state is Finished", () => {
            store.hasServerFinishPromotion = true;
            mockFSBPromotionStore.promotion = {
                isClaimed: true,
                remainingBonusItems: 1,
                initialBonusItem: 1
            };
            expect(store.isFSBPromotionInProgress).toBe(false);
        });
    });

    describe("isUpdateTotalWin", () => {
        it("should return true when fsbConsumedThisRound is true", () => {
            store.fsbConsumedThisRound = true;
            expect(store.isUpdateTotalWin).toBe(true);
        });

        it("should return true when resumedFSBPromotion is true", () => {
            store.resumedFSBPromotion = true;
            expect(store.isUpdateTotalWin).toBe(true);
        });

        it("should return false when neither condition is true", () => {
            store.fsbConsumedThisRound = false;
            store.resumedFSBPromotion = false;
            expect(store.isUpdateTotalWin).toBe(false);
        });
    });

    describe("FSB State Management", () => {
        describe("fsbState", () => {
            it("should return Idle when no promotion exists", () => {
                mockFSBPromotionStore.promotion = null;
                expect(store.fsbState).toBe(FSBPromotionState.Idle);
            });

            it("should return Finished when server has confirmed promotion end", () => {
                mockFSBPromotionStore.finishPromotion = { totalWin: 100 };
                store.hasServerFinishPromotion = true;
                store.currentSpinCount = 0;
                // Need to set promotion to make it work
                mockFSBPromotionStore.promotion = { promotionId: "123" };
                expect(store.fsbState).toBe(FSBPromotionState.Finished);
            });

            it("should return Resumed when FSB promotion is being resumed", () => {
                mockFSBPromotionStore.promotion = { promotionId: "123" };
                store.resumedFSBPromotion = true;
                expect(store.fsbState).toBe(FSBPromotionState.Resumed);
            });

            it("should return Spinning when currently consuming FSB spins", () => {
                mockFSBPromotionStore.promotion = { promotionId: "123" };
                store.currentSpinCount = 3;
                store.fsbConsumedThisRound = true;
                expect(store.fsbState).toBe(FSBPromotionState.Spinning);
            });

            it("should return Ready when FSB spins are available but not consumed", () => {
                mockFSBPromotionStore.promotion = { promotionId: "123" };
                store.currentSpinCount = 5;
                store.fsbConsumedThisRound = false;
                expect(store.fsbState).toBe(FSBPromotionState.Ready);
            });

            it("should return Idle when spin count is negative", () => {
                mockFSBPromotionStore.promotion = { promotionId: "123" };
                store.currentSpinCount = -1;
                expect(store.fsbState).toBe(FSBPromotionState.Idle);
                });
            });
    });

    describe("toProgress property", () => {
        it("should get and set toProgress correctly", () => {
            expect(store.toProgress).toBeNull();

            const toData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            store.toProgress = toData;
            expect(store.toProgress).toEqual(toData);

            store.toProgress = null;
            expect(store.toProgress).toBeNull();
        });
    });

    describe("updateTOProgress", () => {
        it("should return true when data is new", () => {
            const newData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            const result = store.updateTOProgress(newData);
            expect(result).toBe(true);
            expect(store.toProgress).toEqual(newData);
        });

        it("should return true when win changes", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            const newData = { win: 200, totalTO: 1000, minTO: 100, progress: 0.5 };
            const result = store.updateTOProgress(newData);
            expect(result).toBe(true);
        });

        it("should return true when totalTO changes", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            const newData = { win: 100, totalTO: 2000, minTO: 100, progress: 0.5 };
            const result = store.updateTOProgress(newData);
            expect(result).toBe(true);
        });

        it("should return true when progress changes", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            const newData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.8 };
            const result = store.updateTOProgress(newData);
            expect(result).toBe(true);
        });

        it("should return false when no changes", () => {
            const data = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            store.toProgress = data;
            const result = store.updateTOProgress(data);
            expect(result).toBe(false);
        });
    });

    describe("hasTOProgress", () => {
        it("should return false when toProgress is null", () => {
            expect(store.hasTOProgress()).toBe(false);
        });

        it("should return true when toProgress has data", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            expect(store.hasTOProgress()).toBe(true);
        });
    });

    describe("resetTOProgress", () => {
        it("should reset toProgress to null", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            store.resetTOProgress();
            expect(store.toProgress).toBeNull();
        });
    });

    describe("reset", () => {
        it("should reset all state properties to initial values", () => {
            // Set some values
            store.receivedPromotionInGame = true;
            store.skipGiftCode = true;
            store.resumedFSBPromotion = true;
            store.activeTransitionEffect = true;
            store.activeDetailPromo = true;
            store.hasServerFinishPromotion = true;
            store.fsbConsumedThisRound = true;
            store.currentSpinCount = 5;
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };

            // Reset
            store.reset();

            // Verify all are reset
            expect(store.receivedPromotionInGame).toBe(false);
            expect(store.skipGiftCode).toBe(false);
            expect(store.resumedFSBPromotion).toBe(false);
            expect(store.activeTransitionEffect).toBe(false);
            expect(store.activeDetailPromo).toBe(false);
            expect(store.hasServerFinishPromotion).toBe(false);
            expect(store.fsbConsumedThisRound).toBe(false);
            expect(store.currentSpinCount).toBe(-1);
            expect(store.toProgress).toBeNull();
        });
    });

    describe("hasPromo", () => {
        it("should return false when promotion is null", () => {
            mockFSBPromotionStore.promotion = null;
            expect(store.hasPromo()).toBe(false);
        });

        it("should return true when promotion exists", () => {
            mockFSBPromotionStore.promotion = { promotionId: "123", initialBonusItem: 1 };
            expect(store.hasPromo()).toBe(true);
        });
    });

    describe("Promotion Skip Logic", () => {
        describe("shouldSkipPromo", () => {
            it("should not skip when no storage preference and normal system", () => {
                mockStorageManager.get.mockReturnValue(null);
                mockFSBPromotionStore.promotion = { isGiftCode: false };
                mockSiteConfigs.systemType = "NORMAL";

                expect(store.shouldSkipPromo()).toBe(false);
            });

            it("should skip when user chose don't show again for non-gift promotions", () => {
                mockStorageManager.get.mockReturnValue({ dontShowAgain: true });
                mockFSBPromotionStore.promotion = { isGiftCode: false };
                mockSiteConfigs.systemType = "NORMAL";

                expect(store.shouldSkipPromo()).toBe(true);
            });

            it("should not skip gift code promotions even when don't show again is set", () => {
                mockStorageManager.get.mockReturnValue({ dontShowAgain: true });
                mockFSBPromotionStore.promotion = { isGiftCode: true };
                mockSiteConfigs.systemType = "NORMAL";

                expect(store.shouldSkipPromo()).toBe(false);
            });

            it("should skip for SC system type", () => {
                mockSiteConfigs.systemType = "SC";
                expect(store.shouldSkipPromo()).toBe(true);
            });

            it("should skip for SC system type (lowercase)", () => {
                mockSiteConfigs.systemType = "sc";
                expect(store.shouldSkipPromo()).toBe(true);
            });
        });
    });

    describe("isEligibleForTurnOverPanel", () => {
        it("should return false when finishPromotion is null", () => {
            mockFSBPromotionStore.finishPromotion = null;
            store.currentSpinCount = 0;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return false when totalWin is 0", () => {
            mockFSBPromotionStore.finishPromotion = { totalWin: 0 };
            store.currentSpinCount = 0;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return false when currentSpinCount is not 0", () => {
            mockFSBPromotionStore.finishPromotion = { totalWin: 100 };
            store.currentSpinCount = 5;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return true when all conditions are met", () => {
            mockFSBPromotionStore.finishPromotion = { totalWin: 100 };
            store.currentSpinCount = 0;
            expect(store.isEligibleForTurnOverPanel()).toBe(true);
        });
    });

    describe("tryConsumeFSB", () => {
        it("should return false when currentSpinCount is 0", () => {
            store.currentSpinCount = 0;
            store.fsbConsumedThisRound = false;
            const result = store.tryConsumeFSB();
            expect(result).toBe(false);
            expect(store.currentSpinCount).toBe(0);
            expect(store.fsbConsumedThisRound).toBe(false);
        });

        it("should return false when currentSpinCount is negative", () => {
            store.currentSpinCount = -1;
            store.fsbConsumedThisRound = false;
            const result = store.tryConsumeFSB();
            expect(result).toBe(false);
            expect(store.currentSpinCount).toBe(-1);
            expect(store.fsbConsumedThisRound).toBe(false);
        });

        it("should return false when fsbConsumedThisRound is already true", () => {
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = true;
            const result = store.tryConsumeFSB();
            expect(result).toBe(false);
            expect(store.currentSpinCount).toBe(5);
            expect(store.fsbConsumedThisRound).toBe(true);
        });

        it("should return true and consume FSB when conditions are met", () => {
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = false;
            const result = store.tryConsumeFSB();
            expect(result).toBe(true);
            expect(store.currentSpinCount).toBe(4);
            expect(store.fsbConsumedThisRound).toBe(true);
        });
    });

    describe("undoLastFSBSpin", () => {
        it("should return false when fsbConsumedThisRound is false", () => {
            store.fsbConsumedThisRound = false;
            store.currentSpinCount = 4;
            store.resumedFSBPromotion = false;
            const result = store.undoLastFSBSpin();
            expect(result).toBe(false);
            expect(store.currentSpinCount).toBe(4);
            expect(store.fsbConsumedThisRound).toBe(false);
        });

        it("should return false when resumedFSBPromotion is true", () => {
            store.fsbConsumedThisRound = true;
            store.currentSpinCount = 4;
            store.resumedFSBPromotion = true;
            const result = store.undoLastFSBSpin();
            expect(result).toBe(false);
            expect(store.currentSpinCount).toBe(4);
            expect(store.fsbConsumedThisRound).toBe(true);
        });

        it("should return true and undo when conditions are met", () => {
            store.fsbConsumedThisRound = true;
            store.currentSpinCount = 4;
            store.resumedFSBPromotion = false;
            const result = store.undoLastFSBSpin();
            expect(result).toBe(true);
            expect(store.currentSpinCount).toBe(5);
            expect(store.fsbConsumedThisRound).toBe(false);
        });
    });

    describe("commitFSB", () => {
        it("should reset fsbConsumedThisRound when true", () => {
            store.fsbConsumedThisRound = true;
            store.commitFSB();
            expect(store.fsbConsumedThisRound).toBe(false);
        });

        it("should keep fsbConsumedThisRound false when already false", () => {
            store.fsbConsumedThisRound = false;
            store.commitFSB();
            expect(store.fsbConsumedThisRound).toBe(false);
        });
    });

    describe("markServerConfirmedEnd", () => {
        it("should set hasServerFinishPromotion to true", () => {
            store.hasServerFinishPromotion = false;
            store.markServerConfirmedEnd();
            expect(store.hasServerFinishPromotion).toBe(true);
        });
    });

    describe("addPendingUIEvent", () => {
        it("should add event with data", () => {
            const event = "TEST_EVENT";
            const data = { test: "data" };
            store.addPendingUIEvent(event, data);
            expect(store.pendingUIEvent).toEqual({ event, data });
        });

        it("should add event without data", () => {
            const event = "TEST_EVENT";
            store.addPendingUIEvent(event);
            expect(store.pendingUIEvent).toEqual({ event });
        });
    });

    describe("removePendingUIEvent", () => {
        it("should set pendingUIEvent to null", () => {
            store.pendingUIEvent = { event: "TEST_EVENT" };
            store.removePendingUIEvent();
            expect(store.pendingUIEvent).toBeNull();
        });
    });

    describe("isRedeemSuccess", () => {
        it("should return true when event matches and isRedeemSuccess is true", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            mockFSBPromotionStore.isRedeemSuccess = true;
            expect(store.isRedeemSuccess()).toBe(true);
        });

        it("should return false when event doesn't match", () => {
            store.pendingUIEvent = { event: "OTHER_EVENT" };
            mockFSBPromotionStore.isRedeemSuccess = true;
            expect(store.isRedeemSuccess()).toBe(false);
        });

        it("should return false when isRedeemSuccess is false", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            mockFSBPromotionStore.isRedeemSuccess = false;
            expect(store.isRedeemSuccess()).toBe(false);
        });

        it("should return false when pendingUIEvent is null", () => {
            store.pendingUIEvent = null;
            mockFSBPromotionStore.isRedeemSuccess = true;
            expect(store.isRedeemSuccess()).toBe(false);
        });
    });

    describe("isShowFsbBanner", () => {
        it("should return true when event matches and isRedeemSuccess is false", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            mockFSBPromotionStore.isRedeemSuccess = false;
            expect(store.isShowFsbBanner()).toBe(true);
        });

        it("should return false when event doesn't match", () => {
            store.pendingUIEvent = { event: "OTHER_EVENT" };
            mockFSBPromotionStore.isRedeemSuccess = false;
            expect(store.isShowFsbBanner()).toBe(false);
        });

        it("should return false when isRedeemSuccess is true", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            mockFSBPromotionStore.isRedeemSuccess = true;
            expect(store.isShowFsbBanner()).toBe(false);
        });

        it("should return false when pendingUIEvent is null", () => {
            store.pendingUIEvent = null;
            mockFSBPromotionStore.isRedeemSuccess = false;
            expect(store.isShowFsbBanner()).toBe(false);
        });
    });

    describe("setWebViewLoading", () => {
        it("should set isWebViewLoading to true", () => {
            store.setWebViewLoading(true);
            expect(store.isWebViewLoading).toBe(true);
        });

        it("should set isWebViewLoading to false", () => {
            store.setWebViewLoading(false);
            expect(store.isWebViewLoading).toBe(false);
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle rapid state changes", () => {
            for (let i = 0; i < 10; i++) {
                store.currentSpinCount = i;
                store.fsbConsumedThisRound = i % 2 === 0;
                expect(store.currentSpinCount).toBe(i);
                expect(store.fsbConsumedThisRound).toBe(i % 2 === 0);
            }
        });

        it("should handle same value assignments", () => {
            store.currentSpinCount = 5;
            store.currentSpinCount = 5;
            expect(store.currentSpinCount).toBe(5);

            store.fsbConsumedThisRound = true;
            store.fsbConsumedThisRound = true;
            expect(store.fsbConsumedThisRound).toBe(true);
        });

        it("should handle extreme values", () => {
            store.currentSpinCount = Number.MAX_SAFE_INTEGER;
            expect(store.currentSpinCount).toBe(Number.MAX_SAFE_INTEGER);

            store.currentSpinCount = Number.MIN_SAFE_INTEGER;
            expect(store.currentSpinCount).toBe(Number.MIN_SAFE_INTEGER);
        });

        it("should handle null and undefined values in toProgress", () => {
            store.toProgress = null;
            expect(store.toProgress).toBeNull();

            store.toProgress = undefined as any;
            expect(store.toProgress).toBeUndefined();
        });
    });
});