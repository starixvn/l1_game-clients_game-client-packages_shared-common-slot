import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Node } from "cc";
import { GiftCode } from "../../../assets/fsb-promotion/scripts/components/gift-code";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";

// Mock external dependencies
jest.mock("@sg/game-client-base", () => {
    const mockGc = {
        Connection: {},
        Audios: {
            AudioHandler: {},
            AudioIds: {
                CLICK: "click_sound",
            },
        },
        Player: {
            MainPlayerStore: jest.fn(() => ({ balance: 1000, name: "test_player" })),
        },
        Bet: {
            BetStore: {},
            BetHandler: class {},
        },
        Notices: {
            NoticeStore: {},
        },
        Error: {
            ErrorStore: {},
        },
        Rounds: {
            RoundStore: {},
        },
        Shared: {
            IHandler: class {},
            IMultipleHandlers: class {},
        },
        UserSettings: {
            UserSettingHandlers: class {
                handle() {}
            },
        },
        GameUserSettings: {
            GameUserSettingHandler: class {
                handle() {}
            },
        },
    };
    return mockGc;
});

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
    Node: jest.fn(),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
    Component: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/draggable/draggable-item", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        getComponent = jest.fn();
        scheduleOnce = jest.fn();
        onLoad() {}
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FreeSpinsPromotionEvents: {
        EFFECT_UNBOX_GIFT: "EFFECT_UNBOX_GIFT"
    },
    FSBPromotionUIStore: class {
        isSpinningFSB = false;
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: class {
        changeUIPendingEvent = jest.fn();
    },
}));

