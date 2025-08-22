import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FSBPromotionUIStore, FSBPromotionState, FreeSpinsPromotionEvents } from "../../scripts/stores/fsb-promotion-ui-store";

// Mock decorators first
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock dependencies
jest.mock("@sg/game-client-base", () => {
    const mockGC = {
        StorageManager: {
            get: jest.fn(),
        },
        FormatUtils: {
            numberWithCommas: jest.fn().mockReturnValue("1,000.00")
        },
        Player: {
            MainPlayerStore: {
                balance: 1000,
            }
        },
        Configs: {
            SiteConfigs: function MockSiteConfigs() {
                return {
                    systemType: "test",
                };
            }
        },
        Connection: {
            ConnectionStore: {
                connection: {
                    on: jest.fn(),
                },
            }
        },
        Auth: {
            AuthStore: {
                session: "test_session",
                username: "test_username",
                language: "en",
            }
        },
        Notices: {
            NoticeStore: {
                addWarning: jest.fn(),
            },
            NoticeErrorsHandlers: {
                AutoSignOutHandler: jest.fn(() => ({})),
            },
        },
        Notification: {
            NotificationStore: {
                connection: {
                    on: jest.fn(),
                },
            }
        }
    };

    return {
        __esModule: true,
        default: mockGC,
        ...mockGC // Also export as named exports
    };
});

jest.mock("mobx", () => ({
    makeAutoObservable: jest.fn(),
}));

jest.mock("../../scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: function MockFSBPromotionStore() {
        return {
            promotion: null,
            finishPromotion: null,
            isRedeemSuccess: false,
            isClaimed: false,
        };
    },
}));

jest.mock("inversify", () => ({
    injectable: jest.fn(() => jest.fn()),
    inject: jest.fn(() => jest.fn()),
}));

jest.mock("db://assets/game/scripts/game-settings", () => ({
    settings: {
        name: "TestGame",
        id: 123,
    },
}));

jest.mock("db://shared-cascading-slot/stores/cascading-ui-store", () => ({
    CascadingUIStore: function MockCascadingUIStore() {
        return {
            isUsedFSBPromotionBonus: false,
            fsbPromotionInProgress: false,
        };
    },
}));

