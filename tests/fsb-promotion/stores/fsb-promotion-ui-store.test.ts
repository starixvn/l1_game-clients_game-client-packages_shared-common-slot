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

// Test interfaces for better abstraction (DIP)
interface MockFSBPromotionStore {
    promotion: any;
    finishPromotion: any;
    isRedeemSuccess: boolean;
    isClaimed: boolean;
}

interface MockCascadingUIStore {
    isUsedFSBPromotionBonus: boolean;
    fsbPromotionInProgress: boolean;
}

interface MockSiteConfigs {
    systemType: string;
}

// Test factory for creating mock dependencies (SRP)
class TestDependencyFactory {
    static createFSBPromotionStore(overrides: Partial<MockFSBPromotionStore> = {}): MockFSBPromotionStore {
        return {
            promotion: null,
            finishPromotion: null,
            isRedeemSuccess: false,
            isClaimed: false,
            ...overrides
        };
    }

    static createCascadingUIStore(overrides: Partial<MockCascadingUIStore> = {}): MockCascadingUIStore {
        return {
            isUsedFSBPromotionBonus: false,
            fsbPromotionInProgress: false,
            ...overrides
        };
    }

    static createSiteConfigs(overrides: Partial<MockSiteConfigs> = {}): MockSiteConfigs {
        return {
            systemType: "NORMAL",
            ...overrides
        };
    }

    static createStorageManager(returnValue: any = null) {
        return {
            get: jest.fn().mockReturnValue(returnValue)
        };
    }
}

// Test helper for store setup (SRP)
class FSBPromotionUIStoreTestHelper {
    static createStore(
        fsbPromotionStore?: MockFSBPromotionStore,
        cascadingUIStore?: MockCascadingUIStore,
        siteConfigs?: MockSiteConfigs
    ): FSBPromotionUIStore {
        const store = new FSBPromotionUIStore();
        
        // Inject dependencies
        (store as any).fsbPromotionStore = fsbPromotionStore || TestDependencyFactory.createFSBPromotionStore();
        (store as any).cascadingUIStore = cascadingUIStore || TestDependencyFactory.createCascadingUIStore();
        (store as any).siteConfigs = siteConfigs || TestDependencyFactory.createSiteConfigs();
        
        return store;
    }

    static setupStorageManager(returnValue: any = null): void {
        (gc.StorageManager as any) = TestDependencyFactory.createStorageManager(returnValue);
    }
}

// Test scenario builders for complex test setups (SRP)
class FSBPromotionScenarioBuilder {
    // Scenario: FSB ready to spin
    static createReadyToSpinScenario(): {
        store: FSBPromotionUIStore;
        fsbStore: MockFSBPromotionStore;
        cascadingStore: MockCascadingUIStore;
    } {
        const fsbStore = TestDependencyFactory.createFSBPromotionStore({
            promotion: { promotionId: "123", initialBonusItem: 5 }
        });
        const cascadingStore = TestDependencyFactory.createCascadingUIStore({
            isUsedFSBPromotionBonus: true
        });
        const siteConfigs = TestDependencyFactory.createSiteConfigs();

        const store = FSBPromotionUIStoreTestHelper.createStore(fsbStore, cascadingStore, siteConfigs);
        store.currentSpinCount = 5;
        store.isFSBInfoReady = true;

        return { store, fsbStore, cascadingStore };
    }

    // Scenario: FSB spinning in progress
    static createSpinningScenario(): {
        store: FSBPromotionUIStore;
        fsbStore: MockFSBPromotionStore;
        cascadingStore: MockCascadingUIStore;
    } {
        const fsbStore = TestDependencyFactory.createFSBPromotionStore({
            promotion: { promotionId: "123", initialBonusItem: 5 }
        });
        const cascadingStore = TestDependencyFactory.createCascadingUIStore();
        const store = FSBPromotionUIStoreTestHelper.createStore(fsbStore, cascadingStore);
        
        store.currentSpinCount = 3;
        store.fsbConsumedThisRound = true;

        return { store, fsbStore, cascadingStore };
    }

