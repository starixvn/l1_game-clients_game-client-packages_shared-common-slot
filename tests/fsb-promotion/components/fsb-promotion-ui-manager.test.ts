import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FSBPromotionUIStore, FSBPromotionState, FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";

// Mock decorators first - inline to avoid hoisting issues
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock dependencies - inline to avoid hoisting issues
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

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
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

// Mock Factories (SRP - Single responsibility for creating mocks)
class MockDependencyFactory {
    static createSiteConfigsMock(systemType: string = "DEFAULT"): any {
        return {
            systemType,
        };
    }

    static createFSBPromotionStoreMock(overrides: any = {}): any {
        return {
            promotion: null,
            finishPromotion: null,
            isRedeemSuccess: false,
            isClaimed: false,
            ...overrides,
        };
    }

    static createCascadingUIStoreMock(overrides: any = {}): any {
        return {
            isUsedFSBPromotionBonus: false,
            fsbPromotionInProgress: false,
            ...overrides,
        };
    }

    static createStorageManagerMock(): any {
        const mockStorageManager = require("@sg/game-client-base").StorageManager;
        mockStorageManager.get.mockReturnValue(null);
        return mockStorageManager;
    }
}

// Test Data Builders (OCP - Open for extension, closed for modification)
class FSBPromotionTestDataBuilder {
    private promotion: any = null;

    static create(): FSBPromotionTestDataBuilder {
        return new FSBPromotionTestDataBuilder();
    }

    withId(id: string): FSBPromotionTestDataBuilder {
        this.promotion = { ...this.promotion, id };
        return this;
    }

    withGiftCode(isGiftCode: boolean): FSBPromotionTestDataBuilder {
        this.promotion = { ...this.promotion, isGiftCode };
        return this;
    }

    build(): any {
        return this.promotion;
    }

    // Convenience methods
    static createBasicPromotion(): any {
        return this.create().withId("test").build();
    }

    static createGiftCodePromotion(): any {
        return this.create().withId("gift-test").withGiftCode(true).build();
    }

    static createRegularPromotion(): any {
        return this.create().withId("regular-test").withGiftCode(false).build();
    }
}

class TOProgressTestDataBuilder {
    private data: any = {};

    static create(): TOProgressTestDataBuilder {
        return new TOProgressTestDataBuilder();
    }

    withWin(win: number): TOProgressTestDataBuilder {
        this.data.win = win;
        return this;
    }

    withTotalTO(totalTO: number): TOProgressTestDataBuilder {
        this.data.totalTO = totalTO;
        return this;
    }

    withMinTO(minTO: number): TOProgressTestDataBuilder {
        this.data.minTO = minTO;
        return this;
    }

    withProgress(progress: number): TOProgressTestDataBuilder {
        this.data.progress = progress;
        return this;
    }

    build(): any {
        return {
            win: this.data.win || 100,
            totalTO: this.data.totalTO || 200,
            minTO: this.data.minTO || 50,
            progress: this.data.progress || 0.5,
            ...this.data,
        };
    }

    // Convenience methods
    static createBasicProgress(): any {
        return this.create().build();
    }

    static createCompletedProgress(): any {
        return this.create().withProgress(1.0).build();
    }
}

// Store Setup Helper (SRP - focused on store setup)
class StoreTestSetupHelper {
    static createFSBPromotionUIStore(): FSBPromotionUIStore {
        return new FSBPromotionUIStore();
    }

    static injectDependencies(store: FSBPromotionUIStore, dependencies: any): void {
        Object.defineProperty(store, 'siteConfigs', {
            value: dependencies.siteConfigs,
            writable: true
        });
        Object.defineProperty(store, 'fsbPromotionStore', {
            value: dependencies.fsbPromotionStore,
            writable: true
        });
        Object.defineProperty(store, 'cascadingUIStore', {
            value: dependencies.cascadingUIStore,
            writable: true
        });
    }

    static createCompleteStoreSetup(): any {
        const dependencies = {
            siteConfigs: MockDependencyFactory.createSiteConfigsMock(),
            fsbPromotionStore: MockDependencyFactory.createFSBPromotionStoreMock(),
            cascadingUIStore: MockDependencyFactory.createCascadingUIStoreMock(),
            storageManager: MockDependencyFactory.createStorageManagerMock(),
        };

        const store = this.createFSBPromotionUIStore();
        this.injectDependencies(store, dependencies);

        return { store, dependencies };
    }
}

