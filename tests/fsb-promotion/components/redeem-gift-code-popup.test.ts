import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RedeemGiftCodePopup } from "../../../assets/fsb-promotion/scripts/components/redeem-gift-code-popup";

// Mock external dependencies
jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => (target: any) => target),
        property: jest.fn(() => (target: any, propertyKey: string) => {}),
    },
    EditBox: jest.fn(),
    Label: jest.fn(),
    sys: {
        isMobile: false,
    },
    Node: jest.fn(),
    Component: class MockComponent {
        node = { getComponent: jest.fn() };
        onLoad() {}
        onDestroy() {}
        start() {}
        update() {}
        schedule = jest.fn();
        scheduleOnce = jest.fn();
        unschedule = jest.fn();
        unscheduleAllCallbacks = jest.fn();
    },
}));

// Mock navigator.clipboard
Object.defineProperty(global, 'navigator', {
    value: {
        clipboard: {
            readText: jest.fn(),
        },
    },
    writable: true,
});

// Mock window.dispatchEvent
Object.defineProperty(global, 'window', {
    value: {
        dispatchEvent: jest.fn(),
    },
    writable: true,
});

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: jest.fn(),
}));

jest.mock("observer", () => ({
    render: jest.fn(() => (target: any, propertyKey: string) => {}),
    handle: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

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
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

jest.mock("db://shared-components/shared/utils", () => ({
    FunctionUtils: {
        isPortraitMode: jest.fn(() => false),
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FreeSpinsPromotionEvents: {
        REDEMPTION_NOTICE: "REDEMPTION_NOTICE",
    },
    FSBPromotionUIStore: jest.fn(),
}));


describe("RedeemGiftCodePopup", () => {
    let redeemGiftCodePopup: RedeemGiftCodePopup;
    let mockGiftCodeInput: any;
    let mockErrorLabel: any;
    let mockContentNode: any;
    let mockDialog: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockGiftCodeInput = {
            string: "",
        };

        mockErrorLabel = {
            string: "",
        };

        mockContentNode = {
            position: { y: 100 },
            y: 100,
        };

        mockDialog = {
            hide: jest.fn(),
        };

        // Create mock node
        const mockNode = {
            getComponent: jest.fn().mockReturnValue(mockDialog),
        };

        // Create component instance
        redeemGiftCodePopup = new RedeemGiftCodePopup();
        
        // Manually inject the mocked dependencies
        (redeemGiftCodePopup as any).giftCodeInput = mockGiftCodeInput;
        (redeemGiftCodePopup as any).errorLabel = mockErrorLabel;
        (redeemGiftCodePopup as any).contentNode = mockContentNode;
        (redeemGiftCodePopup as any).node = mockNode;
        (redeemGiftCodePopup as any).scheduleOnce = jest.fn();
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(redeemGiftCodePopup).toBeInstanceOf(RedeemGiftCodePopup);
        });

        it("should have required properties", () => {
            expect(redeemGiftCodePopup).toHaveProperty("giftCodeInput");
            expect(redeemGiftCodePopup).toHaveProperty("errorLabel");
            expect(redeemGiftCodePopup).toHaveProperty("contentNode");
        });
    });
    describe("redeemGifCode method", () => {
        it("should return trimmed and uppercased gift code", () => {
            mockGiftCodeInput.string = "  test123  ";
            
            const result = redeemGiftCodePopup.redeemGifCode();
            
            expect(result).toBe("TEST123");
        });

        it("should handle empty input", () => {
            mockGiftCodeInput.string = "";
            
            const result = redeemGiftCodePopup.redeemGifCode();
            
            expect(result).toBe("");
        });

        it("should handle mixed case input", () => {
            mockGiftCodeInput.string = "aBc123DeF";
            
            const result = redeemGiftCodePopup.redeemGifCode();
            
            expect(result).toBe("ABC123DEF");
        });
    });

    describe("onClickRedeemGifCode method", () => {
        it("should call both redeem and reset functions", () => {
            const mockRedeemGifCode = jest.spyOn(redeemGiftCodePopup, 'redeemGifCode');
            const mockResetFSBRedemptionState = jest.fn();
            (redeemGiftCodePopup as any).resetFSBRedemptionState = mockResetFSBRedemptionState;
            
            redeemGiftCodePopup.onClickRedeemGifCode();
            
            expect(mockRedeemGifCode).toHaveBeenCalledTimes(1);
            expect(mockResetFSBRedemptionState).toHaveBeenCalledTimes(1);
        });
    });

    describe("onClosePopup method", () => {
        it("should not close popup when keyboard is open", () => {
            (redeemGiftCodePopup as any)._isKeyboardOpen = true;
            
            redeemGiftCodePopup.onClosePopup();
            
            expect(mockDialog.hide).not.toHaveBeenCalled();
        });

        it("should close popup when keyboard is closed", () => {
            (redeemGiftCodePopup as any)._isKeyboardOpen = false;
            
            redeemGiftCodePopup.onClosePopup();
            
            expect((redeemGiftCodePopup as any).node.getComponent).toHaveBeenCalledWith(expect.any(Function));
            expect(mockDialog.hide).toHaveBeenCalledTimes(1);
        });

        it("should handle null dialog component safely", () => {
            (redeemGiftCodePopup as any).node.getComponent = jest.fn().mockReturnValue(null);
            (redeemGiftCodePopup as any)._isKeyboardOpen = false;
            
            expect(() => redeemGiftCodePopup.onClosePopup()).not.toThrow();
        });
    });

    describe("renderRedeemSuccess method", () => {
        it("should close popup when redemption is successful", () => {
            const mockOnClosePopup = jest.spyOn(redeemGiftCodePopup, 'onClosePopup');
            (redeemGiftCodePopup as any).isRedeemSuccess = true;
            
            redeemGiftCodePopup.renderRedeemSuccess(true);
            
            expect(mockOnClosePopup).toHaveBeenCalledTimes(1);
        });

        it("should not close popup when redemption fails", () => {
            const mockOnClosePopup = jest.spyOn(redeemGiftCodePopup, 'onClosePopup');
            (redeemGiftCodePopup as any).isRedeemSuccess = false;
            
            redeemGiftCodePopup.renderRedeemSuccess(false);
            
            expect(mockOnClosePopup).not.toHaveBeenCalled();
        });
    });

    describe("onPasteClicked method", () => {
        beforeEach(() => {
            // Mock navigator.clipboard for each test
            Object.defineProperty(global, 'navigator', {
                value: {
                    clipboard: {
                        readText: jest.fn(),
                    },
                },
                writable: true,
            });
        });

        it("should handle successful clipboard read", async () => {
            const mockReadText = jest.fn() as jest.MockedFunction<() => Promise<string>>;
            mockReadText.mockResolvedValue("PASTE123");
            (global.navigator.clipboard as any).readText = mockReadText;
            
            await redeemGiftCodePopup.onPasteClicked();
            
            expect(mockGiftCodeInput.string).toBe("PASTE123");
        });

        it("should handle clipboard read failure gracefully", async () => {
            const mockReadText = jest.fn() as jest.MockedFunction<() => Promise<string>>;
            mockReadText.mockRejectedValue(new Error("Clipboard access denied"));
            (global.navigator.clipboard as any).readText = mockReadText;
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            
            await redeemGiftCodePopup.onPasteClicked();
            
            expect(mockGiftCodeInput.string).toBe("");
            expect(consoleSpy).toHaveBeenCalledWith("Clipboard read failed", expect.any(Error));
            
            consoleSpy.mockRestore();
        });

        it("should trim and convert clipboard text to uppercase", async () => {
            const mockReadText = jest.fn() as jest.MockedFunction<() => Promise<string>>;
            mockReadText.mockResolvedValue("  paste456  ");
            (global.navigator.clipboard as any).readText = mockReadText;
            
            await redeemGiftCodePopup.onPasteClicked();
            
            expect(mockGiftCodeInput.string).toBe("PASTE456");
        });

        it("should handle empty clipboard text", async () => {
            const mockReadText = jest.fn() as jest.MockedFunction<() => Promise<string>>;
            mockReadText.mockResolvedValue("");
            (global.navigator.clipboard as any).readText = mockReadText;
            
            await redeemGiftCodePopup.onPasteClicked();
            
            expect(mockGiftCodeInput.string).toBe("");
        });
    });

    describe("onEditBoxFocus method", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should schedule mobile keyboard adjustment when mobile and not portrait", () => {
            const mockSetTimeout = jest.spyOn(global, 'setTimeout');
            const mockDispatchEvent = jest.fn();
            (global as any).window = { dispatchEvent: mockDispatchEvent };
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = true;
            
            // Mock FunctionUtils.isPortraitMode to return false
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(false);
            
            redeemGiftCodePopup.onEditBoxFocus();
            
            expect(mockSetTimeout).toHaveBeenCalled();
            
            // Advance timer to trigger the callback
            jest.advanceTimersByTime(200);
            expect(mockContentNode.y).toBe(300); // 100 + 200
            expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(true);
        });

        it("should not adjust position when mobile but in portrait mode", () => {
            const mockSetTimeout = jest.spyOn(global, 'setTimeout');
            const mockDispatchEvent = jest.fn();
            (global as any).window = { dispatchEvent: mockDispatchEvent };
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = true;
            
            // Mock FunctionUtils.isPortraitMode to return true
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(true);
            
            redeemGiftCodePopup.onEditBoxFocus();
            
            expect(mockSetTimeout).toHaveBeenCalled();
            
            // Advance timer to trigger the callback
            jest.advanceTimersByTime(200);
            expect(mockContentNode.y).toBe(100); // Should remain unchanged
            expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(false);
        });

        it("should not adjust position on desktop", () => {
            const mockSetTimeout = jest.spyOn(global, 'setTimeout');
            const mockDispatchEvent = jest.fn();
            (global as any).window = { dispatchEvent: mockDispatchEvent };
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = false;
            
            redeemGiftCodePopup.onEditBoxFocus();
            
            expect(mockSetTimeout).toHaveBeenCalled();
            
            // Advance timer to trigger the callback
            jest.advanceTimersByTime(200);
            expect(mockContentNode.y).toBe(100); // Should remain unchanged
            expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(false);
        });

        it("should clear existing debounce timer", () => {
            const mockClearTimeout = jest.spyOn(global, 'clearTimeout');
            (redeemGiftCodePopup as any)._debounceTimer = 123;
            
            redeemGiftCodePopup.onEditBoxFocus();
            
            expect(mockClearTimeout).toHaveBeenCalledWith(123);
        });
    });

    describe("onEditBoxBlur method", () => {
        it("should schedule position restore on mobile when not in portrait mode", () => {
            (redeemGiftCodePopup as any)._originalY = 100;
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = true;
            
            // Mock FunctionUtils.isPortraitMode to return false
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(false);
            
            redeemGiftCodePopup.onEditBoxBlur();
            
            expect((redeemGiftCodePopup as any).scheduleOnce).toHaveBeenCalledTimes(1);
            expect((redeemGiftCodePopup as any).scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.2);
        });

        it("should not schedule position restore on mobile when in portrait mode", () => {
            (redeemGiftCodePopup as any)._originalY = 100;
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = true;
            
            // Mock FunctionUtils.isPortraitMode to return true
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(true);
            
            redeemGiftCodePopup.onEditBoxBlur();
            
            expect((redeemGiftCodePopup as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should not schedule position restore on desktop", () => {
            (redeemGiftCodePopup as any)._originalY = 100;
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = false;
            
            redeemGiftCodePopup.onEditBoxBlur();
            
            expect((redeemGiftCodePopup as any).scheduleOnce).not.toHaveBeenCalled();
        });

        it("should restore position and reset keyboard state when scheduled callback runs", () => {
            (redeemGiftCodePopup as any)._originalY = 100;
            (redeemGiftCodePopup as any)._isKeyboardOpen = true;
            
            // Mock cc.sys.isMobile
            const cc = require("cc");
            cc.sys.isMobile = true;
            
            // Mock FunctionUtils.isPortraitMode to return false
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(false);
            
            redeemGiftCodePopup.onEditBoxBlur();
            
            // Get the scheduled callback and execute it
            const scheduledCallback = (redeemGiftCodePopup as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();
            
            expect(mockContentNode.y).toBe(100);
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(false);
        });
    });

    describe("onInputFinalized method", () => {
        it("should convert input to uppercase and call blur", () => {
            mockGiftCodeInput.string = "test123";
            const mockOnEditBoxBlur = jest.spyOn(redeemGiftCodePopup, 'onEditBoxBlur');
            
            redeemGiftCodePopup.onInputFinalized(mockGiftCodeInput);
            
            expect(mockGiftCodeInput.string).toBe("TEST123");
            expect(mockOnEditBoxBlur).toHaveBeenCalledTimes(1);
        });

        it("should not change already uppercase input", () => {
            mockGiftCodeInput.string = "TEST123";
            const mockOnEditBoxBlur = jest.spyOn(redeemGiftCodePopup, 'onEditBoxBlur');
            
            redeemGiftCodePopup.onInputFinalized(mockGiftCodeInput);
            
            expect(mockGiftCodeInput.string).toBe("TEST123");
            expect(mockOnEditBoxBlur).toHaveBeenCalledTimes(1);
        });

        it("should handle mixed case input", () => {
            mockGiftCodeInput.string = "aBc123DeF";
            const mockOnEditBoxBlur = jest.spyOn(redeemGiftCodePopup, 'onEditBoxBlur');
            
            redeemGiftCodePopup.onInputFinalized(mockGiftCodeInput);
            
            expect(mockGiftCodeInput.string).toBe("ABC123DEF");
            expect(mockOnEditBoxBlur).toHaveBeenCalledTimes(1);
        });

        it("should handle empty input", () => {
            mockGiftCodeInput.string = "";
            const mockOnEditBoxBlur = jest.spyOn(redeemGiftCodePopup, 'onEditBoxBlur');
            
            redeemGiftCodePopup.onInputFinalized(mockGiftCodeInput);
            
            expect(mockGiftCodeInput.string).toBe("");
            expect(mockOnEditBoxBlur).toHaveBeenCalledTimes(1);
        });
    });

    describe("renderRedemptionNotice method", () => {
        it("should update error label for redemption notice events", () => {
            const noticeEvent = { event: "REDEMPTION_NOTICE", data: "ERROR_CODE" };
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            
            redeemGiftCodePopup.renderRedemptionNotice(noticeEvent);
            
            expect(mockTranslate).toHaveBeenCalledWith("ERROR_CODE");
            expect(mockErrorLabel.string).toBe("ERROR_CODE");
        });

        it("should not update error label for other events", () => {
            const otherEvent = { event: "OTHER_EVENT", data: "ERROR_CODE" };
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            
            redeemGiftCodePopup.renderRedemptionNotice(otherEvent);
            
            expect(mockErrorLabel.string).toBe("");
        });

        it("should handle null pending UI event", () => {
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            
            expect(() => redeemGiftCodePopup.renderRedemptionNotice(null)).not.toThrow();
            expect(mockErrorLabel.string).toBe("");
        });

        it("should handle undefined pending UI event", () => {
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            
            expect(() => redeemGiftCodePopup.renderRedemptionNotice(undefined)).not.toThrow();
            expect(mockErrorLabel.string).toBe("");
        });

        it("should handle pending UI event with null data", () => {
            const noticeEvent = { event: "REDEMPTION_NOTICE", data: null };
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            
            redeemGiftCodePopup.renderRedemptionNotice(noticeEvent);
            
            expect(mockTranslate).toHaveBeenCalledWith(null);
            expect(mockErrorLabel.string).toBe(null);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete gift code redemption flow", async () => {
            // Setup initial state
            mockGiftCodeInput.string = "TEST123";
            const mockRedeemGifCode = jest.spyOn(redeemGiftCodePopup, 'redeemGifCode');
            const mockResetFSBRedemptionState = jest.fn();
            const mockOnClosePopup = jest.spyOn(redeemGiftCodePopup, 'onClosePopup');
            (redeemGiftCodePopup as any).resetFSBRedemptionState = mockResetFSBRedemptionState;
            (redeemGiftCodePopup as any).isRedeemSuccess = true;

            // User clicks redeem
            redeemGiftCodePopup.onClickRedeemGifCode();

            // Handle success
            redeemGiftCodePopup.renderRedeemSuccess(true);

            expect(mockRedeemGifCode).toHaveBeenCalledTimes(1);
            expect(mockResetFSBRedemptionState).toHaveBeenCalledTimes(1);
            expect(mockOnClosePopup).toHaveBeenCalledTimes(1);
        });

        it("should handle redemption failure flow", () => {
            // Setup initial state
            mockGiftCodeInput.string = "INVALID";
            const mockRedeemGifCode = jest.spyOn(redeemGiftCodePopup, 'redeemGifCode');
            const mockResetFSBRedemptionState = jest.fn();
            const mockTranslate = jest.fn((key: string) => key);
            const gc = require("@sg/game-client-base");
            gc.Translator.translate = mockTranslate;
            (redeemGiftCodePopup as any).resetFSBRedemptionState = mockResetFSBRedemptionState;
            (redeemGiftCodePopup as any).isRedeemSuccess = false;

            // User clicks redeem
            redeemGiftCodePopup.onClickRedeemGifCode();

            // Handle error
            const errorEvent = { event: "REDEMPTION_NOTICE", data: "INVALID_CODE" };
            redeemGiftCodePopup.renderRedemptionNotice(errorEvent);

            expect(mockRedeemGifCode).toHaveBeenCalledTimes(1);
            expect(mockResetFSBRedemptionState).toHaveBeenCalledTimes(1);
            expect(mockErrorLabel.string).toBe("INVALID_CODE");
        });

        it("should handle complete mobile keyboard interaction", () => {
            // Setup mobile environment
            const cc = require("cc");
            cc.sys.isMobile = true;
            (redeemGiftCodePopup as any)._originalY = 100;

            // Mock FunctionUtils.isPortraitMode to return false
            const FunctionUtils = require("db://shared-components/shared/utils").FunctionUtils;
            FunctionUtils.isPortraitMode.mockReturnValue(false);

            // Focus - should adjust position
            jest.useFakeTimers();
            const mockSetTimeout = jest.spyOn(global, 'setTimeout');
            const mockDispatchEvent = jest.fn();
            (global as any).window = { dispatchEvent: mockDispatchEvent };

            redeemGiftCodePopup.onEditBoxFocus();
            jest.advanceTimersByTime(200);

            expect(mockSetTimeout).toHaveBeenCalled();
            expect(mockContentNode.y).toBe(300); // 100 + 200
            expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(true);

            // Blur - should restore position
            redeemGiftCodePopup.onEditBoxBlur();
            expect((redeemGiftCodePopup as any).scheduleOnce).toHaveBeenCalledTimes(1);

            // Execute the scheduled callback
            const scheduledCallback = (redeemGiftCodePopup as any).scheduleOnce.mock.calls[0][0];
            scheduledCallback();
            expect(mockContentNode.y).toBe(100);
            expect((redeemGiftCodePopup as any)._isKeyboardOpen).toBe(false);

            jest.useRealTimers();
        });
    });
});