describe("FSBPromotionUIStore", () => {
    let store: FSBPromotionUIStore;
    let mockSiteConfigs: any;
    let mockFSBPromotionStore: any;
    let mockCascadingUIStore: any;
    let mockStorageManager: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock dependencies
        mockSiteConfigs = {
            systemType: "DEFAULT",
        };

        mockFSBPromotionStore = {
            promotion: null,
            finishPromotion: null,
            isRedeemSuccess: false,
            isClaimed: false,
        };

        mockCascadingUIStore = {
            isUsedFSBPromotionBonus: false,
            fsbPromotionInProgress: false,
        };

        // Mock StorageManager
        const gc = require("@sg/game-client-base");
        mockStorageManager = gc.StorageManager;
        mockStorageManager.get.mockReturnValue(null);

        // Create store instance
        store = new FSBPromotionUIStore();
        
        // Inject dependencies manually (since we're bypassing DI container)
        Object.defineProperty(store, 'siteConfigs', {
            value: mockSiteConfigs,
            writable: true
        });
        Object.defineProperty(store, 'fsbPromotionStore', {
            value: mockFSBPromotionStore,
            writable: true
        });
        Object.defineProperty(store, 'cascadingUIStore', {
            value: mockCascadingUIStore,
            writable: true
        });
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            // Assert
            expect(store.receivedPromotionInGame).toBe(false);
            expect(store.skipGiftCode).toBe(false);
            expect(store.activeTransitionEffect).toBe(false);
            expect(store.activeDetailPromo).toBe(false);
            expect(store.currentSpinCount).toBe(-1);
            expect(store.resumedFSBPromotion).toBe(false);
            expect(store.hasServerFinishPromotion).toBe(false);
            expect(store.fsbConsumedThisRound).toBe(false);
            expect(store.promotionUrl).toBe("");
            expect(store.isWebViewLoading).toBe(false);
            expect(store.isFSBInfoReady).toBe(false);
            expect(store.isTrialMode).toBe(false);
            expect(store.pendingOpenTOAfterFinish).toBe(false);
            expect(store.isClickPlayNow).toBe(false);
            expect(store.pendingUIEvent).toBe(null);
        });

        it("should initialize gameOffers with settings", () => {
            // Assert
            expect(store.gameOffers).toEqual([{ name: "testgame", gameId: 123 }]);
        });

        it("should call mobx.makeAutoObservable", () => {
            // Assert
            const mobx = require("mobx");
            expect(mobx.makeAutoObservable).toHaveBeenCalledWith(store);
        });
    });

    describe("getters and setters", () => {
        describe("currentSpinCount", () => {
            it("should get and set currentSpinCount correctly", () => {
                // Act
                store.currentSpinCount = 5;

                // Assert
                expect(store.currentSpinCount).toBe(5);
            });
        });

        describe("activeDetailPromo", () => {
            it("should get and set activeDetailPromo correctly", () => {
                // Act
                store.activeDetailPromo = true;

                // Assert
                expect(store.activeDetailPromo).toBe(true);
            });
        });

        describe("skipGiftCode", () => {
            it("should get and set skipGiftCode correctly", () => {
                // Act
                store.skipGiftCode = true;

                // Assert
                expect(store.skipGiftCode).toBe(true);
            });
        });
    });

    describe("computed properties", () => {
        describe("isEligibleForNextFSBSpin", () => {
            it("should return false when conditions are not met", () => {
                // Assert
                expect(store.isEligibleForNextFSBSpin).toBe(false);
            });

            it("should return true when all conditions are met", () => {
                // Arrange
                mockCascadingUIStore.isUsedFSBPromotionBonus = true;
                store.currentSpinCount = 3;
                store.setFSBInfoReady(true);

                // Assert
                expect(store.isEligibleForNextFSBSpin).toBe(true);
            });

            it("should return false when currentSpinCount is 0", () => {
                // Arrange
                mockCascadingUIStore.isUsedFSBPromotionBonus = true;
                store.currentSpinCount = 0;
                store.setFSBInfoReady(true);

                // Assert
                expect(store.isEligibleForNextFSBSpin).toBe(false);
            });
        });

        describe("isFSBPromotionInProgress", () => {
            it("should return false when state is Idle", () => {
                // Assert
                expect(store.isFSBPromotionInProgress).toBe(false);
            });

            it("should return true when state is Ready", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.currentSpinCount = 3;

                // Assert
                expect(store.isFSBPromotionInProgress).toBe(true);
            });

            it("should return true when state is Spinning", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.currentSpinCount = 3;
                store.fsbConsumedThisRound = true;

                // Assert
                expect(store.isFSBPromotionInProgress).toBe(true);
            });
        });

        describe("fsbState", () => {
            it("should return Idle when no promotion", () => {
                // Arrange
                mockFSBPromotionStore.promotion = null;

                // Assert
                expect(store.fsbState).toBe(FSBPromotionState.Idle);
            });

            it("should return Finished when hasServerFinishPromotion is true", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.hasServerFinishPromotion = true;

                // Assert
                expect(store.fsbState).toBe(FSBPromotionState.Finished);
            });

            it("should return Resumed when resumedFSBPromotion is true", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.resumedFSBPromotion = true;

                // Assert
                expect(store.fsbState).toBe(FSBPromotionState.Resumed);
            });

            it("should return Spinning when currentSpinCount >= 0 and fsbConsumedThisRound", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.currentSpinCount = 2;
                store.fsbConsumedThisRound = true;

                // Act & Assert
                expect(store.fsbState).toBe(FSBPromotionState.Spinning);
                expect(mockCascadingUIStore.fsbPromotionInProgress).toBe(true);
            });

            it("should return Ready when currentSpinCount >= 0", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };
                store.currentSpinCount = 2;

                // Assert
                expect(store.fsbState).toBe(FSBPromotionState.Ready);
            });
        });
    });

    describe("state management methods", () => {
        describe("reset", () => {
            it("should reset all state properties to initial values", () => {
                // Arrange - set some values first
                store.receivedPromotionInGame = true;
                store.skipGiftCode = true;
                store.resumedFSBPromotion = true;
                store.activeTransitionEffect = true;
                store.activeDetailPromo = true;
                store.hasServerFinishPromotion = true;
                store.fsbConsumedThisRound = true;
                store.currentSpinCount = 5;
                store.toProgress = { win: 100, totalTO: 200, minTO: 50, progress: 0.5 };

                // Act
                store.reset();

                // Assert
                expect(store.receivedPromotionInGame).toBe(false);
                expect(store.skipGiftCode).toBe(false);
                expect(store.resumedFSBPromotion).toBe(false);
                expect(store.activeTransitionEffect).toBe(false);
                expect(store.activeDetailPromo).toBe(false);
                expect(store.hasServerFinishPromotion).toBe(false);
                expect(store.fsbConsumedThisRound).toBe(false);
                expect(store.currentSpinCount).toBe(-1);
                expect(store.toProgress).toBe(null);
            });
        });

        describe("hasPromo", () => {
            it("should return false when no promotion", () => {
                // Arrange
                mockFSBPromotionStore.promotion = null;

                // Assert
                expect(store.hasPromo()).toBe(false);
            });

            it("should return true when promotion exists", () => {
                // Arrange
                mockFSBPromotionStore.promotion = { id: "test" };

                // Assert
                expect(store.hasPromo()).toBe(true);
            });
        });

        describe("shouldSkipPromo", () => {
            it("should return false when no skip settings", () => {
                // Arrange
                mockStorageManager.get.mockReturnValue(null);
                mockSiteConfigs.systemType = "DEFAULT";

                // Assert
                expect(store.shouldSkipPromo()).toBe(false);
            });

            it("should return true when systemType is SC", () => {
                // Arrange
                mockSiteConfigs.systemType = "sc";

                // Assert
                expect(store.shouldSkipPromo()).toBe(true);
            });

            it("should return true when dontShowAgain is set and not gift code", () => {
                // Arrange
                mockStorageManager.get.mockReturnValue({ dontShowAgain: true });
                mockFSBPromotionStore.promotion = { isGiftCode: false };

                // Assert
                expect(store.shouldSkipPromo()).toBe(true);
            });

            it("should return false when dontShowAgain is set but is gift code", () => {
                // Arrange
                mockStorageManager.get.mockReturnValue({ dontShowAgain: true });
                mockFSBPromotionStore.promotion = { isGiftCode: true };

                // Assert
                expect(store.shouldSkipPromo()).toBe(false);
            });
        });
    });

    describe("FSB consumption methods", () => {
        describe("tryConsumeFSB", () => {
            it("should return false when currentSpinCount is 0", () => {
                // Arrange
                store.currentSpinCount = 0;
                store.fsbConsumedThisRound = false;

                // Act
                const result = store.tryConsumeFSB();

                // Assert
                expect(result).toBe(false);
                expect(store.currentSpinCount).toBe(0);
                expect(store.fsbConsumedThisRound).toBe(false);
            });

            it("should consume FSB when conditions are met", () => {
                // Arrange
                store.currentSpinCount = 3;
                store.fsbConsumedThisRound = false;

                // Act
                const result = store.tryConsumeFSB();

                // Assert
                expect(result).toBe(true);
                expect(store.currentSpinCount).toBe(2);
                expect(store.fsbConsumedThisRound).toBe(true);
            });
        });

        describe("undoLastFSBSpin", () => {
            it("should return false when fsbConsumedThisRound is false", () => {
                // Arrange
                store.fsbConsumedThisRound = false;

                // Act
                const result = store.undoLastFSBSpin();

                // Assert
                expect(result).toBe(false);
            });

            it("should undo last FSB spin when conditions are met", () => {
                // Arrange
                store.fsbConsumedThisRound = true;
                store.resumedFSBPromotion = false;
                store.currentSpinCount = 2;

                // Act
                const result = store.undoLastFSBSpin();

                // Assert
                expect(result).toBe(true);
                expect(store.fsbConsumedThisRound).toBe(false);
                expect(store.currentSpinCount).toBe(3);
            });
        });

        describe("commitFSB", () => {
            it("should reset fsbConsumedThisRound when true", () => {
                // Arrange
                store.fsbConsumedThisRound = true;

                // Act
                store.commitFSB();

                // Assert
                expect(store.fsbConsumedThisRound).toBe(false);
            });
        });
    });

    describe("UI event management", () => {
        describe("addPendingUIEvent", () => {
            it("should add pending UI event without data", () => {
                // Act
                store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE);

                // Assert
                expect(store.pendingUIEvent).toEqual({
                    event: FreeSpinsPromotionEvents.OPEN_GIFT_CODE,
                    data: undefined,
                });
            });
        });

        describe("isRedeemSuccess", () => {
            it("should return true when conditions are met", () => {
                // Arrange
                store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION);
                mockFSBPromotionStore.isRedeemSuccess = true;

                // Assert
                expect(store.isRedeemSuccess()).toBe(true);
            });
        });
    });

    describe("utility methods", () => {
        describe("setWebViewLoading", () => {
            it("should set isWebViewLoading correctly", () => {
                // Act
                store.setWebViewLoading(true);

                // Assert
                expect(store.isWebViewLoading).toBe(true);
            });
        });

        describe("markServerConfirmedEnd", () => {
            it("should set hasServerFinishPromotion to true", () => {
                // Act
                store.markServerConfirmedEnd();

                // Assert
                expect(store.hasServerFinishPromotion).toBe(true);
            });
        });
    });
});