// Specialized Test Helpers (ISP - Interface Segregation for different test concerns)
class StateTestHelper {
    static testFSBState(
        store: FSBPromotionUIStore,
        dependencies: any,
        setup: any,
        expectedState: FSBPromotionState
    ): void {
        // Arrange
        Object.assign(dependencies.fsbPromotionStore, setup.fsbPromotionStore || {});
        Object.assign(store, setup.storeProps || {});

        // Act & Assert
        expect(store.fsbState).toBe(expectedState);

        // Check side effects if any
        if (setup.expectedSideEffects) {
            setup.expectedSideEffects.forEach((effect: any) => {
                expect(dependencies.cascadingUIStore[effect.property]).toBe(effect.value);
            });
        }
    }

    static testComputedProperty(
        store: FSBPromotionUIStore,
        dependencies: any,
        setup: any,
        propertyName: string,
        expectedValue: any
    ): void {
        // Arrange
        Object.assign(dependencies.fsbPromotionStore, setup.fsbPromotionStore || {});
        Object.assign(dependencies.cascadingUIStore, setup.cascadingUIStore || {});
        Object.assign(store, setup.storeProps || {});

        // Act & Assert
        expect(store[propertyName as keyof FSBPromotionUIStore]).toBe(expectedValue);
    }
}

class FSBConsumptionTestHelper {
    static testFSBConsumption(
        store: FSBPromotionUIStore,
        initialState: any,
        expectedResult: boolean,
        expectedFinalState: any
    ): void {
        // Arrange
        Object.assign(store, initialState);

        // Act
        const result = store.tryConsumeFSB();

        // Assert
        expect(result).toBe(expectedResult);
        Object.entries(expectedFinalState).forEach(([key, value]) => {
            expect((store as any)[key]).toBe(value);
        });
    }

    static testFSBUndo(
        store: FSBPromotionUIStore,
        initialState: any,
        expectedResult: boolean,
        expectedFinalState: any
    ): void {
        // Arrange
        Object.assign(store, initialState);

        // Act
        const result = store.undoLastFSBSpin();

        // Assert
        expect(result).toBe(expectedResult);
        Object.entries(expectedFinalState).forEach(([key, value]) => {
            expect((store as any)[key]).toBe(value);
        });
    }
}

class PropertyTestHelper {
    static testGetterSetter<T>(store: FSBPromotionUIStore, propertyName: string, value: T): void {
        (store as any)[propertyName] = value;
        expect((store as any)[propertyName]).toBe(value);
    }

    static testPropertyInitialization(store: FSBPromotionUIStore, expectedValues: Record<string, any>): void {
        Object.entries(expectedValues).forEach(([property, expectedValue]) => {
            expect((store as any)[property]).toEqual(expectedValue);
        });
    }
}

class ResetTestHelper {
    static setupComplexState(store: FSBPromotionUIStore): void {
        store.receivedPromotionInGame = true;
        store.skipGiftCode = true;
        store.resumedFSBPromotion = true;
        store.activeTransitionEffect = true;
        store.activeDetailPromo = true;
        store.hasServerFinishPromotion = true;
        store.fsbConsumedThisRound = true;
        store.currentSpinCount = 5;
        store.toProgress = TOProgressTestDataBuilder.createBasicProgress();
    }

    static verifyResetState(store: FSBPromotionUIStore): void {
        const expectedResetValues = {
            receivedPromotionInGame: false,
            skipGiftCode: false,
            resumedFSBPromotion: false,
            activeTransitionEffect: false,
            activeDetailPromo: false,
            hasServerFinishPromotion: false,
            fsbConsumedThisRound: false,
            currentSpinCount: -1,
            toProgress: null,
        };

        PropertyTestHelper.testPropertyInitialization(store, expectedResetValues);
    }
}

