import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FSBPromotionInfo } from "../../scripts/components/fsb-promotion-info";
import { GameServiceMessageSlot } from "../../../game-message-slot";
import { FreeSpinsPromotionEvents } from "../../scripts/stores/fsb-promotion-ui-store";

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
    Label: jest.fn(),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
    Component: jest.fn(),
}));

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    FormatUtils: {
        numberWithCommas: jest.fn().mockReturnValue("1,000.00")
    },
    Player: {
        MainPlayerStore: {
            balance: 1000,
        }
    },
    Configs: {
        SiteConfigs: {
            env: "test",
        }
    },
    Connection: {
        ConnectionStore: {
            connection: {
                on: jest.fn(),
            },
        }
    },
    Auth: {
        AuthStore: {
            session: "test_session",
            username: "test_username",
            language: "en",
        }
    },
    Notices: {
        NoticeStore: {
            addWarning: jest.fn(),
        },
        NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(() => ({})),
        },
    },
    Notification: {
        NotificationStore: {
            connection: {
                on: jest.fn(),
            },
        }
    },
    UserSettings: {
        UserSettingsStore: {
            get: jest.fn(),
        },
        UserSettingHandlers: {
            GetBalance: jest.fn(() => ({})),
        },
    },
    GameUserSettings: {
        GameUserSettingHandler: jest.fn(() => ({})),
    },
    Bet: {
        BetHandler: class MockBetHandler {
            constructor() {}
        },
        BetStore: {
            lastReceivedBet: { value: 0 }
        }
    },
    Error: {
        ErrorStore: {
            apiError: null,
        },
    },
    Rounds: {
        RoundStore: {
            minBet: 1,
        },
    },
    Translator: {
        commonTranslate: jest.fn(),
    },
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        getComponent = jest.fn();
        scheduleOnce = jest.fn();
    },
}));

