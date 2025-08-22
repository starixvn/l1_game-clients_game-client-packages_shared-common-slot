import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { GiftCode } from "../../scripts/components/gift-code";
import { Node } from "cc";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";
import { CascadingSlotState } from "db://shared-cascading-slot/cascading-slot-state";

// Mock decorators first
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock _decorator from cc
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

// Mock dependencies
jest.mock("db://shared-components/shared/common-components/draggable/draggable-item", () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        getComponent = jest.fn();
        scheduleOnce = jest.fn();
    },
}));
jest.mock("../../scripts/stores/fsb-promotion-ui-store");
jest.mock("../../scripts/handlers/fsb-promotion-ui-handler");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));
jest.mock("db://shared-cascading-slot/stores/cascading-ui-store");
jest.mock("db://shared-cascading-slot/cascading-slot-state");

// Mock cascading slot dependencies
jest.mock("db://shared-cascading-slot/cascading-slot-utils", () => ({
    globalEmitter: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    },
    SlotClientEvent: {},
    SlotNotification: {},
}));

describe("GiftCode", () => {
    let component: GiftCode;
    let mockIcon: any;
    let mockDraggableItem: any;
    let mockTouchCallback: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock icon
        mockIcon = {};

        // Create mock touch callback
        mockTouchCallback = {
            end: null
        };

        // Create mock draggable item
        mockDraggableItem = {
            touchCallback: mockTouchCallback
        };

        // Create component instance
        component = new GiftCode();
        component.icon = mockIcon;
        component.getComponent = jest.fn() as any;
        component.scheduleOnce = jest.fn();

        // Mock methods that will be handled by decorators
        component['openGiftCodeRedeemPopup'] = jest.fn();
        
        // Setup default getComponent behavior
        (component.getComponent as jest.Mock).mockReturnValue(mockDraggableItem);
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            // Assert
            expect(component.icon).toBeDefined();
            expect(component['isProcessing']).toBe(false);
            expect(component['cascadingState']).toBe(CascadingSlotState.NOT_READY_BET);
        });

        it("should have icon property", () => {
            // Assert
            expect(component.icon).toBe(mockIcon);
        });
    });

    describe("onEnable", () => {
        it("should call dragGiftCode", () => {
            // Arrange
            const dragGiftCodeSpy = jest.spyOn(component, 'dragGiftCode');

            // Act
            component.onEnable();

            // Assert
            expect(dragGiftCodeSpy).toHaveBeenCalled();
        });
    });

    describe("dragGiftCode", () => {
        it("should get DraggableItem component and set touch callback", () => {
            // Act
            component.dragGiftCode();

            // Assert
            expect(component.getComponent).toHaveBeenCalledWith(DraggableItem);
            expect(mockTouchCallback.end).toBeDefined();
            expect(typeof mockTouchCallback.end).toBe('function');
        });

        it("should handle case when DraggableItem component is null", () => {
            // Arrange
            (component.getComponent as jest.Mock).mockReturnValue(null);

            // Act & Assert - should not throw
            expect(() => component.dragGiftCode()).not.toThrow();
            expect(component.getComponent).toHaveBeenCalledWith(DraggableItem);
        });

        it("should set touch callback that calls onClickGiftCode when clicked", () => {
            // Arrange
            const onClickSpy = jest.spyOn(component, 'onClickGiftCode');

            // Act
            component.dragGiftCode();
            mockTouchCallback.end(true); // simulate click

            // Assert
            expect(onClickSpy).toHaveBeenCalled();
        });

        it("should not call onClickGiftCode when not clicked", () => {
            // Arrange
            const onClickSpy = jest.spyOn(component, 'onClickGiftCode');

            // Act
            component.dragGiftCode();
            mockTouchCallback.end(false); // simulate drag without click

            // Assert
            expect(onClickSpy).not.toHaveBeenCalled();
        });
    });

    describe("onClickGiftCode", () => {
        beforeEach(() => {
            // Ensure component is in a clickable state by default
            component['isProcessing'] = false;
            component['cascadingState'] = CascadingSlotState.NOT_READY_BET;
        });

        it("should return early when isProcessing is true", () => {
            // Arrange
            component['isProcessing'] = true;

            // Act
            component.onClickGiftCode();

            // Assert
            expect(component['openGiftCodeRedeemPopup']).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should return early when cascading state is SPINNING", () => {
            // Arrange
            component['cascadingState'] = CascadingSlotState.SPINNING;

            // Act
            component.onClickGiftCode();

            // Assert
            expect(component['openGiftCodeRedeemPopup']).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should return early when both isProcessing is true and state is SPINNING", () => {
            // Arrange
            component['isProcessing'] = true;
            component['cascadingState'] = CascadingSlotState.SPINNING;

            // Act
            component.onClickGiftCode();

            // Assert
            expect(component['openGiftCodeRedeemPopup']).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should successfully execute when conditions are met", () => {
            // Arrange - conditions are already set in beforeEach
            // isProcessing = false, cascadingState = NOT_READY_BET

            // Act
            component.onClickGiftCode();

            // Assert
            expect(component['isProcessing']).toBe(true);
            expect(component['openGiftCodeRedeemPopup']).toHaveBeenCalled();
            expect((component as any).scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 1);
        });
    });

    describe("updateClaimedBonusSuccess", () => {
        it("should update cascadingState with new value", () => {
            // Arrange
            const newState = CascadingSlotState.SPINNING;

            // Act
            component['updateClaimedBonusSuccess'](newState);

            // Assert
            expect(component['cascadingState']).toBe(newState);
        });

        it("should update cascadingState with different states", () => {
            const testStates = [
                CascadingSlotState.NOT_READY_BET,
                CascadingSlotState.READY_BET,
                CascadingSlotState.SPINNING,
                CascadingSlotState.SETTLED,
            ];

            testStates.forEach(state => {
                // Act
                component['updateClaimedBonusSuccess'](state);

                // Assert
                expect(component['cascadingState']).toBe(state);
            });
        });

        it("should handle string state values", () => {
            // Arrange
            const stringState = "CUSTOM_STATE";

            // Act
            component['updateClaimedBonusSuccess'](stringState);

            // Assert
            expect(component['cascadingState']).toBe(stringState);
        });
    });

    describe("openGiftCodeRedeemPopup", () => {
        it("should be defined as a method", () => {
            // Assert
            expect(component['openGiftCodeRedeemPopup']).toBeDefined();
            expect(typeof component['openGiftCodeRedeemPopup']).toBe('function');
        });
    });

    describe("component state interactions", () => {
        it("should prevent multiple rapid clicks", () => {
            // Act - first click
            component.onClickGiftCode();
            expect(component['isProcessing']).toBe(true);

            // Clear mocks to check second call
            jest.clearAllMocks();

            // Act - second click while processing
            component.onClickGiftCode();

            // Assert - second click should be ignored
            expect(component['openGiftCodeRedeemPopup']).not.toHaveBeenCalled();
            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });
    });

    describe("edge cases", () => {
        it("should handle undefined draggable component gracefully", () => {
            // Arrange
            (component.getComponent as jest.Mock).mockReturnValue(undefined);

            // Act & Assert
            expect(() => component.dragGiftCode()).not.toThrow();
        });

        it("should handle draggable component without touchCallback", () => {
            // Arrange
            const incompleteDraggable = {}; // No touchCallback property
            (component.getComponent as jest.Mock).mockReturnValue(incompleteDraggable);

            // Act & Assert - This should throw because the real code tries to access touchCallback.end
            expect(() => component.dragGiftCode()).toThrow();
        });

        it("should maintain state consistency", () => {
            // Initial state check
            expect(component['isProcessing']).toBe(false);
            expect(component['cascadingState']).toBe(CascadingSlotState.NOT_READY_BET);

            // Change state to a valid non-spinning state
            component['updateClaimedBonusSuccess'](CascadingSlotState.SETTLED);
            expect(component['cascadingState']).toBe(CascadingSlotState.SETTLED);

            // Processing should still work (need to ensure isProcessing starts as false)
            component['isProcessing'] = false; // Ensure clean state
            component.onClickGiftCode();
            expect(component['isProcessing']).toBe(true);
        });
    });
});
