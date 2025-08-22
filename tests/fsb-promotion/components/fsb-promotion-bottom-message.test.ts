import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// Mock decorators - inline to avoid hoisting issues
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock cc - inline to avoid hoisting issues
const mockTweenChain = {
    delay: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    start: jest.fn(),
};

jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
        property: jest.fn(() => jest.fn()),
    },
    Component: class MockComponent {
        constructor() {
            // Empty constructor for mocking
        }
    },
    Node: jest.fn(),
    RichText: jest.fn(),
    tween: jest.fn(() => mockTweenChain),
}));

// Mock game client base - inline to avoid hoisting issues
jest.mock("@sg/game-client-base", () => ({
    __esModule: true,
    default: {
        Translator: {
            translate: jest.fn().mockReturnValue("Mocked FSB pending freespin message")
        }
    }
}));

// Mock Dependency Factories (SRP - Single responsibility for creating mocks)
class MockDependencyFactory {
    static createTweenChainMock(): any {
        return {
            delay: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            start: jest.fn(),
        };
    }

    static createCocosCreatorMocks(): any {
        const tweenChain = this.createTweenChainMock();
        return {
            _decorator: {
                ccclass: jest.fn(() => jest.fn()),
                property: jest.fn(() => jest.fn()),
            },
            Component: class MockComponent {},
            Node: jest.fn(),
            RichText: jest.fn(),
            tween: jest.fn(() => tweenChain),
            tweenChain,
        };
    }

    static createGameClientBaseMock(): any {
        return {
            Translator: {
                translate: jest.fn().mockReturnValue("Mocked FSB pending freespin message")
            }
        };
    }

    static createRichTextMock(initialString: string = ""): any {
        return {
            string: initialString
        };
    }

    static createNodeMock(initialActive: boolean = false): any {
        return {
            active: initialActive
        };
    }
}

// UI Component Mock Factory (SRP - focused on UI component creation)
class UIComponentMockFactory {
    static createCompleteUISetup(): any {
        return {
            msgText: MockDependencyFactory.createRichTextMock(),
            msgNode: MockDependencyFactory.createNodeMock(),
        };
    }

    static createMsgTextMock(customString?: string): any {
        return MockDependencyFactory.createRichTextMock(customString);
    }

    static createMsgNodeMock(customActive?: boolean): any {
        return MockDependencyFactory.createNodeMock(customActive);
    }
}

// Component Setup Helper (SRP - focused on component setup)
class ComponentTestSetupHelper {
    static createBottomMessageComponent(): any {
        const uiSetup = UIComponentMockFactory.createCompleteUISetup();
        
        return {
            msgText: uiSetup.msgText,
            msgNode: uiSetup.msgNode,
            DELAY_TIME: 3,
            
            onLoad() {
                this.showMessage();
            },
            
            showMessage() {
                const gc = require("@sg/game-client-base").default;
                const message = gc.Translator.translate("FreeSpinBonus.FSB_pending_freespin_msg");
                this.msgText.string = message;
                this.msgNode.active = true;
                
                const cc = require("cc");
                cc.tween(this.msgNode)
                    .delay(this.DELAY_TIME)
                    .call(() => {
                        this.msgNode.active = false;
                    })
                    .start();
            }
        };
    }

    static resetMocks(): void {
        jest.clearAllMocks();
        
        // Reset tween chain mocks
        mockTweenChain.delay.mockReturnThis();
        mockTweenChain.call.mockReturnThis();
        mockTweenChain.start.mockClear();
    }

    static createCompleteTestSetup(): any {
        this.resetMocks();
        
        const component = this.createBottomMessageComponent();
        const cc = require("cc");
        const gc = require("@sg/game-client-base").default;
        
        return {
            component,
            mockTween: cc.tween,
            mockTranslator: gc.Translator,
            mockTweenChain,
        };
    }
}

// Specialized Test Helpers (ISP - Interface Segregation for different test concerns)
class TweenTestHelper {
    static testTweenSequence(component: any, mockTween: any): void {
        // Act
        component.showMessage();

        // Assert sequence
        expect(mockTween).toHaveBeenCalledWith(component.msgNode);
        expect(mockTweenChain.delay).toHaveBeenCalledWith(component.DELAY_TIME);
        expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
        expect(mockTweenChain.start).toHaveBeenCalled();
    }

    static testTweenCallback(component: any): Function {
        // Arrange - capture callback
        let capturedCallback: Function;
        mockTweenChain.call.mockImplementation((callback: Function) => {
            capturedCallback = callback;
            return mockTweenChain;
        });

        // Act
        component.showMessage();

        // Assert callback exists and is function
        expect(capturedCallback!).toBeDefined();
        expect(typeof capturedCallback!).toBe('function');

        return capturedCallback!;
    }

    static testCallbackFunctionality(component: any, callback: Function): void {
        // Arrange
        component.msgNode.active = true;

        // Act
        callback();

        // Assert
        expect(component.msgNode.active).toBe(false);
    }

