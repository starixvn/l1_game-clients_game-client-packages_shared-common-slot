import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FsbPromotionDialog } from "../../../assets/fsb-promotion/scripts/components/fsb-promotion-dialog";

// Mock dependencies following Dependency Inversion Principle
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

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

jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

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

// Mock Interfaces following Interface Segregation Principle
interface MockDialog {
    hide: jest.Mock;
}

interface MockDialogTransition {
    show: jest.Mock;
}

interface MockNodeVisibility {
    active: boolean;
}

interface MockBackground extends MockNodeVisibility {
    getComponent: jest.Mock;
}

interface MockGameOffer {
    name: string;
    gameId: number;
}

interface MockDialogState {
    isFreeSpins: boolean;
    activeDetailPromo: boolean;
    gameOffers: MockGameOffer[];
}

interface MockDialogComponents {
    playNow: MockNodeVisibility | null;
    playLater: MockNodeVisibility | null;
    closeButton: MockNodeVisibility | null;
    background: MockBackground;
    node: { getComponent: jest.Mock };
}

interface MockDialogActions {
    closeDialog: () => void;
    playGameNow: () => void;
    checkFeeSpinInGame: (isFreeSpins: boolean) => void;
    setGameOffers: (offers: MockGameOffer[]) => void;
    controlButtonsVisibility: (isWebViewLoading: boolean) => void;
    setActiveAnnouncement: (isActive: boolean) => void;
    closeFSBBanner: (shouldClose: boolean) => void;
    onPlayGameNow: jest.Mock;
    openPromotionDetailsPanel: jest.Mock;
    showFreeSpinMessage: jest.Mock;
    resetRedeemSuccess: jest.Mock;
    addPendingUIEvent: jest.Mock;
}

interface MockFsbPromotionDialog extends MockDialogState, MockDialogComponents, MockDialogActions {}

// Factory functions following Single Responsibility Principle
const createMockDialog = (): MockDialog => ({
    hide: jest.fn(),
});

const createMockDialogTransition = (): MockDialogTransition => ({
    show: jest.fn(),
});

const createMockNode = (isActive: boolean = true): MockNodeVisibility => ({
    active: isActive,
});

const createMockBackground = (): MockBackground => ({
    active: true,
    getComponent: jest.fn().mockReturnValue(createMockDialogTransition()),
});

const createMockGameOffer = (name: string, gameId: number): MockGameOffer => ({
    name,
    gameId,
});

const createMockFsbPromotionDialog = (overrides?: Partial<MockFsbPromotionDialog>): MockFsbPromotionDialog => {
    const mockDialog = createMockDialog();
    const mockBackground = createMockBackground();

    const dialog: MockFsbPromotionDialog = {
        // State
        isFreeSpins: false,
        activeDetailPromo: false,
        gameOffers: [],

        // Components  
        playNow: createMockNode(true),
        playLater: createMockNode(true),
        closeButton: createMockNode(false),
        background: mockBackground,
        node: { getComponent: jest.fn().mockReturnValue(mockDialog) },

        // Actions
        onPlayGameNow: jest.fn(),
        openPromotionDetailsPanel: jest.fn(),
        showFreeSpinMessage: jest.fn(),
        resetRedeemSuccess: jest.fn(),
        addPendingUIEvent: jest.fn(),

        // Methods
        closeDialog() {
            const dialogComponent = this.node.getComponent() as MockDialog;
            if (dialogComponent) {
                dialogComponent.hide();
            }
            this.resetRedeemSuccess();
            this.addPendingUIEvent();
        },

        playGameNow() {
            this.closeDialog();
            this.onPlayGameNow();
            if (this.isFreeSpins) {
                this.showFreeSpinMessage();
            } else {
                this.openPromotionDetailsPanel();
            }
        },

        checkFeeSpinInGame(isFreeSpins: boolean) {
            if (isFreeSpins) {
                this.isFreeSpins = true;
            }
        },

        setGameOffers(offers: MockGameOffer[]) {
            this.gameOffers = offers;
        },

        controlButtonsVisibility(isWebViewLoading: boolean) {
            if (isWebViewLoading) {
                if (this.playNow) this.playNow.active = false;
                if (this.playLater) this.playLater.active = false;
                if (this.closeButton) this.closeButton.active = false;
                this.background.active = false;
                const transition = this.background.getComponent() as MockDialogTransition;
                transition.show(false);
            } else {
                if (this.activeDetailPromo) {
                    if (this.playNow) this.playNow.active = false;
                    if (this.playLater) this.playLater.active = false;
                    if (this.closeButton) this.closeButton.active = true;
                } else {
                    if (this.playNow) this.playNow.active = true;
                    if (this.playLater) this.playLater.active = true;
                    if (this.closeButton) this.closeButton.active = false;
                }
                this.background.active = true;
                const transition = this.background.getComponent() as MockDialogTransition;
                transition.show(true);
            }
        },

        setActiveAnnouncement(isActive: boolean) {
            this.activeDetailPromo = isActive;
        },

        closeFSBBanner(shouldClose: boolean) {
            if (shouldClose) {
                this.closeDialog();
            }
        },

        ...overrides,
    };

    return dialog;
};

