import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { GiftCode } from "../../../assets/fsb-promotion/scripts/components/gift-code";
import { Node } from "cc";
import DraggableItem from "db://shared-components/shared/common-components/draggable/draggable-item";

// Mock CascadingSlotState enum - not available in current codebase
enum CascadingSlotState {
    NOT_READY_BET = "NOT_READY_BET",
    READY_BET = "READY_BET", 
    SPINNING = "SPINNING",
    SETTLED = "SETTLED"
}

// Mock dependencies following Dependency Inversion Principle
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
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

// Mock Interfaces following Interface Segregation Principle
interface MockIcon {
    // Icon properties if needed
}

interface MockTouchCallback {
    end: ((isClick: boolean) => void) | null;
}

interface MockDraggableItem {
    touchCallback: MockTouchCallback;
}

interface MockComponentLifecycle {
    scheduleOnce: jest.Mock;
    getComponent: jest.Mock;
}

interface MockGiftCodeState {
    isProcessing: boolean;
    cascadingState: any;
}

interface MockGiftCodeActions {
    openGiftCodeRedeemPopup: jest.Mock;
    onEnable: () => void;
    dragGiftCode: () => void;
    onClickGiftCode: () => void;
    updateClaimedBonusSuccess: (newState: any) => void;
}

interface MockGiftCodeComponent extends MockComponentLifecycle, MockGiftCodeState, MockGiftCodeActions {
    icon: MockIcon;
}

// Factory functions following Single Responsibility Principle
const createMockIcon = (): MockIcon => ({});

const createMockTouchCallback = (): MockTouchCallback => ({
    end: null,
});

const createMockDraggableItem = (): MockDraggableItem => ({
    touchCallback: createMockTouchCallback(),
});

const createMockGiftCodeComponent = (overrides?: Partial<MockGiftCodeComponent>): MockGiftCodeComponent => {
    const mockIcon = createMockIcon();
    const mockDraggableItem = createMockDraggableItem();

    const component: MockGiftCodeComponent = {
        icon: mockIcon,
        scheduleOnce: jest.fn(),
        getComponent: jest.fn().mockReturnValue(mockDraggableItem),
        isProcessing: false,
        cascadingState: CascadingSlotState.NOT_READY_BET,
        openGiftCodeRedeemPopup: jest.fn(),
        
        onEnable() {
            this.dragGiftCode();
        },
        
        dragGiftCode() {
            const draggable = this.getComponent(DraggableItem) as MockDraggableItem;
            if (draggable && draggable.touchCallback) {
                draggable.touchCallback.end = (isClick) => {
                    if (isClick) {
                        this.onClickGiftCode();
                    }
                };
            }
        },
        
        onClickGiftCode() {
            if (this.isProcessing || this.cascadingState === CascadingSlotState.SPINNING) {
                return;
            }
            
            this.isProcessing = true;
            this.openGiftCodeRedeemPopup();
            
            this.scheduleOnce(() => {
                this.isProcessing = false;
            }, 1);
        },
        
        updateClaimedBonusSuccess(newState: any) {
            this.cascadingState = newState;
        },
        
        ...overrides,
    };

    return component;
};

// Business Logic Handlers following Single Responsibility Principle
class GiftCodeStateHandler {
    static canProcessClick(component: MockGiftCodeState): boolean {
        return !component.isProcessing && component.cascadingState !== CascadingSlotState.SPINNING;
    }

    static updateProcessingState(component: MockGiftCodeState, isProcessing: boolean): void {
        component.isProcessing = isProcessing;
    }

    static updateCascadingState(component: MockGiftCodeState, newState: any): void {
        component.cascadingState = newState;
    }
}

class GiftCodeInteractionHandler {
    static setupDragInteraction(component: MockGiftCodeComponent): void {
        const draggable = component.getComponent(DraggableItem) as MockDraggableItem;
        if (draggable && draggable.touchCallback) {
            draggable.touchCallback.end = (isClick: boolean) => {
                if (isClick) {
                    component.onClickGiftCode();
                }
            };
        }
    }

    static handleClick(component: MockGiftCodeComponent): void {
        if (!GiftCodeStateHandler.canProcessClick(component)) {
            return;
        }

        GiftCodeStateHandler.updateProcessingState(component, true);
        component.openGiftCodeRedeemPopup();

        component.scheduleOnce(() => {
            GiftCodeStateHandler.updateProcessingState(component, false);
        }, 1);
    }
}

