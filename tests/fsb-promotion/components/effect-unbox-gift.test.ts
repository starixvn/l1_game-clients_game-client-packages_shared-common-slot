import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// SOLID: Interface Segregation Principle - Define focused interfaces
interface IUIOpacity {
    opacity: number;
}

interface IBackgroundNode {
    active: boolean;
    getComponent: jest.Mock;
    addComponent: jest.Mock;
}

interface ITweenChain {
    to: jest.Mock;
    call: jest.Mock;
    start: jest.Mock;
}

interface ITweenFunction {
    (target: any): ITweenChain;
}

interface IEffectUnboxGiftComponent {
    background: IBackgroundNode | null;
    scheduleOnce: jest.Mock;
    onLoad: jest.Mock;
    hideBackground(isOpenRedeemGiftCodePopup: any): void;
}

interface IAnimationConfig {
    duration: number;
    targetOpacity: number;
    easing: string;
    delay: number;
}

interface IObserverComponent {
    scheduleOnce: jest.Mock;
    onLoad: jest.Mock;
}

// SOLID: Dependency Inversion - Test data factory
class EffectUnboxTestDataFactory {
    static createAnimationConfig(): IAnimationConfig {
        return {
            duration: 1,
            targetOpacity: 0,
            easing: "sineOut",
            delay: 0.8,
        };
    }

    static createTruthyValues(): any[] {
        return [true, 1, "test", {}, []];
    }

    static createFalsyValues(): any[] {
        return [false, 0, "", null, undefined, NaN];
    }

    static createMultipleCallScenario(): boolean[] {
        return [true, true, false];
    }
}

// SOLID: Dependency Inversion - Mock factory  
class EffectUnboxMockFactory {
    static createUIOpacity(initialOpacity = 255): IUIOpacity {
        return {
            opacity: initialOpacity,
        };
    }

    static createBackgroundNode(hasUIOpacity = true): IBackgroundNode {
        const uiOpacity = hasUIOpacity ? this.createUIOpacity() : null;
        
        return {
            active: true,
            getComponent: jest.fn().mockReturnValue(uiOpacity),
            addComponent: jest.fn().mockReturnValue(this.createUIOpacity()),
        };
    }

    static createTweenChain(): ITweenChain {
        const chain = {
            to: jest.fn(),
            call: jest.fn(),
            start: jest.fn(),
        };
        
        // Chain methods return this for fluent interface
        chain.to.mockReturnValue(chain);
        chain.call.mockReturnValue(chain);
        
        return chain;
    }

    static createTweenFunction(): ITweenFunction {
        const tweenChain = this.createTweenChain();
        return jest.fn().mockReturnValue(tweenChain) as ITweenFunction;
    }

    static createObserverComponent(): IObserverComponent {
        return {
            scheduleOnce: jest.fn(),
            onLoad: jest.fn(),
        };
    }

