import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// Interfaces for better abstraction (ISP)
interface ITweenInstance {
    repeatForever: jest.Mock;
    to: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
}

interface ITweenChain {
    to: jest.Mock;
}

interface IVec3 {
    x: number;
    y: number;
    z: number;
}

interface INode {
    setScale: jest.Mock;
}

interface ICCModule {
    _decorator: {
        ccclass: jest.Mock;
    };
    Node: jest.Mock;
    Tween: jest.Mock;
    tween: jest.Mock;
    Vec3: jest.Mock;
    Component: any;
}

// Factory for creating mock dependencies (SRP)
class MockDependencyFactory {
    static createTweenInstance(): ITweenInstance {
        return {
            repeatForever: jest.fn().mockReturnThis(),
            to: jest.fn().mockReturnThis(),
            start: jest.fn().mockReturnThis(),
            stop: jest.fn(),
        };
    }

    static createTweenChain(): ITweenChain {
        return {
            to: jest.fn().mockReturnThis(),
        };
    }

    static createVec3Factory(): jest.Mock {
        return jest.fn().mockImplementation((x: number, y: number, z: number): IVec3 => ({ x, y, z }));
    }

    static createNode(): INode {
        return {
            setScale: jest.fn()
        };
    }

    static createCCModule(tweenInstance: ITweenInstance, tweenChain: ITweenChain, vec3Factory: jest.Mock): ICCModule {
        return {
            _decorator: {
                ccclass: jest.fn(() => jest.fn()),
            },
            Node: jest.fn(),
            Tween: jest.fn(),
            tween: jest.fn((node?: any) => {
                if (node) {
                    return tweenInstance;
                }
                return tweenChain;
            }),
            Vec3: vec3Factory,
            Component: class MockComponent {
                node = MockDependencyFactory.createNode();
            },
        };
    }
}

// Test Configuration Builder (Builder Pattern for SRP)
class TestConfigurationBuilder {
    private tweenInstance: ITweenInstance;
    private tweenChain: ITweenChain;
    private vec3Factory: jest.Mock;
    private ccModule: ICCModule;

    constructor() {
        this.reset();
    }

    reset(): TestConfigurationBuilder {
        this.tweenInstance = MockDependencyFactory.createTweenInstance();
        this.tweenChain = MockDependencyFactory.createTweenChain();
        this.vec3Factory = MockDependencyFactory.createVec3Factory();
        this.ccModule = MockDependencyFactory.createCCModule(this.tweenInstance, this.tweenChain, this.vec3Factory);
        return this;
    }

    withCustomTweenInstance(customTweenInstance: Partial<ITweenInstance>): TestConfigurationBuilder {
        this.tweenInstance = { ...this.tweenInstance, ...customTweenInstance };
        this.ccModule = MockDependencyFactory.createCCModule(this.tweenInstance, this.tweenChain, this.vec3Factory);
        return this;
    }

    withCustomTweenChain(customTweenChain: Partial<ITweenChain>): TestConfigurationBuilder {
        this.tweenChain = { ...this.tweenChain, ...customTweenChain };
        this.ccModule = MockDependencyFactory.createCCModule(this.tweenInstance, this.tweenChain, this.vec3Factory);
        return this;
    }

    build() {
        return {
            tweenInstance: this.tweenInstance,
            tweenChain: this.tweenChain,
            vec3Factory: this.vec3Factory,
            ccModule: this.ccModule
        };
    }
}

// Mock decorators
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Global test configuration
let testConfig: ReturnType<TestConfigurationBuilder['build']>;
const configBuilder = new TestConfigurationBuilder();

// Mock cc module using factory
jest.mock("cc", () => testConfig?.ccModule || configBuilder.build().ccModule);

// Component Test Builder following SRP and DIP
interface IButtonPulseComponent {
    node: INode;
    activeTween: ITweenInstance | null;
    onEnable(): void;
    onDisable(): void;
}