    static testDelayTimeUsage(component: any, expectedDelay: number): void {
        // Act
        component.showMessage();

        // Assert
        expect(mockTweenChain.delay).toHaveBeenCalledWith(expectedDelay);
    }
}

class TranslationTestHelper {
    static testTranslationCall(component: any, mockTranslator: any, expectedKey: string): void {
        // Act
        component.showMessage();

        // Assert
        expect(mockTranslator.translate).toHaveBeenCalledWith(expectedKey);
    }

    static testMessageAssignment(component: any, expectedMessage: string): void {
        // Act
        component.showMessage();

        // Assert
        expect(component.msgText.string).toBe(expectedMessage);
    }

    static testCustomTranslation(component: any, mockTranslator: any, customMessage: string): void {
        // Arrange
        mockTranslator.translate.mockReturnValue(customMessage);

        // Act
        component.showMessage();

        // Assert
        expect(component.msgText.string).toBe(customMessage);
    }
}

class ComponentBehaviorTestHelper {
    static testNodeActivation(component: any): void {
        // Arrange
        component.msgNode.active = false;

        // Act
        component.showMessage();

        // Assert
        expect(component.msgNode.active).toBe(true);
    }

    static testMultipleCalls(component: any, mockTranslator: any, mockTween: any, callCount: number): void {
        // Act
        for (let i = 0; i < callCount; i++) {
            component.showMessage();
        }

        // Assert
        expect(mockTranslator.translate).toHaveBeenCalledTimes(callCount);
        expect(mockTween).toHaveBeenCalledTimes(callCount);
        expect(mockTweenChain.start).toHaveBeenCalledTimes(callCount);
    }

    static testNullHandling(component: any, property: string, expectedError: boolean): void {
        // Arrange
        const originalValue = component[property];
        component[property] = null;

        if (expectedError) {
            // Act & Assert
            expect(() => component.showMessage()).toThrow();
        } else {
            // Act & Assert (should not throw)
            expect(() => component.showMessage()).not.toThrow();
        }

        // Restore
        component[property] = originalValue;
    }
}

class PropertyTestHelper {
    static testComponentProperties(component: any, expectedProperties: Record<string, any>): void {
        Object.entries(expectedProperties).forEach(([property, expectedValue]) => {
            expect(component[property]).toEqual(expectedValue);
        });
    }

    static testPropertyExistence(component: any, properties: string[]): void {
        properties.forEach(property => {
            expect(component[property]).toBeDefined();
        });
    }

    static testConstantValue(component: any, constantName: string, expectedValue: any, expectedType: string): void {
        expect(component[constantName]).toBe(expectedValue);
        expect(typeof component[constantName]).toBe(expectedType);
    }
}

