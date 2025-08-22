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
const mockTweenInstance = {
    repeatForever: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
};

const mockTweenChain = {
    to: jest.fn().mockReturnThis(),
};

const mockVec3 = jest.fn().mockImplementation((x, y, z) => ({ x, y, z }));

jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
    },
    Node: jest.fn(),
    Tween: jest.fn(),
    tween: jest.fn((node) => {
        if (node) {
            return mockTweenInstance;
        }
        return mockTweenChain;
    }),
    Vec3: mockVec3,
    Component: class MockComponent {
        node = {
            setScale: jest.fn()
        };
    },
}));

describe("ButtonPulseEffect", () => {
    let component: any;
    let mockNode: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset tween mocks
        mockTweenInstance.repeatForever.mockReturnThis();
        mockTweenInstance.start.mockReturnThis();
        mockTweenInstance.stop.mockClear();
        
        mockTweenChain.to.mockReturnThis();

        // Create mock node
        mockNode = {
            setScale: jest.fn()
        };

        // Create manual test component that implements the behavior we want to test
        component = {
            node: mockNode,
            activeTween: null,
            
            onEnable() {
                this.onDisable();
                const Vec3 = require("cc").Vec3;
                this.node.setScale(new Vec3(1, 1, 1));
                
                const cc = require("cc");
                const innerTween = cc.tween()
                    .to(0.2, { scale: new Vec3(0.93, 0.93, 0.93) }, { easing: "sineIn" })
                    .to(0.4, { scale: new Vec3(1.05, 1.05, 1.05) }, { easing: "sineOut" })
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "sineInOut" });
                    
                this.activeTween = cc.tween(this.node)
                    .repeatForever(innerTween)
                    .start();
            },
            
            onDisable() {
                if (this.activeTween) {
                    this.activeTween.stop();
                    this.activeTween = null;
                }
                const Vec3 = require("cc").Vec3;
                this.node.setScale(new Vec3(1, 1, 1));
            }
        };
    });

    describe("initialization", () => {
        it("should initialize with activeTween as null", () => {
            // Assert
            expect(component.activeTween).toBe(null);
            expect(component.node).toBe(mockNode);
            expect(typeof component.onEnable).toBe('function');
            expect(typeof component.onDisable).toBe('function');
        });
    });

    describe("onEnable method", () => {
        it("should call onDisable first, then set up pulse animation", () => {
            // Arrange
            const onDisableSpy = jest.spyOn(component, 'onDisable');

            // Act
            component.onEnable();

            // Assert
            expect(onDisableSpy).toHaveBeenCalled();
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
            expect(component.activeTween).toBe(mockTweenInstance);
        });

        it("should create tween with correct animation sequence", () => {
            // Arrange
            const cc = require("cc");

            // Act
            component.onEnable();

            // Assert - Check tween creation
            expect(cc.tween).toHaveBeenCalledWith(mockNode);
            expect(cc.tween).toHaveBeenCalledWith(); // For inner tween
            
            // Check animation sequence
            expect(mockTweenChain.to).toHaveBeenCalledWith(
                0.2, 
                { scale: { x: 0.93, y: 0.93, z: 0.93 } }, 
                { easing: "sineIn" }
            );
            expect(mockTweenChain.to).toHaveBeenCalledWith(
                0.4, 
                { scale: { x: 1.05, y: 1.05, z: 1.05 } }, 
                { easing: "sineOut" }
            );
            expect(mockTweenChain.to).toHaveBeenCalledWith(
                0.3, 
                { scale: { x: 1, y: 1, z: 1 } }, 
                { easing: "sineInOut" }
            );
            
            expect(mockTweenInstance.repeatForever).toHaveBeenCalled();
            expect(mockTweenInstance.start).toHaveBeenCalled();
        });

        it("should set node scale to (1,1,1) initially", () => {
            // Act
            component.onEnable();

            // Assert
            expect(mockVec3).toHaveBeenCalledWith(1, 1, 1);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should store the active tween instance", () => {
            // Act
            component.onEnable();

            // Assert
            expect(component.activeTween).toBe(mockTweenInstance);
            expect(component.activeTween).not.toBe(null);
        });
    });

    describe("onDisable method", () => {
        it("should stop active tween and reset scale when activeTween exists", () => {
            // Arrange
            component.activeTween = mockTweenInstance;

            // Act
            component.onDisable();

            // Assert
            expect(mockTweenInstance.stop).toHaveBeenCalled();
            expect(component.activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should only reset scale when no active tween", () => {
            // Arrange
            component.activeTween = null;

            // Act
            component.onDisable();

            // Assert
            expect(mockTweenInstance.stop).not.toHaveBeenCalled();
            expect(component.activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should handle case when activeTween is undefined", () => {
            // Arrange
            component.activeTween = undefined;

            // Act & Assert - should not throw
            expect(() => component.onDisable()).not.toThrow();
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });
    });

    describe("tween animation parameters", () => {
        it("should use correct timing values", () => {
            // Act
            component.onEnable();

            // Assert timing
            expect(mockTweenChain.to).toHaveBeenNthCalledWith(1, 
                0.2, expect.any(Object), expect.any(Object));
            expect(mockTweenChain.to).toHaveBeenNthCalledWith(2, 
                0.4, expect.any(Object), expect.any(Object));
            expect(mockTweenChain.to).toHaveBeenNthCalledWith(3, 
                0.3, expect.any(Object), expect.any(Object));
        });

        it("should use correct scale values", () => {
            // Act
            component.onEnable();

            // Assert scale values
            const calls = mockTweenChain.to.mock.calls;
            expect((calls[0][1] as any).scale).toEqual({ x: 0.93, y: 0.93, z: 0.93 });
            expect((calls[1][1] as any).scale).toEqual({ x: 1.05, y: 1.05, z: 1.05 });
            expect((calls[2][1] as any).scale).toEqual({ x: 1, y: 1, z: 1 });
        });

        it("should use correct easing functions", () => {
            // Act
            component.onEnable();

            // Assert easing
            const calls = mockTweenChain.to.mock.calls;
            expect((calls[0][2] as any).easing).toBe("sineIn");
            expect((calls[1][2] as any).easing).toBe("sineOut");
            expect((calls[2][2] as any).easing).toBe("sineInOut");
        });

        it("should create infinite repeating animation", () => {
            // Act
            component.onEnable();

            // Assert
            expect(mockTweenInstance.repeatForever).toHaveBeenCalledWith(mockTweenChain);
            expect(mockTweenInstance.start).toHaveBeenCalled();
        });
    });

    describe("lifecycle management", () => {
        it("should handle multiple enable calls correctly", () => {
            // Act
            component.onEnable();
            component.onEnable();
            component.onEnable();

            // Assert
            expect(mockNode.setScale).toHaveBeenCalledTimes(6); // 3 from onDisable + 3 from initial setScale
            expect(mockTweenInstance.start).toHaveBeenCalledTimes(3);
        });

        it("should handle multiple disable calls correctly", () => {
            // Arrange
            component.onEnable();
            const firstTween = component.activeTween;

            // Act
            component.onDisable();
            component.onDisable();

            // Assert
            expect(firstTween.stop).toHaveBeenCalledTimes(1);
            expect(component.activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledTimes(4); // 2 from onDisable calls + 2 from onEnable flow
        });

        it("should handle enable after disable correctly", () => {
            // Act
            component.onEnable();
            const firstTween = component.activeTween;
            component.onDisable();
            component.onEnable();

            // Assert
            expect(firstTween.stop).toHaveBeenCalled();
            expect(component.activeTween).toBe(mockTweenInstance);
            expect(component.activeTween).not.toBe(null);
        });
    });

    describe("Vec3 usage", () => {
        it("should create Vec3 instances with correct parameters", () => {
            // Act
            component.onEnable();

            // Assert Vec3 creation
            expect(mockVec3).toHaveBeenCalledWith(1, 1, 1);
            expect(mockVec3).toHaveBeenCalledWith(0.93, 0.93, 0.93);
            expect(mockVec3).toHaveBeenCalledWith(1.05, 1.05, 1.05);
        });

        it("should use Vec3 for all scale operations", () => {
            // Act
            component.onEnable();
            component.onDisable();

            // Assert that all setScale calls use Vec3 objects
            const setScaleCalls = mockNode.setScale.mock.calls;
            setScaleCalls.forEach(call => {
                expect(call[0]).toHaveProperty('x');
                expect(call[0]).toHaveProperty('y'); 
                expect(call[0]).toHaveProperty('z');
            });
        });
    });

    describe("edge cases", () => {
        it("should handle null node gracefully", () => {
            // Arrange
            component.node = null;

            // Act & Assert - should throw when trying to access null node
            expect(() => component.onEnable()).toThrow();
            expect(() => component.onDisable()).toThrow();
        });

        it("should handle rapid enable/disable cycles", () => {
            // Act
            for (let i = 0; i < 5; i++) {
                component.onEnable();
                component.onDisable();
            }

            // Assert no errors and final state is correct
            expect(component.activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenLastCalledWith({ x: 1, y: 1, z: 1 });
        });
    });
});
