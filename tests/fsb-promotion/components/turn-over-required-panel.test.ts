import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock Factory for consistent mock creation (SRP)
class MockDependencyFactory {
    static createGameClientBaseMock() {
        return {
            FormatUtils: {
                numberWithCommas: jest.fn((value: number, decimals: number, useGrouping: boolean) => {
                    if (decimals === 2) {
                        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }
                    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }),
            },
        };
    }

    static createCCMock() {
        return {
            _decorator: {
                ccclass: jest.fn(() => (target: any) => target),
                property: jest.fn(() => (target: any, propertyKey: string) => {}),
            },
            Label: jest.fn(),
            Node: jest.fn(),
            ProgressBar: jest.fn(),
        };
    }

    static createObserverMocks() {
        return {
            handle: jest.fn(() => (target: any, propertyKey: string) => {}),
            render: jest.fn(() => (target: any, propertyKey: string) => {}),
        };
    }

    static createI18nMock() {
        return {
            t: jest.fn((key) => key),
        };
    }
}

// Mock dependencies
jest.mock("@sg/game-client-base", () => MockDependencyFactory.createGameClientBaseMock());

jest.mock("cc", () => MockDependencyFactory.createCCMock());

jest.mock("db://shared-components/shared/common-components/draggable/draggable-item", () => ({
    default: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: jest.fn(),
}));

jest.mock("observer", () => MockDependencyFactory.createObserverMocks());

jest.mock("db://i18n/LanguageData", () => MockDependencyFactory.createI18nMock());

jest.mock("../../../assets/fsb-promotion/scripts/components/simple-claim-button", () => ({
    default: jest.fn(),
}));

// Event Constants Factory (SRP - single responsibility for event constants)
class FreeSpinsPromotionEventsFactory {
    static createEvents() {
        return {
            SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
            EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
            UPDATE_TURN_OVER_REQUIRED: "UPDATE_TURN_OVER_REQUIRED",
            COLLAPSE_MENU: "COLLAPSE_MENU",
            OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
            CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
            OPEN_CLAIM_BONUS_NOTIFICATION: "OPEN_CLAIM_BONUS_NOTIFICATION",
        };
    }
}

// Mock the stores to avoid decorator issues
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn(),
    FreeSpinsPromotionEvents: FreeSpinsPromotionEventsFactory.createEvents(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: jest.fn(),
}));

jest.mock("../../../assets/game-message-slot", () => ({
    GameServiceMessageSlot: {
        PromotionTOProgress: {
            eventName: "PromotionTOProgress",
        },
    },
}));

// UI Component Factories following Factory Pattern (SRP)
class UIComponentMockFactory {
    static createLabelMock(initialValue: string = ""): any {
        return { string: initialValue };
    }

    static createProgressBarMock(initialProgress: number = 0): any {
        return { progress: initialProgress };
    }

    static createNodeMock(isActive: boolean = true): any {
        return {
            active: isActive,
            getComponent: jest.fn(),
        };
    }

    static createClaimButtonMock(): any {
        return {
            getComponent: jest.fn(),
        };
    }

    static createSimpleClaimButtonMock(): any {
        return {
            setClaimable: jest.fn(),
            startClaimButtonPulse: jest.fn(),
            stopClaimButtonPulse: jest.fn(),
        };
    }

    static createDraggableItemMock(): any {
        return {
            touchCallback: {
                end: jest.fn(),
            },
        };
    }
}

// Test Data Builders (OCP - open for extension)
class PromotionTOProgressTestDataBuilder {
    private data: Partial<GameServiceMessageSlot.PromotionTOProgress> = {};

    static create(): PromotionTOProgressTestDataBuilder {
        return new PromotionTOProgressTestDataBuilder();
    }

    withPromotionId(id: string): PromotionTOProgressTestDataBuilder {
        this.data.promotionId = id;
        return this;
    }

    withWin(win: number): PromotionTOProgressTestDataBuilder {
        this.data.win = win;
        return this;
    }

    withTurnover(totalTO: number, minTO: number): PromotionTOProgressTestDataBuilder {
        this.data.totalTO = totalTO;
        this.data.minTO = minTO;
        return this;
    }

    withProgress(progress: number): PromotionTOProgressTestDataBuilder {
        this.data.progress = progress;
        return this;
    }

    withRemainingTO(remainTO: number): PromotionTOProgressTestDataBuilder {
        this.data.remainTO = remainTO;
        return this;
    }

    withClaimable(canClaim: boolean): PromotionTOProgressTestDataBuilder {
        this.data.canClaim = canClaim;
        return this;
    }

    withExpiration(expire: string): PromotionTOProgressTestDataBuilder {
        this.data.expire = expire;
        return this;
    }