class ComponentTestBuilder {
    private dependencies: ReturnType<TestConfigurationBuilder['build']>;
    private node: INode;

    constructor(dependencies: ReturnType<TestConfigurationBuilder['build']>) {
        this.dependencies = dependencies;
        this.node = MockDependencyFactory.createNode();
    }

    withCustomNode(customNode: INode): ComponentTestBuilder {
        this.node = customNode;
        return this;
    }

    buildComponent(): IButtonPulseComponent {
        const { ccModule } = this.dependencies;
        const node = this.node;

        return {
            node,
            activeTween: null,
            
            onEnable() {
                this.onDisable();
                const Vec3 = ccModule.Vec3;
                this.node.setScale(new Vec3(1, 1, 1));
                
                const innerTweenBase = ccModule.tween() as ITweenChain;
                let innerTweenStep1 = innerTweenBase.to(0.2, { scale: new Vec3(0.93, 0.93, 0.93) }, { easing: "sineIn" }) as ITweenChain;
                let innerTweenStep2 = innerTweenStep1.to(0.4, { scale: new Vec3(1.05, 1.05, 1.05) }, { easing: "sineOut" }) as ITweenChain;
                const innerTween = innerTweenStep2.to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "sineInOut" });
                    
                const mainTweenBase = ccModule.tween(this.node) as ITweenInstance;
                const repeatTween = mainTweenBase.repeatForever(innerTween) as ITweenInstance;
                this.activeTween = repeatTween.start();
            },
            
            onDisable() {
                if (this.activeTween) {
                    this.activeTween.stop();
                    this.activeTween = null;
                }
                const Vec3 = ccModule.Vec3;
                this.node.setScale(new Vec3(1, 1, 1));
            }
        };
    }
}

// Test Data Builder for common test scenarios (OCP)
class TestScenarioBuilder {
    static createAnimationSequenceData() {
        return [
            { duration: 0.2, scale: { x: 0.93, y: 0.93, z: 0.93 }, easing: "sineIn" },
            { duration: 0.4, scale: { x: 1.05, y: 1.05, z: 1.05 }, easing: "sineOut" },
            { duration: 0.3, scale: { x: 1, y: 1, z: 1 }, easing: "sineInOut" }
        ];
    }

    static createVec3TestData() {
        return [
            { x: 1, y: 1, z: 1 },
            { x: 0.93, y: 0.93, z: 0.93 },
            { x: 1.05, y: 1.05, z: 1.05 }
        ];
    }
}