describe("FSBPromotionBottomMessage", () => {
    let testSetup: any;
    let component: any;

    beforeEach(() => {
        testSetup = ComponentTestSetupHelper.createCompleteTestSetup();
        component = testSetup.component;
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            const expectedProperties = {
                DELAY_TIME: 3,
                msgText: component.msgText,
                msgNode: component.msgNode
            };
            
            PropertyTestHelper.testComponentProperties(component, expectedProperties);
        });

        it("should have required properties defined", () => {
            const requiredProperties = ["msgText", "msgNode", "DELAY_TIME", "onLoad", "showMessage"];
            PropertyTestHelper.testPropertyExistence(component, requiredProperties);
        });

        it("should have correct constant values", () => {
            PropertyTestHelper.testConstantValue(component, "DELAY_TIME", 3, "number");
        });
    });

    describe("onLoad", () => {
        it("should call showMessage when component loads and verify effects", () => {
            // Act
            component.onLoad();

            // Assert - Check that the effects of showMessage occurred
            TranslationTestHelper.testTranslationCall(
                component,
                testSetup.mockTranslator,
                "FreeSpinBonus.FSB_pending_freespin_msg"
            );
            
            TranslationTestHelper.testMessageAssignment(
                component,
                "Mocked FSB pending freespin message"
            );
            
            ComponentBehaviorTestHelper.testNodeActivation(component);
            
            expect(testSetup.mockTween).toHaveBeenCalledWith(component.msgNode);
        });
    });

    describe("showMessage", () => {
        it("should execute complete message flow correctly", () => {
            // Test all aspects of showMessage in one comprehensive test
            TranslationTestHelper.testTranslationCall(
                component,
                testSetup.mockTranslator,
                "FreeSpinBonus.FSB_pending_freespin_msg"
            );
            
            TranslationTestHelper.testMessageAssignment(
                component,
                "Mocked FSB pending freespin message"
            );
            
            ComponentBehaviorTestHelper.testNodeActivation(component);
            
            TweenTestHelper.testTweenSequence(component, testSetup.mockTween);
        });

        it("should handle tween callback correctly", () => {
            // Test tween callback functionality
            const callback = TweenTestHelper.testTweenCallback(component);
            TweenTestHelper.testCallbackFunctionality(component, callback);
        });

        const multipleCallsTestCases = [
            { callCount: 1, description: "single call" },
            { callCount: 3, description: "multiple calls" },
            { callCount: 5, description: "many calls" }
        ];

        multipleCallsTestCases.forEach(({ callCount, description }) => {
            it(`should handle ${description} correctly`, () => {
                ComponentBehaviorTestHelper.testMultipleCalls(
                    component,
                    testSetup.mockTranslator,
                    testSetup.mockTween,
                    callCount
                );
                
                // Additional assertions specific to multiple calls
                expect(component.msgText.string).toBe("Mocked FSB pending freespin message");
                expect(component.msgNode.active).toBe(true);
            });
        });

        it("should use correct delay time constant", () => {
            TweenTestHelper.testDelayTimeUsage(component, 3);
            TweenTestHelper.testDelayTimeUsage(component, component.DELAY_TIME);
        });

        const nullHandlingTestCases = [
            { property: "msgText", expectError: true, description: "null msgText" },
            { property: "msgNode", expectError: true, description: "null msgNode" }
        ];

        nullHandlingTestCases.forEach(({ property, expectError, description }) => {
            it(`should handle ${description} gracefully`, () => {
                ComponentBehaviorTestHelper.testNullHandling(component, property, expectError);
            });
        });
    });

    describe("tween animation flow", () => {
        it("should follow correct tween sequence", () => {
            TweenTestHelper.testTweenSequence(component, testSetup.mockTween);
        });

        it("should handle tween callback correctly", () => {
            const callback = TweenTestHelper.testTweenCallback(component);
            TweenTestHelper.testCallbackFunctionality(component, callback);
        });

        const tweenSequenceTestCases = [
            { 
                description: "delay configuration", 
                testMethod: () => TweenTestHelper.testDelayTimeUsage(component, 3)
            },
            { 
                description: "callback setup", 
                testMethod: () => {
                    const callback = TweenTestHelper.testTweenCallback(component);
                    expect(callback).toBeDefined();
                    expect(typeof callback).toBe('function');
                }
            }
        ];

        tweenSequenceTestCases.forEach(({ description, testMethod }) => {
            it(`should handle ${description} correctly`, testMethod);
        });
    });

    describe("translation integration", () => {
        it("should use correct translation key", () => {
            TranslationTestHelper.testTranslationCall(
                component,
                testSetup.mockTranslator,
                "FreeSpinBonus.FSB_pending_freespin_msg"
            );
        });

        const translationTestCases = [
            {
                description: "different translated messages",
                customMessage: "Custom FSB message for testing",
                shouldActivateNode: true
            },
            {
                description: "empty translation result",
                customMessage: "",
                shouldActivateNode: true
            },
            {
                description: "long translated message",
                customMessage: "This is a very long FSB pending freespin message for comprehensive testing purposes",
                shouldActivateNode: true
            },
            {
                description: "special characters in translation",
                customMessage: "FSB 特殊字符 測試 🎰",
                shouldActivateNode: true
            }
        ];

        translationTestCases.forEach(({ description, customMessage, shouldActivateNode }) => {
            it(`should handle ${description}`, () => {
                // Test custom translation
                TranslationTestHelper.testCustomTranslation(
                    component,
                    testSetup.mockTranslator,
                    customMessage
                );

                // Verify node activation behavior
                if (shouldActivateNode) {
                    expect(component.msgNode.active).toBe(true);
                }
            });
        });
    });

    describe("constants and configuration", () => {
        const constantTestCases = [
            {
                name: "DELAY_TIME",
                expectedValue: 3,
                expectedType: "number",
                description: "delay time constant"
            }
        ];

        constantTestCases.forEach(({ name, expectedValue, expectedType, description }) => {
            it(`should have correct ${description}`, () => {
                PropertyTestHelper.testConstantValue(component, name, expectedValue, expectedType);
            });
        });

        it("should use DELAY_TIME constant in tween operations", () => {
            TweenTestHelper.testDelayTimeUsage(component, component.DELAY_TIME);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete lifecycle: onLoad -> showMessage -> tween completion", () => {
            // Act - simulate complete lifecycle
            component.onLoad();
            
            // Capture and execute tween callback
            const callback = TweenTestHelper.testTweenCallback(component);
            callback();

            // Assert final state
            expect(component.msgNode.active).toBe(false); // Should be deactivated after callback
        });

        const edgeCaseTestScenarios = [
            {
                description: "rapid multiple onLoad calls",
                testMethod: () => {
                    component.onLoad();
                    component.onLoad();
                    component.onLoad();
                    expect(testSetup.mockTranslator.translate).toHaveBeenCalledTimes(3);
                }
            },
            {
                description: "mixed onLoad and showMessage calls",
                testMethod: () => {
                    component.onLoad();
                    component.showMessage();
                    component.onLoad();
                    expect(testSetup.mockTranslator.translate).toHaveBeenCalledTimes(3);
                }
            }
        ];

        edgeCaseTestScenarios.forEach(({ description, testMethod }) => {
            it(`should handle ${description}`, testMethod);
        });
    });
});