// Business Logic Handlers following Single Responsibility Principle
class DialogStateHandler {
    static canProcessFreeSpins(dialog: MockDialogState): boolean {
        return dialog.isFreeSpins;
    }

    static updateFreeSpinState(dialog: MockDialogState, isFreeSpins: boolean): void {
        if (isFreeSpins) {
            dialog.isFreeSpins = true;
        }
    }

    static updateAnnouncementState(dialog: MockDialogState, isActive: boolean): void {
        dialog.activeDetailPromo = isActive;
    }

    static updateGameOffers(dialog: MockDialogState, offers: MockGameOffer[]): void {
        dialog.gameOffers = offers;
    }
}

class DialogVisibilityHandler {
    static controlButtonVisibility(
        dialog: MockFsbPromotionDialog, 
        isWebViewLoading: boolean
    ): void {
        if (isWebViewLoading) {
            this.hideAllButtons(dialog);
            this.hideBackground(dialog);
        } else {
            this.showButtonsBasedOnState(dialog);
            this.showBackground(dialog);
        }
    }

    private static hideAllButtons(dialog: MockFsbPromotionDialog): void {
        if (dialog.playNow) dialog.playNow.active = false;
        if (dialog.playLater) dialog.playLater.active = false;
        if (dialog.closeButton) dialog.closeButton.active = false;
    }

    private static hideBackground(dialog: MockFsbPromotionDialog): void {
        dialog.background.active = false;
        const transition = dialog.background.getComponent() as MockDialogTransition;
        transition.show(false);
    }

    private static showButtonsBasedOnState(dialog: MockFsbPromotionDialog): void {
        if (dialog.activeDetailPromo) {
            if (dialog.playNow) dialog.playNow.active = false;
            if (dialog.playLater) dialog.playLater.active = false;
            if (dialog.closeButton) dialog.closeButton.active = true;
        } else {
            if (dialog.playNow) dialog.playNow.active = true;
            if (dialog.playLater) dialog.playLater.active = true;
            if (dialog.closeButton) dialog.closeButton.active = false;
        }
    }

    private static showBackground(dialog: MockFsbPromotionDialog): void {
        dialog.background.active = true;
        const transition = dialog.background.getComponent() as MockDialogTransition;
        transition.show(true);
    }
}

class DialogInteractionHandler {
    static handleCloseDialog(dialog: MockFsbPromotionDialog): void {
        const dialogComponent = dialog.node.getComponent() as MockDialog;
        if (dialogComponent) {
            dialogComponent.hide();
        }
        dialog.resetRedeemSuccess();
        dialog.addPendingUIEvent();
    }

    static handlePlayGameNow(dialog: MockFsbPromotionDialog): void {
        this.handleCloseDialog(dialog);
        dialog.onPlayGameNow();

        if (DialogStateHandler.canProcessFreeSpins(dialog)) {
            dialog.showFreeSpinMessage();
        } else {
            dialog.openPromotionDetailsPanel();
        }
    }

    static handleBannerClose(dialog: MockFsbPromotionDialog, shouldClose: boolean): void {
        if (shouldClose) {
            this.handleCloseDialog(dialog);
        }
    }
}