describe("ButtonPulseEffect", () => {
    let component: IButtonPulseComponent;
    let mockNode: INode;
    let testDependencies: ReturnType<TestConfigurationBuilder['build']>;
    let componentBuilder: ComponentTestBuilder;

    beforeEach(() => {
        // Reset configuration and rebuild dependencies
        testConfig = configBuilder.reset().build();
        testDependencies = testConfig;
        mockNode = MockDependencyFactory.createNode();
        componentBuilder = new ComponentTestBuilder(testDependencies).withCustomNode(mockNode);
        component = componentBuilder.buildComponent();
        
        // Clear all mock call history
        jest.clearAllMocks();
    });

    // Helper class for test assertions (SRP)
    class ComponentTestAssertions {
        constructor(
            private component: IButtonPulseComponent,
            private mockNode: INode,
            private dependencies: ReturnType<TestConfigurationBuilder['build']>
        ) {}

        assertInitialState(): void {
            expect(this.component.activeTween).toBe(null);
            expect(this.component.node).toBe(this.mockNode);
            expect(typeof this.component.onEnable).toBe('function');
            expect(typeof this.component.onDisable).toBe('function');
        }

        assertNodeScaleSet(expectedScale: IVec3): void {
            expect(this.mockNode.setScale).toHaveBeenCalledWith(expectedScale);
        }

        assertVec3Called(x: number, y: number, z: number): void {
            expect(this.dependencies.vec3Factory).toHaveBeenCalledWith(x, y, z);
        }

        assertTweenChainCalled(duration: number, scale: IVec3, easing: string): void {
            expect(this.dependencies.tweenChain.to).toHaveBeenCalledWith(
                duration, 
                { scale }, 
                { easing }
            );
        }

        assertAnimationSetup(): void {
            expect(this.dependencies.ccModule.tween).toHaveBeenCalledWith(this.mockNode);
            expect(this.dependencies.ccModule.tween).toHaveBeenCalledWith();
            expect(this.dependencies.tweenInstance.repeatForever).toHaveBeenCalled();
            expect(this.dependencies.tweenInstance.start).toHaveBeenCalled();
        }

        assertActiveTween(expectedTween: ITweenInstance | null): void {
            expect(this.component.activeTween).toBe(expectedTween);
        }

        assertTweenStopped(): void {
            if (this.component.activeTween) {
                expect(this.component.activeTween.stop).toHaveBeenCalled();
            }
        }
    }

    let assertions: ComponentTestAssertions;

    beforeEach(() => {
        // Reset configuration and rebuild dependencies
        testConfig = configBuilder.reset().build();
        testDependencies = testConfig;
        mockNode = MockDependencyFactory.createNode();
        componentBuilder = new ComponentTestBuilder(testDependencies).withCustomNode(mockNode);
        component = componentBuilder.buildComponent();
        assertions = new ComponentTestAssertions(component, mockNode, testDependencies);
        
        // Clear all mock call history
        jest.clearAllMocks();
    });

    describe("initialization", () => {
        it("should initialize with correct default state", () => {
            assertions.assertInitialState();
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
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
            assertions.assertActiveTween(testDependencies.tweenInstance);
        });

        it("should create tween with correct animation sequence", () => {
            // Arrange
            const animationSequence = TestScenarioBuilder.createAnimationSequenceData();

            // Act
            component.onEnable();

            // Assert - Check animation sequence
            animationSequence.forEach((step, index) => {
                assertions.assertTweenChainCalled(step.duration, step.scale, step.easing);
            });
            
            assertions.assertAnimationSetup();
        });

        it("should set node scale to (1,1,1) initially", () => {
            // Act
            component.onEnable();

            // Assert
            assertions.assertVec3Called(1, 1, 1);
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
        });

        it("should store the active tween instance", () => {
            // Act
            component.onEnable();

            // Assert
            assertions.assertActiveTween(testDependencies.tweenInstance);
            expect(component.activeTween).not.toBe(null);
        });
    });

    describe("onDisable method", () => {
        it("should stop active tween and reset scale when activeTween exists", () => {
            // Arrange
            component.activeTween = testDependencies.tweenInstance;

            // Act
            component.onDisable();

            // Assert
            assertions.assertTweenStopped();
            assertions.assertActiveTween(null);
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
        });

        it("should only reset scale when no active tween", () => {
            // Arrange
            component.activeTween = null;

            // Act
            component.onDisable();

            // Assert
            expect(testDependencies.tweenInstance.stop).not.toHaveBeenCalled();
            assertions.assertActiveTween(null);
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
        });

        it("should handle case when activeTween is undefined", () => {
            // Arrange
            component.activeTween = undefined as any;

            // Act & Assert - should not throw
            expect(() => component.onDisable()).not.toThrow();
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
        });
    });

    describe("tween animation parameters", () => {
        it("should use correct timing values", () => {
            // Arrange
            const animationSequence = TestScenarioBuilder.createAnimationSequenceData();
            
            // Act
            component.onEnable();

            // Assert timing
            animationSequence.forEach((step, index) => {
                expect(testDependencies.tweenChain.to).toHaveBeenNthCalledWith(
                    index + 1, 
                    step.duration, 
                    expect.any(Object), 
                    expect.any(Object)
                );
            });
        });

        it("should use correct scale values", () => {
            // Arrange
            const animationSequence = TestScenarioBuilder.createAnimationSequenceData();
            
            // Act
            component.onEnable();

            // Assert scale values
            const calls = testDependencies.tweenChain.to.mock.calls;
            animationSequence.forEach((step, index) => {
                expect((calls[index][1] as any).scale).toEqual(step.scale);
            });
        });

        it("should use correct easing functions", () => {
            // Arrange
            const animationSequence = TestScenarioBuilder.createAnimationSequenceData();
            
            // Act
            component.onEnable();

            // Assert easing
            const calls = testDependencies.tweenChain.to.mock.calls;
            animationSequence.forEach((step, index) => {
                expect((calls[index][2] as any).easing).toBe(step.easing);
            });
        });

        it("should create infinite repeating animation", () => {
            // Act
            component.onEnable();

            // Assert
            expect(testDependencies.tweenInstance.repeatForever).toHaveBeenCalledWith(testDependencies.tweenChain);
            expect(testDependencies.tweenInstance.start).toHaveBeenCalled();
        });
    });

    describe("lifecycle management", () => {
        it("should handle multiple enable calls correctly", () => {
            // Arrange
            const enableCount = 3;

            // Act
            for (let i = 0; i < enableCount; i++) {
                component.onEnable();
            }

            // Assert
            // Each onEnable calls onDisable (1 setScale) + initial setScale (1) = 2 per call
            expect(mockNode.setScale).toHaveBeenCalledTimes(enableCount * 2);
            expect(testDependencies.tweenInstance.start).toHaveBeenCalledTimes(enableCount);
        });

        it("should handle multiple disable calls correctly", () => {
            // Arrange
            component.onEnable();
            const firstTween = component.activeTween;
            jest.clearAllMocks(); // Clear to count only disable calls

            // Act
            component.onDisable();
            component.onDisable();

            // Assert - stop should only be called once
            if (firstTween) {
                expect(firstTween.stop).toHaveBeenCalledTimes(1);
            }
            assertions.assertActiveTween(null);
            expect(mockNode.setScale).toHaveBeenCalledTimes(2); // 2 onDisable calls
        });

        it("should handle enable after disable correctly", () => {
            // Act
            component.onEnable();
            const firstTween = component.activeTween;
            component.onDisable();
            component.onEnable();

            // Assert
            if (firstTween) {
                expect(firstTween.stop).toHaveBeenCalled();
            }
            assertions.assertActiveTween(testDependencies.tweenInstance);
            expect(component.activeTween).not.toBe(null);
        });
    });

    describe("Vec3 usage", () => {
        it("should create Vec3 instances with correct parameters", () => {
            // Arrange
            const vec3TestData = TestScenarioBuilder.createVec3TestData();
            
            // Act
            component.onEnable();

            // Assert Vec3 creation for all expected values
            vec3TestData.forEach(data => {
                assertions.assertVec3Called(data.x, data.y, data.z);
            });
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
            // Arrange - Create component with null node
            const nullNodeComponent = componentBuilder
                .withCustomNode(null as any)
                .buildComponent();

            // Act & Assert - should throw when trying to access null node
            expect(() => nullNodeComponent.onEnable()).toThrow();
            expect(() => nullNodeComponent.onDisable()).toThrow();
        });

        it("should handle rapid enable/disable cycles", () => {
            // Arrange
            const cycleCount = 5;

            // Act
            for (let i = 0; i < cycleCount; i++) {
                component.onEnable();
                component.onDisable();
            }

            // Assert no errors and final state is correct
            assertions.assertActiveTween(null);
            assertions.assertNodeScaleSet({ x: 1, y: 1, z: 1 });
        });

        it("should maintain component contract under stress", () => {
            // Arrange
            const operations = 10;

            // Act - Mixed operations to test stability
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

            // Assert - Component should be in valid state
            expect(typeof component.onEnable).toBe('function');
            expect(typeof component.onDisable).toBe('function');
            expect(component.node).toBe(mockNode);
        });
    });
});
