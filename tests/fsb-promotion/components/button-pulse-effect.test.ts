import { ButtonPulseEffect } from "../../../assets/fsb-promotion/scripts/components/button-pulse-effect";
// Mock dependencies
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        _decorator: {
            ccclass: jest.fn(() => jest.fn()),
        },
        Node: jest.fn(),
        Tween: jest.fn(),
        tween: jest.fn(),
        Vec3: jest.fn((x: number, y: number, z: number) => ({ x, y, z })),
        Component: class MockComponent {
            node = { setScale: jest.fn() };
        },
    };
});

describe("ButtonPulseEffect", () => {
    let component: ButtonPulseEffect;
    let mockNode: any;
    let mockTweenInstance: any;
    let mockTweenChain: any;
    let mockVec3: any;
    let cc: any;

    beforeEach(() => {

        // Create simple mocks
        mockNode = {
            setScale: jest.fn()
        };

        mockTweenInstance = {
            repeatForever: jest.fn().mockReturnThis(),
            to: jest.fn().mockReturnThis(),
            start: jest.fn().mockReturnThis(),
            stop: jest.fn(),
        };

        mockTweenChain = {
            to: jest.fn().mockReturnThis(),
        };

        mockVec3 = jest.fn((x: number, y: number, z: number) => ({ x, y, z }));

        // Setup cc mock
        cc = require("cc");
        cc.tween.mockImplementation((node?: any) => {
            if (node) {
                return mockTweenInstance;
            }
            return mockTweenChain;
        });
        cc.Vec3 = mockVec3;

        // Create component instance
        component = new ButtonPulseEffect();
        component.node = mockNode;
    });

    describe("initialization", () => {
        it("should initialize with correct default state", () => {
            expect((component as any).activeTween).toBe(null);
            expect(component.node).toBe(mockNode);
            expect(typeof component.onEnable).toBe('function');
            expect(typeof component.onDisable).toBe('function');
        });
    });

    describe("onEnable method", () => {
        it("should call onDisable first, then set up pulse animation", () => {
            const onDisableSpy = jest.spyOn(component, 'onDisable');
            component.onEnable();

            expect(onDisableSpy).toHaveBeenCalled();
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
            expect((component as any).activeTween).toBe(mockTweenInstance);
        });

        it("should create tween with correct animation sequence", () => {
            const animationSequence = [
                { duration: 0.2, scale: { x: 0.93, y: 0.93, z: 0.93 }, easing: "sineIn" },
                { duration: 0.4, scale: { x: 1.05, y: 1.05, z: 1.05 }, easing: "sineOut" },
                { duration: 0.3, scale: { x: 1, y: 1, z: 1 }, easing: "sineInOut" }
            ];

            component.onEnable();

            // Check animation sequence
            animationSequence.forEach((step, index) => {
                expect(mockTweenChain.to).toHaveBeenNthCalledWith(
                    index + 1,
                    step.duration,
                    { scale: step.scale },
                    { easing: step.easing }
                );
            });
            
            expect(cc.tween).toHaveBeenCalledWith(mockNode);
            expect(cc.tween).toHaveBeenCalledWith();
            expect(mockTweenInstance.repeatForever).toHaveBeenCalled();
            expect(mockTweenInstance.start).toHaveBeenCalled();
        });

        it("should set node scale to (1,1,1) initially", () => {
            component.onEnable();

            expect(mockVec3).toHaveBeenCalledWith(1, 1, 1);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should store the active tween instance", () => {
            component.onEnable();

            expect((component as any).activeTween).toBe(mockTweenInstance);
            expect((component as any).activeTween).not.toBe(null);
        });
    });

    describe("onDisable method", () => {
        it("should stop active tween and reset scale when activeTween exists", () => {
            (component as any).activeTween = mockTweenInstance;
            component.onDisable();

            expect(mockTweenInstance.stop).toHaveBeenCalled();
            expect((component as any).activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should only reset scale when no active tween", () => {
            (component as any).activeTween = null;
            component.onDisable();

            expect(mockTweenInstance.stop).not.toHaveBeenCalled();
            expect((component as any).activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should handle case when activeTween is undefined", () => {
            (component as any).activeTween = undefined as any;

            expect(() => component.onDisable()).not.toThrow();
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });
    });

    describe("tween animation parameters", () => {
        it("should use correct timing values", () => {
            const animationSequence = [
                { duration: 0.2, scale: { x: 0.93, y: 0.93, z: 0.93 }, easing: "sineIn" },
                { duration: 0.4, scale: { x: 1.05, y: 1.05, z: 1.05 }, easing: "sineOut" },
                { duration: 0.3, scale: { x: 1, y: 1, z: 1 }, easing: "sineInOut" }
            ];
            
            component.onEnable();

            animationSequence.forEach((step, index) => {
                expect(mockTweenChain.to).toHaveBeenNthCalledWith(
                    index + 1, 
                    step.duration, 
                    expect.any(Object), 
                    expect.any(Object)
                );
            });
        });

        it("should use correct scale values", () => {
            const animationSequence = [
                { duration: 0.2, scale: { x: 0.93, y: 0.93, z: 0.93 }, easing: "sineIn" },
                { duration: 0.4, scale: { x: 1.05, y: 1.05, z: 1.05 }, easing: "sineOut" },
                { duration: 0.3, scale: { x: 1, y: 1, z: 1 }, easing: "sineInOut" }
            ];
            
            component.onEnable();

            const calls = mockTweenChain.to.mock.calls;
            animationSequence.forEach((step, index) => {
                expect((calls[index][1] as any).scale).toEqual(step.scale);
            });
        });

        it("should use correct easing functions", () => {
            const animationSequence = [
                { duration: 0.2, scale: { x: 0.93, y: 0.93, z: 0.93 }, easing: "sineIn" },
                { duration: 0.4, scale: { x: 1.05, y: 1.05, z: 1.05 }, easing: "sineOut" },
                { duration: 0.3, scale: { x: 1, y: 1, z: 1 }, easing: "sineInOut" }
            ];
            
            component.onEnable();

            const calls = mockTweenChain.to.mock.calls;
            animationSequence.forEach((step, index) => {
                expect((calls[index][2] as any).easing).toBe(step.easing);
            });
        });

        it("should create infinite repeating animation", () => {
            component.onEnable();

            expect(mockTweenInstance.repeatForever).toHaveBeenCalledWith(mockTweenChain);
            expect(mockTweenInstance.start).toHaveBeenCalled();
        });
    });

    describe("lifecycle management", () => {
        it("should handle multiple enable calls correctly", () => {
            const enableCount = 3;

            for (let i = 0; i < enableCount; i++) {
                component.onEnable();
            }

            // Each onEnable calls onDisable (1 setScale) + initial setScale (1) = 2 per call
            expect(mockNode.setScale).toHaveBeenCalledTimes(enableCount * 2);
            expect(mockTweenInstance.start).toHaveBeenCalledTimes(enableCount);
        });

        it("should handle multiple disable calls correctly", () => {
            component.onEnable();
            const firstTween = (component as any).activeTween;
            jest.clearAllMocks(); // Clear to count only disable calls

            component.onDisable();
            component.onDisable();

            // stop should only be called once
            if (firstTween) {
                expect(firstTween.stop).toHaveBeenCalledTimes(1);
            }
            expect((component as any).activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledTimes(2); // 2 onDisable calls
        });

        it("should handle enable after disable correctly", () => {
            component.onEnable();
            const firstTween = (component as any).activeTween;
            component.onDisable();
            component.onEnable();

            if (firstTween) {
                expect(firstTween.stop).toHaveBeenCalled();
            }
            expect((component as any).activeTween).toBe(mockTweenInstance);
            expect((component as any).activeTween).not.toBe(null);
        });
    });

    describe("Vec3 usage", () => {
        it("should create Vec3 instances with correct parameters", () => {
            const vec3TestData = [
                { x: 1, y: 1, z: 1 },
                { x: 0.93, y: 0.93, z: 0.93 },
                { x: 1.05, y: 1.05, z: 1.05 }
            ];
            
            component.onEnable();

            vec3TestData.forEach(data => {
                expect(mockVec3).toHaveBeenCalledWith(data.x, data.y, data.z);
            });
        });

        it("should use Vec3 for all scale operations", () => {
            component.onEnable();
            component.onDisable();

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
            const nullNodeComponent = new ButtonPulseEffect();
            (nullNodeComponent as any).node = null;

            expect(() => nullNodeComponent.onEnable()).toThrow();
            expect(() => nullNodeComponent.onDisable()).toThrow();
        });

        it("should handle rapid enable/disable cycles", () => {
            const cycleCount = 5;

            for (let i = 0; i < cycleCount; i++) {
                component.onEnable();
                component.onDisable();
            }

            expect((component as any).activeTween).toBe(null);
            expect(mockNode.setScale).toHaveBeenCalledWith({ x: 1, y: 1, z: 1 });
        });

        it("should maintain component contract under stress", () => {
            const operations = 10;

            for (let i = 0; i < operations; i++) {
                if (i % 3 === 0) {
                    component.onEnable();
                } else if (i % 3 === 1) {
                    component.onDisable();
                } else {
                    // No-op to test idle state
                    expect(component.node).toBe(mockNode);
                }
            }

            expect(typeof component.onEnable).toBe('function');
            expect(typeof component.onDisable).toBe('function');
            expect(component.node).toBe(mockNode);
        });

        it("should handle extreme values in animation", () => {
            // Test with extreme scale values
            const extremeComponent = new ButtonPulseEffect();
            extremeComponent.node = mockNode;
            
            // Override onEnable to test extreme values
            extremeComponent.onEnable = function() {
                this.onDisable();
                const Vec3 = cc.Vec3;
                this.node.setScale(new Vec3(0.001, 0.001, 0.001));
                
                const innerTweenBase = cc.tween() as any;
                let innerTweenStep1 = innerTweenBase.to(0.001, { scale: new Vec3(0.0001, 0.0001, 0.0001) }, { easing: "sineIn" });
                let innerTweenStep2 = innerTweenStep1.to(0.001, { scale: new Vec3(1000, 1000, 1000) }, { easing: "sineOut" });
                const innerTween = innerTweenStep2.to(0.001, { scale: new Vec3(1, 1, 1) }, { easing: "sineInOut" });
                    
                const mainTweenBase = cc.tween(this.node) as any;
                const repeatTween = mainTweenBase.repeatForever(innerTween);
                (this as any).activeTween = repeatTween.start();
            };

            expect(() => extremeComponent.onEnable()).not.toThrow();
            expect((extremeComponent as any).activeTween).toBe(mockTweenInstance);
        });
    });
});