    // Scenario: FSB finished
    static createFinishedScenario(): {
        store: FSBPromotionUIStore;
        fsbStore: MockFSBPromotionStore;
    } {
        const fsbStore = TestDependencyFactory.createFSBPromotionStore({
            promotion: { promotionId: "123", initialBonusItem: 5 },
            finishPromotion: { totalWin: 100 }
        });
        const store = FSBPromotionUIStoreTestHelper.createStore(fsbStore);
        
        store.hasServerFinishPromotion = true;
        store.currentSpinCount = 0;

        return { store, fsbStore };
    }

    // Scenario: Turn over progress eligible
    static createTurnOverEligibleScenario(): {
        store: FSBPromotionUIStore;
        fsbStore: MockFSBPromotionStore;
        cascadingStore: MockCascadingUIStore;
    } {
        const fsbStore = TestDependencyFactory.createFSBPromotionStore({
            finishPromotion: { totalWin: 100 },
            isClaimed: true
        });
        const cascadingStore = TestDependencyFactory.createCascadingUIStore({
            isUsedFSBPromotionBonus: true
        });
        const store = FSBPromotionUIStoreTestHelper.createStore(fsbStore, cascadingStore);
        
        store.currentSpinCount = 0;
        store.isFSBInfoReady = false;
        store.isClickPlayNow = true;

        return { store, fsbStore, cascadingStore };
    }

    // Scenario: SC system type (should skip promo)
    static createSCSystemScenario(): {
        store: FSBPromotionUIStore;
        siteConfigs: MockSiteConfigs;
    } {
        const siteConfigs = TestDependencyFactory.createSiteConfigs({ systemType: "SC" });
        const store = FSBPromotionUIStoreTestHelper.createStore(undefined, undefined, siteConfigs);

        return { store, siteConfigs };
    }
}