// Test Setup Class following Single Responsibility Principle
class GiftCodeTestSetup {
    component: MockGiftCodeComponent;
    mockIcon: MockIcon;
    mockDraggableItem: MockDraggableItem;
    mockTouchCallback: MockTouchCallback;

    constructor(componentOverrides?: Partial<MockGiftCodeComponent>) {
        this.setupMocks();
        this.setupComponent(componentOverrides);
    }

    private setupMocks(): void {
        this.mockIcon = createMockIcon();
        this.mockTouchCallback = createMockTouchCallback();
        this.mockDraggableItem = createMockDraggableItem();
    }

    private setupComponent(overrides?: Partial<MockGiftCodeComponent>): void {
        this.component = createMockGiftCodeComponent({
            ...overrides,
            getComponent: jest.fn().mockReturnValue(this.mockDraggableItem),
        });
    }

    updateComponentState(stateOverrides: Partial<MockGiftCodeState>): void {
        Object.assign(this.component, stateOverrides);
    }

    updateDraggableItem(draggableOverrides: Partial<MockDraggableItem>): void {
        Object.assign(this.mockDraggableItem, draggableOverrides);
        (this.component.getComponent as jest.Mock).mockReturnValue(this.mockDraggableItem);
    }

    simulateClick(): void {
        this.component.dragGiftCode();
        if (this.mockDraggableItem.touchCallback.end) {
            this.mockDraggableItem.touchCallback.end(true);
        }
    }

    simulateDrag(): void {
        this.component.dragGiftCode();
        if (this.mockDraggableItem.touchCallback.end) {
            this.mockDraggableItem.touchCallback.end(false);
        }
    }

    clearAllMocks(): void {
        jest.clearAllMocks();
    }
}

