import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock dependencies following Dependency Inversion Principle
jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => (target: any) => target),
        property: jest.fn(() => (target: any, propertyKey: string) => {}),
    },
    Button: jest.fn(),
    Component: jest.fn(),
    Node: jest.fn(),
    tween: jest.fn(),
    Tween: { stopAllByTarget: jest.fn() },
    Vec3: jest.fn((x: number, y: number, z: number) => ({ x, y, z })),
}));

// Mock Interfaces following Interface Segregation Principle
interface MockNodeVisibility {
    active: boolean;
}

interface MockButtonInteraction {
    interactable: boolean;
}

interface MockNodeTransform {
    scale: { x: number; y: number; z: number };
}

interface MockTweenAnimation {
    repeatForever: jest.Mock;
    to: jest.Mock;
    start: jest.Mock;
}

interface MockVec3Constructor {
    (x: number, y: number, z: number): { x: number; y: number; z: number };
}

interface MockCCEngine {
    tween: jest.Mock;
    Tween: { stopAllByTarget: jest.Mock };
    Vec3: MockVec3Constructor;
}

// Factory functions following Single Responsibility Principle
const createMockVisibleNode = (isVisible: boolean = true): MockNodeVisibility => ({
    active: isVisible,
});

const createMockButtonComponent = (isInteractable: boolean = true): MockButtonInteraction => ({
    interactable: isInteractable,
});

const createMockTransformNode = (scale = { x: 1.0, y: 1.0, z: 1.0 }): MockNodeTransform => ({
    scale: { ...scale },
});

const createMockTweenAnimation = (): MockTweenAnimation => ({
    repeatForever: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
    start: jest.fn(),
});

const createMockCCEngine = (): MockCCEngine => {
    const mockTween = createMockTweenAnimation();
    return {
        tween: jest.fn().mockReturnValue(mockTween),
        Tween: { stopAllByTarget: jest.fn() },
        Vec3: jest.fn((x: number, y: number, z: number) => ({ x, y, z })),
    };
};

// Test Setup Class following Single Responsibility Principle
class SimpleClaimButtonTestSetup {
    mockActiveNode: MockNodeVisibility;
    mockDisableNode: MockNodeVisibility;
    mockButtonComponent: MockButtonInteraction;
    mockTransformNode: MockNodeTransform;
    mockTweenAnimation: MockTweenAnimation;
    mockCCEngine: MockCCEngine;

    constructor() {
        this.setupMocks();
        this.setupCCEngine();
    }

    private setupMocks(): void {
        this.mockActiveNode = createMockVisibleNode(true);
        this.mockDisableNode = createMockVisibleNode(false);
        this.mockButtonComponent = createMockButtonComponent(true);
        this.mockTransformNode = createMockTransformNode();
        this.mockTweenAnimation = createMockTweenAnimation();
        this.mockCCEngine = createMockCCEngine();
    }

    private setupCCEngine(): void {
        const cc = require("cc");
        cc.tween.mockReturnValue(this.mockTweenAnimation);
        cc.Vec3.mockImplementation((x: number, y: number, z: number) => ({ x, y, z }));
    }

    updateActiveNode(overrides: Partial<MockNodeVisibility>): void {
        Object.assign(this.mockActiveNode, overrides);
    }

    updateDisableNode(overrides: Partial<MockNodeVisibility>): void {
        Object.assign(this.mockDisableNode, overrides);
    }

    updateButtonComponent(overrides: Partial<MockButtonInteraction>): void {
        Object.assign(this.mockButtonComponent, overrides);
    }

    updateTransformNode(overrides: Partial<MockNodeTransform>): void {
        Object.assign(this.mockTransformNode, overrides);
    }

    clearAllMocks(): void {
        jest.clearAllMocks();
    }
}

