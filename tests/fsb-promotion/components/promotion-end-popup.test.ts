import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import PromotionEndPopup from "../../../assets/fsb-promotion/scripts/components/promotion-end-popup";
import { Node, Label, Button } from "cc";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";
import { Auth } from "@sg/game-client-base";

// Mock decorators first - inline to avoid hoisting issues
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock _decorator from cc - inline to avoid hoisting issues
jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
        property: jest.fn(() => jest.fn()),
    },
    Node: jest.fn(),
    Label: jest.fn(),
    Button: jest.fn(),
    Vec3: {
        ZERO: { x: 0, y: 0, z: 0 },
        ONE: { x: 1, y: 1, z: 1 },
    },
    tween: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        call: jest.fn().mockReturnThis(),
        start: jest.fn(),
    })),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
    Component: jest.fn(),
    UITransform: jest.fn(),
    Widget: jest.fn(),
}));

// Mock dependencies - inline to avoid hoisting issues
jest.mock("@sg/game-client-base", () => ({
    FormatUtils: {
        numberWithCommas: jest.fn().mockReturnValue("1,000.00")
    },
    Player: {
        MainPlayerStore: {
            balance: 1000,
        }
    },
    Configs: {
        SiteConfigs: {
            env: "test",
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
}));
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {},
}));
jest.mock("db://i18n/LanguageData");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));
jest.mock("../../../assets/game-message-slot");
jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");

// Additional test dependencies are handled by existing mocks above

// Mock Dependency Factories (SRP - Single Responsibility for creating mocks)
// Moved after jest.mock() calls to avoid hoisting issues
class MockDependencyFactory {
    static createReflectMetadataMock() {
        return {
            Reflect: {
                decorate: jest.fn(),
                metadata: jest.fn(() => jest.fn()),
                defineMetadata: jest.fn(),
                getMetadata: jest.fn(),
            },
        };
    }