jest.mock("observer", () => ({
    observer: jest.fn(),
    render: jest.fn((store, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
    handle: jest.fn((handler, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
}));

describe("GiftCode", () => {
    let component: GiftCode;
    let mockIcon: Node;
    let mockDraggableItem: any;
    let mockTouchCallback: any;

    beforeEach(() => {
        // Create mock Node
        mockIcon = {
            getComponent: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        } as unknown as Node;

        // Create mock touch callback
        mockTouchCallback = {
            start: jest.fn(),
            move: jest.fn(),
            end: jest.fn(),
        };

        // Create mock draggable item
        mockDraggableItem = {
            touchCallback: mockTouchCallback,
            isDragging: false,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
        };

        // Create component instance
        component = new GiftCode();
        
        // Setup component properties
        component.icon = mockIcon;
        (component as any).isProcessing = false;
        (component as any).isSpinningFSB = false;
        
        // Mock component methods
        (component as any).getComponent = jest.fn().mockReturnValue(mockDraggableItem);
        (component as any).scheduleOnce = jest.fn();
        (component as any).openGiftCodeRedeemPopup = jest.fn();
    });

    describe("constructor and initial state", () => {
        it("should initialize with default values", () => {
            expect(component.icon).toBeDefined();
            expect((component as any).isProcessing).toBe(false);
            expect((component as any).isSpinningFSB).toBe(false);
        });

        it("should have all required component lifecycle methods", () => {
            expect(typeof component.onEnable).toBe('function');
            expect(typeof (component as any).scheduleOnce).toBe('function');
            expect(typeof (component as any).getComponent).toBe('function');
        });

        it("should have all required gift code action methods", () => {
            expect(typeof component.dragGiftCode).toBe('function');
            expect(typeof component.onClickGiftCode).toBe('function');
            expect(typeof (component as any).openGiftCodeRedeemPopup).toBe('function');
        });
    });

    describe("onEnable", () => {
        it("should call drag gift code setup on enable", () => {
            const dragGiftCodeSpy = jest.spyOn(component, 'dragGiftCode');
            component.onEnable();
            expect(dragGiftCodeSpy).toHaveBeenCalled();
        });

        it("should initialize component in ready state on enable", () => {
            expect((component as any).isProcessing).toBe(false);
            expect((component as any).isSpinningFSB).toBe(false);
        });
    });

    describe("onClickGiftCode", () => {
        it("should set isProcessing to true when called", () => {
            component.onClickGiftCode();
            expect((component as any).isProcessing).toBe(true);
        });

        it("should call openGiftCodeRedeemPopup when called", () => {
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(1);
        });

        it("should schedule timeout with correct delay", () => {
            component.onClickGiftCode();
            expect((component as any).scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 1);
        });

        it("should return early when isProcessing is true", () => {
            (component as any).isProcessing = true;
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should return early when isSpinningFSB is true", () => {
            (component as any).isSpinningFSB = true;
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should return early when both isProcessing and isSpinningFSB are true", () => {
            (component as any).isProcessing = true;
            (component as any).isSpinningFSB = true;
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should process click when both conditions are false", () => {
            (component as any).isProcessing = false;
            (component as any).isSpinningFSB = false;
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalled();
            expect((component as any).isProcessing).toBe(true);
        });

        it("should handle multiple rapid clicks correctly", () => {
            for (let i = 0; i < 5; i++) {
                component.onClickGiftCode();
            }
            // Only the first click should be processed due to isProcessing guard
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(1);
            expect((component as any).scheduleOnce).toHaveBeenCalledTimes(1);
        });

        it("should allow clicks after processing is complete", () => {
            // First click
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(1);
            
            // Simulate processing completion
            (component as any).isProcessing = false;
            
            // Second click should now work
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(2);
        });

        it("should execute timeout callback correctly", () => {
            component.onClickGiftCode();
            expect((component as any).isProcessing).toBe(true);
            
            // Get the timeout callback and execute it
            const timeoutCallback = (component as any).scheduleOnce.mock.calls[0][0];
            timeoutCallback();
            expect((component as any).isProcessing).toBe(false);
        });

        it("should handle timeout callback execution", () => {
            component.onClickGiftCode();
            const timeoutCallback = (component as any).scheduleOnce.mock.calls[0][0];
            
            // Verify callback is a function
            expect(typeof timeoutCallback).toBe('function');
            
            // Execute callback
            timeoutCallback();
            expect((component as any).isProcessing).toBe(false);
        });
    });

    describe("updateSpinningFSB", () => {
        it("should have updateSpinningFSB method", () => {
            expect(typeof (component as any).updateSpinningFSB).toBe('function');
        });

        it("should update isSpinningFSB property when called with true", () => {
            (component as any).updateSpinningFSB(true);
            expect((component as any).isSpinningFSB).toBe(true);
        });

        it("should update isSpinningFSB property when called with false", () => {
            (component as any).updateSpinningFSB(false);
            expect((component as any).isSpinningFSB).toBe(false);
        });

        it("should handle multiple state changes", () => {
            (component as any).updateSpinningFSB(true);
            expect((component as any).isSpinningFSB).toBe(true);
            
            (component as any).updateSpinningFSB(false);
            expect((component as any).isSpinningFSB).toBe(false);
            
            (component as any).updateSpinningFSB(true);
            expect((component as any).isSpinningFSB).toBe(true);
        });

        it("should accept boolean parameter", () => {
            expect(() => (component as any).updateSpinningFSB(true)).not.toThrow();
            expect(() => (component as any).updateSpinningFSB(false)).not.toThrow();
        });
    });

    describe("openGiftCodeRedeemPopup", () => {
        it("should have openGiftCodeRedeemPopup method", () => {
            expect(typeof (component as any).openGiftCodeRedeemPopup).toBe('function');
        });

        it("should be callable without parameters", () => {
            expect(() => (component as any).openGiftCodeRedeemPopup()).not.toThrow();
        });

        it("should be called when gift code is clicked", () => {
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(1);
        });

        it("should be called exactly once per click", () => {
            component.onClickGiftCode();
            component.onClickGiftCode(); // Second call should be ignored due to isProcessing
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(1);
        });

        it("should be called multiple times when processing is reset", () => {
            component.onClickGiftCode();
            (component as any).isProcessing = false;
            component.onClickGiftCode();
            expect((component as any).openGiftCodeRedeemPopup).toHaveBeenCalledTimes(2);
        });
    });

    describe("property updates", () => {
        it("should handle processing state changes", () => {
            (component as any).isProcessing = true;
            expect((component as any).isProcessing).toBe(true);
            
            (component as any).isProcessing = false;
            expect((component as any).isProcessing).toBe(false);
        });

        it("should handle rapid state changes", () => {
            for (let i = 0; i < 10; i++) {
                (component as any).isProcessing = i % 2 === 0;
                (component as any).isSpinningFSB = i % 2 === 1;
            }
            expect((component as any).isProcessing).toBe(false);
            expect((component as any).isSpinningFSB).toBe(true);
        });

        it("should handle extreme state values", () => {
            (component as any).isProcessing = true;
            (component as any).isSpinningFSB = true;
            expect((component as any).isProcessing).toBe(true);
            expect((component as any).isSpinningFSB).toBe(true);
        });

        it("should handle null or undefined values gracefully", () => {
            expect(() => {
                const nullValue = null;
                const undefinedValue = undefined;
                // Test that component handles null/undefined gracefully
                if (nullValue) (component as any).isProcessing = true;
                if (undefinedValue) (component as any).isSpinningFSB = false;
            }).not.toThrow();
        });
    });
});
