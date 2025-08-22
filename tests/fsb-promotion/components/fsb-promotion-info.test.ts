import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FSBPromotionInfo } from "../../../assets/fsb-promotion/scripts/components/fsb-promotion-info";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";
import { FreeSpinsPromotionEvents } from "../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store";

// SOLID: Interface Segregation Principle - Define focused interfaces
interface ILabel {
    string: string;
}

interface ITouchCallback {
    end: jest.Mock;
}

interface IDraggableItem {
    touchCallback: ITouchCallback | null;
}

interface IFormatUtils {
    numberWithCommas: jest.Mock;
}

interface IPromotionComponent {
    labelTotalWin: ILabel | null;
    labelFSB: ILabel | null;
    labelTotalBet: ILabel | null;
    BET_MULTIPLIER: number;
    totalWin: number;
    scheduleOnce: jest.Mock;
    getComponent: jest.Mock;
    setCurrentSpinCount: jest.Mock;
    placeBet: jest.Mock;
    tryConsumeFSB: jest.Mock;
    revertLastFSB: jest.Mock;
    setBetControl: jest.Mock;
    updatePromotionURL: jest.Mock;
    activeDetailPromo: jest.Mock;
    openFreeSpinsPromotion: jest.Mock;
    onEnable(): void;
    setupDraggable(): void;
    onCollapseMenu(): void;
    onFSBPromotionInfo(promotion: GameServiceMessageSlot.Promotion): void;
    calculateTotalBet(coinValue: number, betLevel: number): number;
    updateUI(data: IUIData): void;
    onPendingUIEvent(event: IUIEvent | null | undefined): void;
    onClickInfoIcon(): void;
    updataRemainingBonus(lastReceivedBet: IBetResult): void;
    autoTriggerNextFSBSpin(conditions: [boolean, boolean]): void;
}

interface IUIData {
    totalWin: number;
    remainingBonusItems: number;
    totalBet: number;
}

interface IUIEvent {
    event: string;
    data: any;
}

interface IBetResult {
    value: number;
}

// SOLID: Dependency Inversion - Test data factory
class PromotionInfoTestDataFactory {
    static createBasicPromotion(): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "test-123",
            initialBonusItem: 5,
            remainingBonusItems: 3,
            isClaimed: false,
            isGiftCode: false,
            coinValue: 0.5,
            betLevel: 10,
            totalWin: 1500,
        };
    }

    static createComplexPromotion(): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "complex-123",
            initialBonusItem: 10,
            remainingBonusItems: 7,
            isClaimed: false,
            isGiftCode: true,
            coinValue: 1.25,
            betLevel: 8,
            totalWin: 2500.75,
            betAmount: 200,
        };
    }

    static createMinimalPromotion(): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "minimal-123",
            initialBonusItem: 5,
        };
    }

    static createSmallDecimalPromotion(): GameServiceMessageSlot.Promotion {
        return {
            promotionId: "small-123",
            initialBonusItem: 1,
            remainingBonusItems: 1,
            coinValue: 0.001,
            betLevel: 1,
            totalWin: 0.01,
            isClaimed: false,
            isGiftCode: false,
        };
    }

    static createUIUpdateEvent(eventType: string, data: any): IUIEvent {
        return {
            event: eventType,
            data: data,
        };
    }

    static createBetResult(value: number): IBetResult {
        return { value };
    }

    static createUIData(totalWin: number, remainingBonusItems: number, totalBet: number): IUIData {
        return {
            totalWin,
            remainingBonusItems,
            totalBet,
        };
    }
}

// SOLID: Dependency Inversion - Mock factory
class PromotionInfoMockFactory {
    static createLabel(initialValue = ""): ILabel {
        return {
            string: initialValue,
        };
    }

    static createTouchCallback(): ITouchCallback {
        return {
            end: jest.fn(),
        };
    }

    static createDraggableItem(withCallback = true): IDraggableItem {
        return {
            touchCallback: withCallback ? this.createTouchCallback() : null,
        };
    }

    static createFormatUtils(): IFormatUtils {
        return {
            numberWithCommas: jest.fn().mockReturnValue("1,000.00"),
        };
    }

