import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import PromotionEndPopup from "../../../assets/fsb-promotion/scripts/components/promotion-end-popup";
import { Node, Label, Button } from "cc";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";
import { Auth } from "@sg/game-client-base";

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
    Node: jest.fn(),
    Label: jest.fn(),
    Button: jest.fn(),
    Vec3: {
        ZERO: { x: 0, y: 0, z: 0 },
        ONE: { x: 1, y: 1, z: 1 },
    },
    tween: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        call: jest.fn().mockReturnThis(),
        start: jest.fn(),
    })),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
    Component: jest.fn(),
    UITransform: jest.fn(),
    Widget: jest.fn(),
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
    }
}));
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {},
}));
jest.mock("db://i18n/LanguageData");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers");
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));
jest.mock("../../../assets/game-message-slot");
jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");

// Mock cascading slot dependencies
jest.mock("db://shared-cascading-slot/stores/cascading-ui-store");
jest.mock("db://shared-cascading-slot/cascading-slot-utils", () => ({
    globalEmitter: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    },
    SlotClientEvent: {},
    SlotNotification: {},
}));

describe("PromotionEndPopup", () => {
    let component: PromotionEndPopup;
    let mockNode: any;
    let mockLabelTitle: any;
    let mockLabelMainMessage: any;
    let mockLabelSubMessage: any;
    let mockLabelTotalWin: any;
    let mockCloseButton: any;
    let mockDialog: any;
    
    beforeEach(() => {
        // Reset static property
        PromotionEndPopup.hasShown = false;
        
        // Create mock components
        mockLabelTitle = {
            string: ""
        };
        mockLabelMainMessage = {
            string: ""
        };
        mockLabelSubMessage = {
            string: ""
        };
        mockLabelTotalWin = {
            string: ""
        };
        mockCloseButton = {};
        
        mockDialog = {
            hide: jest.fn()
        };
        
        mockNode = {
            active: false,
            getComponent: jest.fn().mockReturnValue(mockDialog)
        };

        // Create component instance
        component = new PromotionEndPopup();
        component.node = mockNode;
        component.labelTitle = mockLabelTitle;
        component.labelMainMessage = mockLabelMainMessage;
        component.labelSubMessage = mockLabelSubMessage;
        component.labelTotalWin = mockLabelTotalWin;
        component.closeButton = mockCloseButton;
        
        // Mock methods that will be handled by decorators
        component.closeFSBBanner = jest.fn();
        component.onDestroy = jest.fn();
        (component as any).openTurnOverRequired = jest.fn();
        
        // Mock gc.FormatUtils
        const gc = require("@sg/game-client-base");
        if (!gc.FormatUtils) {
            gc.FormatUtils = {};
        }
        gc.FormatUtils.numberWithCommas = jest.fn().mockReturnValue("1,000.00");
        
        // Mock i18n
        const i18n = require("db://i18n/LanguageData");
        i18n.t = jest.fn().mockImplementation((key) => key);
    });

    describe("updateCurrentSpinCount", () => {
        it("should update currentSpinCount property", () => {
            // Act
            component.updateCurrentSpinCount(5);

            // Assert
            expect(component['currentSpinCount']).toBe(5);
        });
    });

    describe("show", () => {
        it("should return early when finishPromotion is null", () => {
            // Act
            component.show(null);

            // Assert
            expect(PromotionEndPopup.hasShown).toBe(false);
            expect(mockNode.active).toBe(false);
            expect(component.closeFSBBanner).not.toHaveBeenCalled();
        });

        it("should return early when finishPromotion is undefined", () => {
            // Act
            component.show(undefined);

            // Assert
            expect(PromotionEndPopup.hasShown).toBe(false);
            expect(mockNode.active).toBe(false);
            expect(component.closeFSBBanner).not.toHaveBeenCalled();
        });

        it("should set hasShown to true and activate node when finishPromotion is valid", () => {
            // Arrange
            const finishPromotion: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 1000,
                endPromotion: false
            };
            const gc = require("@sg/game-client-base");

            // Act
            component.show(finishPromotion);

            // Assert
            expect(PromotionEndPopup.hasShown).toBe(true);
            expect(mockNode.active).toBe(true);
            expect(component.closeFSBBanner).toHaveBeenCalled();
            expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(1000, 2, false);
            expect(mockLabelTotalWin.string).toBe("1,000.00");
        });
        
        it("should format totalWin correctly", () => {
            // Arrange
            const finishPromotion: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 2500.5,
                endPromotion: false
            };
            const gc = require("@sg/game-client-base");
            gc.FormatUtils.numberWithCommas.mockReturnValue("2,500.50");

            // Act
            component.show(finishPromotion);

            // Assert
            expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(2500.5, 2, false);
            expect(mockLabelTotalWin.string).toBe("2,500.50");
        });
    });

    describe("setupContent", () => {
        const i18n = require("db://i18n/LanguageData");
        
        beforeEach(() => {
            i18n.t.mockImplementation((key) => key);
        });

        it("should setup content for win with all spins used", () => {
            // Arrange
            component['currentSpinCount'] = 0; // All spins used
            
            // Act
            component['setupContent'](1000);

            // Assert
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_notification_para1a");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_message");
            expect(mockLabelTitle.string).toBe("FREESPINBONUS.FSB_NOTIFICATION_PARA1A");
            expect(mockLabelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification");
            expect(mockLabelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_message");
        });

        it("should setup content for win with remaining spins", () => {
            // Arrange
            component['currentSpinCount'] = 3; // Spins remaining
            
            // Act
            component['setupContent'](500);

            // Assert
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
            expect(mockLabelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS");
            expect(mockLabelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(mockLabelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });

        it("should setup content for zero win with all spins used", () => {
            // Arrange
            component['currentSpinCount'] = 0; // All spins used
            
            // Act
            component['setupContent'](0);

            // Assert
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_zero_win");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_zero_win_message");
            expect(mockLabelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_ZERO_WIN");
            expect(mockLabelMainMessage.string).toBe(""); // Main message is empty for zero win all used
            expect(mockLabelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_zero_win_message");
        });

        it("should setup content for zero win with remaining spins", () => {
            // Arrange
            component['currentSpinCount'] = 2; // Spins remaining
            
            // Act
            component['setupContent'](0);

            // Assert
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(i18n.t).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
            expect(mockLabelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS");
            expect(mockLabelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(mockLabelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });

        it("should uppercase the title text", () => {
            // Arrange
            component['currentSpinCount'] = 0;
            i18n.t.mockReturnValue("test title");
            
            // Act
            component['setupContent'](100);

            // Assert
            expect(mockLabelTitle.string).toBe("TEST TITLE");
        });

        it("should handle empty main message correctly", () => {
            // Arrange
            component['currentSpinCount'] = 0;
            
            // Act
            component['setupContent'](0); // Zero win with all spins used has empty main message

            // Assert
            expect(mockLabelMainMessage.string).toBe("");
        });

        it("should handle empty sub message correctly", () => {
            // Arrange
            component['currentSpinCount'] = 0;
            i18n.t.mockImplementation((key) => {
                if (key === "FreeSpinBonus.FSB_end_notification_message") return "";
                return key;
            });
            
            // Act
            component['setupContent'](100);

            // Assert
            expect(mockLabelSubMessage.string).toBe("");
        });
    });

    describe("onCloseClicked", () => {
        it("should hide dialog when dialog component exists", () => {
            // Act
            component['onCloseClicked']();

            // Assert
            expect(mockNode.getComponent).toHaveBeenCalled();
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(component['openTurnOverRequired']).toHaveBeenCalled();
        });

        it("should handle case when dialog component is null", () => {
            // Arrange
            mockNode.getComponent.mockReturnValue(null);

            // Act & Assert - should not throw
            expect(() => component['onCloseClicked']()).not.toThrow();
            expect(component['openTurnOverRequired']).toHaveBeenCalled();
        });

        it("should always call openTurnOverRequired", () => {
            // Act
            component['onCloseClicked']();

            // Assert
            expect(component['openTurnOverRequired']).toHaveBeenCalled();
        });
    });

    describe("static hasShown property", () => {
        it("should initialize as false", () => {
            // Assert
            expect(PromotionEndPopup.hasShown).toBe(false);
        });

        it("should be set to true when show is called with valid data", () => {
            // Arrange
            const finishPromotion: GameServiceMessageSlot.FinishPromotion = {
                totalWin: 100,
                endPromotion: false
            };

            // Act
            component.show(finishPromotion);

            // Assert
            expect(PromotionEndPopup.hasShown).toBe(true);
        });

        it("should remain false when show is called with null data", () => {
            // Act
            component.show(null);

            // Assert
            expect(PromotionEndPopup.hasShown).toBe(false);
        });
    });

    describe("component properties", () => {
        it("should have all required label properties", () => {
            expect(component.labelTitle).toBeDefined();
            expect(component.labelMainMessage).toBeDefined();
            expect(component.labelSubMessage).toBeDefined();
            expect(component.labelTotalWin).toBeDefined();
        });

        it("should have closeButton property", () => {
            expect(component.closeButton).toBeDefined();
        });

        it("should have currentSpinCount initialized to 0", () => {
            const newComponent = new PromotionEndPopup();
            expect(newComponent['currentSpinCount']).toBe(0);
        });
    });
});