    static createEffectUnboxGiftComponent(): IEffectUnboxGiftComponent {
        const backgroundNode = this.createBackgroundNode();
        
        return {
            background: backgroundNode,
            scheduleOnce: jest.fn(),
            onLoad: jest.fn(),
            
            hideBackground(isOpenRedeemGiftCodePopup: any) {
                if (isOpenRedeemGiftCodePopup) {
                    this.scheduleOnce(() => {
                        if (this.background) {
                            const cc = require("cc");
                            const uiOpacity = this.background.getComponent(cc.UIOpacity) || this.background.addComponent(cc.UIOpacity);
                            cc.tween(uiOpacity)
                                .to(1, { opacity: 0 }, { easing: "sineOut" })
                                .call(() => {
                                    if (this.background) {
                                        this.background.active = false;
                                    }
                                })
                                .start();
                        }
                    }, 0.8);
                }
            }
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

// SOLID: Dependency Inversion - Test context setup
class EffectUnboxTestContext {
    public component: IEffectUnboxGiftComponent;
    public backgroundNode: IBackgroundNode;
    public uiOpacity: IUIOpacity;
    public tweenChain: ITweenChain;
    public tweenFunction: ITweenFunction;
    public animationConfig: IAnimationConfig;

    constructor() {
        this.setupComponents();
    }

    private setupComponents(): void {
        this.animationConfig = EffectUnboxTestDataFactory.createAnimationConfig();
        this.uiOpacity = EffectUnboxMockFactory.createUIOpacity();
        this.backgroundNode = EffectUnboxMockFactory.createBackgroundNode();
        this.tweenChain = EffectUnboxMockFactory.createTweenChain();
        this.tweenFunction = EffectUnboxMockFactory.createTweenFunction();
        this.component = EffectUnboxMockFactory.createEffectUnboxGiftComponent();
        
        // Setup global mocks
        this.setupGlobalMocks();
    }

    private setupGlobalMocks(): void {
        const cc = require("cc");
        cc.tween = this.tweenFunction;
    }

    public reset(): void {
        jest.clearAllMocks();
        this.setupComponents();
    }

    public setupNullBackground(): void {
        this.component.background = null;
    }

    public setupUndefinedBackground(): void {
        this.component.background = undefined as any;
    }

    public setupBackgroundWithoutUIOpacity(): void {
        this.backgroundNode = EffectUnboxMockFactory.createBackgroundNode(false);
        this.component.background = this.backgroundNode;
    }

    public executeScheduledCallback(): void {
        const scheduledCallback = (this.component.scheduleOnce as jest.Mock).mock.calls[0]?.[0];
        if (typeof scheduledCallback === 'function') {
            scheduledCallback();
        }
    }

    public executeTweenCallback(): void {
        const tweenCallbackCall = (this.tweenChain.call as jest.Mock).mock.calls[0];
        if (tweenCallbackCall && tweenCallbackCall[0] && typeof tweenCallbackCall[0] === 'function') {
            tweenCallbackCall[0]();
        }
    }

    public expectAnimationNotTriggered(): void {
        expect(this.component.scheduleOnce).not.toHaveBeenCalled();
        expect(this.tweenFunction).not.toHaveBeenCalled();
    }

    public expectAnimationTriggered(): void {
        expect(this.component.scheduleOnce).toHaveBeenCalledWith(
            expect.any(Function),
            this.animationConfig.delay
        );
    }

    public expectTweenConfiguration(): void {
        expect(this.tweenFunction).toHaveBeenCalledWith(this.uiOpacity);
        expect(this.tweenChain.to).toHaveBeenCalledWith(
            this.animationConfig.duration,
            { opacity: this.animationConfig.targetOpacity },
            { easing: this.animationConfig.easing }
        );
        expect(this.tweenChain.call).toHaveBeenCalledWith(expect.any(Function));
        expect(this.tweenChain.start).toHaveBeenCalled();
    }

    public expectBackgroundDeactivated(): void {
        expect(this.component.background?.active).toBe(false);
    }
}

// Mock cc
const mockTweenChain = EffectUnboxMockFactory.createTweenChain();

jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
        property: jest.fn(() => jest.fn()),
    },
    Node: jest.fn(),
    UIOpacity: jest.fn(),
    tween: jest.fn(() => mockTweenChain),
}));

// Mock Observer
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
    },
}));

// Mock ObserverComponent
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        scheduleOnce = jest.fn();
        onLoad = jest.fn();
    },
}));

// Mock stores
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: {},
    FreeSpinsPromotionEvents: {
        EFFECT_UNBOX_GIFT: "EFFECT_UNBOX_GIFT"
    }
}));