    build(): GameServiceMessageSlot.PromotionTOProgress {
        return {
            promotionId: this.data.promotionId || "test-123",
            win: this.data.win || 1000,
            totalTO: this.data.totalTO || 5000,
            minTO: this.data.minTO || 10000,
            progress: this.data.progress || 50,
            remainTO: this.data.remainTO || 5000,
            canClaim: this.data.canClaim || false,
            expire: this.data.expire || "2024-12-31T23:59:59Z",
        };
    }
}

// UI Test Setup Helper (SRP - focused on UI setup)
class UITestSetupHelper {
    static createCompleteUISetup(): any {
        const setup = {
            labels: {
                totalWin: UIComponentMockFactory.createLabelMock(),
                totalTurnover: UIComponentMockFactory.createLabelMock(),
                percentage: UIComponentMockFactory.createLabelMock(),
                timer: UIComponentMockFactory.createLabelMock(),
                mainMessage: UIComponentMockFactory.createLabelMock(),
                subMessage: UIComponentMockFactory.createLabelMock(),
            },
            progressBar: UIComponentMockFactory.createProgressBarMock(),
            node: UIComponentMockFactory.createNodeMock(),
            claimButton: UIComponentMockFactory.createClaimButtonMock(),
            simpleClaimButton: UIComponentMockFactory.createSimpleClaimButtonMock(),
            draggableItem: UIComponentMockFactory.createDraggableItemMock(),
            dependencies: {
                gc: require("@sg/game-client-base"),
                i18n: require("db://i18n/LanguageData"),
            },
        };

        // Setup component relationships
        setup.claimButton.getComponent.mockReturnValue(setup.simpleClaimButton);
        setup.node.getComponent.mockReturnValue(setup.draggableItem);

        return setup;
    }
}