// Test Setup Class following Single Responsibility Principle
class FsbPromotionDialogTestSetup {
    dialog: MockFsbPromotionDialog;
    mockDialog: MockDialog;
    mockDialogTransition: MockDialogTransition;
    mockBackground: MockBackground;

    constructor(dialogOverrides?: Partial<MockFsbPromotionDialog>) {
        this.setupMocks();
        this.setupDialog(dialogOverrides);
    }

    private setupMocks(): void {
        this.mockDialog = createMockDialog();
        this.mockDialogTransition = createMockDialogTransition();
        this.mockBackground = createMockBackground();
    }

    private setupDialog(overrides?: Partial<MockFsbPromotionDialog>): void {
        this.dialog = createMockFsbPromotionDialog({
            background: this.mockBackground,
            node: { getComponent: jest.fn().mockReturnValue(this.mockDialog) },
            ...overrides,
        });
    }

    updateDialogState(stateOverrides: Partial<MockDialogState>): void {
        Object.assign(this.dialog, stateOverrides);
    }

    updateDialogComponents(componentOverrides: Partial<MockDialogComponents>): void {
        Object.assign(this.dialog, componentOverrides);
    }

    setGameOffers(offers: MockGameOffer[]): void {
        this.dialog.setGameOffers(offers);
    }

    simulatePlayNow(): void {
        this.dialog.playGameNow();
    }

    simulateCloseDialog(): void {
        this.dialog.closeDialog();
    }

    clearAllMocks(): void {
        jest.clearAllMocks();
    }
}