describe("FSBPromotionUIStore", () => {
    let store: FSBPromotionUIStore;
    let mockFSBPromotionStore: MockFSBPromotionStore;
    let mockCascadingUIStore: MockCascadingUIStore;
    let mockSiteConfigs: MockSiteConfigs;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup default dependencies using factory (DIP)
        mockFSBPromotionStore = TestDependencyFactory.createFSBPromotionStore();
        mockCascadingUIStore = TestDependencyFactory.createCascadingUIStore();
        mockSiteConfigs = TestDependencyFactory.createSiteConfigs();

        // Setup storage manager
        FSBPromotionUIStoreTestHelper.setupStorageManager();

        // Create store with dependencies (SRP)
        store = FSBPromotionUIStoreTestHelper.createStore(
            mockFSBPromotionStore,
            mockCascadingUIStore,
            mockSiteConfigs
        );
    });

    describe("constructor and initial state", () => {
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

        it("should initialize fallbackGameOffers as empty array", () => {
            expect(store.getFallbackGameOffers()).toEqual([]);
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
        it("should get currentSpinCount correctly", () => {
            expect(store.currentSpinCount).toBe(-1);
        });

        it("should set currentSpinCount to positive numbers", () => {
            store.currentSpinCount = 5;
            expect(store.currentSpinCount).toBe(5);
        });

        it("should set currentSpinCount to zero", () => {
            store.currentSpinCount = 0;
            expect(store.currentSpinCount).toBe(0);
        });

        it("should set currentSpinCount to negative numbers", () => {
            store.currentSpinCount = -5;
            expect(store.currentSpinCount).toBe(-5);
        });
    });

    describe("activeDetailPromo property", () => {
        it("should get activeDetailPromo correctly", () => {
            expect(store.activeDetailPromo).toBe(false);
        });

        it("should set activeDetailPromo to true", () => {
            store.activeDetailPromo = true;
            expect(store.activeDetailPromo).toBe(true);
        });

        it("should set activeDetailPromo to false", () => {
            store.activeDetailPromo = true;
            store.activeDetailPromo = false;
            expect(store.activeDetailPromo).toBe(false);
        });
    });

    describe("activeTransitionEffect property", () => {
        it("should get activeTransitionEffect correctly", () => {
            expect(store.activeTransitionEffect).toBe(false);
        });

        it("should set activeTransitionEffect to true", () => {
            store.activeTransitionEffect = true;
            expect(store.activeTransitionEffect).toBe(true);
        });

        it("should set activeTransitionEffect to false", () => {
            store.activeTransitionEffect = true;
            store.activeTransitionEffect = false;
            expect(store.activeTransitionEffect).toBe(false);
        });
    });

    describe("skipGiftCode property", () => {
        it("should get skipGiftCode correctly", () => {
            expect(store.skipGiftCode).toBe(false);
        });

        it("should set skipGiftCode to true", () => {
            store.skipGiftCode = true;
            expect(store.skipGiftCode).toBe(true);
        });

        it("should set skipGiftCode to false", () => {
            store.skipGiftCode = true;
            store.skipGiftCode = false;
            expect(store.skipGiftCode).toBe(false);
        });
    });

    // Focused tests for FSB eligibility (SRP)
    describe("FSB Spin Eligibility", () => {
        describe("isEligibleForNextFSBSpin", () => {
            it("should return false when FSB bonus is not used", () => {
                const cascadingStore = TestDependencyFactory.createCascadingUIStore({
                    isUsedFSBPromotionBonus: false
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(undefined, cascadingStore);
                testStore.currentSpinCount = 5;
                testStore.isFSBInfoReady = true;

                expect(testStore.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return false when spin count is depleted", () => {
                const cascadingStore = TestDependencyFactory.createCascadingUIStore({
                    isUsedFSBPromotionBonus: true
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(undefined, cascadingStore);
                testStore.currentSpinCount = 0;
                testStore.isFSBInfoReady = true;

                expect(testStore.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return false when FSB info is not ready", () => {
                const cascadingStore = TestDependencyFactory.createCascadingUIStore({
                    isUsedFSBPromotionBonus: true
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(undefined, cascadingStore);
                testStore.currentSpinCount = 5;
                testStore.isFSBInfoReady = false;

                expect(testStore.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return true when all conditions are satisfied", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createReadyToSpinScenario();
                // Explicitly set the property since it's a getter/setter
                testStore.isUsedFSBPromotionBonus = true;

                expect(testStore.isEligibleForNextFSBSpin).toBe(true);
            });
        });
    });

    describe("isFSBPromotionInProgress", () => {
        it("should return true when state is Ready", () => {
            mockFSBPromotionStore.promotion = {}; // Set promotion to enable FSB state
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = false;
            expect(store.isFSBPromotionInProgress).toBe(true);
        });

        it("should return true when state is Spinning", () => {
            mockFSBPromotionStore.promotion = {}; // Set promotion to enable FSB state
            store.currentSpinCount = 5;
            store.fsbConsumedThisRound = true;
            expect(store.isFSBPromotionInProgress).toBe(true);
        });

        it("should return false when state is Idle", () => {
            store.currentSpinCount = -1;
            expect(store.isFSBPromotionInProgress).toBe(false);
        });

        it("should return false when state is Finished", () => {
            store.hasServerFinishPromotion = true;
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

    // Focused tests for FSB state management (SRP)
    describe("FSB State Management", () => {
        describe("fsbState", () => {
            it("should return Idle when no promotion exists", () => {
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: null
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore);

                expect(testStore.fsbState).toBe(FSBPromotionState.Idle);
            });

            it("should return Finished when server has confirmed promotion end", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createFinishedScenario();

                expect(testStore.fsbState).toBe(FSBPromotionState.Finished);
            });

            it("should return Resumed when FSB promotion is being resumed", () => {
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { promotionId: "123" }
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore);
                testStore.resumedFSBPromotion = true;

                expect(testStore.fsbState).toBe(FSBPromotionState.Resumed);
            });

            it("should return Spinning when currently consuming FSB spins", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createSpinningScenario();

                expect(testStore.fsbState).toBe(FSBPromotionState.Spinning);
            });

            it("should return Ready when FSB spins are available but not consumed", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createReadyToSpinScenario();
                testStore.fsbConsumedThisRound = false; // Ensure not consumed

                expect(testStore.fsbState).toBe(FSBPromotionState.Ready);
            });

            it("should return Idle when spin count is negative", () => {
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { promotionId: "123" }
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore);
                testStore.currentSpinCount = -1;

                expect(testStore.fsbState).toBe(FSBPromotionState.Idle);
            });
        });


    });

    describe("toProgress property", () => {
        it("should get toProgress correctly", () => {
            expect(store.toProgress).toBeNull();
        });

        it("should set toProgress to valid data", () => {
            const toData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
            store.toProgress = toData;
            expect(store.toProgress).toEqual(toData);
        });

        it("should set toProgress to null", () => {
            store.toProgress = { win: 100, totalTO: 1000, minTO: 100, progress: 0.5 };
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

    // Focused tests for promotion skip logic (SRP)
    describe("Promotion Skip Logic", () => {
        describe("shouldSkipPromo", () => {
            it("should not skip when no storage preference and normal system", () => {
                FSBPromotionUIStoreTestHelper.setupStorageManager(null);
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { isGiftCode: false }
                });
                const siteConfigs = TestDependencyFactory.createSiteConfigs({
                    systemType: "NORMAL"
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore, undefined, siteConfigs);

                expect(testStore.shouldSkipPromo()).toBe(false);
            });

            it("should skip when user chose don't show again for non-gift promotions", () => {
                FSBPromotionUIStoreTestHelper.setupStorageManager({ dontShowAgain: true });
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { isGiftCode: false }
                });
                const siteConfigs = TestDependencyFactory.createSiteConfigs({
                    systemType: "NORMAL"
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore, undefined, siteConfigs);

                expect(testStore.shouldSkipPromo()).toBe(true);
            });

            it("should not skip gift code promotions even when don't show again is set", () => {
                FSBPromotionUIStoreTestHelper.setupStorageManager({ dontShowAgain: true });
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { isGiftCode: true }
                });
                const siteConfigs = TestDependencyFactory.createSiteConfigs({
                    systemType: "NORMAL"
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(fsbStore, undefined, siteConfigs);

                expect(testStore.shouldSkipPromo()).toBe(false);
            });

            it("should skip for SC system type (uppercase)", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createSCSystemScenario();

                expect(testStore.shouldSkipPromo()).toBe(true);
            });

            it("should skip for SC system type (lowercase)", () => {
                const siteConfigs = TestDependencyFactory.createSiteConfigs({ 
                    systemType: "sc" 
                });
                const testStore = FSBPromotionUIStoreTestHelper.createStore(undefined, undefined, siteConfigs);

                expect(testStore.shouldSkipPromo()).toBe(true);
            });
        });
    });

    describe("isEligibleForTurnOverPanel", () => {
        it("should return false when finishPromotion is null", () => {
            (mockFSBPromotionStore as any).finishPromotion = null;
            store.currentSpinCount = 0;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return false when totalWin is 0", () => {
            (mockFSBPromotionStore as any).finishPromotion = { totalWin: 0 };
            store.currentSpinCount = 0;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return false when currentSpinCount is not 0", () => {
            (mockFSBPromotionStore as any).finishPromotion = { totalWin: 100 };
            store.currentSpinCount = 5;
            expect(store.isEligibleForTurnOverPanel()).toBe(false);
        });

        it("should return true when all conditions are met", () => {
            (mockFSBPromotionStore as any).finishPromotion = { totalWin: 100 };
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
            (mockFSBPromotionStore as any).isRedeemSuccess = true;  
            expect(store.isRedeemSuccess()).toBe(true);
        });

        it("should return false when event doesn't match", () => {
            store.pendingUIEvent = { event: "OTHER_EVENT" };
            (mockFSBPromotionStore as any).isRedeemSuccess = true;
            expect(store.isRedeemSuccess()).toBe(false);
        });

        it("should return false when isRedeemSuccess is false", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            (mockFSBPromotionStore as any).isRedeemSuccess = false;
            expect(store.isRedeemSuccess()).toBe(false);
        });

        it("should return false when pendingUIEvent is null", () => {
            store.pendingUIEvent = null;
            (mockFSBPromotionStore as any).isRedeemSuccess = true;
            expect(store.isRedeemSuccess()).toBe(false);
        });
    });

    describe("isShowFsbBanner", () => {
        it("should return true when event matches and isRedeemSuccess is false", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            (mockFSBPromotionStore as any).isRedeemSuccess = false;
            expect(store.isShowFsbBanner()).toBe(true);
        });

        it("should return false when event doesn't match", () => {
            store.pendingUIEvent = { event: "OTHER_EVENT" };
            (mockFSBPromotionStore as any).isRedeemSuccess = false;
            expect(store.isShowFsbBanner()).toBe(false);
        });

        it("should return false when isRedeemSuccess is true", () => {
            store.pendingUIEvent = { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION };
            (mockFSBPromotionStore as any).isRedeemSuccess = true;
            expect(store.isShowFsbBanner()).toBe(false);
        });

        it("should return false when pendingUIEvent is null", () => {
            store.pendingUIEvent = null;
            (mockFSBPromotionStore as any).isRedeemSuccess = false;
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

    // Integration scenarios focused by business workflow (SRP)
    describe("FSB Promotion Lifecycle Integration", () => {
        describe("complete promotion lifecycle", () => {
            it("should transition from Idle to Ready when promotion is received", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                
                // Initial state - no promotion
                expect(testStore.fsbState).toBe(FSBPromotionState.Idle);

                // Receive promotion and set spin count
                const fsbStore = TestDependencyFactory.createFSBPromotionStore({
                    promotion: { promotionId: "123", initialBonusItem: 5 }
                });
                (testStore as any).fsbPromotionStore = fsbStore;
                testStore.currentSpinCount = 5;
                
                expect(testStore.fsbState).toBe(FSBPromotionState.Ready);
            });

            it("should transition from Ready to Spinning when FSB is consumed", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createReadyToSpinScenario();
                
                // Start spinning by consuming FSB
                testStore.fsbConsumedThisRound = true;
                
                expect(testStore.fsbState).toBe(FSBPromotionState.Spinning);
            });

            it("should transition to Finished when server confirms end", () => {
                const { store: testStore } = FSBPromotionScenarioBuilder.createSpinningScenario();
                
                // Server confirms promotion end
                testStore.hasServerFinishPromotion = true;
                
                expect(testStore.fsbState).toBe(FSBPromotionState.Finished);
            });
        });

        describe("FSB spin consumption workflow", () => {
            it("should consume FSB spin successfully when conditions are met", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                testStore.currentSpinCount = 3;
                testStore.fsbConsumedThisRound = false;

                const result = testStore.tryConsumeFSB();

                expect(result).toBe(true);
                expect(testStore.currentSpinCount).toBe(2);
                expect(testStore.fsbConsumedThisRound).toBe(true);
            });

            it("should prevent double consumption within same round", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                testStore.currentSpinCount = 3;
                testStore.fsbConsumedThisRound = true; // Already consumed

                const result = testStore.tryConsumeFSB();

                expect(result).toBe(false);
                expect(testStore.currentSpinCount).toBe(3);
                expect(testStore.fsbConsumedThisRound).toBe(true);
            });

            it("should support undo functionality for last spin", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                testStore.currentSpinCount = 2;
                testStore.fsbConsumedThisRound = true;
                testStore.resumedFSBPromotion = false;

                const result = testStore.undoLastFSBSpin();

                expect(result).toBe(true);
                expect(testStore.currentSpinCount).toBe(3);
                expect(testStore.fsbConsumedThisRound).toBe(false);
            });

            it("should commit FSB consumption for next round", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                testStore.fsbConsumedThisRound = true;

                testStore.commitFSB();

                expect(testStore.fsbConsumedThisRound).toBe(false);
            });
        });

        describe("turn over progress tracking workflow", () => {
            it("should update progress when data changes", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                const initialData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };

                const result = testStore.updateTOProgress(initialData);

                expect(result).toBe(true);
                expect(testStore.toProgress).toEqual(initialData);
            });

            it("should detect changes in progress data", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                const initialData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };
                const updatedData = { win: 200, totalTO: 1000, minTO: 100, progress: 0.2 };

                testStore.updateTOProgress(initialData);
                const result = testStore.updateTOProgress(updatedData);

                expect(result).toBe(true);
                expect(testStore.toProgress).toEqual(updatedData);
            });

            it("should ignore identical progress updates", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };

                testStore.updateTOProgress(progressData);
                const result = testStore.updateTOProgress(progressData);

                expect(result).toBe(false);
            });

            it("should support progress reset functionality", () => {
                const testStore = FSBPromotionUIStoreTestHelper.createStore();
                const progressData = { win: 100, totalTO: 1000, minTO: 100, progress: 0.1 };

                testStore.updateTOProgress(progressData);
                testStore.resetTOProgress();

                expect(testStore.toProgress).toBeNull();
            });
        });
    });
});