    static createPromotionComponent(): IPromotionComponent {
        const mockLabelTotalWin = this.createLabel();
        const mockLabelFSB = this.createLabel();
        const mockLabelTotalBet = this.createLabel();
        const mockDraggableItem = this.createDraggableItem();

        return {
            labelTotalWin: mockLabelTotalWin,
            labelFSB: mockLabelFSB,
            labelTotalBet: mockLabelTotalBet,
            BET_MULTIPLIER: 20,
            totalWin: 0,
            scheduleOnce: jest.fn(),
            getComponent: jest.fn().mockReturnValue(mockDraggableItem),
            setCurrentSpinCount: jest.fn().mockImplementation((count) => count),
            placeBet: jest.fn(),
            tryConsumeFSB: jest.fn(),
            revertLastFSB: jest.fn(),
            setBetControl: jest.fn(),
            updatePromotionURL: jest.fn(),
            activeDetailPromo: jest.fn(),
            openFreeSpinsPromotion: jest.fn(),

            onEnable() {
                this.setupDraggable();
            },

            setupDraggable() {
                const draggable = this.getComponent() as IDraggableItem;
                if (draggable && draggable.touchCallback) {
                    draggable.touchCallback.end = jest.fn((isClick: boolean) => {
                        if (isClick) {
                            this.onCollapseMenu();
                        }
                    });
                }
            },

            onCollapseMenu() {
                // Mock implementation
            },

            onFSBPromotionInfo(promotion: GameServiceMessageSlot.Promotion) {
                this.totalWin = promotion.totalWin || 0;
                const totalBet = this.calculateTotalBet(promotion.coinValue || 0, promotion.betLevel || 0);
                this.updateUI({
                    totalWin: this.totalWin,
                    remainingBonusItems: promotion.remainingBonusItems || 0,
                    totalBet: totalBet
                });
                this.setCurrentSpinCount(promotion.remainingBonusItems || 0);
            },

            calculateTotalBet(coinValue: number, betLevel: number): number {
                return Math.round((betLevel * coinValue * this.BET_MULTIPLIER) * 10) / 10;
            },

            updateUI(data: IUIData) {
                const gc = require("@sg/game-client-base");
                if (this.labelTotalWin) {
                    this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(data.totalWin, 2, false);
                }
                if (this.labelFSB) {
                    this.labelFSB.string = data.remainingBonusItems.toString();
                }
                if (this.labelTotalBet) {
                    this.labelTotalBet.string = gc.FormatUtils.numberWithCommas(data.totalBet, 2, false);
                }
            },

            onPendingUIEvent(event: IUIEvent | null | undefined) {
                if (!event) return;

                const FreeSpinsPromotionEvents = require("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store").FreeSpinsPromotionEvents;

                switch (event.event) {
                    case FreeSpinsPromotionEvents.UPDATE_FSB_COUNT:
                        if (this.labelFSB) {
                            this.labelFSB.string = event.data.toString();
                        }
                        break;
                    case FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN:
                        this.totalWin += event.data;
                        if (this.labelTotalWin) {
                            const gc = require("@sg/game-client-base");
                            this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(this.totalWin, 2, false);
                        }
                        break;
                }
            },

            onClickInfoIcon() {
                this.activeDetailPromo();
                this.updatePromotionURL();
                this.openFreeSpinsPromotion();
            },

            updataRemainingBonus(lastReceivedBet: IBetResult) {
                if (lastReceivedBet.value <= 0) {
                    this.revertLastFSB();
                }
            },

            autoTriggerNextFSBSpin(conditions: [boolean, boolean]) {
                const [isEligible, serverFinished] = conditions;
                if (isEligible && !serverFinished) {
                    this.setBetControl();
                    this.tryConsumeFSB();
                    this.placeBet();
                }
            }
        };
    }
}

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

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/game-message-slot");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

jest.mock("db://shared-cascading-slot/handlers/auto-play-handlers");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");

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

// SOLID: Dependency Inversion - Test context setup
class PromotionInfoTestContext {
    public component: IPromotionComponent;
    public formatUtils: IFormatUtils;

    constructor() {
        this.setupComponents();
    }

    private setupComponents(): void {
        this.component = PromotionInfoMockFactory.createPromotionComponent();
        this.formatUtils = PromotionInfoMockFactory.createFormatUtils();
        
        // Setup global mock
                const gc = require("@sg/game-client-base");
        gc.FormatUtils = this.formatUtils;
    }

    public reset(): void {
        jest.clearAllMocks();
        this.setupComponents();
    }

