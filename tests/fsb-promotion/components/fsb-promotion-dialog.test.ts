import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FsbPromotionDialog } from "../../../assets/fsb-promotion/scripts/components/fsb-promotion-dialog";

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
jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
        property: jest.fn(() => jest.fn()),
    },
    Node: jest.fn(),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
}));

// Mock Observer
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

// Mock dependencies
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        node = { getComponent: jest.fn() };
    },
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/dialogs/transition/dialog-transition", () => ({
    DialogTransition: jest.fn(),
}));

// Mock cascading slot utils
jest.mock("db://shared-cascading-slot/cascading-slot-utils", () => ({
    globalEmitter: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    },
    SlotClientEvent: {},
    SlotNotification: {},
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers");
jest.mock("db://shared-cascading-slot/stores/cascading-ui-store");

describe("FsbPromotionDialog", () => {
    let component: FsbPromotionDialog;
    let mockDialog: any;
    let mockDialogTransition: any;
    let mockPlayNow: any;
    let mockPlayLater: any;
    let mockCloseButton: any;
    let mockBackground: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDialog = { hide: jest.fn() };
        mockDialogTransition = { show: jest.fn() };
        mockPlayNow = { active: true };
        mockPlayLater = { active: true };
        mockCloseButton = { active: false };
        mockBackground = {
            active: true,
            getComponent: jest.fn().mockReturnValue(mockDialogTransition)
        };

        component = new FsbPromotionDialog();
        component.playNow = mockPlayNow;
        component.playLater = mockPlayLater;
        component.closeButton = mockCloseButton;
        component.background = mockBackground;
        component.node.getComponent = jest.fn().mockReturnValue(mockDialog) as any;

        component.onPlayGameNow = jest.fn();
        component.openPromotionDetailsPanel = jest.fn();
        component.showFreeSpinMessage = jest.fn();
        component.resetRedeemSuccess = jest.fn();
        component.addPendingUIEvent = jest.fn();
    });

    describe("initialization", () => {
        it("should initialize with correct default values", () => {
            expect(component['isFreeSpins']).toBe(false);
            expect(component['activeDetailPromo']).toBe(false);
            expect(component.gameOffers).toEqual([]);
        });
    });

    describe("closeDialog", () => {
        it("should hide dialog, reset redeem success and add pending UI event", () => {
            component.closeDialog();

            expect(component.node.getComponent).toHaveBeenCalled();
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(component.resetRedeemSuccess).toHaveBeenCalled();
            expect(component.addPendingUIEvent).toHaveBeenCalled();
        });

        it("should handle case when dialog component is null", () => {
            component.node.getComponent = jest.fn().mockReturnValue(null) as any;

            expect(() => component.closeDialog()).not.toThrow();
            expect(component.resetRedeemSuccess).toHaveBeenCalled();
            expect(component.addPendingUIEvent).toHaveBeenCalled();
        });
    });

    describe("playGameNow", () => {
        it("should close dialog, call onPlayGameNow and show free spin message when isFreeSpins is true", () => {
            component['isFreeSpins'] = true;
            const closeDialogSpy = jest.spyOn(component, 'closeDialog');

            component.playGameNow();

            expect(closeDialogSpy).toHaveBeenCalled();
            expect(component.onPlayGameNow).toHaveBeenCalled();
            expect(component.showFreeSpinMessage).toHaveBeenCalled();
            expect(component.openPromotionDetailsPanel).not.toHaveBeenCalled();
        });

        it("should close dialog, call onPlayGameNow and open promotion details panel when isFreeSpins is false", () => {
            component['isFreeSpins'] = false;
            const closeDialogSpy = jest.spyOn(component, 'closeDialog');

            component.playGameNow();

            expect(closeDialogSpy).toHaveBeenCalled();
            expect(component.onPlayGameNow).toHaveBeenCalled();
            expect(component.openPromotionDetailsPanel).toHaveBeenCalled();
            expect(component.showFreeSpinMessage).not.toHaveBeenCalled();
        });
    });

    describe("checkFeeSpinInGame", () => {
        it("should set isFreeSpins to true when parameter is true", () => {
            component.checkFeeSpinInGame(true);
            expect(component['isFreeSpins']).toBe(true);
        });

        it("should not change isFreeSpins when parameter is false", () => {
            component['isFreeSpins'] = false;
            component.checkFeeSpinInGame(false);
            expect(component['isFreeSpins']).toBe(false);
        });

        it("should not reset isFreeSpins to false when parameter is false and isFreeSpins was already true", () => {
            component['isFreeSpins'] = true;
            component.checkFeeSpinInGame(false);
            expect(component['isFreeSpins']).toBe(true);
        });
    });

    describe("setGameOffers", () => {
        it("should set gameOffers array", () => {
            const gameOffers = [
                { name: "Game 1", gameId: 1 },
                { name: "Game 2", gameId: 2 }
            ];

            component.setGameOffers(gameOffers);

            expect(component.gameOffers).toBe(gameOffers);
            expect(component.gameOffers).toHaveLength(2);
            expect(component.gameOffers[0]).toEqual({ name: "Game 1", gameId: 1 });
        });

        it("should handle empty gameOffers array", () => {
            const gameOffers: { name: string; gameId: number }[] = [];
            component.setGameOffers(gameOffers);
            expect(component.gameOffers).toHaveLength(0);
        });
    });

    describe("controlButtonsVisibility", () => {
        beforeEach(() => {
            component['activeDetailPromo'] = false;
        });

        it("should control buttons visibility when isWebViewLoading is true", () => {
            component.controlButtonsVisibility(true);

            expect(mockPlayNow.active).toBe(false);
            expect(mockPlayLater.active).toBe(false);
            expect(mockCloseButton.active).toBe(false);
            expect(mockBackground.active).toBe(false);
            expect(mockDialogTransition.show).toHaveBeenCalledWith(false);
        });

        it("should control buttons visibility when isWebViewLoading is false and activeDetailPromo is false", () => {
            component.controlButtonsVisibility(false);

            expect(mockPlayNow.active).toBe(true);
            expect(mockPlayLater.active).toBe(true);
            expect(mockCloseButton.active).toBe(false);
            expect(mockBackground.active).toBe(true);
            expect(mockDialogTransition.show).toHaveBeenCalledWith(true);
        });

        it("should control buttons visibility when activeDetailPromo is true", () => {
            component['activeDetailPromo'] = true;
            component.controlButtonsVisibility(false);

            expect(mockPlayNow.active).toBe(false);
            expect(mockPlayLater.active).toBe(false);
            expect(mockCloseButton.active).toBe(true);
            expect(mockBackground.active).toBe(true);
        });

        it("should handle null nodes gracefully", () => {
            component.playNow = null;
            component.playLater = null;
            component.closeButton = null;

            expect(() => component.controlButtonsVisibility(false)).not.toThrow();
            expect(mockBackground.active).toBe(true);
        });
    });

    describe("setActiveAnnouncement", () => {
        it("should set activeDetailPromo to true", () => {
            component.setActiveAnnouncement(true);
            expect(component['activeDetailPromo']).toBe(true);
        });

        it("should set activeDetailPromo to false", () => {
            component['activeDetailPromo'] = true;
            component.setActiveAnnouncement(false);
            expect(component['activeDetailPromo']).toBe(false);
        });
    });

    describe("closeFSBBanner", () => {
        it("should close dialog when shouldClose is true", () => {
            const closeDialogSpy = jest.spyOn(component, 'closeDialog');
            component.closeFSBBanner(true);
            expect(closeDialogSpy).toHaveBeenCalled();
        });

        it("should not close dialog when shouldClose is false", () => {
            const closeDialogSpy = jest.spyOn(component, 'closeDialog');
            component.closeFSBBanner(false);
            expect(closeDialogSpy).not.toHaveBeenCalled();
        });
    });

    describe("handler methods", () => {
        it("should have required handler methods", () => {
            expect(typeof component.onPlayGameNow).toBe('function');
            expect(typeof component.openPromotionDetailsPanel).toBe('function');
            expect(typeof component.showFreeSpinMessage).toBe('function');
            expect(typeof component.resetRedeemSuccess).toBe('function');
            expect(typeof component.addPendingUIEvent).toBe('function');
        });
    });

    describe("complex scenarios", () => {
        it("should handle multiple game offers correctly", () => {
            const gameOffers = [
                { name: "Slot Game", gameId: 100 },
                { name: "Card Game", gameId: 200 },
                { name: "Roulette", gameId: 300 }
            ];

            component.setGameOffers(gameOffers);

            expect(component.gameOffers).toHaveLength(3);
            expect(component.gameOffers.find(game => game.gameId === 200)?.name).toBe("Card Game");
        });

        it("should handle state changes in sequence", () => {
            component.checkFeeSpinInGame(true);
            component.setActiveAnnouncement(true);
            component.controlButtonsVisibility(false);

            expect(component['isFreeSpins']).toBe(true);
            expect(component['activeDetailPromo']).toBe(true);
            expect(mockPlayNow.active).toBe(false);
            expect(mockCloseButton.active).toBe(true);
        });
    });
});