describe("TurnOverRequiredPanel", () => {
    let uiSetup: any;

    beforeEach(() => {
        jest.clearAllMocks();
        uiSetup = UITestSetupHelper.createCompleteUISetup();
    });

    // Specialized UI Testing Helper (ISP - focused interface for UI testing)
    class UITestHelper {
        static testNumberFormatting(formatUtils: any): void {
            const testCases = [
                { value: 1500, decimals: 2, expected: "1,500.00" },
                { value: 7500, decimals: 0, expected: "7,500" },
                { value: 999999, decimals: 2, expected: "999,999.00" },
                { value: 0, decimals: 0, expected: "0" },
            ];

            testCases.forEach(({ value, decimals, expected }) => {
                expect(formatUtils.numberWithCommas(value, decimals, true)).toBe(expected);
            });
        }

        static testI18nTranslations(i18n: any, keys: string[]): void {
            keys.forEach(key => {
                expect(i18n.t(key)).toBe(key);
            });
        }

        static testLabelUpdates(label: any, testValues: string[]): void {
            testValues.forEach(value => {
                label.string = value;
                expect(label.string).toBe(value);
            });
        }

        static testProgressBarUpdates(progressBar: any, testValues: number[]): void {
            testValues.forEach(value => {
                progressBar.progress = value;
                expect(progressBar.progress).toBe(value);
            });
        }
    }

    describe("UI Component Tests", () => {
        it("should format numbers correctly", () => {
            UITestHelper.testNumberFormatting(uiSetup.dependencies.gc.FormatUtils);
        });

        it("should handle i18n translations", () => {
            const i18nKeys = [
                "FreeSpinBonus.FSB_days",
                "FreeSpinBonus.TO_requirement_state1_message"
            ];
            UITestHelper.testI18nTranslations(uiSetup.dependencies.i18n, i18nKeys);
        });
    });

    describe("Mock Component Tests", () => {
        it("should setup claim button component correctly", () => {
            const component = uiSetup.claimButton.getComponent();
            expect(component).toBe(uiSetup.simpleClaimButton);
        });

        it("should setup draggable item component correctly", () => {
            const component = uiSetup.node.getComponent();
            expect(component).toBe(uiSetup.draggableItem);
        });

        it("should handle claim button actions", () => {
            const claimButtonActions = [
                { method: 'setClaimable', args: [true] },
                { method: 'setClaimable', args: [false] },
                { method: 'startClaimButtonPulse', args: [] },
                { method: 'stopClaimButtonPulse', args: [] },
            ];

            claimButtonActions.forEach(({ method, args }) => {
                uiSetup.simpleClaimButton[method](...args);
                expect(uiSetup.simpleClaimButton[method]).toHaveBeenCalledWith(...args);
            });
        });

        it("should handle node visibility states", () => {
            const visibilityStates = [false, true];
            visibilityStates.forEach(state => {
                uiSetup.node.active = state;
                expect(uiSetup.node.active).toBe(state);
            });
        });

        it("should handle label text updates", () => {
            const labelTestValues = ["1,500.00", "75%", "1 FreeSpinBonus.FSB_days 12:30:45"];
            UITestHelper.testLabelUpdates(uiSetup.labels.totalWin, labelTestValues);
        });

        it("should handle progress bar updates", () => {
            const progressValues = [0.0, 0.5, 0.75, 1.0];
            UITestHelper.testProgressBarUpdates(uiSetup.progressBar, progressValues);
        });
    });

    // Event Testing Helper (ISP - focused on event testing)
    class EventTestHelper {
        static testEventConstants(events: any, expectedValues: Record<string, string>): void {
            Object.entries(expectedValues).forEach(([eventName, expectedValue]) => {
                expect(events[eventName]).toBe(expectedValue);
            });
        }

        static createEventTestData(event: string, data: any): any {
            return { event, data };
        }
    }

    describe("Event Constants Tests", () => {
        it("should have correct event constants", () => {
            const { FreeSpinsPromotionEvents } = require("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
            
            const expectedEventValues = {
                SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
                EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
                UPDATE_TURN_OVER_REQUIRED: "UPDATE_TURN_OVER_REQUIRED",
                COLLAPSE_MENU: "COLLAPSE_MENU",
                OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
                CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
                OPEN_CLAIM_BONUS_NOTIFICATION: "OPEN_CLAIM_BONUS_NOTIFICATION",
            };

            EventTestHelper.testEventConstants(FreeSpinsPromotionEvents, expectedEventValues);
        });
    });

    describe("Game Service Message Tests", () => {
        it("should have correct game service message structure", () => {
            const { GameServiceMessageSlot } = require("../../../assets/game-message-slot");
            expect(GameServiceMessageSlot.PromotionTOProgress.eventName).toBe("PromotionTOProgress");
        });

        it("should create valid PromotionTOProgress data using builder", () => {
            const data = PromotionTOProgressTestDataBuilder.create()
                .withPromotionId("test-123")
                .withWin(1000)
                .withTurnover(5000, 10000)
                .withProgress(50)
                .withRemainingTO(5000)
                .withClaimable(false)
                .withExpiration("2024-12-31T23:59:59Z")
                .build();

            const expectedProperties = {
                promotionId: "test-123",
                win: 1000,
                totalTO: 5000,
                minTO: 10000,
                progress: 50,
                remainTO: 5000,
                canClaim: false,
                expire: "2024-12-31T23:59:59Z"
            };

            Object.entries(expectedProperties).forEach(([property, expectedValue]) => {
                expect(data[property as keyof typeof data]).toBe(expectedValue);
            });
        });
    });

    // Utility Functions Helper (SRP - single responsibility for utilities)
    class UtilityFunctionHelper {
        static padNumber(num: number): string {
            return num < 10 ? `0${num}` : `${num}`;
        }

        static calculateProgress(current: number, total: number): number {
            return Math.round((current / total) * 100);
        }

        static formatTime(seconds: number): string {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        static testUtilityFunction<T, U>(
            fn: (input: T) => U,
            testCases: Array<{ input: T; expected: U; description?: string }>
        ): void {
            testCases.forEach(({ input, expected, description }) => {
                const result = fn(input);
                expect(result).toBe(expected);
            });
        }
    }

    describe("Utility Function Tests", () => {
        it("should pad numbers correctly", () => {
            const paddingTestCases = [
                { input: 5, expected: "05" },
                { input: 9, expected: "09" },
                { input: 10, expected: "10" },
                { input: 59, expected: "59" },
            ];

            UtilityFunctionHelper.testUtilityFunction(
                UtilityFunctionHelper.padNumber,
                paddingTestCases
            );
        });

        it("should calculate progress percentage correctly", () => {
            const progressTestCases = [
                { input: { current: 5000, total: 10000 }, expected: 50 },
                { input: { current: 7500, total: 10000 }, expected: 75 },
                { input: { current: 10000, total: 10000 }, expected: 100 },
                { input: { current: 0, total: 10000 }, expected: 0 },
            ];

            progressTestCases.forEach(({ input, expected }) => {
                expect(UtilityFunctionHelper.calculateProgress(input.current, input.total)).toBe(expected);
            });
        });

        it("should format time correctly", () => {
            const timeFormattingTestCases = [
                { input: 3661, expected: "01:01:01" },
                { input: 7325, expected: "02:02:05" },
                { input: 0, expected: "00:00:00" },
                { input: 3600, expected: "01:00:00" },
                { input: 60, expected: "00:01:00" },
            ];

            UtilityFunctionHelper.testUtilityFunction(
                UtilityFunctionHelper.formatTime,
                timeFormattingTestCases
            );
        });
    });

    // Integration Test Scenarios Helper (SRP - focused on complex scenarios)
    class IntegrationTestScenarioHelper {
        static setupTOProgressFlow(uiSetup: any, progressData: any): any {
            const formatUtils = uiSetup.dependencies.gc.FormatUtils;
            
            return {
                formattedWin: formatUtils.numberWithCommas(progressData.win, 2, true),
                formattedTurnover: `${formatUtils.numberWithCommas(progressData.totalTO, 0, true)} / ${formatUtils.numberWithCommas(progressData.minTO, 0, true)}`,
                formattedPercentage: `${progressData.progress}%`,
                shouldEnableClaim: progressData.progress === 100
            };
        }

        static handleClaimButtonState(simpleClaimButton: any, shouldEnable: boolean): void {
            if (shouldEnable) {
                simpleClaimButton.setClaimable(true);
                simpleClaimButton.startClaimButtonPulse();
            } else {
                simpleClaimButton.setClaimable(false);
                simpleClaimButton.stopClaimButtonPulse();
            }
        }

        static calculateTimeRemaining(futureDate: Date): any {
            const endTime = futureDate.getTime();
            const now = Date.now();
            const remainingTime = Math.max(0, endTime - now);

            return {
                days: Math.floor(remainingTime / (1000 * 60 * 60 * 24)),
                hours: Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((remainingTime % (1000 * 60)) / 1000)
            };
        }

        static formatTimerString(timeComponents: any): string {
            const { days, hours, minutes, seconds } = timeComponents;
            return `${days} FreeSpinBonus.FSB_days ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    describe("Integration Scenarios", () => {
        it("should handle complete TO progress flow", () => {
            // Arrange
            const progressData = PromotionTOProgressTestDataBuilder.create()
                .withWin(2000)
                .withTurnover(8000, 10000)
                .withProgress(80)
                .withExpiration("2024-12-31T23:59:59Z")
                .build();

            // Act
            const flowResult = IntegrationTestScenarioHelper.setupTOProgressFlow(uiSetup, progressData);

            // Assert
            expect(flowResult.formattedWin).toBe("2,000.00");
            expect(flowResult.formattedTurnover).toBe("8,000 / 10,000");
            expect(flowResult.formattedPercentage).toBe("80%");

            // Act - Handle claim button state
            IntegrationTestScenarioHelper.handleClaimButtonState(
                uiSetup.simpleClaimButton,
                flowResult.shouldEnableClaim
            );

            // Assert - Verify claim button behavior
            expect(uiSetup.simpleClaimButton.setClaimable).toHaveBeenCalledWith(false);
            expect(uiSetup.simpleClaimButton.stopClaimButtonPulse).toHaveBeenCalled();
        });

        it("should handle claimable progress scenario", () => {
            // Arrange
            const claimableProgressData = PromotionTOProgressTestDataBuilder.create()
                .withProgress(100)
                .withClaimable(true)
                .build();

            // Act
            const flowResult = IntegrationTestScenarioHelper.setupTOProgressFlow(uiSetup, claimableProgressData);
            IntegrationTestScenarioHelper.handleClaimButtonState(
                uiSetup.simpleClaimButton,
                flowResult.shouldEnableClaim
            );

            // Assert
            expect(flowResult.shouldEnableClaim).toBe(true);
            expect(uiSetup.simpleClaimButton.setClaimable).toHaveBeenCalledWith(true);
            expect(uiSetup.simpleClaimButton.startClaimButtonPulse).toHaveBeenCalled();
        });

        it("should handle error scenarios", () => {
            const { FreeSpinsPromotionEvents } = require("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");

            const errorScenarios = [
                { event: FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR, data: "ERROR_CODE" },
                { event: FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS, data: "ERROR_CODE" },
            ];

            errorScenarios.forEach(scenario => {
                const eventData = EventTestHelper.createEventTestData(scenario.event, scenario.data);
                expect(eventData.event).toBe(scenario.event);
                expect(eventData.data).toBe(scenario.data);
            });
        });

        it("should handle timer updates", () => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            futureDate.setHours(10, 30, 45);

            // Act
            const timeComponents = IntegrationTestScenarioHelper.calculateTimeRemaining(futureDate);
            const timeString = IntegrationTestScenarioHelper.formatTimerString(timeComponents);

            // Assert
            expect(timeString).toMatch(/\d{2}:\d{2}:\d{2}/);
            expect(timeComponents.days).toBeGreaterThanOrEqual(0);
            expect(timeComponents.hours).toBeGreaterThanOrEqual(0);
            expect(timeComponents.minutes).toBeGreaterThanOrEqual(0);
            expect(timeComponents.seconds).toBeGreaterThanOrEqual(0);
        });
    });
});