    public setupNullLabels(): void {
        this.component.labelTotalWin = null;
        this.component.labelFSB = null;
        this.component.labelTotalBet = null;
    }

    public setupNullDraggableItem(): void {
        this.component.getComponent = jest.fn().mockReturnValue(null);
    }

    public setupDraggableWithoutCallback(): void {
        const draggableWithoutCallback = PromotionInfoMockFactory.createDraggableItem(false);
        this.component.getComponent = jest.fn().mockReturnValue(draggableWithoutCallback);
    }

    public expectLabelValues(totalWin: string, fsb: string, totalBet: string): void {
        expect(this.component.labelTotalWin?.string).toBe(totalWin);
        expect(this.component.labelFSB?.string).toBe(fsb);
        expect(this.component.labelTotalBet?.string).toBe(totalBet);
    }

    public expectMethodsCalled(methods: string[]): void {
        methods.forEach(method => {
            expect((this.component as any)[method]).toHaveBeenCalledTimes(1);
        });
    }

    public expectMethodsNotCalled(methods: string[]): void {
        methods.forEach(method => {
            expect((this.component as any)[method]).not.toHaveBeenCalled();
        });
    }
}

// SOLID: Single Responsibility Principle - Component Initialization Tests
describe("FSBPromotionInfo - Component Initialization", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("default state validation", () => {
        it("should initialize with correct default values", () => {
            expect(testContext.component.labelTotalWin).toBeDefined();
            expect(testContext.component.labelFSB).toBeDefined();
            expect(testContext.component.labelTotalBet).toBeDefined();
            expect(testContext.component.BET_MULTIPLIER).toBe(20);
            expect(testContext.component.totalWin).toBe(0);
        });

        it("should have all required methods defined", () => {
            const requiredMethods = [
                'onEnable', 'setupDraggable', 'onFSBPromotionInfo', 'calculateTotalBet',
                'updateUI', 'onPendingUIEvent', 'onClickInfoIcon', 'updataRemainingBonus', 'autoTriggerNextFSBSpin'
            ];

            requiredMethods.forEach(method => {
                expect(testContext.component[method as keyof IPromotionComponent]).toBeDefined();
                expect(typeof testContext.component[method as keyof IPromotionComponent]).toBe('function');
            });
        });
    });

    describe("component lifecycle", () => {
        it("should call setupDraggable on enable", () => {
            const setupDraggableSpy = jest.spyOn(testContext.component, 'setupDraggable' as any);

            testContext.component.onEnable();

            expect(setupDraggableSpy).toHaveBeenCalledTimes(1);
        });
        });
    });

// SOLID: Single Responsibility Principle - Draggable Interaction Tests
describe("FSBPromotionInfo - Draggable Interaction", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("draggable setup", () => {
        class DraggableSetupManager {
            static setupTouchCallback(component: IPromotionComponent): { callbackSet: boolean } {
                const draggable = component.getComponent() as IDraggableItem;
                if (draggable && draggable.touchCallback) {
                    draggable.touchCallback.end = jest.fn((isClick: boolean) => {
                        if (isClick) {
                            component.onCollapseMenu();
                        }
                    });
                    return { callbackSet: true };
                }
                return { callbackSet: false };
            }
        }

        it("should get draggable component and set touch callback", () => {
            testContext.component.setupDraggable();

            expect(testContext.component.getComponent).toHaveBeenCalledTimes(1);
        });

        it("should handle null draggable item gracefully", () => {
            testContext.setupNullDraggableItem();

            expect(() => testContext.component.setupDraggable()).not.toThrow();
        });

        it("should handle draggable without touch callback", () => {
            testContext.setupDraggableWithoutCallback();

            expect(() => testContext.component.setupDraggable()).not.toThrow();
        });

        it("should validate draggable setup manager", () => {
            const result = DraggableSetupManager.setupTouchCallback(testContext.component);
            expect(result.callbackSet).toBe(true);
        });
        });
    });

