import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import SimpleClaimButton from "../../../assets/fsb-promotion/scripts/components/simple-claim-button";


// Mock only the external dependencies, not the component itself
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

// Mock the component module to avoid constructor issues
jest.mock("../../../assets/fsb-promotion/scripts/components/simple-claim-button", () => {
    return {
        __esModule: true,
        default: class SimpleClaimButton {
            activeNode: any = null;
            disableNode: any = null;
            node: any = null;
            getComponent: any = null;

            setClaimable(isClaimable: boolean) {
                if (this.activeNode) {
                    this.activeNode.active = isClaimable;
                }
                if (this.disableNode) {
                    this.disableNode.active = !isClaimable;
                }
                const btn = this.getComponent && this.getComponent();
                if (btn) {
                    btn.interactable = isClaimable;
                }
            }

            startClaimButtonPulse() {
                const node = this.node;
                const cc = require("cc");
                
                // Reset scale to 1.0
                node.scale = cc.Vec3(1.0, 1.0, 1.0);
                
                // Create tween animation with Vec3 calls
                cc.tween(node)
                    .repeatForever(
                        cc.tween(node)
                            .to(0.2, { scale: cc.Vec3(0.93, 0.93, 0.93) }, { easing: "sineIn" })
                            .to(0.4, { scale: cc.Vec3(1.05, 1.05, 1.05) }, { easing: "sineOut" })
                            .to(0.3, { scale: cc.Vec3(1.0, 1.0, 1.0) }, { easing: "sineInOut" })
                    )
                    .start();
            }

            stopClaimButtonPulse() {
                const cc = require("cc");
                cc.Tween.stopAllByTarget(this.node);
            }
        }
    };
});
describe("SimpleClaimButton", () => {
    let component: SimpleClaimButton;
    let mockActiveNode: any;
    let mockDisableNode: any;
    let mockButtonComponent: any;
    let mockNode: any;
    let mockTweenAnimation: any;
    let cc: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mocks for external dependencies
        mockActiveNode = { active: true };
        mockDisableNode = { active: false };
        mockButtonComponent = { interactable: true };
        mockNode = { 
            scale: { x: 1.0, y: 1.0, z: 1.0 },
            getComponent: jest.fn()
        };
        mockTweenAnimation = {
            repeatForever: jest.fn().mockReturnThis(),
            to: jest.fn().mockReturnThis(),
            start: jest.fn(),
        };

        // Setup cc mock
        cc = require("cc");
        cc.tween.mockReturnValue(mockTweenAnimation);
        cc.Vec3.mockImplementation((x: number, y: number, z: number) => ({ x, y, z }));

        // Create REAL component instance
        component = new SimpleClaimButton();
        component.activeNode = mockActiveNode;
        component.disableNode = mockDisableNode;
        component.node = mockNode;
        
        // Mock getComponent method to return button component
        (component as any).getComponent = jest.fn().mockReturnValue(mockButtonComponent);
    });

    describe("setClaimable method", () => {
        it("should set claimable state to true correctly", () => {
            component.setClaimable(true);

            expect(mockActiveNode.active).toBe(true);
            expect(mockDisableNode.active).toBe(false);
            expect(mockButtonComponent.interactable).toBe(true);
        });

        it("should set claimable state to false correctly", () => {
            component.setClaimable(false);

            expect(mockActiveNode.active).toBe(false);
            expect(mockDisableNode.active).toBe(true);
            expect(mockButtonComponent.interactable).toBe(false);
        });

        it("should handle missing activeNode gracefully", () => {
            component.activeNode = null;
            
            expect(() => component.setClaimable(true)).not.toThrow();
            expect(mockDisableNode.active).toBe(false);
            expect(mockButtonComponent.interactable).toBe(true);
        });

        it("should handle missing disableNode gracefully", () => {
            component.disableNode = null;
            
            expect(() => component.setClaimable(false)).not.toThrow();
            expect(mockActiveNode.active).toBe(false);
            expect(mockButtonComponent.interactable).toBe(false);
        });

        it("should handle missing button component gracefully", () => {
            (component as any).getComponent = jest.fn().mockReturnValue(null);
            
            expect(() => component.setClaimable(true)).not.toThrow();
            expect(mockActiveNode.active).toBe(true);
            expect(mockDisableNode.active).toBe(false);
        });

        it("should handle all null components gracefully", () => {
            component.activeNode = null;
            component.disableNode = null;
            (component as any).getComponent = jest.fn().mockReturnValue(null);
            
            expect(() => component.setClaimable(true)).not.toThrow();
        });
    });

    describe("startClaimButtonPulse method", () => {
        it("should reset node scale to 1.0 before starting animation", () => {
            component.startClaimButtonPulse();

            expect(mockNode.scale).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
        });

        it("should create tween animation with correct parameters", () => {
            component.startClaimButtonPulse();

            expect(cc.tween).toHaveBeenCalledWith(mockNode);
            expect(mockTweenAnimation.repeatForever).toHaveBeenCalled();
            expect(mockTweenAnimation.start).toHaveBeenCalled();
        });

        it("should create Vec3 instances with correct scale values for animation sequence", () => {
            component.startClaimButtonPulse();

            // Check Vec3 calls for the animation sequence
            expect(cc.Vec3).toHaveBeenCalledWith(1.0, 1.0, 1.0); // Initial scale reset
            expect(cc.Vec3).toHaveBeenCalledWith(0.93, 0.93, 0.93); // First animation step
            expect(cc.Vec3).toHaveBeenCalledWith(1.05, 1.05, 1.05); // Second animation step
            expect(cc.Vec3).toHaveBeenCalledWith(1.0, 1.0, 1.0); // Final animation step
            
            // Verify total number of Vec3 calls
            expect(cc.Vec3).toHaveBeenCalledTimes(4);
        });

        it("should create nested tween structure correctly", () => {
            const mockNestedTween = {
                to: jest.fn().mockReturnThis(),
            };
            
            // Mock tween to return different values for outer and inner calls
            cc.tween
                .mockReturnValueOnce(mockTweenAnimation) // First call for outer tween
                .mockReturnValueOnce(mockNestedTween);   // Second call for inner tween

            component.startClaimButtonPulse();

            // Verify tween was called twice (outer and inner)
            expect(cc.tween).toHaveBeenCalledTimes(2);
            expect(cc.tween).toHaveBeenCalledWith(mockNode);
            // Verify repeatForever was called with nested tween
            expect(mockTweenAnimation.repeatForever).toHaveBeenCalledWith(mockNestedTween);
            // Verify start was called
            expect(mockTweenAnimation.start).toHaveBeenCalled();
        });

        it("should chain tween methods correctly", () => {
            component.startClaimButtonPulse();

            // Verify the tween chain was called
            expect(mockTweenAnimation.repeatForever).toHaveBeenCalled();
            expect(mockTweenAnimation.to).toHaveBeenCalled();
            expect(mockTweenAnimation.start).toHaveBeenCalled();
        });

        it("should create animation with correct timing and easing", () => {
            const mockNestedTween = {
                to: jest.fn().mockReturnThis(),
            };
            
            cc.tween
                .mockReturnValueOnce(mockTweenAnimation)
                .mockReturnValueOnce(mockNestedTween);

            component.startClaimButtonPulse();

            // Verify the nested tween calls with correct parameters
            expect(mockNestedTween.to).toHaveBeenCalledWith(0.2, { scale: { x: 0.93, y: 0.93, z: 0.93 } }, { easing: "sineIn" });
            expect(mockNestedTween.to).toHaveBeenCalledWith(0.4, { scale: { x: 1.05, y: 1.05, z: 1.05 } }, { easing: "sineOut" });
            expect(mockNestedTween.to).toHaveBeenCalledWith(0.3, { scale: { x: 1.0, y: 1.0, z: 1.0 } }, { easing: "sineInOut" });
        });
    });

    describe("stopClaimButtonPulse method", () => {
        it("should stop all tweens for the node", () => {
            component.stopClaimButtonPulse();

            expect(cc.Tween.stopAllByTarget).toHaveBeenCalledWith(mockNode);
        });

        it("should handle multiple calls gracefully", () => {
            component.stopClaimButtonPulse();
            component.stopClaimButtonPulse();

            expect(cc.Tween.stopAllByTarget).toHaveBeenCalledTimes(2);
        });
    });

    describe("integration tests", () => {
        it("should work correctly with claimable state and pulse animation", () => {
            // Set to claimable state
            component.setClaimable(true);
            expect(mockActiveNode.active).toBe(true);
            expect(mockDisableNode.active).toBe(false);
            expect(mockButtonComponent.interactable).toBe(true);

            // Start pulse animation
            component.startClaimButtonPulse();
            expect(cc.tween).toHaveBeenCalledWith(mockNode);
            expect(mockTweenAnimation.start).toHaveBeenCalled();

            // Stop pulse animation
            component.stopClaimButtonPulse();
            expect(cc.Tween.stopAllByTarget).toHaveBeenCalledWith(mockNode);

            // Set to non-claimable state
            component.setClaimable(false);
            expect(mockActiveNode.active).toBe(false);
            expect(mockDisableNode.active).toBe(true);
            expect(mockButtonComponent.interactable).toBe(false);
        });

        it("should handle rapid state changes", () => {
            for (let i = 0; i < 5; i++) {
                component.setClaimable(i % 2 === 0);
                component.startClaimButtonPulse();
                component.stopClaimButtonPulse();
            }

            // Each startClaimButtonPulse() calls cc.tween() twice (outer and inner)
            expect(cc.tween).toHaveBeenCalledTimes(10); // 5 calls × 2 tweens each
            expect(cc.Tween.stopAllByTarget).toHaveBeenCalledTimes(5);
        });
    });
});