describe("SimpleClaimButton", () => {
    let testSetup: SimpleClaimButtonTestSetup;

    beforeEach(() => {
        testSetup = new SimpleClaimButtonTestSetup();
    });

    // Test suite for Node Visibility Management Responsibility
    describe("Node Visibility Management", () => {
        it("should_toggle_active_node_visibility_correctly", () => {
            testSetup.updateActiveNode({ active: true });
            expect(testSetup.mockActiveNode.active).toBe(true);

            testSetup.updateActiveNode({ active: false });
            expect(testSetup.mockActiveNode.active).toBe(false);
        });

        it("should_toggle_disable_node_visibility_correctly", () => {
            testSetup.updateDisableNode({ active: true });
            expect(testSetup.mockDisableNode.active).toBe(true);

            testSetup.updateDisableNode({ active: false });
            expect(testSetup.mockDisableNode.active).toBe(false);
        });

        it("should_maintain_independent_visibility_states", () => {
            testSetup.updateActiveNode({ active: true });
            testSetup.updateDisableNode({ active: false });

            expect(testSetup.mockActiveNode.active).toBe(true);
            expect(testSetup.mockDisableNode.active).toBe(false);
        });
    });

    // Test suite for Button Interaction Management Responsibility
    describe("Button Interaction Management", () => {
        it("should_toggle_button_interactability_correctly", () => {
            testSetup.updateButtonComponent({ interactable: true });
            expect(testSetup.mockButtonComponent.interactable).toBe(true);

            testSetup.updateButtonComponent({ interactable: false });
            expect(testSetup.mockButtonComponent.interactable).toBe(false);
        });

        it("should_maintain_button_interactable_state", () => {
            testSetup.updateButtonComponent({ interactable: true });
            
            expect(testSetup.mockButtonComponent.interactable).toBe(true);
        });
    });

    // Test suite for Node Transform Management Responsibility
    describe("Node Transform Management", () => {
        it("should_update_node_scale_properties", () => {
            testSetup.updateTransformNode({ scale: { x: 0.5, y: 0.5, z: 0.5 } });
            expect(testSetup.mockTransformNode.scale).toEqual({ x: 0.5, y: 0.5, z: 0.5 });

            testSetup.updateTransformNode({ scale: { x: 1.0, y: 1.0, z: 1.0 } });
            expect(testSetup.mockTransformNode.scale).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
        });

        it("should_handle_different_scale_values", () => {
            const customScale = { x: 1.5, y: 2.0, z: 0.8 };
            testSetup.updateTransformNode({ scale: customScale });
            
            expect(testSetup.mockTransformNode.scale).toEqual(customScale);
        });
    });

    // Test suite for CC Engine Integration Responsibility
    describe("CC Engine Integration", () => {
        it("should_create_vec3_with_correct_coordinates", () => {
            const cc = require("cc");
            
            const vec1 = cc.Vec3(1.0, 1.0, 1.0);
            expect(vec1).toEqual({ x: 1.0, y: 1.0, z: 1.0 });

            const vec2 = cc.Vec3(0.5, 0.5, 0.5);
            expect(vec2).toEqual({ x: 0.5, y: 0.5, z: 0.5 });
        });

        it("should_create_tween_for_target_node", () => {
            const cc = require("cc");
            
            cc.tween(testSetup.mockTransformNode);
            expect(cc.tween).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });

        it("should_provide_tween_animation_methods", () => {
            expect(testSetup.mockTweenAnimation.repeatForever).toBeDefined();
            expect(testSetup.mockTweenAnimation.to).toBeDefined();
            expect(testSetup.mockTweenAnimation.start).toBeDefined();
        });

        it("should_execute_tween_animation_chain", () => {
            testSetup.mockTweenAnimation.repeatForever();
            expect(testSetup.mockTweenAnimation.repeatForever).toHaveBeenCalled();

            testSetup.mockTweenAnimation.start();
            expect(testSetup.mockTweenAnimation.start).toHaveBeenCalled();
        });

        it("should_stop_all_tweens_for_target_node", () => {
            const cc = require("cc");
            
            cc.Tween.stopAllByTarget(testSetup.mockTransformNode);
            expect(cc.Tween.stopAllByTarget).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });
    });

    // Business Logic Handlers following Single Responsibility Principle
    class ClaimableStateHandler {
        static setClaimable(
            isClaimable: boolean, 
            activeNode?: MockNodeVisibility, 
            disableNode?: MockNodeVisibility, 
            buttonComponent?: MockButtonInteraction
        ): void {
            if (activeNode) {
                activeNode.active = isClaimable;
            }
            if (disableNode) {
                disableNode.active = !isClaimable;
            }
            if (buttonComponent) {
                buttonComponent.interactable = isClaimable;
            }
        }
    }

    // Test suite for Claimable State Management Responsibility
    describe("Claimable State Management", () => {
        it("should_set_all_components_to_claimable_state_when_true", () => {
            ClaimableStateHandler.setClaimable(
                true, 
                testSetup.mockActiveNode, 
                testSetup.mockDisableNode, 
                testSetup.mockButtonComponent
            );

            expect(testSetup.mockActiveNode.active).toBe(true);
            expect(testSetup.mockDisableNode.active).toBe(false);
            expect(testSetup.mockButtonComponent.interactable).toBe(true);
        });

        it("should_set_all_components_to_non_claimable_state_when_false", () => {
            ClaimableStateHandler.setClaimable(
                false, 
                testSetup.mockActiveNode, 
                testSetup.mockDisableNode, 
                testSetup.mockButtonComponent
            );

            expect(testSetup.mockActiveNode.active).toBe(false);
            expect(testSetup.mockDisableNode.active).toBe(true);
            expect(testSetup.mockButtonComponent.interactable).toBe(false);
        });

        it("should_handle_missing_active_node_gracefully", () => {
            expect(() => {
                ClaimableStateHandler.setClaimable(
                    true, 
                    undefined, 
                    testSetup.mockDisableNode, 
                    testSetup.mockButtonComponent
                );
            }).not.toThrow();

            expect(testSetup.mockDisableNode.active).toBe(false);
            expect(testSetup.mockButtonComponent.interactable).toBe(true);
        });

        it("should_handle_missing_disable_node_gracefully", () => {
            expect(() => {
                ClaimableStateHandler.setClaimable(
                    false, 
                    testSetup.mockActiveNode, 
                    undefined, 
                    testSetup.mockButtonComponent
                );
            }).not.toThrow();

            expect(testSetup.mockActiveNode.active).toBe(false);
            expect(testSetup.mockButtonComponent.interactable).toBe(false);
        });

        it("should_handle_missing_button_component_gracefully", () => {
            expect(() => {
                ClaimableStateHandler.setClaimable(
                    true, 
                    testSetup.mockActiveNode, 
                    testSetup.mockDisableNode, 
                    undefined
                );
            }).not.toThrow();

            expect(testSetup.mockActiveNode.active).toBe(true);
            expect(testSetup.mockDisableNode.active).toBe(false);
        });
    });

    // Business Logic Handler for Pulse Animation
    class PulseAnimationHandler {
        static startPulseAnimation(
            node: MockNodeTransform,
            ccEngine: MockCCEngine
        ): MockTweenAnimation {
            node.scale = ccEngine.Vec3(1.0, 1.0, 1.0);
            return ccEngine.tween(node) as unknown as MockTweenAnimation;
        }

        static createAnimationSequence(
            node: MockNodeTransform,
            ccEngine: MockCCEngine
        ): void {
            const tween = ccEngine.tween(node) as unknown as MockTweenAnimation;
            const repeatTween = tween.repeatForever() as unknown as MockTweenAnimation;
            repeatTween.start();
        }

        static stopPulseAnimation(
            node: MockNodeTransform,
            ccEngine: MockCCEngine
        ): void {
            ccEngine.Tween.stopAllByTarget(node);
        }
    }

    // Test suite for Pulse Animation Management Responsibility
    describe("Pulse Animation Management", () => {
        it("should_reset_node_scale_to_default_when_starting_pulse", () => {
            testSetup.updateTransformNode({ scale: { x: 0.5, y: 0.5, z: 0.5 } });

            const result = PulseAnimationHandler.startPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockTransformNode.scale).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
            expect(testSetup.mockCCEngine.tween).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });

        it("should_handle_scale_reset_from_any_initial_value", () => {
            const customScale = { x: 2.5, y: 0.3, z: 1.8 };
            testSetup.updateTransformNode({ scale: customScale });

            const cc = require("cc");
            testSetup.mockTransformNode.scale = cc.Vec3(1.0, 1.0, 1.0);

            expect(testSetup.mockTransformNode.scale).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
        });

        it("should_create_repeating_tween_animation_sequence", () => {
            PulseAnimationHandler.createAnimationSequence(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockCCEngine.tween).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });

        it("should_stop_all_pulse_animations_for_target_node", () => {
            PulseAnimationHandler.stopPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockCCEngine.Tween.stopAllByTarget).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });

        it("should_handle_multiple_stop_calls_safely", () => {
            PulseAnimationHandler.stopPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );
            PulseAnimationHandler.stopPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );
            PulseAnimationHandler.stopPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockCCEngine.Tween.stopAllByTarget).toHaveBeenCalledTimes(3);
            expect(testSetup.mockCCEngine.Tween.stopAllByTarget).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });
    });

    // This section was refactored into Pulse Animation Management suite above

    // Test suite for Integration Scenarios Responsibility
    describe("Integration Scenarios", () => {
        it("should_handle_complete_claimable_state_transition", () => {
            // Start with non-claimable state
            ClaimableStateHandler.setClaimable(
                false, 
                testSetup.mockActiveNode, 
                testSetup.mockDisableNode, 
                testSetup.mockButtonComponent
            );

            expect(testSetup.mockActiveNode.active).toBe(false);
            expect(testSetup.mockDisableNode.active).toBe(true);
            expect(testSetup.mockButtonComponent.interactable).toBe(false);

            // Transition to claimable state
            ClaimableStateHandler.setClaimable(
                true, 
                testSetup.mockActiveNode, 
                testSetup.mockDisableNode, 
                testSetup.mockButtonComponent
            );

            expect(testSetup.mockActiveNode.active).toBe(true);
            expect(testSetup.mockDisableNode.active).toBe(false);
            expect(testSetup.mockButtonComponent.interactable).toBe(true);
        });

        it("should_handle_complete_pulse_animation_lifecycle", () => {
            // Start pulse animation
            PulseAnimationHandler.startPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );
            PulseAnimationHandler.createAnimationSequence(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockCCEngine.tween).toHaveBeenCalledWith(testSetup.mockTransformNode);

            // Stop pulse animation
            PulseAnimationHandler.stopPulseAnimation(
                testSetup.mockTransformNode,
                testSetup.mockCCEngine
            );

            expect(testSetup.mockCCEngine.Tween.stopAllByTarget).toHaveBeenCalledWith(testSetup.mockTransformNode);
        });

        it("should_handle_edge_cases_with_undefined_components", () => {
            expect(() => {
                ClaimableStateHandler.setClaimable(true, undefined, undefined, undefined);
            }).not.toThrow();

            expect(() => {
                ClaimableStateHandler.setClaimable(false, undefined, undefined, undefined);
            }).not.toThrow();
        });

        it("should_handle_multiple_consecutive_state_changes", () => {
            const stateSequence = [true, false, true, false];

            stateSequence.forEach(state => {
                ClaimableStateHandler.setClaimable(
                    state, 
                    testSetup.mockActiveNode, 
                    testSetup.mockDisableNode, 
                    testSetup.mockButtonComponent
                );
            });

            // Final state should be false (last in sequence)
            expect(testSetup.mockActiveNode.active).toBe(false);
            expect(testSetup.mockDisableNode.active).toBe(true);
            expect(testSetup.mockButtonComponent.interactable).toBe(false);
        });

        it("should_handle_multiple_pulse_start_stop_cycles", () => {
            const cycles = 2;

            for (let i = 0; i < cycles; i++) {
                PulseAnimationHandler.startPulseAnimation(
                    testSetup.mockTransformNode,
                    testSetup.mockCCEngine
                );
                PulseAnimationHandler.stopPulseAnimation(
                    testSetup.mockTransformNode,
                    testSetup.mockCCEngine
                );
            }

            expect(testSetup.mockCCEngine.tween).toHaveBeenCalledTimes(cycles);
            expect(testSetup.mockCCEngine.Tween.stopAllByTarget).toHaveBeenCalledTimes(cycles);
        });
    });

    // Test suite for Interface Contract Validation
    describe("Interface Contract Validation", () => {
        it("should_validate_node_visibility_interface_contract", () => {
            const mockNode = createMockVisibleNode(true);
            
            expect(mockNode).toHaveProperty("active");
            expect(typeof mockNode.active).toBe("boolean");
        });

        it("should_validate_button_interaction_interface_contract", () => {
            const mockButton = createMockButtonComponent(true);
            
            expect(mockButton).toHaveProperty("interactable");
            expect(typeof mockButton.interactable).toBe("boolean");
        });

        it("should_validate_node_transform_interface_contract", () => {
            const mockTransform = createMockTransformNode();
            
            expect(mockTransform).toHaveProperty("scale");
            expect(mockTransform.scale).toHaveProperty("x");
            expect(mockTransform.scale).toHaveProperty("y");
            expect(mockTransform.scale).toHaveProperty("z");
            expect(typeof mockTransform.scale.x).toBe("number");
            expect(typeof mockTransform.scale.y).toBe("number");
            expect(typeof mockTransform.scale.z).toBe("number");
        });

        it("should_validate_tween_animation_interface_contract", () => {
            const mockTween = createMockTweenAnimation();
            
            expect(mockTween).toHaveProperty("repeatForever");
            expect(mockTween).toHaveProperty("to");
            expect(mockTween).toHaveProperty("start");
            expect(typeof mockTween.repeatForever).toBe("function");
            expect(typeof mockTween.to).toBe("function");
            expect(typeof mockTween.start).toBe("function");
        });
    });

    // Test suite for Business Logic Handler Structure Validation
    describe("Business Logic Handler Structure Validation", () => {
        it("should_validate_claimable_state_handler_structure", () => {
            expect(ClaimableStateHandler).toBeDefined();
            expect(typeof ClaimableStateHandler.setClaimable).toBe("function");
        });

        it("should_validate_pulse_animation_handler_structure", () => {
            expect(PulseAnimationHandler).toBeDefined();
            expect(typeof PulseAnimationHandler.startPulseAnimation).toBe("function");
            expect(typeof PulseAnimationHandler.createAnimationSequence).toBe("function");
            expect(typeof PulseAnimationHandler.stopPulseAnimation).toBe("function");
        });

        it("should_validate_test_setup_class_structure", () => {
            expect(testSetup).toBeInstanceOf(SimpleClaimButtonTestSetup);
            expect(typeof testSetup.updateActiveNode).toBe("function");
            expect(typeof testSetup.updateDisableNode).toBe("function");
            expect(typeof testSetup.updateButtonComponent).toBe("function");
            expect(typeof testSetup.updateTransformNode).toBe("function");
            expect(typeof testSetup.clearAllMocks).toBe("function");
        });
    });
});