    static createCocosCreatorMock() {
        return {
            _decorator: {
                ccclass: jest.fn(() => jest.fn()),
                property: jest.fn(() => jest.fn()),
            },
            Node: jest.fn(),
            Label: jest.fn(),
            Button: jest.fn(),
            Vec3: {
                ZERO: { x: 0, y: 0, z: 0 },
                ONE: { x: 1, y: 1, z: 1 },
            },
            tween: jest.fn(() => ({
                to: jest.fn().mockReturnThis(),
                call: jest.fn().mockReturnThis(),
                start: jest.fn(),
            })),
            EventTarget: jest.fn().mockImplementation(() => ({
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
            Component: jest.fn(),
            UITransform: jest.fn(),
            Widget: jest.fn(),
        };
    }

    static createGameClientBaseMock() {
        return {
            FormatUtils: {
                numberWithCommas: jest.fn().mockReturnValue("1,000.00")
            },
            Player: {
                MainPlayerStore: {
                    balance: 1000,
                }
            },
            Configs: {
                SiteConfigs: {
                    env: "test",
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
    }

    static createObserverMocks() {
        return {
            __esModule: true,
            default: {
                render: jest.fn(() => jest.fn()),
                handle: jest.fn(() => jest.fn()),
            },
        };
    }

    static createCascadingSlotMocks() {
        return {
            globalEmitter: {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            },
            SlotClientEvent: {},
            SlotNotification: {},
        };
    }
}

// Test Data Builders (OCP - Open for extension, closed for modification)
class FinishPromotionTestDataBuilder {
    private data: Partial<GameServiceMessageSlot.FinishPromotion> = {};

    static create(): FinishPromotionTestDataBuilder {
        return new FinishPromotionTestDataBuilder();
    }

    withTotalWin(totalWin: number): FinishPromotionTestDataBuilder {
        this.data.totalWin = totalWin;
        return this;
    }

    withEndPromotion(endPromotion: boolean): FinishPromotionTestDataBuilder {
        this.data.endPromotion = endPromotion;
        return this;
    }

    build(): GameServiceMessageSlot.FinishPromotion {
        return {
            totalWin: this.data.totalWin ?? 1000,
            endPromotion: this.data.endPromotion ?? false,
        };
    }

    // Convenience methods for common scenarios
    static createDefault(): GameServiceMessageSlot.FinishPromotion {
        return this.create().build();
    }

    static createWithWin(totalWin: number): GameServiceMessageSlot.FinishPromotion {
        return this.create().withTotalWin(totalWin).build();
    }

    static createWithZeroWin(): GameServiceMessageSlot.FinishPromotion {
        return this.create().withTotalWin(0).build();
    }

    static createHighWin(): GameServiceMessageSlot.FinishPromotion {
        return this.create().withTotalWin(2500.5).build();
    }
}

// UI Component Mock Factory (SRP - Single responsibility for UI mocks)
class UIComponentMockFactory {
    static createLabelMock(initialValue: string = ""): any {
        return { string: initialValue };
    }

    static createButtonMock(): any {
        return {};
    }

    static createNodeMock(active: boolean = false): any {
        return {
            active,
            getComponent: jest.fn(),
        };
    }

    static createDialogMock(): any {
        return {
            hide: jest.fn(),
        };
    }

    static createCompleteUIComponentSetup(): any {
        const dialog = this.createDialogMock();
        const node = this.createNodeMock();
        node.getComponent.mockReturnValue(dialog);

        return {
            node,
            dialog,
            labels: {
                title: this.createLabelMock(),
                mainMessage: this.createLabelMock(),
                subMessage: this.createLabelMock(),
                totalWin: this.createLabelMock(),
            },
            button: this.createButtonMock(),
        };
    }
}

// Component Test Setup Helper (SRP - focused on component setup)
class ComponentTestSetupHelper {
    static createPromotionEndPopupInstance(): PromotionEndPopup {
        return new PromotionEndPopup();
    }

    static setupComponent(component: PromotionEndPopup, uiSetup: any): void {
        component.node = uiSetup.node;
        component.labelTitle = uiSetup.labels.title;
        component.labelMainMessage = uiSetup.labels.mainMessage;
        component.labelSubMessage = uiSetup.labels.subMessage;
        component.labelTotalWin = uiSetup.labels.totalWin;
        component.closeButton = uiSetup.button;

        // Mock methods that will be handled by decorators
        component.closeFSBBanner = jest.fn();
        component.onDestroy = jest.fn();
        (component as any).openTurnOverRequired = jest.fn();
    }

    static setupDependencies(): any {
        const gc = require("@sg/game-client-base");
        const i18n = require("db://i18n/LanguageData");

        // Ensure FormatUtils is available
        if (!gc.FormatUtils) {
            gc.FormatUtils = {};
        }
        gc.FormatUtils.numberWithCommas = jest.fn().mockReturnValue("1,000.00");

        // Setup i18n mock
        i18n.t = jest.fn().mockImplementation((key) => key);

        return { gc, i18n };
    }

    static createCompleteTestSetup(): any {
        const uiSetup = UIComponentMockFactory.createCompleteUIComponentSetup();
        const component = this.createPromotionEndPopupInstance();
        const dependencies = this.setupDependencies();

        this.setupComponent(component, uiSetup);

        // Reset static property
        PromotionEndPopup.hasShown = false;

        return {
            component,
            uiSetup,
            dependencies,
        };
    }
}

// Specialized Test Helpers (ISP - Interface Segregation for different test aspects)
class ShowMethodTestHelper {
    static testNullOrUndefinedInput(component: PromotionEndPopup, input: any, expectedResult: any): void {
        // Act
        component.show(input);

        // Assert
        expect(PromotionEndPopup.hasShown).toBe(expectedResult.hasShown);
        expect(component.node.active).toBe(expectedResult.nodeActive);
        expect(component.closeFSBBanner).not.toHaveBeenCalled();
    }

    static testValidInput(
        component: PromotionEndPopup, 
        finishPromotion: GameServiceMessageSlot.FinishPromotion,
        expectedFormatArgs: any,
        expectedFormattedValue: string
    ): void {
        const gc = require("@sg/game-client-base");

        // Act
        component.show(finishPromotion);

        // Assert
        expect(PromotionEndPopup.hasShown).toBe(true);
        expect(component.node.active).toBe(true);
        expect(component.closeFSBBanner).toHaveBeenCalled();
        expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(
            expectedFormatArgs.totalWin,
            expectedFormatArgs.decimals,
            expectedFormatArgs.useGrouping
        );
        expect(component.labelTotalWin.string).toBe(expectedFormattedValue);
    }
}

class SetupContentTestHelper {
    static testContentScenario(
        component: PromotionEndPopup,
        scenario: {
            currentSpinCount: number;
            totalWin: number;
            expectedCalls: string[];
            expectedLabels: { title: string; mainMessage: string; subMessage: string };
        }
    ): void {
        const i18n = require("db://i18n/LanguageData");
        
        // Arrange
        component['currentSpinCount'] = scenario.currentSpinCount;

        // Act
        component['setupContent'](scenario.totalWin);

        // Assert
        scenario.expectedCalls.forEach(expectedCall => {
            expect(i18n.t).toHaveBeenCalledWith(expectedCall);
        });

        expect(component.labelTitle.string).toBe(scenario.expectedLabels.title);
        expect(component.labelMainMessage.string).toBe(scenario.expectedLabels.mainMessage);
        expect(component.labelSubMessage.string).toBe(scenario.expectedLabels.subMessage);
    }
}

class DialogTestHelper {
    static testDialogInteraction(component: PromotionEndPopup, dialogExists: boolean = true): void {
        if (!dialogExists) {
            (component.node.getComponent as jest.Mock).mockReturnValue(null);
        }

        // Act
        component['onCloseClicked']();

        // Assert
        expect(component.node.getComponent).toHaveBeenCalled();
        
        if (dialogExists) {
            const mockGetComponent = component.node.getComponent as jest.Mock;
            const dialog = mockGetComponent.mock.results[0]?.value as any;
            if (dialog && dialog.hide) {
                expect(dialog.hide).toHaveBeenCalled();
            }
        }
        
        expect(component['openTurnOverRequired']).toHaveBeenCalled();
    }
}

describe("PromotionEndPopup", () => {
    let testSetup: any;
    let component: PromotionEndPopup;

    beforeEach(() => {
        jest.clearAllMocks();
        testSetup = ComponentTestSetupHelper.createCompleteTestSetup();
        component = testSetup.component;
    });

    describe("updateCurrentSpinCount", () => {
        it("should update currentSpinCount property", () => {
            // Arrange
            const testSpinCount = 5;

            // Act
            component.updateCurrentSpinCount(testSpinCount);

            // Assert
            expect(component['currentSpinCount']).toBe(testSpinCount);
        });

        it("should handle zero spin count", () => {
            // Arrange & Act
            component.updateCurrentSpinCount(0);

            // Assert
            expect(component['currentSpinCount']).toBe(0);
        });

        it("should handle large spin count", () => {
            // Arrange
            const largeSpinCount = 999;

            // Act
            component.updateCurrentSpinCount(largeSpinCount);

            // Assert
            expect(component['currentSpinCount']).toBe(largeSpinCount);
        });
    });

    describe("show", () => {
        const nullUndefinedTestCases = [
            { input: null, description: "null" },
            { input: undefined, description: "undefined" },
        ];

        nullUndefinedTestCases.forEach(({ input, description }) => {
            it(`should return early when finishPromotion is ${description}`, () => {
                ShowMethodTestHelper.testNullOrUndefinedInput(component, input, {
                    hasShown: false,
                    nodeActive: false,
                });
            });
        });

        it("should set hasShown to true and activate node when finishPromotion is valid", () => {
            // Arrange
            const finishPromotion = FinishPromotionTestDataBuilder.createDefault();
            const expectedFormatArgs = {
                totalWin: 1000,
                decimals: 2,
                useGrouping: false,
            };

            // Act & Assert
            ShowMethodTestHelper.testValidInput(
                component,
                finishPromotion,
                expectedFormatArgs,
                "1,000.00"
            );
        });
        
        it("should format high totalWin correctly", () => {
            // Arrange
            const finishPromotion = FinishPromotionTestDataBuilder.createHighWin();
            const expectedFormatArgs = {
                totalWin: 2500.5,
                decimals: 2,
                useGrouping: false,
            };
            
            // Setup mock to return specific formatted value
            testSetup.dependencies.gc.FormatUtils.numberWithCommas.mockReturnValue("2,500.50");

            // Act & Assert
            ShowMethodTestHelper.testValidInput(
                component,
                finishPromotion,
                expectedFormatArgs,
                "2,500.50"
            );
        });

        it("should handle zero win amount", () => {
            // Arrange
            const finishPromotion = FinishPromotionTestDataBuilder.createWithZeroWin();
            const expectedFormatArgs = {
                totalWin: 0,
                decimals: 2,
                useGrouping: false,
            };

            testSetup.dependencies.gc.FormatUtils.numberWithCommas.mockReturnValue("0.00");

            // Act & Assert
            ShowMethodTestHelper.testValidInput(
                component,
                finishPromotion,
                expectedFormatArgs,
                "0.00"
            );
        });
    });

    describe("setupContent", () => {
        beforeEach(() => {
            testSetup.dependencies.i18n.t.mockImplementation((key: string) => key);
        });

        const contentScenarios = [
            {
                description: "win with all spins used",
                currentSpinCount: 0,
                totalWin: 1000,
                expectedCalls: [
                    "FreeSpinBonus.FSB_notification_para1a",
                    "FreeSpinBonus.FSB_end_notification",
                    "FreeSpinBonus.FSB_end_notification_message"
                ],
                expectedLabels: {
                    title: "FREESPINBONUS.FSB_NOTIFICATION_PARA1A",
                    mainMessage: "FreeSpinBonus.FSB_end_notification",
                    subMessage: "FreeSpinBonus.FSB_end_notification_message"
                }
            },
            {
                description: "win with remaining spins",
                currentSpinCount: 3,
                totalWin: 500,
                expectedCalls: [
                    "FreeSpinBonus.FSB_end_notification_unusedFS",
                    "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                    "FreeSpinBonus.FSB_end_notification_unusedFS_message1"
                ],
                expectedLabels: {
                    title: "FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS",
                    mainMessage: "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                    subMessage: "FreeSpinBonus.FSB_end_notification_unusedFS_message1"
                }
            },
            {
                description: "zero win with all spins used",
                currentSpinCount: 0,
                totalWin: 0,
                expectedCalls: [
                    "FreeSpinBonus.FSB_end_notification_zero_win",
                    "FreeSpinBonus.FSB_end_notification_zero_win_message"
                ],
                expectedLabels: {
                    title: "FREESPINBONUS.FSB_END_NOTIFICATION_ZERO_WIN",
                    mainMessage: "", // Main message is empty for zero win all used
                    subMessage: "FreeSpinBonus.FSB_end_notification_zero_win_message"
                }
            },
            {
                description: "zero win with remaining spins",
                currentSpinCount: 2,
                totalWin: 0,
                expectedCalls: [
                    "FreeSpinBonus.FSB_end_notification_unusedFS",
                    "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                    "FreeSpinBonus.FSB_end_notification_unusedFS_message1"
                ],
                expectedLabels: {
                    title: "FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS",
                    mainMessage: "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                    subMessage: "FreeSpinBonus.FSB_end_notification_unusedFS_message1"
                }
            }
        ];

        contentScenarios.forEach(scenario => {
            it(`should setup content for ${scenario.description}`, () => {
                SetupContentTestHelper.testContentScenario(component, scenario);
            });
        });

        it("should uppercase the title text", () => {
            // Arrange
            testSetup.dependencies.i18n.t.mockReturnValue("test title");
            
            const scenario = {
                currentSpinCount: 0,
                totalWin: 100,
                expectedCalls: ["FreeSpinBonus.FSB_notification_para1a"],
                expectedLabels: {
                    title: "TEST TITLE",
                    mainMessage: "test title",
                    subMessage: "test title"
                }
            };

            // Act & Assert
            SetupContentTestHelper.testContentScenario(component, scenario);
        });

        it("should handle empty messages correctly", () => {
            // Arrange
            testSetup.dependencies.i18n.t.mockImplementation((key: string) => {
                if (key === "FreeSpinBonus.FSB_end_notification_message") return "";
                return key;
            });
            
            const scenario = {
                currentSpinCount: 0,
                totalWin: 100,
                expectedCalls: [
                    "FreeSpinBonus.FSB_notification_para1a",
                    "FreeSpinBonus.FSB_end_notification",
                    "FreeSpinBonus.FSB_end_notification_message"
                ],
                expectedLabels: {
                    title: "FREESPINBONUS.FSB_NOTIFICATION_PARA1A",
                    mainMessage: "FreeSpinBonus.FSB_end_notification",
                    subMessage: ""
                }
            };

            // Act & Assert
            SetupContentTestHelper.testContentScenario(component, scenario);
        });
    });

    describe("onCloseClicked", () => {
        it("should hide dialog when dialog component exists", () => {
            DialogTestHelper.testDialogInteraction(component, true);
        });

        it("should handle case when dialog component is null", () => {
            // Act & Assert - should not throw
            expect(() => DialogTestHelper.testDialogInteraction(component, false)).not.toThrow();
        });

        it("should always call openTurnOverRequired regardless of dialog existence", () => {
            const dialogExistenceScenarios = [true, false];
            
            dialogExistenceScenarios.forEach(dialogExists => {
                // Reset mock calls
                jest.clearAllMocks();
                testSetup = ComponentTestSetupHelper.createCompleteTestSetup();
                component = testSetup.component;

                // Act & Assert
                DialogTestHelper.testDialogInteraction(component, dialogExists);
            });
        });
    });

    describe("static hasShown property", () => {
        // Static Property Test Helper (ISP - focused on static property testing)
        class StaticPropertyTestHelper {
            static testHasShownInitialization(): void {
                expect(PromotionEndPopup.hasShown).toBe(false);
            }

            static testHasShownAfterValidShow(component: PromotionEndPopup): void {
                const finishPromotion = FinishPromotionTestDataBuilder.createWithWin(100);
                component.show(finishPromotion);
                expect(PromotionEndPopup.hasShown).toBe(true);
            }

            static testHasShownAfterNullShow(component: PromotionEndPopup): void {
                component.show(null);
                expect(PromotionEndPopup.hasShown).toBe(false);
            }

            static testHasShownPersistence(component: PromotionEndPopup): void {
                const finishPromotion = FinishPromotionTestDataBuilder.createDefault();
                component.show(finishPromotion);
                
                // Should remain true after multiple calls
                expect(PromotionEndPopup.hasShown).toBe(true);
                component.show(finishPromotion);
                expect(PromotionEndPopup.hasShown).toBe(true);
            }
        }

        it("should initialize as false", () => {
            StaticPropertyTestHelper.testHasShownInitialization();
        });

        it("should be set to true when show is called with valid data", () => {
            StaticPropertyTestHelper.testHasShownAfterValidShow(component);
        });

        it("should remain false when show is called with null data", () => {
            StaticPropertyTestHelper.testHasShownAfterNullShow(component);
        });

        it("should persist true state across multiple calls", () => {
            StaticPropertyTestHelper.testHasShownPersistence(component);
        });
    });

    describe("component properties and initialization", () => {
        // Component Properties Test Helper (SRP - focused on component properties)
        class ComponentPropertiesTestHelper {
            static testRequiredProperties(component: PromotionEndPopup): void {
                const requiredProperties = [
                    'labelTitle',
                    'labelMainMessage', 
                    'labelSubMessage',
                    'labelTotalWin',
                    'closeButton'
                ];

                requiredProperties.forEach(property => {
                    expect(component[property as keyof PromotionEndPopup]).toBeDefined();
                });
            }

            static testInitialSpinCount(component: PromotionEndPopup): void {
                expect(component['currentSpinCount']).toBe(0);
            }

            static testComponentNodeSetup(component: PromotionEndPopup): void {
                expect(component.node).toBeDefined();
                expect(typeof component.node.getComponent).toBe('function');
            }
        }

        it("should have all required UI component properties", () => {
            ComponentPropertiesTestHelper.testRequiredProperties(component);
        });

        it("should have currentSpinCount initialized to 0", () => {
            const newComponent = ComponentTestSetupHelper.createPromotionEndPopupInstance();
            ComponentPropertiesTestHelper.testInitialSpinCount(newComponent);
        });

        it("should have properly configured node component", () => {
            ComponentPropertiesTestHelper.testComponentNodeSetup(component);
        });

        it("should have proper mock setup for component methods", () => {
            const methodsToCheck = ['closeFSBBanner', 'onDestroy'];
            
            methodsToCheck.forEach(method => {
                expect(jest.isMockFunction(component[method as keyof PromotionEndPopup])).toBe(true);
            });
        });
    });
});
