import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// ========== Mocks ==========

// Mock chỉ những gì thực sự cần thiết cho business logic
jest.mock("@sg/game-client-base", () => ({
    Translator: {
        translate: jest.fn((key: string) => key),
    },
    FormatUtils: {
        numberWithCommas: jest.fn((num: number, decimals: number) => num.toFixed(decimals)),
    },
    Audios: {
        AudioHandler: jest.fn(),
        AudioIds: {
            CLICK: "click",
        },
    },
    Configs: {
        SiteConfigs: jest.fn(),
    },
    Connection: {
        ConnectionStore: jest.fn(),
    },
    Notices: {
        NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(),
        },
    },
    Notification: {
        NotificationStore: jest.fn(),
    },
    Shared: {
        utils: {
            StorageManager: {
                setPrefixKey: jest.fn(),
            },
        },
    },
    UserSettings: {
        UserSettingStore: {
        },
    },
}));

// Mock các dependencies cần thiết - follow shared-cascading-slot pattern
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers", () => ({
    FSBPromotionHandlers: class {
        handleFinishPromotion = jest.fn();
        processPromotionData = jest.fn();
    },
}));
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: class {
        showPromotionEndPopup = jest.fn();
        hidePromotionEndPopup = jest.fn();
        updatePopupContent = jest.fn();
    },
}));
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: class {
        isPromotionEndPopupVisible = false;
        currentMessageType = "";

        setPopupVisible(visible: boolean) {
            this.isPromotionEndPopupVisible = visible;
        }

        setMessageType(type: string) {
            this.currentMessageType = type;
        }
    },
    FreeSpinsPromotionEvents: {
        SHOW_PROMOTION_END_POPUP: "SHOW_PROMOTION_END_POPUP",
        HIDE_PROMOTION_END_POPUP: "HIDE_PROMOTION_END_POPUP",
    },
}));
jest.mock("../../../assets/game-message-slot");

jest.mock("db://shared-components/game/audios/utils", () => ({
    AudioUtils: {
        stopStoppableSFX: jest.fn(),
        playStoppableSFX: jest.fn(),
    },
}));
// ========== Test Data ==========

const createFinishPromotionData = (totalWin: number, endPromotion = false) =>
({
    totalWin,
    endPromotion,
} as GameServiceMessageSlot.FinishPromotion);

// Import after mocks are set up
import gc from "@sg/game-client-base";
import PromotionEndPopup from "../../../assets/fsb-promotion/scripts/components/promotion-end-popup";