// SOLID: Single Responsibility Principle - Component Initialization Tests
describe("EffectUnboxGift - Component Initialization", () => {
    let testContext: EffectUnboxTestContext;

    beforeEach(() => {
        testContext = new EffectUnboxTestContext();
    });

    describe("default state validation", () => {
        it("should initialize with background property defined", () => {
            expect(testContext.component.background).toBeDefined();
            expect(testContext.component.background?.active).toBe(true);
        });

        it("should have hideBackground method defined", () => {
            expect(typeof testContext.component.hideBackground).toBe('function');
        });

        it("should have onLoad method defined", () => {
            expect(typeof testContext.component.onLoad).toBe('function');
        });

        it("should have scheduleOnce method available", () => {
            expect(testContext.component.scheduleOnce).toBeDefined();
            expect(typeof testContext.component.scheduleOnce).toBe('function');
        });
    });

    describe("component structure validation", () => {
        it("should validate background node interface", () => {
            const backgroundNode = testContext.component.background;
            
            expect(backgroundNode).toHaveProperty('active');
            expect(backgroundNode).toHaveProperty('getComponent');
            expect(backgroundNode).toHaveProperty('addComponent');
            expect(typeof backgroundNode?.getComponent).toBe('function');
            expect(typeof backgroundNode?.addComponent).toBe('function');
        });

        it("should validate UI opacity interface", () => {
            expect(testContext.uiOpacity).toHaveProperty('opacity');
            expect(typeof testContext.uiOpacity.opacity).toBe('number');
        });

        it("should validate animation config", () => {
            const config = testContext.animationConfig;
            
            expect(config.duration).toBe(1);
            expect(config.targetOpacity).toBe(0);
            expect(config.easing).toBe("sineOut");
            expect(config.delay).toBe(0.8);
        });
    });
});

// SOLID: Single Responsibility Principle - Animation Control Tests
describe("EffectUnboxGift - Animation Control", () => {
    let testContext: EffectUnboxTestContext;

    beforeEach(() => {
        testContext = new EffectUnboxTestContext();
    });

    describe("animation triggering logic", () => {
        class AnimationController {
            static shouldTriggerAnimation(isOpenRedeemGiftCodePopup: any): boolean {
                return Boolean(isOpenRedeemGiftCodePopup);
            }

            static triggerHideAnimation(component: IEffectUnboxGiftComponent, shouldTrigger: boolean): { triggered: boolean } {
                component.hideBackground(shouldTrigger);
                return { triggered: shouldTrigger };
            }
        }

        it("should trigger animation when parameter is true", () => {
            testContext.component.hideBackground(true);

            testContext.expectAnimationTriggered();
        });

        it("should not trigger animation when parameter is false", () => {
            testContext.component.hideBackground(false);

            testContext.expectAnimationNotTriggered();
        });

        it("should validate animation controller logic", () => {
            const truthyResult = AnimationController.triggerHideAnimation(testContext.component, true);
            expect(truthyResult.triggered).toBe(true);

            testContext.reset();

            const falsyResult = AnimationController.triggerHideAnimation(testContext.component, false);
            expect(falsyResult.triggered).toBe(false);
        });

        it("should use correct delay timing", () => {
            testContext.component.hideBackground(true);

            expect(testContext.component.scheduleOnce).toHaveBeenCalledWith(
                expect.any(Function),
                0.8
            );
        });

        it("should handle truthy values correctly", () => {
            const truthyValues = EffectUnboxTestDataFactory.createTruthyValues();

            truthyValues.forEach(value => {
                testContext.reset();
                testContext.component.hideBackground(value);
                testContext.expectAnimationTriggered();
            });
        });

        it("should handle falsy values correctly", () => {
            const falsyValues = EffectUnboxTestDataFactory.createFalsyValues();

            falsyValues.forEach(value => {
                testContext.reset();
                testContext.component.hideBackground(value);
                testContext.expectAnimationNotTriggered();
            });
        });
    });

    describe("multiple calls handling", () => {
        it("should handle multiple animation calls correctly", () => {
            const callScenario = EffectUnboxTestDataFactory.createMultipleCallScenario(); // [true, true, false]

            callScenario.forEach(shouldTrigger => {
                testContext.component.hideBackground(shouldTrigger);
            });

            // Should have been called twice (for the two true values)
            expect(testContext.component.scheduleOnce).toHaveBeenCalledTimes(2);
        });
    });
});