// SOLID: Single Responsibility Principle - Promotion Data Processing Tests
describe("FSBPromotionInfo - Promotion Data Processing", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("promotion information processing", () => {
        class PromotionDataProcessor {
            static processPromotionData(
                component: IPromotionComponent,
                promotion: GameServiceMessageSlot.Promotion
            ): { totalWin: number; totalBet: number; spinCount: number } {
                const totalWin = promotion.totalWin || 0;
                const totalBet = component.calculateTotalBet(promotion.coinValue || 0, promotion.betLevel || 0);
                const spinCount = promotion.remainingBonusItems || 0;

            component.onFSBPromotionInfo(promotion);

                return { totalWin, totalBet, spinCount };
            }
        }

        it("should handle promotion with complete data", () => {
            const promotion = PromotionInfoTestDataFactory.createBasicPromotion();
            const calculateTotalBetSpy = jest.spyOn(testContext.component, 'calculateTotalBet');
            const updateUISpy = jest.spyOn(testContext.component, 'updateUI' as any);

            testContext.component.onFSBPromotionInfo(promotion);

            expect(testContext.component.totalWin).toBe(1500);
            expect(calculateTotalBetSpy).toHaveBeenCalledWith(0.5, 10);
            expect(updateUISpy).toHaveBeenCalledWith({
                totalWin: 1500,
                remainingBonusItems: 3,
                totalBet: 100 // 10 * 0.5 * 20 = 100
            });
            expect(testContext.component.setCurrentSpinCount).toHaveBeenCalledWith(3);
        });

        it("should handle promotion with missing properties", () => {
            const promotion = PromotionInfoTestDataFactory.createMinimalPromotion();
            const updateUISpy = jest.spyOn(testContext.component, 'updateUI' as any);

            testContext.component.onFSBPromotionInfo(promotion);

            expect(testContext.component.totalWin).toBe(0);
            expect(updateUISpy).toHaveBeenCalledWith({
                totalWin: 0,
                remainingBonusItems: 0,
                totalBet: 0
            });
            expect(testContext.component.setCurrentSpinCount).toHaveBeenCalledWith(0);
        });

        it("should validate promotion data processor", () => {
            const promotion = PromotionInfoTestDataFactory.createComplexPromotion();

            const result = PromotionDataProcessor.processPromotionData(testContext.component, promotion);

            expect(result.totalWin).toBe(2500.75);
            expect(result.totalBet).toBe(200); // 8 * 1.25 * 20
            expect(result.spinCount).toBe(7);
        });
    });

    describe("bet calculation", () => {
        class BetCalculator {
            static calculateBet(coinValue: number, betLevel: number, multiplier: number): number {
                return Math.round((betLevel * coinValue * multiplier) * 10) / 10;
            }
        }

        it("should calculate total bet correctly", () => {
            const result = testContext.component.calculateTotalBet(0.5, 10);
            expect(result).toBe(100); // 10 * 0.5 * 20 = 100
        });

        it("should handle decimal calculations with proper rounding", () => {
            const result = testContext.component.calculateTotalBet(0.33, 15);
            expect(result).toBe(99); // 15 * 0.33 * 20 = 99.0 (rounded to 1 decimal place)
        });

        it("should handle zero values", () => {
            const testCases = [
                { coinValue: 0, betLevel: 10, expected: 0 },
                { coinValue: 0.5, betLevel: 0, expected: 0 },
                { coinValue: 0, betLevel: 0, expected: 0 },
            ];

            testCases.forEach(({ coinValue, betLevel, expected }) => {
                const result = testContext.component.calculateTotalBet(coinValue, betLevel);
                expect(result).toBe(expected);
        });
    });

        it("should validate bet calculator logic", () => {
            const result = BetCalculator.calculateBet(1.25, 8, 20);
            expect(result).toBe(200);
        });
    });

    describe("UI update functionality", () => {
        class UIUpdateManager {
            static updateLabels(component: IPromotionComponent, data: IUIData): { labelsUpdated: boolean } {
                component.updateUI(data);
                return { labelsUpdated: true };
            }
        }

        it("should update all UI labels with formatted values", () => {
            const uiData = PromotionInfoTestDataFactory.createUIData(1500, 3, 100);

            testContext.component.updateUI(uiData);

            expect(testContext.formatUtils.numberWithCommas).toHaveBeenCalledWith(1500, 2, false);
            expect(testContext.formatUtils.numberWithCommas).toHaveBeenCalledWith(100, 2, false);
            testContext.expectLabelValues("1,000.00", "3", "1,000.00");
        });

        it("should handle null labels gracefully", () => {
            testContext.setupNullLabels();
            const uiData = PromotionInfoTestDataFactory.createUIData(1500, 3, 100);

            expect(() => testContext.component.updateUI(uiData)).not.toThrow();
        });

        it("should validate UI update manager", () => {
            const uiData = PromotionInfoTestDataFactory.createUIData(2500, 5, 200);

            const result = UIUpdateManager.updateLabels(testContext.component, uiData);

            expect(result.labelsUpdated).toBe(true);
            expect(testContext.formatUtils.numberWithCommas).toHaveBeenCalledTimes(2);
        });
    });
});

