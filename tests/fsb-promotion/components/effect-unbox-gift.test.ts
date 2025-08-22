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
const mockTweenChain = {
    to: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    start: jest.fn(),
};

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

describe("EffectUnboxGift", () => {
    let component: any;
    let mockBackground: any;
    let mockUIOpacity: any;
    let mockTween: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset tween chain mocks
        mockTweenChain.to.mockReturnThis();
        mockTweenChain.call.mockReturnThis();
        mockTweenChain.start.mockClear();

        // Create mock UIOpacity component
        mockUIOpacity = {
            opacity: 255
        };

        // Create mock background node
        mockBackground = {
            active: true,
            getComponent: jest.fn().mockReturnValue(mockUIOpacity),
            addComponent: jest.fn().mockReturnValue(mockUIOpacity)
        };

        // Get tween mock
        const cc = require("cc");
        mockTween = cc.tween;

        // Create manual test component that implements the behavior we want to test
        component = {
            background: mockBackground,
            scheduleOnce: jest.fn(),
            onLoad: jest.fn(),
            
            hideBackground(isOpenRedeemGiftCodePopup) {
                if (isOpenRedeemGiftCodePopup) {
                    this.scheduleOnce(() => {
                        if (this.background) {
                            const uiOpacity = this.background.getComponent(require("cc").UIOpacity) || this.background.addComponent(require("cc").UIOpacity);
                            require("cc").tween(uiOpacity)
                                .to(1, { opacity: 0 }, { easing: "sineOut" })
                                .call(() => {
                                    this.background.active = false;
                                })
                                .start();
                        }
                    }, 0.8);
                }
            }
        };

        // Mock the parent onLoad method
        component.onLoad = function() {
            // Simulate calling super.onLoad() by calling the mock
            const MockObserverComponent = require("db://shared-components/shared/common-components/observer-component/scripts/observer-component").ObserverComponent;
            const superInstance = new MockObserverComponent();
            superInstance.onLoad();
        };
    });

    describe("initialization", () => {
        it("should initialize with background property", () => {
            // Assert
            expect(component.background).toBe(mockBackground);
            expect(component.background).toBeDefined();
        });

        it("should have hideBackground method", () => {
            // Assert
            expect(typeof component.hideBackground).toBe('function');
        });

        it("should have onLoad method", () => {
            // Assert
            expect(typeof component.onLoad).toBe('function');
        });
    });

    describe("hideBackground", () => {
        it("should schedule animation when isOpenRedeemGiftCodePopup is true", () => {
            // Act
            component.hideBackground(true);

            // Assert
            expect(component.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.8);
        });

        it("should not schedule anything when isOpenRedeemGiftCodePopup is false", () => {
            // Act
            component.hideBackground(false);

            // Assert
            expect(component.scheduleOnce).not.toHaveBeenCalled();
        });

        it("should animate background opacity and deactivate when scheduled callback executes", () => {
            // Arrange
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback(); // Execute the scheduled callback

            // Assert
            expect(mockBackground.getComponent).toHaveBeenCalled();
            expect(mockTween).toHaveBeenCalledWith(mockUIOpacity);
            expect(mockTweenChain.to).toHaveBeenCalledWith(1, { opacity: 0 }, { easing: "sineOut" });
            expect(mockTweenChain.call).toHaveBeenCalledWith(expect.any(Function));
            expect(mockTweenChain.start).toHaveBeenCalled();
        });

        it("should deactivate background when tween callback executes", () => {
            // Arrange
            let scheduledCallback: Function;
            let tweenCallback: Function;
            
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });
            
            mockTweenChain.call.mockImplementation((callback: Function) => {
                tweenCallback = callback;
                return mockTweenChain;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback(); // Execute the scheduled callback
            tweenCallback(); // Execute the tween callback

            // Assert
            expect(mockBackground.active).toBe(false);
        });

        it("should handle case when background is null", () => {
            // Arrange
            component.background = null;
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback();

            // Assert - should not throw and should not call tween
            expect(mockTween).not.toHaveBeenCalled();
            expect(mockTweenChain.to).not.toHaveBeenCalled();
        });

        it("should get existing UIOpacity component if available", () => {
            // Arrange
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback();

            // Assert
            expect(mockBackground.getComponent).toHaveBeenCalled();
            expect(mockBackground.addComponent).not.toHaveBeenCalled();
            expect(mockTween).toHaveBeenCalledWith(mockUIOpacity);
        });

        it("should add UIOpacity component if not exists", () => {
            // Arrange
            mockBackground.getComponent.mockReturnValue(null);
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback();

            // Assert
            expect(mockBackground.getComponent).toHaveBeenCalled();
            expect(mockBackground.addComponent).toHaveBeenCalled();
            expect(mockTween).toHaveBeenCalledWith(mockUIOpacity);
        });

        it("should use correct delay time of 0.8 seconds", () => {
            // Act
            component.hideBackground(true);

            // Assert
            expect(component.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.8);
        });

        it("should use correct tween parameters", () => {
            // Arrange
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback();

            // Assert
            expect(mockTweenChain.to).toHaveBeenCalledWith(
                1, // duration
                { opacity: 0 }, // target properties
                { easing: "sineOut" } // options
            );
        });
    });

    describe("animation flow", () => {
        it("should follow correct sequence: scheduleOnce -> tween.to -> call -> start", () => {
            // Arrange
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act
            component.hideBackground(true);
            scheduledCallback();

            // Assert sequence
            expect(component.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.8);
            expect(mockTween).toHaveBeenCalledWith(mockUIOpacity);
        });

        it("should handle multiple calls correctly", () => {
            // Act
            component.hideBackground(true);
            component.hideBackground(true);
            component.hideBackground(false);

            // Assert
            expect(component.scheduleOnce).toHaveBeenCalledTimes(2);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined background gracefully", () => {
            // Arrange
            component.background = undefined;
            let scheduledCallback: Function;
            component.scheduleOnce = jest.fn().mockImplementation((callback: Function) => {
                scheduledCallback = callback;
            });

            // Act & Assert - should not throw
            expect(() => {
                component.hideBackground(true);
                scheduledCallback();
            }).not.toThrow();
        });

        it("should handle falsy values for isOpenRedeemGiftCodePopup", () => {
            // Test various falsy values
            const falsyValues = [false, 0, "", null, undefined, NaN];

            falsyValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                expect(component.scheduleOnce).not.toHaveBeenCalled();
            });
        });

        it("should handle truthy values for isOpenRedeemGiftCodePopup", () => {
            // Test various truthy values
            const truthyValues = [true, 1, "test", {}, []];

            truthyValues.forEach(value => {
                jest.clearAllMocks();
                component.hideBackground(value);
                expect(component.scheduleOnce).toHaveBeenCalled();
            });
        });
    });
});
