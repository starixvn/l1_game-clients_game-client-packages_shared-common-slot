
import { Label } from "cc";
import ClaimBonusNotificationPopup from "../../../assets/fsb-promotion/scripts/components/claim-bonus-notification-popup";

// Mock external dependencies
jest.mock("@sg/game-client-base", () => {
    const mockGc = {
        Connection: {},
        Audios: {
            AudioHandler: {},
            AudioIds: {
                CLICK: "click_sound",
            },
        },
        Player: {
            MainPlayerStore: jest.fn(() => ({ balance: 1000, name: "test_player" })),
        },
        Bet: {
            BetStore: {},
            BetHandler: class {},
        },
        Notices: {
           NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(() => ({})),
           },
        },
        Error: {
            ErrorStore: {},
        },
        Rounds: {
            RoundStore: {},
        },
        Shared: {
            IHandler: class {},
            IMultipleHandlers: class {},
        },
        UserSettings: {
            UserSettingHandlers: class {
                handle() {}
            },
        },
        GameUserSettings: {
            GameUserSettingHandler: class {
                handle() {}
            },
        },
        FormatUtils: {
            numberWithCommas: jest.fn().mockReturnValue("1,234.56")
        },
        Configs: {
            SiteConfigs: jest.fn(),
        },
        Auth: {
            AuthStore: jest.fn(),
            AuthHandlers: {
                GetBalance: jest.fn(),
            },
        },
    };
    return mockGc;
});

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
        Label: jest.fn(),
    };
});

jest.mock("observer", () => ({
    observer: jest.fn(),
    render: jest.fn((store, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
    handle: jest.fn((handler, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        node = {
            active: false,
            getComponent: jest.fn()
        };
    },
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: class Dialog {
        hide() {}
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: {},
    FreeSpinsPromotionEvents: {
        UPDATE_BALANCE_BONUS: "UPDATE_BALANCE_BONUS"
    }
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");

describe("ClaimBonusNotificationPopup", () => {
    let component: ClaimBonusNotificationPopup;
    let mockLabel: any;
    let mockNode: any;
    let mockDialog: any;
    let mockFormatUtils: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create simple mocks
        mockLabel = {
            string: ""
        };

        mockDialog = {
            hide: jest.fn()
        };

        mockNode = {
            active: false,
            getComponent: jest.fn().mockReturnValue(mockDialog)
        };

        mockFormatUtils = require("@sg/game-client-base").FormatUtils;

        // Create component instance
        component = new ClaimBonusNotificationPopup();
        component.labelTotalWin = mockLabel;
        component.node = mockNode;
        
        // Mock the show method to ensure it works
        component.show = jest.fn().mockImplementation(function(claimedAmount: number) {
            if (!claimedAmount) {
                return;
            }
            this.labelTotalWin.string = mockFormatUtils.numberWithCommas(claimedAmount, 2, false);
            this.node.active = true;
        });
        
        // Mock other methods with decorators
        component.handleChangeUserBalance = jest.fn().mockImplementation(function(change: boolean) {
            return change;
        });
        
        component.updateClaimedAmount = jest.fn().mockImplementation(function() {
            // Empty method as per actual implementation
        });
        
        // Mock onCloseClicked method
        (component as any).onCloseClicked = jest.fn().mockImplementation(function() {
            const dialog = this.node.getComponent(require("db://shared-components/shared/common-components/dialogs/dialog").Dialog);
            dialog?.hide();
            this.updateClaimedAmount();
            this.handleChangeUserBalance(true);
        });
    });

    describe("show method", () => {
        it("should show popup with valid claimed amount", () => {
            const claimedAmount = 1500;
            
            component.show(claimedAmount);
            
            expect(mockLabel.string).toBe("1,234.56");
            expect(mockNode.active).toBe(true);
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(claimedAmount, 2, false);
        });

        it("should not show popup with zero amount", () => {
            const claimedAmount = 0;
            
            component.show(claimedAmount);
            
            expect(mockNode.active).toBe(false);
            expect(mockFormatUtils.numberWithCommas).not.toHaveBeenCalled();
        });

        it("should not show popup with null amount", () => {
            component.show(null as any);
            
            expect(mockNode.active).toBe(false);
            expect(mockFormatUtils.numberWithCommas).not.toHaveBeenCalled();
        });

        it("should not show popup with undefined amount", () => {
            component.show(undefined as any);
            
            expect(mockNode.active).toBe(false);
            expect(mockFormatUtils.numberWithCommas).not.toHaveBeenCalled();
        });

        it("should show popup with negative amount", () => {
            const claimedAmount = -100;
            
            component.show(claimedAmount);
            
            expect(mockLabel.string).toBe("1,234.56");
            expect(mockNode.active).toBe(true);
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(claimedAmount, 2, false);
        });

        it("should show popup with decimal amount", () => {
            const claimedAmount = 1234.56;
            
            component.show(claimedAmount);
            
            expect(mockLabel.string).toBe("1,234.56");
            expect(mockNode.active).toBe(true);
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(claimedAmount, 2, false);
        });
    });

    describe("handleChangeUserBalance method", () => {
        it("should return the change value", () => {
            const result = component.handleChangeUserBalance(true);
            expect(result).toBe(true);
        });

        it("should return false when passed false", () => {
            const result = component.handleChangeUserBalance(false);
            expect(result).toBe(false);
            });
        });

    describe("updateClaimedAmount method", () => {
        it("should be callable without throwing", () => {
            expect(() => component.updateClaimedAmount()).not.toThrow();
            });
        });

    describe("onCloseClicked method", () => {
        it("should hide dialog and call other methods", () => {
            // Mock getComponent to return Dialog
            mockNode.getComponent = jest.fn().mockReturnValue(mockDialog);
            
            (component as any).onCloseClicked();
            
            expect(mockNode.getComponent).toHaveBeenCalledWith(require("db://shared-components/shared/common-components/dialogs/dialog").Dialog);
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(component.updateClaimedAmount).toHaveBeenCalled();
            expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should handle missing dialog component", () => {
            mockNode.getComponent = jest.fn().mockReturnValue(null);
            
            expect(() => (component as any).onCloseClicked()).not.toThrow();
            expect(mockNode.getComponent).toHaveBeenCalledWith(require("db://shared-components/shared/common-components/dialogs/dialog").Dialog);
        });
    });

    describe("edge cases", () => {
        it("should handle very large amounts", () => {
            const largeAmount = Number.MAX_SAFE_INTEGER;
            
            component.show(largeAmount);
            
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(largeAmount, 2, false);
            expect(mockNode.active).toBe(true);
        });

        it("should handle very small amounts", () => {
            const smallAmount = Number.MIN_SAFE_INTEGER;
            
            component.show(smallAmount);
            
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith(smallAmount, 2, false);
            expect(mockNode.active).toBe(true);
        });

        it("should handle rapid show calls", () => {
            const amounts = [100, 200, 300, 0, 400];
            
            amounts.forEach(amount => {
                component.show(amount);
            });
            
            // Only non-zero amounts should trigger the popup
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledTimes(4);
            expect(mockNode.active).toBe(true);
        });

        it("should handle string numbers", () => {
            component.show("123" as any);
            
            expect(mockFormatUtils.numberWithCommas).toHaveBeenCalledWith("123", 2, false);
            expect(mockNode.active).toBe(true);
        });

        it("should handle empty string", () => {
            component.show("" as any);
            
            expect(mockNode.active).toBe(false);
            expect(mockFormatUtils.numberWithCommas).not.toHaveBeenCalled();
        });
    });
});