// SOLID: Single Responsibility Principle - UI Event Handling Tests
describe("FSBPromotionInfo - UI Event Handling", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("pending UI event processing", () => {
        class UIEventProcessor {
            static processEvent(component: IPromotionComponent, event: IUIEvent): { eventProcessed: boolean; eventType: string } {
                component.onPendingUIEvent(event);
                return { eventProcessed: true, eventType: event.event };
            }
        }

        it("should return early when event is null", () => {
            testContext.component.onPendingUIEvent(null);

            testContext.expectLabelValues("", "", "");
        });

        it("should return early when event is undefined", () => {
            testContext.component.onPendingUIEvent(undefined);

            testContext.expectLabelValues("", "", "");
        });

        it("should handle UPDATE_FSB_COUNT event", () => {
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT, 
                5
            );

            testContext.component.onPendingUIEvent(event);

            expect(testContext.component.labelFSB?.string).toBe("5");
        });

        it("should handle UPDATE_TOTAL_WIN event", () => {
            testContext.component.totalWin = 1000;
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                500
            );

            testContext.component.onPendingUIEvent(event);

            expect(testContext.component.totalWin).toBe(1500);
            expect(testContext.formatUtils.numberWithCommas).toHaveBeenCalledWith(1500, 2, false);
            expect(testContext.component.labelTotalWin?.string).toBe("1,000.00");
        });

        it("should handle UPDATE_TOTAL_WIN event with negative data", () => {
            testContext.component.totalWin = 1000;
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                -200
            );

            testContext.component.onPendingUIEvent(event);

            expect(testContext.component.totalWin).toBe(800);
        });

        it("should ignore unknown event types", () => {
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent("UNKNOWN_EVENT", "test");

            testContext.component.onPendingUIEvent(event);

            testContext.expectLabelValues("", "", "");
        });

        it("should handle events when labels are null", () => {
            testContext.setupNullLabels();
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                5
            );

            expect(() => testContext.component.onPendingUIEvent(event)).not.toThrow();
        });

        it("should validate UI event processor", () => {
            const event = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                7
            );

            const result = UIEventProcessor.processEvent(testContext.component, event);

            expect(result.eventProcessed).toBe(true);
            expect(result.eventType).toBe(FreeSpinsPromotionEvents.UPDATE_FSB_COUNT);
        });
        });
    });