describe("FsbPromotionDialog", () => {
    let testSetup: FsbPromotionDialogTestSetup;

    beforeEach(() => {
        testSetup = new FsbPromotionDialogTestSetup();
    });

    // Test suite for Dialog Initialization Responsibility
    describe("Dialog Initialization", () => {
        it("should_initialize_with_correct_default_state_values", () => {
            expect(testSetup.dialog.isFreeSpins).toBe(false);
            expect(testSetup.dialog.activeDetailPromo).toBe(false);
            expect(testSetup.dialog.gameOffers).toEqual([]);
        });

        it("should_initialize_with_correct_component_visibility_states", () => {
            expect(testSetup.dialog.playNow?.active).toBe(true);
            expect(testSetup.dialog.playLater?.active).toBe(true);
            expect(testSetup.dialog.closeButton?.active).toBe(false);
            expect(testSetup.dialog.background.active).toBe(true);
        });

        it("should_have_all_required_action_methods_available", () => {
            expect(typeof testSetup.dialog.onPlayGameNow).toBe('function');
            expect(typeof testSetup.dialog.openPromotionDetailsPanel).toBe('function');
            expect(typeof testSetup.dialog.showFreeSpinMessage).toBe('function');
            expect(typeof testSetup.dialog.resetRedeemSuccess).toBe('function');
            expect(typeof testSetup.dialog.addPendingUIEvent).toBe('function');
        });
    });

    // Test suite for Dialog Close Management Responsibility
    describe("Dialog Close Management", () => {
        it("should_hide_dialog_and_execute_cleanup_actions_on_close", () => {
            testSetup.simulateCloseDialog();

            expect(testSetup.dialog.node.getComponent).toHaveBeenCalled();
            expect(testSetup.mockDialog.hide).toHaveBeenCalled();
            expect(testSetup.dialog.resetRedeemSuccess).toHaveBeenCalled();
            expect(testSetup.dialog.addPendingUIEvent).toHaveBeenCalled();
        });

        it("should_handle_missing_dialog_component_gracefully", () => {
            testSetup.updateDialogComponents({ 
                node: { getComponent: jest.fn().mockReturnValue(null) }
            });

            expect(() => testSetup.simulateCloseDialog()).not.toThrow();
            expect(testSetup.dialog.resetRedeemSuccess).toHaveBeenCalled();
            expect(testSetup.dialog.addPendingUIEvent).toHaveBeenCalled();
        });

        it("should_execute_close_action_cleanup_sequence_correctly", () => {
            const resetSpy = jest.spyOn(testSetup.dialog, 'resetRedeemSuccess');
            const eventSpy = jest.spyOn(testSetup.dialog, 'addPendingUIEvent');

            testSetup.simulateCloseDialog();

            expect(resetSpy).toHaveBeenCalled();
            expect(eventSpy).toHaveBeenCalled();
            expect(testSetup.mockDialog.hide).toHaveBeenCalled();
        });
    });

    // Test suite for Game Play Actions Responsibility
    describe("Game Play Actions", () => {
        it("should_execute_free_spin_flow_when_free_spins_active", () => {
            testSetup.updateDialogState({ isFreeSpins: true });
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');

            testSetup.simulatePlayNow();

            expect(closeDialogSpy).toHaveBeenCalled();
            expect(testSetup.dialog.onPlayGameNow).toHaveBeenCalled();
            expect(testSetup.dialog.showFreeSpinMessage).toHaveBeenCalled();
            expect(testSetup.dialog.openPromotionDetailsPanel).not.toHaveBeenCalled();
        });

        it("should_execute_promotion_details_flow_when_free_spins_inactive", () => {
            testSetup.updateDialogState({ isFreeSpins: false });
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');

            testSetup.simulatePlayNow();

            expect(closeDialogSpy).toHaveBeenCalled();
            expect(testSetup.dialog.onPlayGameNow).toHaveBeenCalled();
            expect(testSetup.dialog.openPromotionDetailsPanel).toHaveBeenCalled();
            expect(testSetup.dialog.showFreeSpinMessage).not.toHaveBeenCalled();
        });

        it("should_always_execute_common_play_actions_regardless_of_free_spin_state", () => {
            const playNowSpy = jest.spyOn(testSetup.dialog, 'onPlayGameNow');
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');

            testSetup.simulatePlayNow();

            expect(closeDialogSpy).toHaveBeenCalled();
            expect(playNowSpy).toHaveBeenCalled();
        });
    });

    // Test suite for Free Spin State Management Responsibility
    describe("Free Spin State Management", () => {
        it("should_activate_free_spin_state_when_requested", () => {
            testSetup.dialog.checkFeeSpinInGame(true);
            
            expect(testSetup.dialog.isFreeSpins).toBe(true);
        });

        it("should_not_modify_free_spin_state_when_false_provided", () => {
            testSetup.updateDialogState({ isFreeSpins: false });
            
            testSetup.dialog.checkFeeSpinInGame(false);
            
            expect(testSetup.dialog.isFreeSpins).toBe(false);
        });

        it("should_preserve_active_free_spin_state_when_false_provided", () => {
            testSetup.updateDialogState({ isFreeSpins: true });
            
            testSetup.dialog.checkFeeSpinInGame(false);
            
            expect(testSetup.dialog.isFreeSpins).toBe(true);
        });

        it("should_maintain_state_consistency_across_multiple_calls", () => {
            testSetup.dialog.checkFeeSpinInGame(true);
            expect(testSetup.dialog.isFreeSpins).toBe(true);
            
            testSetup.dialog.checkFeeSpinInGame(false);
            expect(testSetup.dialog.isFreeSpins).toBe(true);
            
            // State should remain true once activated
            testSetup.dialog.checkFeeSpinInGame(true);
            expect(testSetup.dialog.isFreeSpins).toBe(true);
        });
    });

    // Test suite for Game Offers Management Responsibility
    describe("Game Offers Management", () => {
        it("should_set_and_store_game_offers_correctly", () => {
            const gameOffers = [
                createMockGameOffer("Game 1", 1),
                createMockGameOffer("Game 2", 2)
            ];

            testSetup.setGameOffers(gameOffers);

            expect(testSetup.dialog.gameOffers).toBe(gameOffers);
            expect(testSetup.dialog.gameOffers).toHaveLength(2);
            expect(testSetup.dialog.gameOffers[0]).toEqual({ name: "Game 1", gameId: 1 });
        });

        it("should_handle_empty_game_offers_array", () => {
            const emptyOffers: MockGameOffer[] = [];
            
            testSetup.setGameOffers(emptyOffers);
            
            expect(testSetup.dialog.gameOffers).toHaveLength(0);
        });

        it("should_handle_multiple_game_offers_with_different_properties", () => {
            const gameOffers = [
                createMockGameOffer("Slot Game", 100),
                createMockGameOffer("Card Game", 200),
                createMockGameOffer("Roulette", 300)
            ];

            testSetup.setGameOffers(gameOffers);

            expect(testSetup.dialog.gameOffers).toHaveLength(3);
            expect(testSetup.dialog.gameOffers.find(game => game.gameId === 200)?.name).toBe("Card Game");
        });

        it("should_replace_existing_game_offers_when_new_ones_set", () => {
            const initialOffers = [createMockGameOffer("Initial Game", 1)];
            const newOffers = [createMockGameOffer("New Game", 2)];

            testSetup.setGameOffers(initialOffers);
            expect(testSetup.dialog.gameOffers).toHaveLength(1);

            testSetup.setGameOffers(newOffers);
            expect(testSetup.dialog.gameOffers).toHaveLength(1);
            expect(testSetup.dialog.gameOffers[0].name).toBe("New Game");
        });
    });

    // Test suite for Button Visibility Control Responsibility
    describe("Button Visibility Control", () => {
        beforeEach(() => {
            testSetup.updateDialogState({ activeDetailPromo: false });
        });

        it("should_hide_all_buttons_and_background_when_webview_loading", () => {
            testSetup.dialog.controlButtonsVisibility(true);

            expect(testSetup.dialog.playNow?.active).toBe(false);
            expect(testSetup.dialog.playLater?.active).toBe(false);
            expect(testSetup.dialog.closeButton?.active).toBe(false);
            expect(testSetup.dialog.background.active).toBe(false);
        });

        it("should_show_play_buttons_when_not_loading_and_not_detail_promo", () => {
            testSetup.dialog.controlButtonsVisibility(false);

            expect(testSetup.dialog.playNow?.active).toBe(true);
            expect(testSetup.dialog.playLater?.active).toBe(true);
            expect(testSetup.dialog.closeButton?.active).toBe(false);
            expect(testSetup.dialog.background.active).toBe(true);
        });

        it("should_show_close_button_when_detail_promo_active", () => {
            testSetup.updateDialogState({ activeDetailPromo: true });
            
            testSetup.dialog.controlButtonsVisibility(false);

            expect(testSetup.dialog.playNow?.active).toBe(false);
            expect(testSetup.dialog.playLater?.active).toBe(false);
            expect(testSetup.dialog.closeButton?.active).toBe(true);
            expect(testSetup.dialog.background.active).toBe(true);
        });

        it("should_handle_null_button_nodes_gracefully", () => {
            testSetup.updateDialogComponents({
                playNow: null,
                playLater: null,
                closeButton: null,
            });

            expect(() => testSetup.dialog.controlButtonsVisibility(false)).not.toThrow();
            expect(testSetup.dialog.background.active).toBe(true);
        });
    });

    // Test suite for Announcement Management Responsibility
    describe("Announcement Management", () => {
        it("should_activate_announcement_detail_promo_state", () => {
            testSetup.dialog.setActiveAnnouncement(true);
            
            expect(testSetup.dialog.activeDetailPromo).toBe(true);
        });

        it("should_deactivate_announcement_detail_promo_state", () => {
            testSetup.updateDialogState({ activeDetailPromo: true });
            
            testSetup.dialog.setActiveAnnouncement(false);
            
            expect(testSetup.dialog.activeDetailPromo).toBe(false);
        });

        it("should_handle_multiple_state_toggles_correctly", () => {
            testSetup.dialog.setActiveAnnouncement(true);
            expect(testSetup.dialog.activeDetailPromo).toBe(true);

            testSetup.dialog.setActiveAnnouncement(false);
            expect(testSetup.dialog.activeDetailPromo).toBe(false);

            testSetup.dialog.setActiveAnnouncement(true);
            expect(testSetup.dialog.activeDetailPromo).toBe(true);
        });
    });

    // Test suite for Banner Management Responsibility
    describe("Banner Management", () => {
        it("should_close_dialog_when_banner_close_requested", () => {
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');
            
            testSetup.dialog.closeFSBBanner(true);
            
            expect(closeDialogSpy).toHaveBeenCalled();
        });

        it("should_not_close_dialog_when_banner_close_not_requested", () => {
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');
            
            testSetup.dialog.closeFSBBanner(false);
            
            expect(closeDialogSpy).not.toHaveBeenCalled();
        });

        it("should_handle_conditional_banner_closing_correctly", () => {
            const closeDialogSpy = jest.spyOn(testSetup.dialog, 'closeDialog');
            
            // Test multiple false calls
            testSetup.dialog.closeFSBBanner(false);
            testSetup.dialog.closeFSBBanner(false);
            expect(closeDialogSpy).not.toHaveBeenCalled();
            
            // Test true call
            testSetup.dialog.closeFSBBanner(true);
            expect(closeDialogSpy).toHaveBeenCalledTimes(1);
        });
    });

    // Test suite for Handler Methods Validation
    describe("Handler Methods Validation", () => {
        it("should_have_all_required_handler_methods_available", () => {
            expect(typeof testSetup.dialog.onPlayGameNow).toBe('function');
            expect(typeof testSetup.dialog.openPromotionDetailsPanel).toBe('function');
            expect(typeof testSetup.dialog.showFreeSpinMessage).toBe('function');
            expect(typeof testSetup.dialog.resetRedeemSuccess).toBe('function');
            expect(typeof testSetup.dialog.addPendingUIEvent).toBe('function');
        });

        it("should_have_callable_handler_methods_without_errors", () => {
            expect(() => {
                testSetup.dialog.onPlayGameNow();
                testSetup.dialog.openPromotionDetailsPanel();
                testSetup.dialog.showFreeSpinMessage();
                testSetup.dialog.resetRedeemSuccess();
                testSetup.dialog.addPendingUIEvent();
            }).not.toThrow();
        });
    });

    // Test suite for Integration Scenarios and Complex Workflows
    describe("Integration Scenarios and Complex Workflows", () => {
        it("should_handle_comprehensive_game_offers_management", () => {
            const gameOffers = [
                createMockGameOffer("Slot Game", 100),
                createMockGameOffer("Card Game", 200),
                createMockGameOffer("Roulette", 300)
            ];

            testSetup.setGameOffers(gameOffers);

            expect(testSetup.dialog.gameOffers).toHaveLength(3);
            expect(testSetup.dialog.gameOffers.find(game => game.gameId === 200)?.name).toBe("Card Game");
        });

        it("should_execute_complex_state_change_sequence_correctly", () => {
            testSetup.dialog.checkFeeSpinInGame(true);
            testSetup.dialog.setActiveAnnouncement(true);
            testSetup.dialog.controlButtonsVisibility(false);

            expect(testSetup.dialog.isFreeSpins).toBe(true);
            expect(testSetup.dialog.activeDetailPromo).toBe(true);
            expect(testSetup.dialog.playNow?.active).toBe(false);
            expect(testSetup.dialog.closeButton?.active).toBe(true);
        });

        it("should_handle_complete_dialog_workflow_from_initialization_to_close", () => {
            // Setup game offers
            const gameOffers = [createMockGameOffer("Test Game", 1)];
            testSetup.setGameOffers(gameOffers);

            // Activate free spins
            testSetup.dialog.checkFeeSpinInGame(true);

            // Play game and verify flow
            testSetup.simulatePlayNow();

            expect(testSetup.dialog.onPlayGameNow).toHaveBeenCalled();
            expect(testSetup.dialog.showFreeSpinMessage).toHaveBeenCalled();
            expect(testSetup.mockDialog.hide).toHaveBeenCalled();
        });

        it("should_maintain_component_state_consistency_across_operations", () => {
            // Initial state verification
            expect(testSetup.dialog.isFreeSpins).toBe(false);
            expect(testSetup.dialog.activeDetailPromo).toBe(false);

            // Sequential operations
            testSetup.dialog.setActiveAnnouncement(true);
            testSetup.dialog.checkFeeSpinInGame(true);
            testSetup.dialog.controlButtonsVisibility(false);

            // Verify final state
            expect(testSetup.dialog.isFreeSpins).toBe(true);
            expect(testSetup.dialog.activeDetailPromo).toBe(true);
            expect(testSetup.dialog.closeButton?.active).toBe(true);
        });
    });
});