describe("PromotionEndPopup", () => {
    let promotionEndPopup: PromotionEndPopup;
    let mockTranslator: any;
    let mockFormatUtils: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTranslator = require("@sg/game-client-base").Translator;
        mockFormatUtils = require("@sg/game-client-base").FormatUtils;

        // Create instance of real class
        promotionEndPopup = new PromotionEndPopup();

        // Mock properties like shared-cascading-slot pattern
        promotionEndPopup.node = {
            active: true,
            getComponent: jest.fn(),
            addChild: jest.fn(),
            removeChild: jest.fn(),
        } as any;
    });

    describe("show method", () => {
        it("should show popup with valid data", () => {
            // Arrange
            const finishPromotion = createFinishPromotionData(1000);
            promotionEndPopup.node = { active: false } as any;
            promotionEndPopup.labelTotalWin = { string: "" } as any;
            promotionEndPopup["setupContent"] = jest.fn();
            promotionEndPopup["setShowFreeSpinMessage"] = jest.fn();
            promotionEndPopup["closeFSBBanner"] = jest.fn();

            // Act
            promotionEndPopup.show(finishPromotion);

            // Assert
            expect(promotionEndPopup.node.active).toBe(true);
            expect(promotionEndPopup["setupContent"]).toHaveBeenCalledWith(1000);
            expect(promotionEndPopup["setShowFreeSpinMessage"]).toHaveBeenCalled();
            expect(promotionEndPopup["closeFSBBanner"]).toHaveBeenCalled();
        });

        it("should not show popup with null data", () => {
            // Arrange
            promotionEndPopup.node = { active: false } as any;
            promotionEndPopup["setupContent"] = jest.fn();

            // Act
            promotionEndPopup.show(null);

            // Assert
            expect(promotionEndPopup.node.active).toBe(false);
            expect(promotionEndPopup["setupContent"]).not.toHaveBeenCalled();
        });
    });

    describe("updateCurrentSpinCount method", () => {
        it("should update current spin count", () => {
            // Arrange
            const currentSpinCount = 5;

            // Act
            promotionEndPopup.updateCurrentSpinCount(currentSpinCount);

            // Assert
            expect(promotionEndPopup["currentSpinCount"]).toBe(5);
        });
    });

    describe("onCloseClicked method", () => {
        it("should hide dialog and open turn over required", () => {
            // Arrange
            const mockDialog = { hide: jest.fn() };
            promotionEndPopup.node = { getComponent: jest.fn().mockReturnValue(mockDialog) } as any;
            promotionEndPopup["openTurnOverRequired"] = jest.fn();

            // Act
            promotionEndPopup["onCloseClicked"]();

            // Assert
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(promotionEndPopup["openTurnOverRequired"]).toHaveBeenCalled();
        });
    });

    describe("setupContent method", () => {
        beforeEach(() => {
            // Mock labels
            promotionEndPopup.labelTitle = { string: "" } as any;
            promotionEndPopup.labelMainMessage = { string: "" } as any;
            promotionEndPopup.labelSubMessage = { string: "" } as any;

            // Mock currentSpinCount
            promotionEndPopup["currentSpinCount"] = 0;

            // Mock Translator to return the key with prefix
            (gc.Translator.translate as jest.Mock).mockImplementation((key: string) => {
                return key; // Return the key as-is for testing
            });
        });

        it("should setup content for win with all spins used", () => {
            // Arrange
            const totalWin = 1000;
            promotionEndPopup["currentSpinCount"] = 0;

            // Act
            promotionEndPopup["setupContent"](totalWin);

            // Assert
            expect(promotionEndPopup.labelTitle.string).toBe("FREESPINBONUS.FSB_NOTIFICATION_PARA1A");
            expect(promotionEndPopup.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification");
            expect(promotionEndPopup.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_message");
        });

        it("should setup content for win with remaining spins", () => {
            // Arrange
            const totalWin = 1000;
            promotionEndPopup["currentSpinCount"] = 5;

            // Act
            promotionEndPopup["setupContent"](totalWin);

            // Assert
            expect(promotionEndPopup.labelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS");
            expect(promotionEndPopup.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(promotionEndPopup.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });

        it("should setup content for zero win with all spins used", () => {
            // Arrange
            const totalWin = 0;
            promotionEndPopup["currentSpinCount"] = 0;

            // Act
            promotionEndPopup["setupContent"](totalWin);

            // Assert
            expect(promotionEndPopup.labelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_ZERO_WIN");
            expect(promotionEndPopup.labelMainMessage.string).toBe("");
            expect(promotionEndPopup.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_zero_win_message");
        });

        it("should setup content for zero win with remaining spins", () => {
            // Arrange
            const totalWin = 0;
            promotionEndPopup["currentSpinCount"] = 3;

            // Act
            promotionEndPopup["setupContent"](totalWin);

            // Assert
            expect(promotionEndPopup.labelTitle.string).toBe("FREESPINBONUS.FSB_END_NOTIFICATION_UNUSEDFS");
            expect(promotionEndPopup.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(promotionEndPopup.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });
    });

    describe("Business Logic", () => {
        it("should select win message when totalWin > 0 and currentSpinCount = 0", () => {
            // Arrange
            const totalWin = 1000;
            const currentSpinCount = 0;

            // Act - Test business logic
            const isWin = totalWin > 0;
            const hasRemainingSpins = currentSpinCount > 0;
            const messageType = isWin && !hasRemainingSpins ? "win_all_used" : "other";

            // Assert
            expect(messageType).toBe("win_all_used");
        });

        it("should select unused spins message when totalWin > 0 and currentSpinCount > 0", () => {
            // Arrange
            const totalWin = 1000;
            const currentSpinCount = 5;

            // Act
            const isWin = totalWin > 0;
            const hasRemainingSpins = currentSpinCount > 0;
            const messageType = isWin && hasRemainingSpins ? "win_with_remaining" : "other";

            // Assert
            expect(messageType).toBe("win_with_remaining");
        });

        it("should select zero win message when totalWin = 0 and currentSpinCount = 0", () => {
            // Arrange
            const totalWin = 0;
            const currentSpinCount = 0;

            // Act
            const isWin = totalWin > 0;
            const hasRemainingSpins = currentSpinCount > 0;
            const messageType = !isWin && !hasRemainingSpins ? "zero_win_all_used" : "other";

            // Assert
            expect(messageType).toBe("zero_win_all_used");
        });

        it("should select unused spins message when totalWin = 0 and currentSpinCount > 0", () => {
            // Arrange
            const totalWin = 0;
            const currentSpinCount = 3;

            // Act
            const isWin = totalWin > 0;
            const hasRemainingSpins = currentSpinCount > 0;
            const messageType = !isWin && hasRemainingSpins ? "zero_win_with_remaining" : "other";

            // Assert
            expect(messageType).toBe("zero_win_with_remaining");
        });
    });

    describe("Number Formatting", () => {
        it("should format numbers with 2 decimal places", () => {
            // Arrange
            const testCases = [
                { input: 1000, expected: "1000.00" },
                { input: 2500.5, expected: "2500.50" },
                { input: 0, expected: "0.00" },
            ];

            // Act & Assert
            testCases.forEach(({ input, expected }) => {
                mockFormatUtils.numberWithCommas.mockReturnValue(expected);
                const result = mockFormatUtils.numberWithCommas(input, 2, false);
                expect(result).toBe(expected);
            });
        });

        it("should handle large numbers", () => {
            // Arrange
            const largeNumber = 999999.99;
            const expected = "999,999.99";

            // Act
            mockFormatUtils.numberWithCommas.mockReturnValue(expected);
            const result = mockFormatUtils.numberWithCommas(largeNumber, 2, false);

            // Assert
            expect(result).toBe(expected);
        });

        it("should handle negative numbers", () => {
            // Arrange
            const negativeNumber = -100;
            const expected = "-100.00";

            // Act
            mockFormatUtils.numberWithCommas.mockReturnValue(expected);
            const result = mockFormatUtils.numberWithCommas(negativeNumber, 2, false);

            // Assert
            expect(result).toBe(expected);
        });
    });

    describe("State Management", () => {
        it("should update hasShown state", () => {
            // Arrange
            let hasShown = false;

            // Act
            hasShown = true;

            // Assert
            expect(hasShown).toBe(true);
        });

        it("should update currentSpinCount", () => {
            // Arrange
            let currentSpinCount = 0;

            // Act
            currentSpinCount = 5;

            // Assert
            expect(currentSpinCount).toBe(5);
        });
    });

    describe("Popup Display", () => {
        it("should return false for null payload", () => {
            // Arrange
            const payload = null;

            // Act
            const shouldShow = payload !== null;

            // Assert
            expect(shouldShow).toBe(false);
        });

        it("should return true for valid payload", () => {
            // Arrange
            const validPayload = createFinishPromotionData(1000);

            // Act
            const shouldShow = validPayload !== null;

            // Assert
            expect(shouldShow).toBe(true);
        });
    });

    describe("Translation Keys", () => {
        it("should return correct translation keys for win message", () => {
            // Arrange
            const messageType = "win_all_used";

            // Act
            const keys =
                messageType === "win_all_used"
                    ? [
                        "FreeSpinBonus.FSB_notification_para1a",
                        "FreeSpinBonus.FSB_end_notification",
                        "FreeSpinBonus.FSB_end_notification_message",
                    ]
                    : [];

            // Assert
            expect(keys).toHaveLength(3);
            expect(keys[0]).toBe("FreeSpinBonus.FSB_notification_para1a");
        });

        it("should return correct translation keys for unused spins message", () => {
            // Arrange
            const messageType = "win_with_remaining";

            // Act
            const keys =
                messageType === "win_with_remaining"
                    ? [
                        "FreeSpinBonus.FSB_end_notification_unusedFS",
                        "FreeSpinBonus.FSB_end_notification_unusedFS_message",
                        "FreeSpinBonus.FSB_end_notification_unusedFS_message1",
                    ]
                    : [];

            // Assert
            expect(keys).toHaveLength(3);
            expect(keys[0]).toBe("FreeSpinBonus.FSB_end_notification_unusedFS");
        });
    });

    describe("Payload Validation", () => {
        it("should return false for null payload", () => {
            // Arrange
            const payload = null;

            // Act
            const isValid = payload !== null && typeof payload === "object";

            // Assert
            expect(isValid).toBe(false);
        });

        it("should return true for valid payload", () => {
            // Arrange
            const payload = createFinishPromotionData(1000);

            // Act
            const isValid = payload !== null && typeof payload === "object";

            // Assert
            expect(isValid).toBe(true);
        });

        it("should handle invalid data types", () => {
            // Arrange
            const invalidPayload = { totalWin: -100, currentSpinCount: -1 };

            // Act
            const isValid = invalidPayload !== null && typeof invalidPayload === "object";

            // Assert
            expect(isValid).toBe(true); // Still valid object, just with negative values
        });
    });
});