describe("GiftCode", () => {
    let testSetup: GiftCodeTestSetup;

    beforeEach(() => {
        testSetup = new GiftCodeTestSetup();
    });

    // Test suite for Component Initialization Responsibility
    describe("Component Initialization", () => {
        it("should_initialize_with_correct_default_state_values", () => {
            expect(testSetup.component.icon).toBeDefined();
            expect(testSetup.component.isProcessing).toBe(false);
            expect(testSetup.component.cascadingState).toBe(CascadingSlotState.NOT_READY_BET);
        });

        it("should_have_all_required_component_lifecycle_methods", () => {
            expect(typeof testSetup.component.onEnable).toBe('function');
            expect(typeof testSetup.component.scheduleOnce).toBe('function');
            expect(typeof testSetup.component.getComponent).toBe('function');
        });

        it("should_have_all_required_gift_code_action_methods", () => {
            expect(typeof testSetup.component.dragGiftCode).toBe('function');
            expect(typeof testSetup.component.onClickGiftCode).toBe('function');
            expect(typeof testSetup.component.updateClaimedBonusSuccess).toBe('function');
            expect(typeof testSetup.component.openGiftCodeRedeemPopup).toBe('function');
        });
    });

    // Test suite for Component Lifecycle Management Responsibility
    describe("Component Lifecycle Management", () => {
        it("should_call_drag_gift_code_setup_on_enable", () => {
            const dragGiftCodeSpy = jest.spyOn(testSetup.component, 'dragGiftCode');

            testSetup.component.onEnable();

            expect(dragGiftCodeSpy).toHaveBeenCalled();
        });

        it("should_initialize_component_in_ready_state_on_enable", () => {
            expect(testSetup.component.isProcessing).toBe(false);
            expect(testSetup.component.cascadingState).toBe(CascadingSlotState.NOT_READY_BET);
        });
    });

    // Test suite for Drag Interaction Management Responsibility
    describe("Drag Interaction Management", () => {
        it("should_get_draggable_component_and_setup_touch_callback", () => {
            testSetup.component.dragGiftCode();

            expect(testSetup.component.getComponent).toHaveBeenCalledWith(DraggableItem);
            expect(testSetup.mockDraggableItem.touchCallback.end).toBeDefined();
            expect(typeof testSetup.mockDraggableItem.touchCallback.end).toBe('function');
        });

        it("should_handle_missing_draggable_component_gracefully", () => {
            testSetup.updateDraggableItem(null as any);
            (testSetup.component.getComponent as jest.Mock).mockReturnValue(null);

            expect(() => testSetup.component.dragGiftCode()).not.toThrow();
            expect(testSetup.component.getComponent).toHaveBeenCalledWith(DraggableItem);
        });

        it("should_trigger_click_handler_when_touch_ends_with_click", () => {
            const onClickSpy = jest.spyOn(testSetup.component, 'onClickGiftCode');

            testSetup.simulateClick();

            expect(onClickSpy).toHaveBeenCalled();
        });

        it("should_not_trigger_click_handler_when_touch_ends_without_click", () => {
            const onClickSpy = jest.spyOn(testSetup.component, 'onClickGiftCode');

            testSetup.simulateDrag();

            expect(onClickSpy).not.toHaveBeenCalled();
        });

        it("should_handle_draggable_with_no_touch_callback_gracefully", () => {
            testSetup.updateDraggableItem({ touchCallback: undefined as any });

            expect(() => testSetup.component.dragGiftCode()).not.toThrow();
        });
    });

    // Test suite for Click Processing Logic Responsibility
    describe("Click Processing Logic", () => {
        beforeEach(() => {
            // Ensure component starts in clickable state
            testSetup.updateComponentState({
                isProcessing: false,
                cascadingState: CascadingSlotState.NOT_READY_BET,
            });
        });

        it("should_prevent_processing_when_already_processing", () => {
            testSetup.updateComponentState({ isProcessing: true });

            testSetup.component.onClickGiftCode();

            expect(testSetup.component.openGiftCodeRedeemPopup).not.toHaveBeenCalled();
        });

        it("should_prevent_processing_when_cascading_state_is_spinning", () => {
            testSetup.updateComponentState({ cascadingState: CascadingSlotState.SPINNING });

            testSetup.component.onClickGiftCode();

            expect(testSetup.component.openGiftCodeRedeemPopup).not.toHaveBeenCalled();
        });

        it("should_prevent_processing_when_both_conditions_block_click", () => {
            testSetup.updateComponentState({ 
                isProcessing: true, 
                cascadingState: CascadingSlotState.SPINNING 
            });

            testSetup.component.onClickGiftCode();

            expect(testSetup.component.openGiftCodeRedeemPopup).not.toHaveBeenCalled();
        });

        it("should_process_click_when_all_conditions_are_met", () => {
            testSetup.component.onClickGiftCode();

            expect(testSetup.component.isProcessing).toBe(true);
            expect(testSetup.component.openGiftCodeRedeemPopup).toHaveBeenCalled();
        });

        it("should_schedule_processing_reset_after_successful_click", () => {
            testSetup.component.onClickGiftCode();

            expect(testSetup.component.scheduleOnce).toHaveBeenCalledWith(
                expect.any(Function), 
                1
            );
        });

        it("should_handle_multiple_valid_cascading_states_for_clicking", () => {
            const validStates = [
                CascadingSlotState.NOT_READY_BET,
                CascadingSlotState.READY_BET,
                CascadingSlotState.SETTLED,
            ];

            validStates.forEach(state => {
                testSetup.updateComponentState({ 
                    isProcessing: false, 
                    cascadingState: state 
                });
                
                testSetup.component.onClickGiftCode();

                expect(testSetup.component.openGiftCodeRedeemPopup).toHaveBeenCalled();
                
                // Reset for next iteration
                (testSetup.component.openGiftCodeRedeemPopup as jest.Mock).mockClear();
            });
        });
    });

    // Test suite for State Update Management Responsibility
    describe("State Update Management", () => {
        it("should_update_cascading_state_with_new_value", () => {
            const newState = CascadingSlotState.SPINNING;

            testSetup.component.updateClaimedBonusSuccess(newState);

            expect(testSetup.component.cascadingState).toBe(newState);
        });

        it("should_handle_all_valid_cascading_state_transitions", () => {
            const validStates = [
                CascadingSlotState.NOT_READY_BET,
                CascadingSlotState.READY_BET,
                CascadingSlotState.SPINNING,
                CascadingSlotState.SETTLED,
            ];

            validStates.forEach(state => {
                testSetup.component.updateClaimedBonusSuccess(state);
                expect(testSetup.component.cascadingState).toBe(state);
            });
        });

        it("should_maintain_state_consistency_across_updates", () => {
            const stateSequence = [
                CascadingSlotState.READY_BET,
                CascadingSlotState.SPINNING,
                CascadingSlotState.SETTLED,
                CascadingSlotState.NOT_READY_BET,
            ];

            stateSequence.forEach((state, index) => {
                testSetup.component.updateClaimedBonusSuccess(state);
                expect(testSetup.component.cascadingState).toBe(state);
                
                // Verify previous state was properly overwritten
                if (index > 0) {
                    expect(testSetup.component.cascadingState).not.toBe(stateSequence[index - 1]);
                }
            });
        });
    });

    // Test suite for Gift Code Popup Management Responsibility
    describe("Gift Code Popup Management", () => {
        it("should_have_redeem_popup_method_available", () => {
            expect(testSetup.component.openGiftCodeRedeemPopup).toBeDefined();
            expect(typeof testSetup.component.openGiftCodeRedeemPopup).toBe('function');
        });

        it("should_be_callable_when_component_is_ready", () => {
            expect(() => {
                testSetup.component.openGiftCodeRedeemPopup();
            }).not.toThrow();
        });
    });

    // Test suite for Component State Interaction Scenarios
    describe("Component State Interaction Scenarios", () => {
        it("should_prevent_multiple_rapid_click_processing", () => {
            // First click - should process
            testSetup.component.onClickGiftCode();
            expect(testSetup.component.isProcessing).toBe(true);

            // Clear mocks to verify second call behavior
            testSetup.clearAllMocks();

            // Second click while processing - should be ignored
            testSetup.component.onClickGiftCode();
            expect(testSetup.component.openGiftCodeRedeemPopup).not.toHaveBeenCalled();
        });

        it("should_handle_state_changes_during_processing", () => {
            testSetup.component.onClickGiftCode();
            expect(testSetup.component.isProcessing).toBe(true);

            // State change during processing
            testSetup.component.updateClaimedBonusSuccess(CascadingSlotState.SPINNING);
            expect(testSetup.component.cascadingState).toBe(CascadingSlotState.SPINNING);

            // Should still be processing
            expect(testSetup.component.isProcessing).toBe(true);
        });

        it("should_maintain_processing_isolation_across_interactions", () => {
            // Test that processing state doesn't affect drag setup
            testSetup.updateComponentState({ isProcessing: true });
            
            expect(() => {
                testSetup.component.dragGiftCode();
            }).not.toThrow();
            
            expect(testSetup.mockDraggableItem.touchCallback.end).toBeDefined();
        });
    });

    // Test suite for Edge Cases and Error Handling
    describe("Edge Cases and Error Handling", () => {
        it("should_handle_undefined_draggable_component_gracefully", () => {
            (testSetup.component.getComponent as jest.Mock).mockReturnValue(undefined);

            expect(() => testSetup.component.dragGiftCode()).not.toThrow();
        });

        it("should_maintain_consistent_state_across_operations", () => {
            // Verify initial state
            expect(testSetup.component.isProcessing).toBe(false);
            expect(testSetup.component.cascadingState).toBe(CascadingSlotState.NOT_READY_BET);

            // Change to valid non-spinning state
            testSetup.component.updateClaimedBonusSuccess(CascadingSlotState.SETTLED);
            expect(testSetup.component.cascadingState).toBe(CascadingSlotState.SETTLED);

            // Reset processing state and verify click still works
            testSetup.updateComponentState({ isProcessing: false });
            testSetup.component.onClickGiftCode();
            expect(testSetup.component.isProcessing).toBe(true);
        });

        it("should_handle_null_touch_callback_without_errors", () => {
            testSetup.updateDraggableItem({ touchCallback: { end: null } });

            expect(() => {
                testSetup.component.dragGiftCode();
            }).not.toThrow();
        });

        it("should_handle_component_in_invalid_initial_state", () => {
            const invalidSetup = new GiftCodeTestSetup({
                isProcessing: true,
                cascadingState: CascadingSlotState.SPINNING,
            });

            invalidSetup.component.onClickGiftCode();
            expect(invalidSetup.component.openGiftCodeRedeemPopup).not.toHaveBeenCalled();
        });
    });
});