jest.mock("db://shared-components/shared/common-components/draggable/draggable-item", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../../scripts/stores/fsb-promotion-store");
jest.mock("../../../game-message-slot");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

jest.mock("db://shared-cascading-slot/handlers/auto-play-handlers");
jest.mock("../../scripts/stores/fsb-promotion-ui-store");
jest.mock("../../scripts/handlers/fsb-promotion-ui-handler");

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

describe("FSBPromotionInfo", () => {
    let component: FSBPromotionInfo;
    let mockLabelTotalWin: any;
    let mockLabelFSB: any;
    let mockLabelTotalBet: any;
    let mockDraggableItem: any;
    let mockTouchCallback: any;
    let mockFormatUtils: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock labels
        mockLabelTotalWin = {
            string: ""
        };
        mockLabelFSB = {
            string: ""
        };
        mockLabelTotalBet = {
            string: ""
        };

        // Create mock touch callback
        mockTouchCallback = {
            end: jest.fn()
        };

        // Create mock draggable item
        mockDraggableItem = {
            touchCallback: mockTouchCallback
        };

        // Create component instance
        component = new FSBPromotionInfo();
        component.labelTotalWin = mockLabelTotalWin;
        component.labelFSB = mockLabelFSB;
        component.labelTotalBet = mockLabelTotalBet;
        component.getComponent = jest.fn().mockReturnValue(mockDraggableItem) as any;
        component.scheduleOnce = jest.fn();

        // Mock handler methods
        component.setCurrentSpinCount = jest.fn().mockImplementation((count) => count) as any;
        component.placeBet = jest.fn();
        component.tryConsumeFSB = jest.fn();
        component.revertLastFSB = jest.fn();
        component.setBetControl = jest.fn();
        component['updatePromotionURL'] = jest.fn();
        component['activeDetailPromo'] = jest.fn();
        component['openFreeSpinsPromotion'] = jest.fn();

        // Mock FormatUtils
        const gc = require("@sg/game-client-base");
        mockFormatUtils = gc.FormatUtils;
        mockFormatUtils.numberWithCommas.mockReturnValue("1,000.00");
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            // Assert
            expect(component.labelTotalWin).toBe(mockLabelTotalWin);
            expect(component.labelFSB).toBe(mockLabelFSB);
            expect(component.labelTotalBet).toBe(mockLabelTotalBet);
            expect(component['BET_MULTIPLIER']).toBe(20);
            expect(component['totalWin']).toBe(0);
        });
    });

    describe("onEnable", () => {
        it("should call setupDraggable", () => {
            // Arrange
            const setupDraggableSpy = jest.spyOn(component, 'setupDraggable' as any);

            // Act
            component.onEnable();

            // Assert
            expect(setupDraggableSpy).toHaveBeenCalled();
        });
    });

    describe("setupDraggable", () => {
        it("should get DraggableItem component and set touch callback", () => {
            // Act
            component['setupDraggable']();

            // Assert
            expect(component.getComponent).toHaveBeenCalled();
            expect(mockTouchCallback.end).toBeDefined();
        });

        it("should handle case when draggable item is null", () => {
            // Arrange
            component.getComponent = jest.fn().mockReturnValue(null) as any;

            // Act & Assert - should not throw
            expect(() => component['setupDraggable']()).not.toThrow();
        });

        it("should handle case when touchCallback is null", () => {
            // Arrange
            mockDraggableItem.touchCallback = null;

            // Act & Assert - should not throw
            expect(() => component['setupDraggable']()).not.toThrow();
        });

        it("should not call onCollapseMenu when not clicked", () => {
            // Arrange
            const onCollapseMenuSpy = jest.spyOn(component, 'onCollapseMenu' as any);
            component['setupDraggable']();

            // Act
            mockTouchCallback.end(false);

            // Assert
            expect(onCollapseMenuSpy).not.toHaveBeenCalled();
        });
    });

    describe("onFSBPromotionInfo", () => {
        it("should handle promotion with all properties", () => {
            // Arrange
            const promotion: GameServiceMessageSlot.Promotion = {
                coinValue: 0.5,
                betLevel: 10,
                totalWin: 1500,
                remainingBonusItems: 3,
                promotionId: "test123",
                initialBonusItem: 5
            };
            const updateUISpy = jest.spyOn(component, 'updateUI' as any);
            const calculateTotalBetSpy = jest.spyOn(component, 'calculateTotalBet' as any);

            // Act
            component.onFSBPromotionInfo(promotion);

            // Assert
            expect(component['totalWin']).toBe(1500);
            expect(calculateTotalBetSpy).toHaveBeenCalledWith(0.5, 10);
            expect(updateUISpy).toHaveBeenCalledWith({
                totalWin: 1500,
                remainingBonusItems: 3,
                totalBet: 100 // 10 * 0.5 * 20 = 100
            });
            expect(component.setCurrentSpinCount).toHaveBeenCalledWith(3);
        });

        it("should handle promotion with missing properties (use defaults)", () => {
            // Arrange
            const promotion: GameServiceMessageSlot.Promotion = {
                promotionId: "test123",
                initialBonusItem: 5
            };
            const updateUISpy = jest.spyOn(component, 'updateUI' as any);

            // Act
            component.onFSBPromotionInfo(promotion);

            // Assert
            expect(component['totalWin']).toBe(0);
            expect(updateUISpy).toHaveBeenCalledWith({
                totalWin: 0,
                remainingBonusItems: 0,
                totalBet: 0
            });
            expect(component.setCurrentSpinCount).toHaveBeenCalledWith(0);
        });
    });

    describe("calculateTotalBet", () => {
        it("should calculate total bet correctly", () => {
            // Act
            const result = component['calculateTotalBet'](0.5, 10);

            // Assert
            expect(result).toBe(100); // 10 * 0.5 * 20 = 100
        });

        it("should handle decimal calculations and round correctly", () => {
            // Act
            const result = component['calculateTotalBet'](0.33, 15);

            // Assert
            expect(result).toBe(99); // 15 * 0.33 * 20 = 99.0 (rounded to 1 decimal place)
        });

        it("should handle zero values", () => {
            // Act
            const result1 = component['calculateTotalBet'](0, 10);
            const result2 = component['calculateTotalBet'](0.5, 0);
            const result3 = component['calculateTotalBet'](0, 0);

            // Assert
            expect(result1).toBe(0);
            expect(result2).toBe(0);
            expect(result3).toBe(0);
        });
    });

    describe("updateUI", () => {
        it("should update all UI labels", () => {
            // Act
            component['updateUI']({
                totalWin: 1500,
                remainingBonusItems: 3,
                totalBet: 100
            });

            // Assert
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(1500, 2, false);
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(100, 2, false);
            expect(mockLabelTotalWin.string).toBe("1,000.00");
            expect(mockLabelFSB.string).toBe("3");
            expect(mockLabelTotalBet.string).toBe("1,000.00");
        });
    });

    describe("onPendingUIEvent", () => {
        it("should return early when event is null", () => {
            // Act
            component.onPendingUIEvent(null);

            // Assert - no labels should be updated
            expect(mockLabelFSB.string).toBe("");
            expect(mockLabelTotalWin.string).toBe("");
        });

        it("should return early when event is undefined", () => {
            // Act
            component.onPendingUIEvent(undefined);

            // Assert - no labels should be updated
            expect(mockLabelFSB.string).toBe("");
            expect(mockLabelTotalWin.string).toBe("");
        });

        it("should handle UPDATE_FSB_COUNT event", () => {
            // Arrange
            const event = {
                event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                data: 5
            };

            // Act
            component.onPendingUIEvent(event);

            // Assert
            expect(mockLabelFSB.string).toBe("5");
        });

        it("should handle UPDATE_TOTAL_WIN event", () => {
            // Arrange
            component['totalWin'] = 1000; // Set initial total win
            const event = {
                event: FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                data: 500
            };

            // Act
            component.onPendingUIEvent(event);

            // Assert
            expect(component['totalWin']).toBe(1500); // 1000 + 500
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(1500, 2, false);
            expect(mockLabelTotalWin.string).toBe("1,000.00");
        });

        it("should handle UPDATE_TOTAL_WIN event with negative data", () => {
            // Arrange
            component['totalWin'] = 1000;
            const event = {
                event: FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                data: -200
            };

            // Act
            component.onPendingUIEvent(event);

            // Assert
            expect(component['totalWin']).toBe(800); // 1000 - 200
        });

        it("should ignore unknown event types", () => {
            // Arrange
            const event = {
                event: "UNKNOWN_EVENT",
                data: "test"
            };

            // Act
            component.onPendingUIEvent(event);

            // Assert
            expect(mockLabelFSB.string).toBe("");
            expect(mockLabelTotalWin.string).toBe("");
        });

        it("should handle event when labels are null", () => {
            // Arrange
            component.labelFSB = null;
            component.labelTotalWin = null;
            const event = {
                event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                data: 5
            };

            // Act & Assert - should not throw
            expect(() => component.onPendingUIEvent(event)).not.toThrow();
        });
    });

    describe("onClickInfoIcon", () => {
        it("should call all required methods in sequence", () => {
            // Act
            component.onClickInfoIcon();

            // Assert
            expect(component['activeDetailPromo']).toHaveBeenCalled();
            expect(component['updatePromotionURL']).toHaveBeenCalled();
            expect(component['openFreeSpinsPromotion']).toHaveBeenCalled();
        });
    });

    describe("updataRemainingBonus", () => {
        it("should call revertLastFSB when lastReceivedBet value is 0", () => {
            // Arrange
            const lastReceivedBet = { value: 0 };

            // Act
            component.updataRemainingBonus(lastReceivedBet);

            // Assert
            expect(component.revertLastFSB).toHaveBeenCalled();
        });

        it("should call revertLastFSB when lastReceivedBet value is negative", () => {
            // Arrange
            const lastReceivedBet = { value: -100 };

            // Act
            component.updataRemainingBonus(lastReceivedBet);

            // Assert
            expect(component.revertLastFSB).toHaveBeenCalled();
        });

        it("should not call revertLastFSB when lastReceivedBet value is positive", () => {
            // Arrange
            const lastReceivedBet = { value: 100 };

            // Act
            component.updataRemainingBonus(lastReceivedBet);

            // Assert
            expect(component.revertLastFSB).not.toHaveBeenCalled();
        });
    });

    describe("autoTriggerNextFSBSpin", () => {
        it("should trigger actions when eligible and server has not finished", () => {
            // Act
            component.autoTriggerNextFSBSpin([true, false]);

            // Assert
            expect(component.setBetControl).toHaveBeenCalled();
            expect(component.tryConsumeFSB).toHaveBeenCalled();
            expect(component.placeBet).toHaveBeenCalled();
        });

        it("should not trigger actions when not eligible", () => {
            // Act
            component.autoTriggerNextFSBSpin([false, false]);

            // Assert
            expect(component.setBetControl).not.toHaveBeenCalled();
            expect(component.tryConsumeFSB).not.toHaveBeenCalled();
            expect(component.placeBet).not.toHaveBeenCalled();
        });

        it("should not trigger actions when server has finished promotion", () => {
            // Act
            component.autoTriggerNextFSBSpin([true, true]);

            // Assert
            expect(component.setBetControl).not.toHaveBeenCalled();
            expect(component.tryConsumeFSB).not.toHaveBeenCalled();
            expect(component.placeBet).not.toHaveBeenCalled();
        });

        it("should not trigger actions when both conditions are false", () => {
            // Act
            component.autoTriggerNextFSBSpin([false, true]);

            // Assert
            expect(component.setBetControl).not.toHaveBeenCalled();
            expect(component.tryConsumeFSB).not.toHaveBeenCalled();
            expect(component.placeBet).not.toHaveBeenCalled();
        });
    });

    describe("handler methods", () => {
        it("should have setCurrentSpinCount method that returns the input", () => {
            // Act
            const result = component.setCurrentSpinCount(5);

            // Assert
            expect(result).toBe(5);
        });

        it("should have placeBet method", () => {
            // Assert
            expect(component.placeBet).toBeDefined();
            expect(typeof component.placeBet).toBe('function');
        });

        it("should have tryConsumeFSB method", () => {
            // Assert
            expect(component.tryConsumeFSB).toBeDefined();
            expect(typeof component.tryConsumeFSB).toBe('function');
        });

        it("should have revertLastFSB method", () => {
            // Assert
            expect(component.revertLastFSB).toBeDefined();
            expect(typeof component.revertLastFSB).toBe('function');
        });

        it("should have setBetControl method", () => {
            // Assert
            expect(component.setBetControl).toBeDefined();
            expect(typeof component.setBetControl).toBe('function');
        });

        it("should have private handler methods", () => {
            // Assert
            expect(component['updatePromotionURL']).toBeDefined();
            expect(component['activeDetailPromo']).toBeDefined();
            expect(component['openFreeSpinsPromotion']).toBeDefined();
            expect(typeof component['updatePromotionURL']).toBe('function');
            expect(typeof component['activeDetailPromo']).toBe('function');
            expect(typeof component['openFreeSpinsPromotion']).toBe('function');
        });
    });

    describe("edge cases", () => {
        it("should handle complex promotion data correctly", () => {
            // Arrange
            const promotion: GameServiceMessageSlot.Promotion = {
                coinValue: 1.25,
                betLevel: 8,
                totalWin: 2500.75,
                remainingBonusItems: 7,
                promotionId: "complex123",
                initialBonusItem: 10,
                isGiftCode: true,
                isClaimed: false,
                betAmount: 200
            };

            // Act
            component.onFSBPromotionInfo(promotion);

            // Assert
            expect(component['totalWin']).toBe(2500.75);
            expect(component['calculateTotalBet'](1.25, 8)).toBe(200); // 8 * 1.25 * 20
        });

        it("should handle multiple UI events in sequence", () => {
            // Arrange
            component['totalWin'] = 500;

            // Act
            component.onPendingUIEvent({
                event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                data: 3
            });
            component.onPendingUIEvent({
                event: FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                data: 250
            });
            component.onPendingUIEvent({
                event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                data: 2
            });

            // Assert
            expect(mockLabelFSB.string).toBe("2"); // Last FSB count update
            expect(component['totalWin']).toBe(750); // 500 + 250
        });

        it("should handle promotion with very small decimal values", () => {
            // Arrange
            const promotion: GameServiceMessageSlot.Promotion = {
                coinValue: 0.001,
                betLevel: 1,
                totalWin: 0.01,
                remainingBonusItems: 1,
                promotionId: "small123",
                initialBonusItem: 1
            };

            // Act
            component.onFSBPromotionInfo(promotion);

            // Assert
            expect(component['calculateTotalBet'](0.001, 1)).toBe(0); // 1 * 0.001 * 20 = 0.02 rounded to 0.0
        });
    });
});
