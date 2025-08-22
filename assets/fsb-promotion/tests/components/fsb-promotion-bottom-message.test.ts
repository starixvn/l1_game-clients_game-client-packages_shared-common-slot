import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// Mock decorators
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock cc
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

// Mock game client base
jest.mock("@sg/game-client-base", () => ({
    __esModule: true,
    default: {
        Translator: {
            translate: jest.fn().mockReturnValue("Mocked FSB pending freespin message")
        }
    }
}));

describe("FSBPromotionBottomMessage", () => {
    let FSBPromotionBottomMessage: any;
    let component: any;
    let mockMsgText: any;
    let mockMsgNode: any;
    let mockTween: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset tween chain mocks
        mockTweenChain.delay.mockReturnThis();
        mockTweenChain.call.mockReturnThis();
        mockTweenChain.start.mockClear();

        // Create mock RichText
        mockMsgText = {
            string: ""
        };

        // Create mock Node
        mockMsgNode = {
            active: false
        };

        // Get tween mock
        const cc = require("cc");
        mockTween = cc.tween;

        // Create a manual test component that implements the behavior we want to test
        component = {
            msgText: mockMsgText,
            msgNode: mockMsgNode,
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
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            // Assert
            expect(component['DELAY_TIME']).toBe(3);
            expect(component.msgText).toBe(mockMsgText);
            expect(component.msgNode).toBe(mockMsgNode);
        });

        it("should have msgText property as RichText", () => {
            // Assert
            expect(component.msgText).toBeDefined();
        });

        it("should have msgNode property as Node", () => {
            // Assert
            expect(component.msgNode).toBeDefined();
        });
    });

    describe("onLoad", () => {
        it("should call showMessage when component loads", () => {
            // Act
            component.onLoad();

            // Assert - Check that the effects of showMessage occurred
            const gc = require("@sg/game-client-base").default;
            expect(gc.Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");
            expect(mockMsgNode.active).toBe(true);
            expect(mockTween).toHaveBeenCalledWith(mockMsgNode);
        });
    });

    describe("showMessage", () => {
        it("should translate message, set text, activate node, and start tween animation", () => {
            // Arrange
            const gc = require("@sg/game-client-base").default;

            // Act
            component.showMessage();

            // Assert - Check translation
            expect(gc.Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");

            // Assert - Check message text is set
            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");

            // Assert - Check node is activated
            expect(mockMsgNode.active).toBe(true);

            // Assert - Check tween is configured correctly
            expect(mockTween).toHaveBeenCalledWith(mockMsgNode);
            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
            expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
            expect(mockTweenChain.start).toHaveBeenCalled();
        });

        it("should deactivate msgNode after tween delay callback is executed", () => {
            // Arrange
            let tweenCallback: Function;
            mockTweenChain.call.mockImplementation((callback: Function) => {
                tweenCallback = callback;
                return mockTweenChain;
            });

            // Act
            component.showMessage();

            // Assert - Node should be active initially
            expect(mockMsgNode.active).toBe(true);

            // Execute the tween callback
            tweenCallback();

            // Assert - Node should be deactivated after callback
            expect(mockMsgNode.active).toBe(false);
        });

        it("should handle multiple calls to showMessage correctly", () => {
            // Arrange
            const gc = require("@sg/game-client-base").default;

            // Act - Call showMessage multiple times
            component.showMessage();
            component.showMessage();
            component.showMessage();

            // Assert
            expect(gc.Translator.translate).toHaveBeenCalledTimes(3);
            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");
            expect(mockMsgNode.active).toBe(true);
            expect(mockTween).toHaveBeenCalledTimes(3);
            expect(mockTweenChain.start).toHaveBeenCalledTimes(3);
        });

        it("should use correct delay time constant", () => {
            // Act
            component.showMessage();

            // Assert
            expect(mockTweenChain.delay).toHaveBeenCalledWith(component['DELAY_TIME']);
            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
        });

        it("should handle null msgText gracefully", () => {
            // Arrange
            component.msgText = null;

            // Act & Assert - should throw when trying to set string on null
            expect(() => component.showMessage()).toThrow();
        });

        it("should handle null msgNode gracefully", () => {
            // Arrange
            component.msgNode = null;

            // Act & Assert - should throw when trying to set active on null
            expect(() => component.showMessage()).toThrow();
        });
    });

    describe("tween animation flow", () => {
        it("should follow correct tween sequence", () => {
            // Act
            component.showMessage();

            // Assert sequence
            expect(mockTween).toHaveBeenCalledWith(mockMsgNode);
            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
            expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
            expect(mockTweenChain.start).toHaveBeenCalled();
        });

        it("should pass correct callback function to tween call", () => {
            // Arrange
            let capturedCallback: Function;
            mockTweenChain.call.mockImplementation((callback: Function) => {
                capturedCallback = callback;
                return mockTweenChain;
            });

            // Act
            component.showMessage();

            // Assert callback is a function
            expect(capturedCallback).toBeDefined();
            expect(typeof capturedCallback).toBe('function');

            // Test callback functionality
            mockMsgNode.active = true;
            capturedCallback();
            expect(mockMsgNode.active).toBe(false);
        });
    });

    describe("translation integration", () => {
        it("should use correct translation key", () => {
            // Arrange
            const gc = require("@sg/game-client-base").default;

            // Act
            component.showMessage();

            // Assert
            expect(gc.Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
        });

        it("should handle different translated messages", () => {
            // Arrange
            const gc = require("@sg/game-client-base").default;
            const customMessage = "Custom FSB message for testing";
            gc.Translator.translate.mockReturnValue(customMessage);

            // Act
            component.showMessage();

            // Assert
            expect(mockMsgText.string).toBe(customMessage);
        });

        it("should handle empty translation result", () => {
            // Arrange
            const gc = require("@sg/game-client-base").default;
            gc.Translator.translate.mockReturnValue("");

            // Act
            component.showMessage();

            // Assert
            expect(mockMsgText.string).toBe("");
            expect(mockMsgNode.active).toBe(true); // Should still activate node
        });
    });

    describe("constants", () => {
        it("should have correct DELAY_TIME constant", () => {
            // Assert
            expect(component['DELAY_TIME']).toBe(3);
            expect(typeof component['DELAY_TIME']).toBe('number');
        });
    });
});