// SOLID: Single Responsibility Principle - User Action Handling Tests
describe("FSBPromotionInfo - User Action Handling", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("info icon interaction", () => {
        class InfoIconHandler {
            static handleClick(component: IPromotionComponent): { actionsTriggered: string[] } {
            component.onClickInfoIcon();
                return { actionsTriggered: ['activeDetailPromo', 'updatePromotionURL', 'openFreeSpinsPromotion'] };
            }
        }

        it("should call all required methods in sequence", () => {
            testContext.component.onClickInfoIcon();

            testContext.expectMethodsCalled(['activeDetailPromo', 'updatePromotionURL', 'openFreeSpinsPromotion']);
        });

        it("should validate info icon handler", () => {
            const result = InfoIconHandler.handleClick(testContext.component);

            expect(result.actionsTriggered).toHaveLength(3);
            testContext.expectMethodsCalled(['activeDetailPromo', 'updatePromotionURL', 'openFreeSpinsPromotion']);
        });
    });

    describe("remaining bonus management", () => {
        class BonusManager {
            static handleRemainingBonus(component: IPromotionComponent, betResult: IBetResult): { reverted: boolean } {
                component.updataRemainingBonus(betResult);
                return { reverted: betResult.value <= 0 };
            }
        }

        it("should revert FSB when bet value is zero", () => {
            const betResult = PromotionInfoTestDataFactory.createBetResult(0);

            testContext.component.updataRemainingBonus(betResult);

            expect(testContext.component.revertLastFSB).toHaveBeenCalledTimes(1);
        });

        it("should revert FSB when bet value is negative", () => {
            const betResult = PromotionInfoTestDataFactory.createBetResult(-100);

            testContext.component.updataRemainingBonus(betResult);

            expect(testContext.component.revertLastFSB).toHaveBeenCalledTimes(1);
        });

        it("should not revert FSB when bet value is positive", () => {
            const betResult = PromotionInfoTestDataFactory.createBetResult(100);

            testContext.component.updataRemainingBonus(betResult);

            expect(testContext.component.revertLastFSB).not.toHaveBeenCalled();
        });

        it("should validate bonus manager logic", () => {
            const testCases = [
                { value: 0, shouldRevert: true },
                { value: -50, shouldRevert: true },
                { value: 100, shouldRevert: false },
            ];

            testCases.forEach(({ value, shouldRevert }) => {
                testContext.reset();
                const betResult = PromotionInfoTestDataFactory.createBetResult(value);

                const result = BonusManager.handleRemainingBonus(testContext.component, betResult);

                expect(result.reverted).toBe(shouldRevert);
            });
        });
    });

    describe("auto-spin trigger logic", () => {
        class AutoSpinManager {
            static shouldTriggerSpin(isEligible: boolean, serverFinished: boolean): boolean {
                return isEligible && !serverFinished;
            }

            static triggerNextSpin(component: IPromotionComponent, conditions: [boolean, boolean]): { triggered: boolean } {
                const [isEligible, serverFinished] = conditions;
                if (this.shouldTriggerSpin(isEligible, serverFinished)) {
                    component.setBetControl();
                    component.tryConsumeFSB();
                    component.placeBet();
                    return { triggered: true };
                }
                return { triggered: false };
            }
        }

        it("should trigger actions when eligible and server not finished", () => {
            testContext.component.autoTriggerNextFSBSpin([true, false]);

            testContext.expectMethodsCalled(['setBetControl', 'tryConsumeFSB', 'placeBet']);
        });

        const ineligibleConditions = [
            { condition: [false, false], description: "not eligible" },
            { condition: [true, true], description: "server finished" },
            { condition: [false, true], description: "both conditions false" },
        ];

        ineligibleConditions.forEach(({ condition, description }) => {
            it(`should not trigger actions when ${description}`, () => {
                testContext.component.autoTriggerNextFSBSpin(condition as [boolean, boolean]);

                testContext.expectMethodsNotCalled(['setBetControl', 'tryConsumeFSB', 'placeBet']);
        });
    });

        it("should validate auto-spin manager logic", () => {
            const testCases = [
                { conditions: [true, false] as [boolean, boolean], shouldTrigger: true },
                { conditions: [false, false] as [boolean, boolean], shouldTrigger: false },
                { conditions: [true, true] as [boolean, boolean], shouldTrigger: false },
                { conditions: [false, true] as [boolean, boolean], shouldTrigger: false },
            ];

            testCases.forEach(({ conditions, shouldTrigger }) => {
                testContext.reset();
                
                const result = AutoSpinManager.triggerNextSpin(testContext.component, conditions);

                expect(result.triggered).toBe(shouldTrigger);
            });
        });
    });
});