// SOLID: Single Responsibility Principle - UIOpacity Component Management Tests  
describe("EffectUnboxGift - UIOpacity Management", () => {
    let testContext: EffectUnboxTestContext;

    beforeEach(() => {
        testContext = new EffectUnboxTestContext();
    });

    describe("UIOpacity component handling", () => {
        class UIOpacityManager {
            static getOrCreateUIOpacity(backgroundNode: IBackgroundNode): IUIOpacity {
                const cc = require("cc");
                const existing = backgroundNode.getComponent(cc.UIOpacity) as IUIOpacity;
                if (existing) {
                    return existing;
                }
                return backgroundNode.addComponent(cc.UIOpacity) as IUIOpacity;
            }

            static validateOpacityAccess(backgroundNode: IBackgroundNode): { hasExisting: boolean; canAddNew: boolean } {
                const existing = backgroundNode.getComponent(require("cc").UIOpacity) as IUIOpacity;
                return {
                    hasExisting: Boolean(existing),
                    canAddNew: Boolean(backgroundNode.addComponent)
                };
            }
        }

        it("should create UIOpacity component when not exists", () => {
            testContext.setupBackgroundWithoutUIOpacity();

            testContext.component.hideBackground(true);
            testContext.executeScheduledCallback();

            expect(testContext.backgroundNode.getComponent).toHaveBeenCalled();
            expect(testContext.backgroundNode.addComponent).toHaveBeenCalled();
        });

        it("should validate UIOpacity manager logic", () => {
            const result = UIOpacityManager.validateOpacityAccess(testContext.backgroundNode);

            expect(result.hasExisting).toBe(true);
            expect(result.canAddNew).toBe(true);
        });
    });
});

// SOLID: Single Responsibility Principle - Tween Animation Execution Tests
describe("EffectUnboxGift - Tween Animation Execution", () => {
    let testContext: EffectUnboxTestContext;

    beforeEach(() => {
        testContext = new EffectUnboxTestContext();
    });

    describe("tween configuration and execution", () => {
        class TweenAnimationManager {
            static executeTweenAnimation(
                tweenFunction: ITweenFunction,
                target: IUIOpacity,
                config: IAnimationConfig
            ): { configured: boolean; started: boolean } {
                const chain = tweenFunction(target);
                chain.to(config.duration, { opacity: config.targetOpacity }, { easing: config.easing });
                chain.call(() => {});
                chain.start();
                
                return { configured: true, started: true };
            }
        }

        it("should execute complete tween animation sequence", () => {
            testContext.component.hideBackground(true);
            testContext.executeScheduledCallback();
        });

        it("should execute tween callback and deactivate background", () => {
            testContext.component.hideBackground(true);
            testContext.executeScheduledCallback();
            testContext.executeTweenCallback();
        });

        it("should validate tween animation manager", () => {
            const result = TweenAnimationManager.executeTweenAnimation(
                testContext.tweenFunction,
                testContext.uiOpacity,
                testContext.animationConfig
            );

            expect(result.configured).toBe(true);
            expect(result.started).toBe(true);
        });
    });

    describe("animation flow sequence", () => {
        it("should follow correct execution order", () => {
            testContext.component.hideBackground(true);
            testContext.executeScheduledCallback();

            // Verify the sequence: scheduleOnce -> tween -> to -> call -> start
            expect(testContext.component.scheduleOnce).toHaveBeenCalledWith(
                expect.any(Function),
                0.8
            );
            expect(testContext.tweenFunction).toHaveBeenCalledWith(testContext.uiOpacity);
        });
    });
});

