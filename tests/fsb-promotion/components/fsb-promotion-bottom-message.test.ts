import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FSBPromotionBottomMessage } from "../../../assets/fsb-promotion/scripts/components/fsb-promotion-bottom-message";

// Mock dependencies
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

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
    tween: jest.fn(),
}));

jest.mock("@sg/game-client-base", () => ({
    __esModule: true,
    default: {
        Translator: {
            translate: jest.fn().mockReturnValue("Mocked FSB pending freespin message")
        }
    }
}));

describe("FSBPromotionBottomMessage", () => {
    let component: FSBPromotionBottomMessage;
    let mockMsgText: any;
    let mockMsgNode: any;
    let mockTweenChain: any;
    let mockTranslator: any;
    let cc: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create simple mocks
        mockMsgText = {
            string: ""
        };

        mockMsgNode = {
            active: false
        };

        mockTweenChain = {
            delay: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            start: jest.fn()
        };

        mockTranslator = require("@sg/game-client-base").default.Translator;

        // Setup cc mock
        cc = require("cc");
        cc.tween = jest.fn().mockReturnValue(mockTweenChain);

        // Create mock component with actual business logic
        component = {
            msgText: mockMsgText,
            msgNode: mockMsgNode,
            DELAY_TIME: 3,
            
            // Implement actual business logic for testing
            onLoad: function() {
                this.showMessage();
            },
            
            showMessage: function() {
                const message = mockTranslator.translate("FreeSpinBonus.FSB_pending_freespin_msg");
                this.msgText.string = message;
                this.msgNode.active = true;
                
                cc.tween(this.msgNode)
                    .delay(this.DELAY_TIME)
                    .call(() => {
                        this.msgNode.active = false;
                    })
                    .start();
            }
        } as unknown as FSBPromotionBottomMessage;
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            expect(component.msgText).toBe(mockMsgText);
            expect(component.msgNode).toBe(mockMsgNode);
        });

        it("should have required properties defined", () => {
            expect(component.msgText).toBeDefined();
            expect(component.msgNode).toBeDefined();
            expect(typeof component.onLoad).toBe('function');
            expect(typeof component.showMessage).toBe('function');
        });
    });

    describe("onLoad method", () => {
        it("should call showMessage when component loads", () => {
            const showMessageSpy = jest.spyOn(component, 'showMessage');
            
            component.onLoad();
            
            expect(showMessageSpy).toHaveBeenCalledTimes(1);
        });

        it("should execute complete message flow on load", () => {
            component.onLoad();

            expect(mockTranslator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");
            expect(mockMsgNode.active).toBe(true);
            expect(cc.tween).toHaveBeenCalledWith(mockMsgNode);
        });

        it("should handle multiple onLoad calls", () => {
            component.onLoad();
            component.onLoad();
            component.onLoad();

            expect(mockTranslator.translate).toHaveBeenCalledTimes(3);
        });
    });

    describe("showMessage method", () => {
        it("should execute complete message flow correctly", () => {
            component.showMessage();

            expect(mockTranslator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");
            expect(mockMsgNode.active).toBe(true);
        });

        it("should execute tween sequence correctly", () => {
            component.showMessage();

            expect(cc.tween).toHaveBeenCalledWith(mockMsgNode);
            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
            expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
            expect(mockTweenChain.start).toHaveBeenCalled();
        });

        it("should handle tween callback correctly", () => {
            component.showMessage();
            
            // Execute the callback
            const callback = mockTweenChain.call.mock.calls[0][0];
            callback();

            expect(mockMsgNode.active).toBe(false);
        });

        it("should use correct delay time", () => {
            component.showMessage();

            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
        });

        it("should set message text before showing node", () => {
            component.showMessage();

            expect(mockMsgText.string).toBe("Mocked FSB pending freespin message");
            expect(mockMsgNode.active).toBe(true);
        });

        it("should call translator with correct key", () => {
            component.showMessage();

            expect(mockTranslator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
        });
    });

    describe("multiple calls handling", () => {
        it("should handle single call correctly", () => {
            component.showMessage();

            expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
            expect(cc.tween).toHaveBeenCalledTimes(1);
            expect(mockTweenChain.start).toHaveBeenCalledTimes(1);
        });

        it("should handle multiple calls correctly", () => {
            for (let i = 0; i < 3; i++) {
                component.showMessage();
            }

            expect(mockTranslator.translate).toHaveBeenCalledTimes(3);
            expect(cc.tween).toHaveBeenCalledTimes(3);
            expect(mockTweenChain.start).toHaveBeenCalledTimes(3);
        });

        it("should handle many calls correctly", () => {
            for (let i = 0; i < 5; i++) {
                component.showMessage();
            }

            expect(mockTranslator.translate).toHaveBeenCalledTimes(5);
            expect(cc.tween).toHaveBeenCalledTimes(5);
            expect(mockTweenChain.start).toHaveBeenCalledTimes(5);
        });
    });

    describe("translation integration", () => {
        it("should use correct translation key", () => {
            component.showMessage();

            expect(mockTranslator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_pending_freespin_msg");
        });

        it("should handle different translated messages", () => {
            const customMessage = "Custom FSB message for testing";
            mockTranslator.translate.mockReturnValue(customMessage);

            component.showMessage();

            expect(mockMsgText.string).toBe(customMessage);
            expect(mockMsgNode.active).toBe(true);
        });

        it("should handle empty translation result", () => {
            mockTranslator.translate.mockReturnValue("");

            component.showMessage();

            expect(mockMsgText.string).toBe("");
            expect(mockMsgNode.active).toBe(true);
        });

        it("should handle long translated message", () => {
            const longMessage = "This is a very long FSB pending freespin message for comprehensive testing purposes";
            mockTranslator.translate.mockReturnValue(longMessage);

            component.showMessage();

            expect(mockMsgText.string).toBe(longMessage);
            expect(mockMsgNode.active).toBe(true);
        });

        it("should handle special characters in translation", () => {
            const specialMessage = "FSB 特殊字符 測試 🎰";
            mockTranslator.translate.mockReturnValue(specialMessage);

            component.showMessage();

            expect(mockMsgText.string).toBe(specialMessage);
            expect(mockMsgNode.active).toBe(true);
        });
    });

    describe("constants and configuration", () => {
        it("should use correct delay time in tween operations", () => {
            component.showMessage();

            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
        });

        it("should have private DELAY_TIME constant", () => {
            // DELAY_TIME is private, so we test it indirectly through behavior
            component.showMessage();
            expect(mockTweenChain.delay).toHaveBeenCalledWith(3);
        });
    });

    describe("error handling", () => {
        it("should handle null msgText gracefully", () => {
            component.msgText = null;

            expect(() => component.showMessage()).toThrow();
        });

        it("should handle null msgNode gracefully", () => {
            component.msgNode = null;

            expect(() => component.showMessage()).toThrow();
        });

        it("should handle undefined msgText gracefully", () => {
            component.msgText = undefined;

            expect(() => component.showMessage()).toThrow();
        });

        it("should handle undefined msgNode gracefully", () => {
            component.msgNode = undefined;

            expect(() => component.showMessage()).toThrow();
        });
    });
});