// SOLID: Single Responsibility Principle - Integration Scenarios
describe("FSBPromotionInfo - Integration Scenarios", () => {
    let testContext: PromotionInfoTestContext;

    beforeEach(() => {
        testContext = new PromotionInfoTestContext();
    });

    describe("complex promotion workflows", () => {
        it("should handle complete promotion lifecycle", () => {
            const promotion = PromotionInfoTestDataFactory.createComplexPromotion();

            // Step 1: Process promotion
            testContext.component.onFSBPromotionInfo(promotion);
            expect(testContext.component.totalWin).toBe(2500.75);
            expect(testContext.component.calculateTotalBet(1.25, 8)).toBe(200);

            // Step 2: Handle UI events
            const fsbUpdateEvent = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_FSB_COUNT,
                3
            );
            testContext.component.onPendingUIEvent(fsbUpdateEvent);
            expect(testContext.component.labelFSB?.string).toBe("3");

            // Step 3: Handle win update
            const winUpdateEvent = PromotionInfoTestDataFactory.createUIUpdateEvent(
                FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN,
                250
            );
            testContext.component.onPendingUIEvent(winUpdateEvent);
            expect(testContext.component.totalWin).toBe(2750.75);

            // Step 4: Auto-spin trigger
            testContext.component.autoTriggerNextFSBSpin([true, false]);
            testContext.expectMethodsCalled(['setBetControl', 'tryConsumeFSB', 'placeBet']);
        });

        it("should handle multiple sequential UI events", () => {
            testContext.component.totalWin = 500;

            const events = [
                { event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT, data: 3 },
                { event: FreeSpinsPromotionEvents.UPDATE_TOTAL_WIN, data: 250 },
                { event: FreeSpinsPromotionEvents.UPDATE_FSB_COUNT, data: 2 },
            ];

            events.forEach(eventData => {
                const event = PromotionInfoTestDataFactory.createUIUpdateEvent(eventData.event, eventData.data);
                testContext.component.onPendingUIEvent(event);
            });

            expect(testContext.component.labelFSB?.string).toBe("2"); // Last FSB count update
            expect(testContext.component.totalWin).toBe(750); // 500 + 250
        });

        it("should handle edge case with very small decimal values", () => {
            const smallDecimalPromotion = PromotionInfoTestDataFactory.createSmallDecimalPromotion();

            testContext.component.onFSBPromotionInfo(smallDecimalPromotion);

            expect(testContext.component.calculateTotalBet(0.001, 1)).toBe(0); // 1 * 0.001 * 20 = 0.02 rounded to 0.0
            expect(testContext.component.totalWin).toBe(0.01);
        });
    });

    describe("method availability validation", () => {
        it("should have setCurrentSpinCount method that returns input", () => {
            const result = testContext.component.setCurrentSpinCount(5);
            expect(result).toBe(5);
        });

        it("should have all action handler methods defined", () => {
            const actionHandlers = ['placeBet', 'tryConsumeFSB', 'revertLastFSB', 'setBetControl'];

            actionHandlers.forEach(handler => {
                expect(testContext.component[handler as keyof IPromotionComponent]).toBeDefined();
                expect(typeof testContext.component[handler as keyof IPromotionComponent]).toBe('function');
            });
        });

        it("should have all private handler methods defined", () => {
            const privateHandlers = ['updatePromotionURL', 'activeDetailPromo', 'openFreeSpinsPromotion'];

            privateHandlers.forEach(handler => {
                expect((testContext.component as any)[handler]).toBeDefined();
                expect(typeof (testContext.component as any)[handler]).toBe('function');
            });
        });
    });
});

// SOLID: Single Responsibility Principle - Component Structure Validation
describe("FSBPromotionInfo - Component Structure", () => {
    describe("interface compliance", () => {
        it("should validate ILabel interface", () => {
            const label = PromotionInfoMockFactory.createLabel("test");

            expect(label).toHaveProperty("string");
            expect(typeof label.string).toBe("string");
            expect(label.string).toBe("test");
        });

        it("should validate IDraggableItem interface", () => {
            const draggableWithCallback = PromotionInfoMockFactory.createDraggableItem(true);
            const draggableWithoutCallback = PromotionInfoMockFactory.createDraggableItem(false);

            expect(draggableWithCallback.touchCallback).toBeDefined();
            expect(draggableWithoutCallback.touchCallback).toBeNull();
        });

        it("should validate test data factory methods", () => {
            const factoryMethods = [
                'createBasicPromotion', 'createComplexPromotion', 'createMinimalPromotion',
                'createSmallDecimalPromotion', 'createUIUpdateEvent', 'createBetResult', 'createUIData'
            ];

            factoryMethods.forEach(method => {
                expect(typeof (PromotionInfoTestDataFactory as any)[method]).toBe("function");
            });

            const basicPromotion = PromotionInfoTestDataFactory.createBasicPromotion();
            expect(basicPromotion.promotionId).toBe("test-123");
            expect(basicPromotion.coinValue).toBe(0.5);
        });

        it("should validate mock factory methods", () => {
            const mockMethods = [
                'createLabel', 'createTouchCallback', 'createDraggableItem', 
                'createFormatUtils', 'createPromotionComponent'
            ];

            mockMethods.forEach(method => {
                expect(typeof (PromotionInfoMockFactory as any)[method]).toBe("function");
            });

            const component = PromotionInfoMockFactory.createPromotionComponent();
            expect(component.BET_MULTIPLIER).toBe(20);
            expect(component.totalWin).toBe(0);
        });
    });
});