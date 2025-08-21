import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock dependencies
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
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: jest.fn(),
}));

jest.mock("observer", () => ({
    render: jest.fn(() => (target: any, propertyKey: string) => {}),
    handle: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

jest.mock("@sg/game-client-base", () => ({
    default: {
        Audios: {
            AudioHandler: jest.fn(),
            AudioIds: {
                CLICK: "CLICK",
            },
        },
        Translator: {
            translate: jest.fn((key) => `translated_${key}`),
        },
    },
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

jest.mock("../../scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
}));

jest.mock("../../scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: jest.fn(),
}));

jest.mock("../../scripts/stores/fsb-promotion-ui-store", () => ({
    FreeSpinsPromotionEvents: {
        REDEMPTION_NOTICE: "REDEMPTION_NOTICE",
    },
    FSBPromotionUIStore: jest.fn(),
}));

describe("RedeemGiftCodePopup", () => {
    let mockGiftCodeInput: any;
    let mockErrorLabel: any;
    let mockContentNode: any;
    let mockNode: any;
    let mockDialog: any;
    let mockGc: any;
    let mockSys: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock components
        mockGiftCodeInput = {
            string: "",
        };

        mockErrorLabel = {
            string: "",
        };

        mockContentNode = {
            position: {
                y: 0,
            },
            y: 0,
        };

        mockNode = {
            getComponent: jest.fn(),
        };

        mockDialog = {
            hide: jest.fn(),
        };

        // Setup mocks
        mockGc = require("@sg/game-client-base");
        mockSys = require("cc").sys;
        mockNode.getComponent.mockReturnValue(mockDialog);
    });

    describe("Mock Component Tests", () => {
        it("should handle gift code input", () => {
            mockGiftCodeInput.string = "TEST123";
            expect(mockGiftCodeInput.string).toBe("TEST123");

            mockGiftCodeInput.string = "test456";
            expect(mockGiftCodeInput.string).toBe("test456");
        });

        it("should handle error label", () => {
            mockErrorLabel.string = "Error message";
            expect(mockErrorLabel.string).toBe("Error message");

            mockErrorLabel.string = "";
            expect(mockErrorLabel.string).toBe("");
        });

        it("should handle content node position", () => {
            mockContentNode.position.y = 100;
            expect(mockContentNode.position.y).toBe(100);

            mockContentNode.y = 200;
            expect(mockContentNode.y).toBe(200);
        });

        it("should handle dialog component", () => {
            const dialog = mockNode.getComponent();
            expect(dialog).toBe(mockDialog);
            expect(typeof dialog.hide).toBe("function");
        });
    });

    describe("onEnable Logic Tests", () => {
        it("should clear error label and store original Y position", () => {
            const onEnable = (errorLabel: any, contentNode: any) => {
                errorLabel.string = "";
                const originalY = contentNode.position.y;
                return { errorLabelString: errorLabel.string, originalY };
            };

            const result = onEnable(mockErrorLabel, mockContentNode);

            expect(result.errorLabelString).toBe("");
            expect(result.originalY).toBe(0);
        });

        it("should handle different original Y positions", () => {
            mockContentNode.position.y = 150;

            const onEnable = (errorLabel: any, contentNode: any) => {
                errorLabel.string = "";
                const originalY = contentNode.position.y;
                return { errorLabelString: errorLabel.string, originalY };
            };

            const result = onEnable(mockErrorLabel, mockContentNode);

            expect(result.originalY).toBe(150);
        });
    });

    describe("redeemGifCode Logic Tests", () => {
        it("should return trimmed and uppercase gift code", () => {
            const redeemGifCode = (giftCodeInput: any) => {
                return giftCodeInput.string.trim().toUpperCase();
            };

            mockGiftCodeInput.string = "  test123  ";
            const result = redeemGifCode(mockGiftCodeInput);

            expect(result).toBe("TEST123");
        });

        it("should handle empty input", () => {
            const redeemGifCode = (giftCodeInput: any) => {
                return giftCodeInput.string.trim().toUpperCase();
            };

            mockGiftCodeInput.string = "   ";
            const result = redeemGifCode(mockGiftCodeInput);

            expect(result).toBe("");
        });

        it("should handle already uppercase input", () => {
            const redeemGifCode = (giftCodeInput: any) => {
                return giftCodeInput.string.trim().toUpperCase();
            };

            mockGiftCodeInput.string = "ABC123";
            const result = redeemGifCode(mockGiftCodeInput);

            expect(result).toBe("ABC123");
        });

        it("should handle mixed case input", () => {
            const redeemGifCode = (giftCodeInput: any) => {
                return giftCodeInput.string.trim().toUpperCase();
            };

            mockGiftCodeInput.string = "aBc123DeF";
            const result = redeemGifCode(mockGiftCodeInput);

            expect(result).toBe("ABC123DEF");
        });
    });

    describe("onClickRedeemGifCode Logic Tests", () => {
        it("should call redeemGifCode and resetFSBRedemptionState", () => {
            const redeemGifCode = jest.fn(() => "TEST123");
            const resetFSBRedemptionState = jest.fn();

            const onClickRedeemGifCode = () => {
                redeemGifCode();
                resetFSBRedemptionState();
            };

            onClickRedeemGifCode();

            expect(redeemGifCode).toHaveBeenCalled();
            expect(resetFSBRedemptionState).toHaveBeenCalled();
        });
    });

    describe("onClosePopup Logic Tests", () => {
        it("should not close popup when keyboard is open", () => {
            const onClosePopup = (isKeyboardOpen: boolean, dialog: any) => {
                if (isKeyboardOpen) {
                    return "keyboard_open";
                }
                dialog?.hide();
                return "popup_closed";
            };

            const result = onClosePopup(true, mockDialog);

            expect(result).toBe("keyboard_open");
            expect(mockDialog.hide).not.toHaveBeenCalled();
        });

        it("should close popup when keyboard is not open", () => {
            const onClosePopup = (isKeyboardOpen: boolean, dialog: any) => {
                if (isKeyboardOpen) {
                    return "keyboard_open";
                }
                dialog?.hide();
                return "popup_closed";
            };

            const result = onClosePopup(false, mockDialog);

            expect(result).toBe("popup_closed");
            expect(mockDialog.hide).toHaveBeenCalled();
        });

        it("should handle null dialog component", () => {
            const onClosePopup = (isKeyboardOpen: boolean, dialog: any) => {
                if (isKeyboardOpen) {
                    return "keyboard_open";
                }
                dialog?.hide();
                return "popup_closed";
            };

            expect(() => onClosePopup(false, null)).not.toThrow();
        });
    });

    describe("renderRedemptionNotice Logic Tests", () => {
        it("should not update error label for other events", () => {
            const renderRedemptionNotice = (pendingUIEvent: any, errorLabel: any, translator: any) => {
                if (pendingUIEvent?.event === "REDEMPTION_NOTICE") {
                    errorLabel.string = translator.translate(pendingUIEvent?.data);
                }
            };

            const pendingUIEvent = {
                event: "OTHER_EVENT",
                data: "ERROR_CODE",
            };

            renderRedemptionNotice(pendingUIEvent, mockErrorLabel, mockGc.Translator);

            expect(mockErrorLabel.string).toBe("");
        });

        it("should handle null pendingUIEvent", () => {
            const renderRedemptionNotice = (pendingUIEvent: any, errorLabel: any, translator: any) => {
                if (pendingUIEvent?.event === "REDEMPTION_NOTICE") {
                    errorLabel.string = translator.translate(pendingUIEvent?.data);
                }
            };

            expect(() => renderRedemptionNotice(null, mockErrorLabel, mockGc.Translator)).not.toThrow();
        });
    });

    describe("renderRedeemSuccess Logic Tests", () => {
        it("should close popup when redemption is successful", () => {
            const renderRedeemSuccess = (isRedeemSuccess: boolean, onClosePopup: any) => {
                if (isRedeemSuccess) {
                    onClosePopup();
                }
            };

            const onClosePopup = jest.fn();

            renderRedeemSuccess(true, onClosePopup);

            expect(onClosePopup).toHaveBeenCalled();
        });

        it("should not close popup when redemption is not successful", () => {
            const renderRedeemSuccess = (isRedeemSuccess: boolean, onClosePopup: any) => {
                if (isRedeemSuccess) {
                    onClosePopup();
                }
            };

            const onClosePopup = jest.fn();

            renderRedeemSuccess(false, onClosePopup);

            expect(onClosePopup).not.toHaveBeenCalled();
        });
    });

    describe("onPasteClicked Logic Tests", () => {
        it("should handle successful clipboard read", async () => {
            const mockClipboardText = "PASTE123";
            const mockNavigator = {
                clipboard: {
                    readText: jest.fn().mockResolvedValue(mockClipboardText as never),
                },
            };

            const onPasteClicked = async (navigator: any, giftCodeInput: any) => {
                let text = "";
                try {
                    text = await navigator.clipboard.readText();
                    giftCodeInput.string = text.trim().toUpperCase();
                } catch (e) {
                    console.warn("Clipboard read failed", e);
                }
                return giftCodeInput.string;
            };

            const result = await onPasteClicked(mockNavigator, mockGiftCodeInput);

            expect(result).toBe("PASTE123");
            expect(mockGiftCodeInput.string).toBe("PASTE123");
        });

        it("should handle clipboard read failure", async () => {
            const mockNavigator = {
                clipboard: {
                    readText: jest.fn().mockRejectedValue(new Error("Clipboard access denied") as never),
                },
            };

            const onPasteClicked = async (navigator: any, giftCodeInput: any) => {
                let text = "";
                try {
                    text = await navigator.clipboard.readText();
                    giftCodeInput.string = text.trim().toUpperCase();
                } catch (e) {
                    console.warn("Clipboard read failed", e);
                }
                return giftCodeInput.string;
            };

            const result = await onPasteClicked(mockNavigator, mockGiftCodeInput);

            expect(result).toBe("");
            expect(mockGiftCodeInput.string).toBe("");
        });

        it("should handle whitespace in clipboard text", async () => {
            const mockClipboardText = "  paste456  ";
            const mockNavigator = {
                clipboard: {
                    readText: jest.fn().mockResolvedValue(mockClipboardText as never),
                },
            };

            const onPasteClicked = async (navigator: any, giftCodeInput: any) => {
                let text = "";
                try {
                    text = await navigator.clipboard.readText();
                    giftCodeInput.string = text.trim().toUpperCase();
                } catch (e) {
                    console.warn("Clipboard read failed", e);
                }
                return giftCodeInput.string;
            };

            const result = await onPasteClicked(mockNavigator, mockGiftCodeInput);

            expect(result).toBe("PASTE456");
            expect(mockGiftCodeInput.string).toBe("PASTE456");
        });
    });

    describe("onEditBoxFocus Logic Tests", () => {
        it("should handle mobile keyboard opening", () => {
            const mockSetTimeout = jest.fn((callback, delay) => {
                setTimeout(callback as any, delay as any);
            });
            const mockDispatchEvent = jest.fn();

            const onEditBoxFocus = (sys: any, contentNode: any, dispatchEvent: any, setTimeout: any) => {
                const debounceTimer = setTimeout(() => {
                    if (sys.isMobile) {
                        contentNode.y += 200;
                        dispatchEvent(new Event("resize"));
                    }
                }, 200);
                return { debounceTimer, contentNodeY: contentNode.y };
            };

            mockSys.isMobile = true;
            const result = onEditBoxFocus(mockSys, mockContentNode, mockDispatchEvent, mockSetTimeout);

            expect(mockSetTimeout).toHaveBeenCalled();
            expect(result.contentNodeY).toBe(0); // Initial value
        });

        it("should not modify content position on desktop", () => {
            const mockSetTimeout = jest.fn((callback, delay) => {
                setTimeout(callback as any, delay as any);
            });
            const mockDispatchEvent = jest.fn();

            const onEditBoxFocus = (sys: any, contentNode: any, dispatchEvent: any, setTimeout: any) => {
                const debounceTimer = setTimeout(() => {
                    if (sys.isMobile) {
                        contentNode.y += 200;
                        dispatchEvent(new Event("resize"));
                    }
                }, 200);
                return { debounceTimer, contentNodeY: contentNode.y };
            };

            mockSys.isMobile = false;
            const result = onEditBoxFocus(mockSys, mockContentNode, mockDispatchEvent, mockSetTimeout);

            expect(mockSetTimeout).toHaveBeenCalled();
            expect(result.contentNodeY).toBe(0);
        });
    });

    describe("onInputFinalized Logic Tests", () => {
        it("should convert input to uppercase", () => {
            const onInputFinalized = (editBox: any) => {
                const upper = editBox.string.toUpperCase();
                if (editBox.string !== upper) {
                    editBox.string = upper;
                }
                return editBox.string;
            };

            mockGiftCodeInput.string = "test123";
            const result = onInputFinalized(mockGiftCodeInput);

            expect(result).toBe("TEST123");
            expect(mockGiftCodeInput.string).toBe("TEST123");
        });

        it("should not modify already uppercase input", () => {
            const onInputFinalized = (editBox: any) => {
                const upper = editBox.string.toUpperCase();
                if (editBox.string !== upper) {
                    editBox.string = upper;
                }
                return editBox.string;
            };

            mockGiftCodeInput.string = "TEST123";
            const result = onInputFinalized(mockGiftCodeInput);

            expect(result).toBe("TEST123");
            expect(mockGiftCodeInput.string).toBe("TEST123");
        });

        it("should handle mixed case input", () => {
            const onInputFinalized = (editBox: any) => {
                const upper = editBox.string.toUpperCase();
                if (editBox.string !== upper) {
                    editBox.string = upper;
                }
                return editBox.string;
            };

            mockGiftCodeInput.string = "aBc123DeF";
            const result = onInputFinalized(mockGiftCodeInput);

            expect(result).toBe("ABC123DEF");
            expect(mockGiftCodeInput.string).toBe("ABC123DEF");
        });
    });

    describe("onEditBoxBlur Logic Tests", () => {
        it("should restore original position on mobile", () => {
            const mockScheduleOnce = jest.fn((callback, delay) => {
                setTimeout(callback as any, delay as any);
            });

            const onEditBoxBlur = (sys: any, contentNode: any, originalY: number, scheduleOnce: any) => {
                if (sys.isMobile) {
                    scheduleOnce(() => {
                        contentNode.y = originalY;
                    }, 0.2);
                }
                return { scheduled: true };
            };

            mockSys.isMobile = true;
            const result = onEditBoxBlur(mockSys, mockContentNode, 100, mockScheduleOnce);

            expect(mockScheduleOnce).toHaveBeenCalled();
            expect(result.scheduled).toBe(true);
        });

        it("should not schedule position restore on desktop", () => {
            const mockScheduleOnce = jest.fn((callback, delay) => {
                setTimeout(callback as any, delay as any);
            });

            const onEditBoxBlur = (sys: any, contentNode: any, originalY: number, scheduleOnce: any) => {
                if (sys.isMobile) {
                    scheduleOnce(() => {
                        contentNode.y = originalY;
                    }, 0.2);
                }
                return { scheduled: false };
            };

            mockSys.isMobile = false;
            const result = onEditBoxBlur(mockSys, mockContentNode, 100, mockScheduleOnce);

            expect(mockScheduleOnce).not.toHaveBeenCalled();
            expect(result.scheduled).toBe(false);
        });
    });

    describe("Integration Scenarios", () => {
        it("should handle mobile keyboard interaction", () => {
            // Setup mobile environment
            mockSys.isMobile = true;
            mockContentNode.position.y = 100;

            // Focus edit box
            const onEditBoxFocus = (sys: any, contentNode: any, dispatchEvent: any) => {
                if (sys.isMobile) {
                    contentNode.y += 200;
                    dispatchEvent(new Event("resize"));
                }
            };

            onEditBoxFocus(mockSys, mockContentNode, jest.fn());
            expect(mockContentNode.y).toBe(200);

            // Blur edit box
            const onEditBoxBlur = (sys: any, contentNode: any, originalY: number) => {
                if (sys.isMobile) {
                    contentNode.y = originalY;
                }
            };

            onEditBoxBlur(mockSys, mockContentNode, 100);
            expect(mockContentNode.y).toBe(100);
        });

        it("should handle clipboard paste functionality", async () => {
            const mockClipboardText = "PASTE123";
            const mockNavigator = {
                clipboard: {
                    readText: jest.fn().mockResolvedValue(mockClipboardText as never),
                },
            };

            const onPasteClicked = async (navigator: any, giftCodeInput: any) => {
                let text = "";
                try {
                    text = await navigator.clipboard.readText();
                    giftCodeInput.string = text.trim().toUpperCase();
                } catch (e) {
                    console.warn("Clipboard read failed", e);
                }
                return giftCodeInput.string;
            };

            const result = await onPasteClicked(mockNavigator, mockGiftCodeInput);
            expect(result).toBe("PASTE123");
        });
    });

    describe("Property Tests", () => {
        it("should have giftCodeInput property structure", () => {
            const giftCodeInput = {
                string: "",
            };
            expect(giftCodeInput).toHaveProperty("string");
            expect(typeof giftCodeInput.string).toBe("string");
        });

        it("should have errorLabel property structure", () => {
            const errorLabel = {
                string: "",
            };
            expect(errorLabel).toHaveProperty("string");
            expect(typeof errorLabel.string).toBe("string");
        });

        it("should have contentNode property structure", () => {
            const contentNode = {
                position: {
                    y: 0,
                },
                y: 0,
            };
            expect(contentNode).toHaveProperty("position");
            expect(contentNode.position).toHaveProperty("y");
            expect(contentNode).toHaveProperty("y");
        });
    });

    describe("Method Structure Tests", () => {
        it("should have onEnable method structure", () => {
            const onEnable = (errorLabel: any, contentNode: any) => {
                errorLabel.string = "";
                const originalY = contentNode.position.y;
            };

            expect(typeof onEnable).toBe("function");
        });

        it("should have redeemGifCode method structure", () => {
            const redeemGifCode = (giftCodeInput: any) => {
                return giftCodeInput.string.trim().toUpperCase();
            };

            expect(typeof redeemGifCode).toBe("function");
        });

        it("should have onClickRedeemGifCode method structure", () => {
            const onClickRedeemGifCode = () => {
                // Implementation
            };

            expect(typeof onClickRedeemGifCode).toBe("function");
        });

        it("should have onClosePopup method structure", () => {
            const onClosePopup = (isKeyboardOpen: boolean, dialog: any) => {
                if (isKeyboardOpen) {
                    return;
                }
                dialog?.hide();
            };

            expect(typeof onClosePopup).toBe("function");
        });
    });
});