describe("FSBPromotionUIStore", () => {
    let testSetup: any;
    let store: FSBPromotionUIStore;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create complete store setup
        testSetup = StoreTestSetupHelper.createCompleteStoreSetup();
        store = testSetup.store;
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            const expectedInitialValues = {
                receivedPromotionInGame: false,
                skipGiftCode: false,
                activeTransitionEffect: false,
                activeDetailPromo: false,
                currentSpinCount: -1,
                resumedFSBPromotion: false,
                hasServerFinishPromotion: false,
                fsbConsumedThisRound: false,
                promotionUrl: "",
                isWebViewLoading: false,
                isFSBInfoReady: false,
                isTrialMode: false,
                pendingOpenTOAfterFinish: false,
                isClickPlayNow: false,
                pendingUIEvent: null,
            };

            PropertyTestHelper.testPropertyInitialization(store, expectedInitialValues);
        });

        it("should initialize gameOffers with settings", () => {
            expect(store.gameOffers).toEqual([{ name: "testgame", gameId: 123 }]);
        });

        it("should call mobx.makeAutoObservable", () => {
            const mobx = require("mobx");
            expect(mobx.makeAutoObservable).toHaveBeenCalledWith(store);
        });
    });

    describe("getters and setters", () => {
        const propertyTestCases = [
            { property: "currentSpinCount", value: 5, description: "numerical property" },
            { property: "activeDetailPromo", value: true, description: "boolean property" },
            { property: "skipGiftCode", value: true, description: "boolean property" },
            { property: "receivedPromotionInGame", value: true, description: "boolean property" },
            { property: "activeTransitionEffect", value: true, description: "boolean property" },
            { property: "promotionUrl", value: "https://example.com", description: "string property" },
            { property: "isWebViewLoading", value: true, description: "boolean property" },
        ];

        propertyTestCases.forEach(({ property, value, description }) => {
            it(`should get and set ${property} correctly (${description})`, () => {
                PropertyTestHelper.testGetterSetter(store, property, value);
            });
        });

        it("should handle edge cases for currentSpinCount", () => {
            const edgeCases = [0, -1, 100, -999];
            edgeCases.forEach(value => {
                PropertyTestHelper.testGetterSetter(store, "currentSpinCount", value);
            });
        });

        it("should handle empty string for promotionUrl", () => {
            PropertyTestHelper.testGetterSetter(store, "promotionUrl", "");
        });
    });

    describe("computed properties", () => {
        describe("isEligibleForNextFSBSpin", () => {
            const eligibilityTestCases = [
                {
                    description: "conditions not met",
                    setup: {
                        storeProps: { currentSpinCount: 0, isFSBInfoReady: false, isUsedFSBPromotionBonus: false }
                    },
                    expected: false
                },
                {
                    description: "all conditions met",
                    setup: {
                        storeProps: { currentSpinCount: 3, isFSBInfoReady: true, isUsedFSBPromotionBonus: true }
                    },
                    expected: true
                },
                {
                    description: "currentSpinCount is 0",
                    setup: {
                        storeProps: { currentSpinCount: 0, isFSBInfoReady: true, isUsedFSBPromotionBonus: true }
                    },
                    expected: false
                },
                {
                    description: "FSB info not ready",
                    setup: {
                        storeProps: { currentSpinCount: 3, isFSBInfoReady: false, isUsedFSBPromotionBonus: true }
                    },
                    expected: false
                }
            ];

            eligibilityTestCases.forEach(({ description, setup, expected }) => {
                it(`should return ${expected} when ${description}`, () => {
                    StateTestHelper.testComputedProperty(
                        store,
                        testSetup.dependencies,
                        setup,
                        "isEligibleForNextFSBSpin",
                        expected
                    );
                });
            });
        });

        describe("isFSBPromotionInProgress", () => {
            const progressTestCases = [
                {
                    description: "state is Idle",
                    setup: {
                        fsbPromotionStore: { promotion: null },
                        storeProps: { currentSpinCount: -1 }
                    },
                    expected: false
                },
                {
                    description: "state is Ready",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { currentSpinCount: 3, fsbConsumedThisRound: false }
                    },
                    expected: true
                },
                {
                    description: "state is Spinning",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { currentSpinCount: 3, fsbConsumedThisRound: true }
                    },
                    expected: true
                }
            ];

            progressTestCases.forEach(({ description, setup, expected }) => {
                it(`should return ${expected} when ${description}`, () => {
                    StateTestHelper.testComputedProperty(
                        store,
                        testSetup.dependencies,
                        setup,
                        "isFSBPromotionInProgress",
                        expected
                    );
                });
            });
        });

        describe("fsbState", () => {
            const fsbStateTestCases = [
                {
                    description: "no promotion",
                    setup: {
                        fsbPromotionStore: { promotion: null },
                        storeProps: {}
                    },
                    expectedState: FSBPromotionState.Idle
                },
                {
                    description: "hasServerFinishPromotion is true",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { hasServerFinishPromotion: true }
                    },
                    expectedState: FSBPromotionState.Finished
                },
                {
                    description: "resumedFSBPromotion is true",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { resumedFSBPromotion: true }
                    },
                    expectedState: FSBPromotionState.Resumed
                },
                {
                    description: "currentSpinCount >= 0 and fsbConsumedThisRound",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { currentSpinCount: 2, fsbConsumedThisRound: true }
                    },
                    expectedState: FSBPromotionState.Spinning
                },
                {
                    description: "currentSpinCount >= 0",
                    setup: {
                        fsbPromotionStore: { promotion: { id: "test" } },
                        storeProps: { currentSpinCount: 2 }
                    },
                    expectedState: FSBPromotionState.Ready
                }
            ];

            fsbStateTestCases.forEach(({ description, setup, expectedState }) => {
                it(`should return ${FSBPromotionState[expectedState]} when ${description}`, () => {
                    StateTestHelper.testFSBState(
                        store,
                        testSetup.dependencies,
                        setup,
                        expectedState
                    );
                });
            });
        });
    });

    describe("state management methods", () => {
        describe("reset", () => {
            it("should reset all state properties to initial values", () => {
                // Arrange
                ResetTestHelper.setupComplexState(store);

                // Act
                store.reset();

                // Assert
                ResetTestHelper.verifyResetState(store);
            });
        });

        describe("hasPromo", () => {
            const hasPromoTestCases = [
                { promotion: null, expected: false, description: "no promotion" },
                { promotion: { id: "test" }, expected: true, description: "promotion exists" },
                { promotion: FSBPromotionTestDataBuilder.createBasicPromotion(), expected: true, description: "basic promotion" }
            ];

            hasPromoTestCases.forEach(({ promotion, expected, description }) => {
                it(`should return ${expected} when ${description}`, () => {
                // Arrange
                    testSetup.dependencies.fsbPromotionStore.promotion = promotion;

                    // Act & Assert
                    expect(store.hasPromo()).toBe(expected);
                });
            });
        });

        describe("shouldSkipPromo", () => {
            const skipPromoTestCases = [
                {
                    description: "no skip settings",
                    setup: {
                        storageReturn: null,
                        systemType: "DEFAULT",
                        promotion: null
                    },
                    expected: false
                },
                {
                    description: "systemType is SC",
                    setup: {
                        storageReturn: null,
                        systemType: "sc",
                        promotion: null
                    },
                    expected: true
                },
                {
                    description: "dontShowAgain is set and not gift code",
                    setup: {
                        storageReturn: { dontShowAgain: true },
                        systemType: "DEFAULT",
                        promotion: FSBPromotionTestDataBuilder.createRegularPromotion()
                    },
                    expected: true
                },
                {
                    description: "dontShowAgain is set but is gift code",
                    setup: {
                        storageReturn: { dontShowAgain: true },
                        systemType: "DEFAULT",
                        promotion: FSBPromotionTestDataBuilder.createGiftCodePromotion()
                    },
                    expected: false
                }
            ];

            skipPromoTestCases.forEach(({ description, setup, expected }) => {
                it(`should return ${expected} when ${description}`, () => {
                // Arrange
                    testSetup.dependencies.storageManager.get.mockReturnValue(setup.storageReturn);
                    testSetup.dependencies.siteConfigs.systemType = setup.systemType;
                    testSetup.dependencies.fsbPromotionStore.promotion = setup.promotion;

                    // Act & Assert
                    expect(store.shouldSkipPromo()).toBe(expected);
                });
            });
        });
    });

    describe("FSB consumption methods", () => {
        describe("tryConsumeFSB", () => {
            const consumptionTestCases = [
                {
                    description: "currentSpinCount is 0",
                    initialState: { currentSpinCount: 0, fsbConsumedThisRound: false },
                    expectedResult: false,
                    expectedFinalState: { currentSpinCount: 0, fsbConsumedThisRound: false }
                },
                {
                    description: "conditions are met",
                    initialState: { currentSpinCount: 3, fsbConsumedThisRound: false },
                    expectedResult: true,
                    expectedFinalState: { currentSpinCount: 2, fsbConsumedThisRound: true }
                },
                {
                    description: "already consumed this round",
                    initialState: { currentSpinCount: 3, fsbConsumedThisRound: true },
                    expectedResult: false,
                    expectedFinalState: { currentSpinCount: 3, fsbConsumedThisRound: true }
                }
            ];

            consumptionTestCases.forEach(({ description, initialState, expectedResult, expectedFinalState }) => {
                it(`should return ${expectedResult} when ${description}`, () => {
                    FSBConsumptionTestHelper.testFSBConsumption(
                        store,
                        initialState,
                        expectedResult,
                        expectedFinalState
                    );
                });
            });
        });

        describe("undoLastFSBSpin", () => {
            const undoTestCases = [
                {
                    description: "fsbConsumedThisRound is false",
                    initialState: { fsbConsumedThisRound: false, currentSpinCount: 2 },
                    expectedResult: false,
                    expectedFinalState: { fsbConsumedThisRound: false, currentSpinCount: 2 }
                },
                {
                    description: "conditions are met",
                    initialState: { 
                        fsbConsumedThisRound: true, 
                        resumedFSBPromotion: false, 
                        currentSpinCount: 2 
                    },
                    expectedResult: true,
                    expectedFinalState: { 
                        fsbConsumedThisRound: false, 
                        currentSpinCount: 3 
                    }
                },
                {
                    description: "resumed promotion",
                    initialState: { 
                        fsbConsumedThisRound: true, 
                        resumedFSBPromotion: true, 
                        currentSpinCount: 2 
                    },
                    expectedResult: false,
                    expectedFinalState: { 
                        fsbConsumedThisRound: true, 
                        currentSpinCount: 2 
                    }
                }
            ];

            undoTestCases.forEach(({ description, initialState, expectedResult, expectedFinalState }) => {
                it(`should return ${expectedResult} when ${description}`, () => {
                    FSBConsumptionTestHelper.testFSBUndo(
                        store,
                        initialState,
                        expectedResult,
                        expectedFinalState
                    );
                });
            });
        });

        describe("commitFSB", () => {
            const commitTestCases = [
                { initialValue: true, description: "fsbConsumedThisRound is true" },
                { initialValue: false, description: "fsbConsumedThisRound is false" }
            ];

            commitTestCases.forEach(({ initialValue, description }) => {
                it(`should reset fsbConsumedThisRound when ${description}`, () => {
                    // Arrange
                    store.fsbConsumedThisRound = initialValue;

                    // Act
                    store.commitFSB();

                    // Assert
                    expect(store.fsbConsumedThisRound).toBe(false);
                });
            });
        });
    });

    describe("UI event management", () => {
        describe("addPendingUIEvent", () => {
            const eventTestCases = [
                { event: FreeSpinsPromotionEvents.OPEN_GIFT_CODE, data: undefined, description: "without data" },
                { event: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION, data: "test-data", description: "with data" }
            ];

            eventTestCases.forEach(({ event, data, description }) => {
                it(`should add pending UI event ${description}`, () => {
                    // Act
                    store.addPendingUIEvent(event, data);

                    // Assert
                    expect(store.pendingUIEvent).toEqual({
                        event,
                        data,
                    });
                });
            });
        });

        describe("isRedeemSuccess", () => {
            const redeemSuccessTestCases = [
                {
                    description: "conditions are met",
                    setup: {
                        pendingEvent: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION,
                        isRedeemSuccess: true
                    },
                    expected: true
                },
                {
                    description: "no pending event",
                    setup: {
                        pendingEvent: null,
                        isRedeemSuccess: true
                    },
                    expected: false
                },
                {
                    description: "redeem not successful",
                    setup: {
                        pendingEvent: FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION,
                        isRedeemSuccess: false
                    },
                    expected: false
                }
            ];

            redeemSuccessTestCases.forEach(({ description, setup, expected }) => {
                it(`should return ${expected} when ${description}`, () => {
                    // Arrange
                    if (setup.pendingEvent) {
                        store.addPendingUIEvent(setup.pendingEvent);
                    }
                    testSetup.dependencies.fsbPromotionStore.isRedeemSuccess = setup.isRedeemSuccess;

                    // Act & Assert
                    expect(store.isRedeemSuccess()).toBe(expected);
                });
            });
        });
    });

    describe("utility methods", () => {
        const utilityMethodTestCases = [
            {
                method: "setWebViewLoading",
                args: [true],
                expectedProperty: "isWebViewLoading",
                expectedValue: true,
                description: "set loading to true"
            },
            {
                method: "setWebViewLoading",
                args: [false],
                expectedProperty: "isWebViewLoading",
                expectedValue: false,
                description: "set loading to false"
            },
            {
                method: "markServerConfirmedEnd",
                args: [],
                expectedProperty: "hasServerFinishPromotion",
                expectedValue: true,
                description: "mark server confirmed end"
            },
            {
                method: "setFSBInfoReady",
                args: [true],
                expectedProperty: "isFSBInfoReady",
                expectedValue: true,
                description: "set FSB info ready to true"
            }
        ];

        utilityMethodTestCases.forEach(({ method, args, expectedProperty, expectedValue, description }) => {
            it(`should ${description}`, () => {
                // Act
                (store as any)[method](...args);

                // Assert
                expect((store as any)[expectedProperty]).toBe(expectedValue);
            });
        });
    });
});