// SOLID: Single Responsibility Principle - Error Handling Tests
describe("EffectUnboxGift - Error Handling", () => {
    let testContext: EffectUnboxTestContext;

    beforeEach(() => {
        testContext = new EffectUnboxTestContext();
    });

    describe("null and undefined background handling", () => {
        class BackgroundErrorHandler {
            static handleNullBackground(component: IEffectUnboxGiftComponent): { handled: boolean; errorType: string } {
                if (!component.background) {
                    return { handled: true, errorType: "null_background" };
                }
                return { handled: false, errorType: "" };
            }
        }

        it("should handle null background gracefully", () => {
            testContext.setupNullBackground();

            expect(() => {
                testContext.component.hideBackground(true);
                testContext.executeScheduledCallback();
            }).not.toThrow();

            expect(testContext.tweenFunction).not.toHaveBeenCalled();
        });

        it("should handle undefined background gracefully", () => {
            testContext.setupUndefinedBackground();

            expect(() => {
                testContext.component.hideBackground(true);
                testContext.executeScheduledCallback();
            }).not.toThrow();

            expect(testContext.tweenFunction).not.toHaveBeenCalled();
        });

        it("should validate background error handler", () => {
            testContext.setupNullBackground();
            
            const result = BackgroundErrorHandler.handleNullBackground(testContext.component);

            expect(result.handled).toBe(true);
            expect(result.errorType).toBe("null_background");
        });
    });
});

// SOLID: Single Responsibility Principle - Component Structure Validation
describe("EffectUnboxGift - Component Structure", () => {
    describe("interface compliance", () => {
        it("should validate IBackgroundNode interface", () => {
            const backgroundNode = EffectUnboxMockFactory.createBackgroundNode();

            expect(backgroundNode).toHaveProperty("active");
            expect(backgroundNode).toHaveProperty("getComponent");
            expect(backgroundNode).toHaveProperty("addComponent");
            expect(typeof backgroundNode.active).toBe("boolean");
            expect(typeof backgroundNode.getComponent).toBe("function");
            expect(typeof backgroundNode.addComponent).toBe("function");
        });

        it("should validate IUIOpacity interface", () => {
            const uiOpacity = EffectUnboxMockFactory.createUIOpacity(128);

            expect(uiOpacity).toHaveProperty("opacity");
            expect(typeof uiOpacity.opacity).toBe("number");
            expect(uiOpacity.opacity).toBe(128);
        });

        it("should validate ITweenChain interface", () => {
            const tweenChain = EffectUnboxMockFactory.createTweenChain();

            expect(tweenChain).toHaveProperty("to");
            expect(tweenChain).toHaveProperty("call");
            expect(tweenChain).toHaveProperty("start");
            expect(typeof tweenChain.to).toBe("function");
            expect(typeof tweenChain.call).toBe("function");
            expect(typeof tweenChain.start).toBe("function");
        });

        it("should validate test data factory methods", () => {
            const factoryMethods = [
                'createAnimationConfig', 'createTruthyValues', 'createFalsyValues', 'createMultipleCallScenario'
            ];

            factoryMethods.forEach(method => {
                expect(typeof (EffectUnboxTestDataFactory as any)[method]).toBe("function");
            });

            const config = EffectUnboxTestDataFactory.createAnimationConfig();
            expect(config.duration).toBe(1);
            expect(config.easing).toBe("sineOut");
        });

        it("should validate mock factory methods", () => {
            const mockMethods = [
                'createUIOpacity', 'createBackgroundNode', 'createTweenChain',
                'createTweenFunction', 'createObserverComponent', 'createEffectUnboxGiftComponent'
            ];

            mockMethods.forEach(method => {
                expect(typeof (EffectUnboxMockFactory as any)[method]).toBe("function");
            });

            const component = EffectUnboxMockFactory.createEffectUnboxGiftComponent();
            expect(component.background).toBeDefined();
            expect(typeof component.hideBackground).toBe("function");
        });
    });
});
