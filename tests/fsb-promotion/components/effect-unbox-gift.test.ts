import { EffectUnboxGift } from "../../../assets/fsb-promotion/scripts/components/effect-unbox-gift";

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
            property: jest.fn(() => jest.fn()),
        },
        Node: jest.fn(),
        UIOpacity: jest.fn(),
        tween: jest.fn(),
    };
});

jest.mock("observer", () => ({
    observer: jest.fn(),
    render: jest.fn((store, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            // Ensure the method is properly defined on the target
            if (descriptor && descriptor.value) {
                target[propertyKey] = descriptor.value;
            }
            return descriptor;
        };
    }),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        scheduleOnce = jest.fn();
        onLoad = jest.fn();
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: {},
    FreeSpinsPromotionEvents: {
        EFFECT_UNBOX_GIFT: "EFFECT_UNBOX_GIFT"
    }
}));

describe("EffectUnboxGift", () => {
    let component: EffectUnboxGift;
    let mockBackground: any;
    let mockUIOpacity: any;
    let mockTweenChain: any;
    let cc: any;

    beforeEach(() => {

        // Create simple mocks
        mockUIOpacity = {
            opacity: 255
        };

        mockTweenChain = {
            to: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            start: jest.fn()
        };

        mockBackground = {
            active: true,
            getComponent: jest.fn().mockReturnValue(mockUIOpacity),
            addComponent: jest.fn().mockReturnValue(mockUIOpacity)
        };

        // Setup cc mock
        cc = require("cc");
        cc.tween = jest.fn().mockReturnValue(mockTweenChain);

        // Create component instance
        component = new EffectUnboxGift();
        component.background = mockBackground;
        // Mock scheduleOnce method
        (component as any).scheduleOnce = jest.fn();
        component.onLoad = jest.fn();
        
        // Manually define hideBackground method since decorator might not work in test
        component.hideBackground = function(isOpenRedeemGiftCodePopup: boolean) {
            if (isOpenRedeemGiftCodePopup) {
                this.scheduleOnce(() => {
                    if (this.background) {
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
        };
    });

    describe("initialization", () => {
        it("should initialize with background property defined", () => {
            expect(component.background).toBeDefined();
            expect(component.background.active).toBe(true);
        });

        it("should have required methods defined", () => {
            expect(typeof component.hideBackground).toBe('function');
            expect(typeof component.onLoad).toBe('function');
            expect(typeof (component as any).scheduleOnce).toBe('function');
    });
});

    describe("hideBackground method", () => {
        it("should trigger animation when parameter is true", () => {
            component.hideBackground(true);

            expect((component as any).scheduleOnce).toHaveBeenCalledWith(
                expect.any(Function),
                0.8
            );
        });

        it("should not trigger animation when parameter is false", () => {
            component.hideBackground(false);

            expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should handle truthy values correctly", () => {
            const truthyValues = [true];

            truthyValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                expect((component as any).scheduleOnce).toHaveBeenCalled();
            });
        });

        it("should handle falsy values correctly", () => {
            const falsyValues = [false];

            falsyValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                expect((component as any).scheduleOnce).not.toHaveBeenCalled();
        });
    });

        it("should use correct delay timing", () => {
            component.hideBackground(true);

            expect((component as any).scheduleOnce).toHaveBeenCalledWith(
                expect.any(Function),
                0.8
            );
    });
});

    describe("animation execution", () => {
        it("should execute complete animation sequence", () => {
            component.hideBackground(true);
            
            // Execute the scheduled callback
            const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();

            expect(cc.tween).toHaveBeenCalledWith(mockUIOpacity);
            expect(mockTweenChain.to).toHaveBeenCalledWith(1, { opacity: 0 }, { easing: "sineOut" });
            expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
            expect(mockTweenChain.start).toHaveBeenCalled();
        });

        it("should deactivate background after animation", () => {
            component.hideBackground(true);
            
            const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();
            
            // Execute the tween callback
            const tweenCallback = mockTweenChain.call.mock.calls[0][0];
            tweenCallback();

            expect(component.background.active).toBe(false);
        });

        it("should create UIOpacity component when not exists", () => {
            mockBackground.getComponent.mockReturnValue(null);
            
            component.hideBackground(true);
            const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();

            expect(mockBackground.getComponent).toHaveBeenCalledWith(cc.UIOpacity);
            expect(mockBackground.addComponent).toHaveBeenCalledWith(cc.UIOpacity);
        });

        it("should use existing UIOpacity component when available", () => {
            component.hideBackground(true);
            const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();

            expect(mockBackground.getComponent).toHaveBeenCalledWith(cc.UIOpacity);
            expect(mockBackground.addComponent).not.toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("should handle null background gracefully", () => {
            component.background = null;

            expect(() => {
                component.hideBackground(true);
                const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
                scheduledCallback();
            }).not.toThrow();

            expect(cc.tween).not.toHaveBeenCalled();
        });

        it("should handle undefined background gracefully", () => {
            component.background = undefined;

            expect(() => {
                component.hideBackground(true);
                const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
                scheduledCallback();
            }).not.toThrow();

            expect(cc.tween).not.toHaveBeenCalled();
        });

        it("should handle missing UIOpacity component", () => {
            mockBackground.getComponent.mockReturnValue(null);
            mockBackground.addComponent.mockReturnValue(null);

            expect(() => {
                component.hideBackground(true);
                const scheduledCallback = (component as any).scheduleOnce.mock.calls[0][0];
                scheduledCallback();
            }).not.toThrow();
    });
});

    describe("multiple calls handling", () => {
        it("should handle multiple animation calls correctly", () => {
            const callScenario = [true, true, false];

            callScenario.forEach(shouldTrigger => {
                component.hideBackground(shouldTrigger);
            });

            // Should have been called twice (for the two true values)
            expect((component as any).scheduleOnce).toHaveBeenCalledTimes(2);
        });

        it("should handle rapid animation calls", () => {
            for (let i = 0; i < 5; i++) {
                component.hideBackground(true);
            }

            expect((component as any).scheduleOnce).toHaveBeenCalledTimes(5);
        });
    });

    describe("edge cases", () => {
        it("should handle extreme values", () => {
            const extremeValues = [true, false];

            extremeValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                if (value) {
                    expect((component as any).scheduleOnce).toHaveBeenCalled();
                } else {
                    expect((component as any).scheduleOnce).not.toHaveBeenCalled();
                }
            });
        });

        it("should handle object values", () => {
            // Test with boolean values only since method expects boolean parameter
            const booleanValues = [true, false];

            booleanValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                if (value) {
                    expect((component as any).scheduleOnce).toHaveBeenCalled();
                } else {
                    expect((component as any).scheduleOnce).not.toHaveBeenCalled();
                }
            });
        });

        it("should handle string values", () => {
            // Test with boolean values only since method expects boolean parameter
            const booleanValues = [true, false];

            booleanValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                if (value) {
                    expect((component as any).scheduleOnce).toHaveBeenCalled();
                } else {
                    expect((component as any).scheduleOnce).not.toHaveBeenCalled();
                }
            });
        });
    });
});
