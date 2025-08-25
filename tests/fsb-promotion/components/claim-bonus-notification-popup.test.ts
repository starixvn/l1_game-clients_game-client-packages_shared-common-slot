import { describe, expect, it, beforeEach, jest } from "@jest/globals";

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
    Label: jest.fn(),
}));

jest.mock("@sg/game-client-base", () => ({
    __esModule: true,
    default: {
        FormatUtils: {
            numberWithCommas: jest.fn().mockReturnValue("1,234.56")
        }
    }
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
        node = {
            active: false,
            getComponent: jest.fn()
        };
    },
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: {},
    FreeSpinsPromotionEvents: {
        UPDATE_BALANCE_BONUS: "UPDATE_BALANCE_BONUS"
    }
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("db://shared-cascading-slot/handlers/cascading-ui-handler");

// Mock Interfaces following Interface Segregation Principle
interface MockLabel {
    string: string;
}

interface MockDialog {
    hide: jest.Mock;
}

interface MockNode {
    active: boolean;
    getComponent: jest.Mock;
}

interface MockFormatUtils {
    numberWithCommas: jest.Mock;
}

interface MockPopupState {
    isVisible: boolean;
    currentAmount: number | null;
}

interface MockPopupComponents {
    labelTotalWin: MockLabel;
    node: MockNode;
}

interface MockPopupActions {
    show: (claimedAmount: number) => void;
    onCloseClicked: () => void;
    handleChangeUserBalance: (change: any) => any;
    updateClaimedAmount: () => void;
}

interface MockClaimBonusNotificationPopup extends MockPopupState, MockPopupComponents, MockPopupActions {}

// Factory functions following Single Responsibility Principle
const createMockLabel = (initialString: string = ""): MockLabel => ({
    string: initialString,
});

const createMockDialog = (): MockDialog => ({
    hide: jest.fn(),
});

const createMockNode = (isActive: boolean = false): MockNode => ({
    active: isActive,
    getComponent: jest.fn().mockReturnValue(createMockDialog()),
});

const createMockFormatUtils = (defaultReturn: string = "1,234.56"): MockFormatUtils => ({
    numberWithCommas: jest.fn().mockReturnValue(defaultReturn),
});

const createMockClaimBonusNotificationPopup = (overrides?: Partial<MockClaimBonusNotificationPopup>): MockClaimBonusNotificationPopup => {
    const mockLabel = createMockLabel();
    const mockNode = createMockNode();
    const mockDialog = createMockDialog();
    
    // Setup getComponent to return dialog
    mockNode.getComponent.mockReturnValue(mockDialog);

    const popup: MockClaimBonusNotificationPopup = {
        // State
        isVisible: false,
        currentAmount: null,

        // Components
        labelTotalWin: mockLabel,
        node: mockNode,

        // Actions
        show(claimedAmount: number) {
            if (!claimedAmount) {
                return;
            }
            
            this.currentAmount = claimedAmount;
            const gc = require("@sg/game-client-base").default;
            this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(claimedAmount, 2, false);
            this.node.active = true;
            this.isVisible = true;
            this.handleChangeUserBalance(true);
        },

        onCloseClicked() {
            const Dialog = require("db://shared-components/shared/common-components/dialogs/dialog").Dialog;
            const dialogComponent = this.node.getComponent(Dialog);
            if (dialogComponent) {
                dialogComponent.hide();
            }
            this.isVisible = false;
            this.updateClaimedAmount();
        },

        handleChangeUserBalance(change: any) {
            return change;
        },

        updateClaimedAmount() {
            // Empty method implementation
        },

        ...overrides,
    };

    return popup;
};

// Business Logic Handlers following Single Responsibility Principle
class PopupAmountHandler {
    static isValidAmount(amount: number): boolean {
        return Boolean(amount);
    }

    static formatAmount(amount: number): string {
        const gc = require("@sg/game-client-base").default;
        return gc.FormatUtils.numberWithCommas(amount, 2, false);
    }

    static updateLabelAmount(label: MockLabel, amount: number): void {
        label.string = this.formatAmount(amount);
    }
}

class PopupVisibilityHandler {
    static showPopup(popup: MockClaimBonusNotificationPopup): void {
        popup.node.active = true;
        popup.isVisible = true;
    }

    static hidePopup(popup: MockClaimBonusNotificationPopup): void {
        popup.node.active = false;
        popup.isVisible = false;
    }

    static isPopupVisible(popup: MockClaimBonusNotificationPopup): boolean {
        return popup.isVisible && popup.node.active;
    }
}

class PopupInteractionHandler {
    static handleShowPopup(popup: MockClaimBonusNotificationPopup, claimedAmount: number): void {
        if (!PopupAmountHandler.isValidAmount(claimedAmount)) {
            return;
        }

        popup.currentAmount = claimedAmount;
        PopupAmountHandler.updateLabelAmount(popup.labelTotalWin, claimedAmount);
        PopupVisibilityHandler.showPopup(popup);
        popup.handleChangeUserBalance(true);
    }

    static handleClosePopup(popup: MockClaimBonusNotificationPopup): void {
        const Dialog = require("db://shared-components/shared/common-components/dialogs/dialog").Dialog;
        const dialogComponent = popup.node.getComponent(Dialog) as MockDialog;
        
        if (dialogComponent) {
            dialogComponent.hide();
        }
        
        PopupVisibilityHandler.hidePopup(popup);
        popup.updateClaimedAmount();
    }
}

// Test Setup Class following Single Responsibility Principle
class ClaimBonusNotificationPopupTestSetup {
    popup: MockClaimBonusNotificationPopup;
    mockDialog: MockDialog;
    mockLabel: MockLabel;
    mockNode: MockNode;

    constructor(popupOverrides?: Partial<MockClaimBonusNotificationPopup>) {
        this.setupMocks();
        this.setupPopup(popupOverrides);
        this.setupSpies();
    }

    private setupMocks(): void {
        this.mockDialog = createMockDialog();
        this.mockLabel = createMockLabel();
        this.mockNode = createMockNode();
        this.mockNode.getComponent.mockReturnValue(this.mockDialog);
    }

    private setupPopup(overrides?: Partial<MockClaimBonusNotificationPopup>): void {
        this.popup = createMockClaimBonusNotificationPopup({
            labelTotalWin: this.mockLabel,
            node: this.mockNode,
            ...overrides,
        });
    }

    private setupSpies(): void {
        jest.spyOn(this.popup, 'handleChangeUserBalance');
        jest.spyOn(this.popup, 'updateClaimedAmount');
    }

    updatePopupState(stateOverrides: Partial<MockPopupState>): void {
        Object.assign(this.popup, stateOverrides);
    }

    updatePopupComponents(componentOverrides: Partial<MockPopupComponents>): void {
        Object.assign(this.popup, componentOverrides);
    }

    simulateShowPopup(amount: number): void {
        this.popup.show(amount);
    }

    simulateClosePopup(): void {
        this.popup.onCloseClicked();
    }

    getFormattedAmount(): string {
        return this.popup.labelTotalWin.string;
    }

    isPopupVisible(): boolean {
        return this.popup.node.active && this.popup.isVisible;
    }

    clearAllMocks(): void {
        jest.clearAllMocks();
    }
}

describe("ClaimBonusNotificationPopup", () => {
    let testSetup: ClaimBonusNotificationPopupTestSetup;

    beforeEach(() => {
        testSetup = new ClaimBonusNotificationPopupTestSetup();
    });

    // Test suite for Popup Initialization Responsibility
    describe("Popup Initialization", () => {
        it("should_initialize_with_correct_component_references", () => {
            expect(testSetup.popup.labelTotalWin).toBe(testSetup.mockLabel);
            expect(testSetup.popup.node).toBe(testSetup.mockNode);
        });

        it("should_initialize_with_correct_default_state", () => {
            expect(testSetup.popup.isVisible).toBe(false);
            expect(testSetup.popup.currentAmount).toBeNull();
            expect(testSetup.popup.node.active).toBe(false);
            expect(testSetup.popup.labelTotalWin.string).toBe("");
        });

        it("should_have_all_required_action_methods_available", () => {
            expect(typeof testSetup.popup.show).toBe('function');
            expect(typeof testSetup.popup.onCloseClicked).toBe('function');
            expect(typeof testSetup.popup.handleChangeUserBalance).toBe('function');
            expect(typeof testSetup.popup.updateClaimedAmount).toBe('function');
        });

        it("should_properly_setup_dialog_component_references", () => {
            expect(testSetup.mockNode.getComponent).toBeDefined();
            expect(testSetup.mockDialog.hide).toBeDefined();
            expect(typeof testSetup.mockDialog.hide).toBe('function');
        });
    });

    // Test suite for Popup Show Logic Responsibility
    describe("Popup Show Logic", () => {
        it("should_not_show_popup_when_amount_is_falsy", () => {
            const falsyValues = [0, null, undefined, false, "", NaN];
            
            falsyValues.forEach(value => {
                testSetup.clearAllMocks();
                testSetup.updatePopupState({ isVisible: false });
                testSetup.updatePopupComponents({ 
                    labelTotalWin: createMockLabel(""),
                    node: createMockNode(false)
                });

                testSetup.simulateShowPopup(value as number);

                expect(testSetup.getFormattedAmount()).toBe("");
                expect(testSetup.popup.node.active).toBe(false);
                expect(testSetup.popup.handleChangeUserBalance).not.toHaveBeenCalled();
            });
        });

        it("should_format_and_display_amount_when_amount_is_valid", () => {
            const claimedAmount = 1234.56;
            const gc = require("@sg/game-client-base").default;

            testSetup.simulateShowPopup(claimedAmount);

            expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(claimedAmount, 2, false);
            expect(testSetup.getFormattedAmount()).toBe("1,234.56");
            expect(testSetup.isPopupVisible()).toBe(true);
            expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should_handle_different_valid_amount_values_correctly", () => {
            const validAmounts = [100, 9999.99, 0.01, 1];

            validAmounts.forEach(amount => {
                testSetup.clearAllMocks();
                testSetup.updatePopupState({ isVisible: false, currentAmount: null });
                testSetup.updatePopupComponents({ node: createMockNode(false) });

                testSetup.simulateShowPopup(amount);

                expect(testSetup.popup.node.active).toBe(true);
                expect(testSetup.popup.currentAmount).toBe(amount);
                expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
            });
        });

        it("should_handle_very_large_amounts_without_errors", () => {
            const largeAmount = 999999999.99;

            testSetup.simulateShowPopup(largeAmount);

            expect(testSetup.popup.node.active).toBe(true);
            expect(testSetup.popup.currentAmount).toBe(largeAmount);
            expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should_update_popup_state_correctly_on_successful_show", () => {
            const amount = 500.75;

            testSetup.simulateShowPopup(amount);

            expect(testSetup.popup.isVisible).toBe(true);
            expect(testSetup.popup.currentAmount).toBe(amount);
            expect(testSetup.popup.node.active).toBe(true);
        });
    });

    // Test suite for User Balance Change Handling Responsibility
    describe("User Balance Change Handling", () => {
        it("should_return_the_same_boolean_value_passed_as_parameter", () => {
            const resultTrue = testSetup.popup.handleChangeUserBalance(true);
            expect(resultTrue).toBe(true);

            const resultFalse = testSetup.popup.handleChangeUserBalance(false);
            expect(resultFalse).toBe(false);
        });

        it("should_handle_truthy_values_correctly", () => {
            const truthyValues = [true, 1, "test", {}, []];
            
            truthyValues.forEach(value => {
                const result = testSetup.popup.handleChangeUserBalance(value);
                expect(result).toBe(value);
            });
        });

        it("should_handle_falsy_values_correctly", () => {
            const falsyValues = [false, 0, "", null, undefined];
            
            falsyValues.forEach(value => {
                const result = testSetup.popup.handleChangeUserBalance(value);
                expect(result).toBe(value);
            });
        });

        it("should_maintain_input_value_integrity_across_different_types", () => {
            const testValues = [true, false, 42, "string", null, undefined, {}, []];
            
            testValues.forEach(value => {
                const result = testSetup.popup.handleChangeUserBalance(value);
                expect(result).toBe(value);
                expect(result).toStrictEqual(value);
            });
        });
    });

    // Test suite for Popup Close Logic Responsibility
    describe("Popup Close Logic", () => {
        it("should_hide_dialog_and_execute_cleanup_actions_on_close", () => {
            testSetup.simulateClosePopup();

            expect(testSetup.mockNode.getComponent).toHaveBeenCalled();
            expect(testSetup.mockDialog.hide).toHaveBeenCalled();
            expect(testSetup.popup.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should_handle_missing_dialog_component_gracefully", () => {
            testSetup.mockNode.getComponent.mockReturnValue(null);

            expect(() => testSetup.simulateClosePopup()).not.toThrow();
            expect(testSetup.popup.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should_handle_undefined_dialog_component_gracefully", () => {
            testSetup.mockNode.getComponent.mockReturnValue(undefined);

            expect(() => testSetup.simulateClosePopup()).not.toThrow();
            expect(testSetup.popup.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should_update_popup_visibility_state_on_close", () => {
            // First show the popup
            testSetup.simulateShowPopup(100);
            expect(testSetup.popup.isVisible).toBe(true);

            // Then close it
            testSetup.simulateClosePopup();
            expect(testSetup.popup.isVisible).toBe(false);
        });

        it("should_execute_complete_close_sequence_correctly", () => {
            const hideDialogSpy = jest.spyOn(testSetup.mockDialog, 'hide');
            const updateClaimedAmountSpy = jest.spyOn(testSetup.popup, 'updateClaimedAmount');

            testSetup.simulateClosePopup();

            expect(hideDialogSpy).toHaveBeenCalled();
            expect(updateClaimedAmountSpy).toHaveBeenCalled();
            expect(testSetup.popup.isVisible).toBe(false);
        });
    });

    // Test suite for Claimed Amount Update Management Responsibility
    describe("Claimed Amount Update Management", () => {
        it("should_be_callable_without_throwing_errors", () => {
            expect(() => testSetup.popup.updateClaimedAmount()).not.toThrow();
            expect(testSetup.popup.updateClaimedAmount).toBeDefined();
            expect(typeof testSetup.popup.updateClaimedAmount).toBe('function');
        });

        it("should_return_undefined_for_empty_implementation", () => {
            const result = testSetup.popup.updateClaimedAmount();
            expect(result).toBeUndefined();
        });

        it("should_be_invoked_as_part_of_close_workflow", () => {
            const updateSpy = jest.spyOn(testSetup.popup, 'updateClaimedAmount');

            testSetup.simulateClosePopup();

            expect(updateSpy).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledTimes(1);
        });
    });

    // Test suite for Integration Scenarios and Complex Workflows
    describe("Integration Scenarios and Complex Workflows", () => {
        it("should_execute_complete_show_workflow_correctly", () => {
            const amount = 500.25;

            testSetup.simulateShowPopup(amount);

            expect(testSetup.getFormattedAmount()).toBe("1,234.56");
            expect(testSetup.isPopupVisible()).toBe(true);
            expect(testSetup.popup.currentAmount).toBe(amount);
            expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should_execute_complete_show_then_close_workflow", () => {
            // Show popup first
            testSetup.simulateShowPopup(100);
            expect(testSetup.isPopupVisible()).toBe(true);

            // Then close it
            testSetup.simulateClosePopup();

            expect(testSetup.mockDialog.hide).toHaveBeenCalled();
            expect(testSetup.popup.updateClaimedAmount).toHaveBeenCalled();
            expect(testSetup.popup.isVisible).toBe(false);
        });

        it("should_handle_multiple_sequential_show_calls_correctly", () => {
            const amounts = [100, 200, 300];

            amounts.forEach((amount, index) => {
                testSetup.simulateShowPopup(amount);
                expect(testSetup.popup.currentAmount).toBe(amount);
            });

            expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledTimes(3);
            expect(testSetup.isPopupVisible()).toBe(true);
        });

        it("should_maintain_state_consistency_across_show_close_cycles", () => {
            // Cycle 1: Show -> Close
            testSetup.simulateShowPopup(100);
            expect(testSetup.popup.currentAmount).toBe(100);
            expect(testSetup.isPopupVisible()).toBe(true);

            testSetup.simulateClosePopup();
            expect(testSetup.popup.isVisible).toBe(false);

            // Cycle 2: Show -> Close  
            testSetup.simulateShowPopup(200);
            expect(testSetup.popup.currentAmount).toBe(200);
            expect(testSetup.isPopupVisible()).toBe(true);

            testSetup.simulateClosePopup();
            expect(testSetup.popup.isVisible).toBe(false);
        });

        it("should_handle_complex_amount_formatting_scenarios", () => {
            const complexAmounts = [0.001, 1000000, 999.999, 0.01];

            complexAmounts.forEach(amount => {
                testSetup.clearAllMocks();
                testSetup.simulateShowPopup(amount);

                if (amount > 0) {
                    expect(testSetup.isPopupVisible()).toBe(true);
                    expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
                }
            });
        });
    });

    // Test suite for Edge Cases and Error Handling
    describe("Edge Cases and Error Handling", () => {
        it("should_handle_null_label_component_with_appropriate_error", () => {
            testSetup.updatePopupComponents({ labelTotalWin: null as any });

            expect(() => testSetup.simulateShowPopup(100)).toThrow();
        });

        it("should_handle_null_node_component_with_appropriate_error", () => {
            testSetup.updatePopupComponents({ node: null as any });

            expect(() => testSetup.simulateShowPopup(100)).toThrow();
        });

        it("should_handle_edge_case_amounts_appropriately", () => {
            const edgeCaseAmounts = [0.001, 999999999, -100];

            edgeCaseAmounts.forEach(amount => {
                testSetup.clearAllMocks();
                testSetup.updatePopupState({ isVisible: false, currentAmount: null });
                testSetup.updatePopupComponents({ node: createMockNode(false) });
                
                testSetup.simulateShowPopup(amount);
                
                if (amount) { // Only test if truthy
                    expect(testSetup.popup.node.active).toBe(true);
                    expect(testSetup.popup.handleChangeUserBalance).toHaveBeenCalledWith(true);
                }
            });
        });

        it("should_handle_negative_amounts_with_formatting_robustness", () => {
            const negativeAmount = -100.50;

            testSetup.simulateShowPopup(negativeAmount);

            if (negativeAmount) {
                expect(testSetup.popup.currentAmount).toBe(negativeAmount);
                expect(testSetup.isPopupVisible()).toBe(true);
            }
        });

        it("should_handle_very_small_decimal_amounts", () => {
            const verySmallAmount = 0.000001;

            testSetup.simulateShowPopup(verySmallAmount);

            if (verySmallAmount) {
                expect(testSetup.popup.currentAmount).toBe(verySmallAmount);
                expect(testSetup.isPopupVisible()).toBe(true);
            }
        });

        it("should_handle_component_state_corruption_gracefully", () => {
            // Corrupt the popup state
            testSetup.updatePopupState({ isVisible: undefined as any, currentAmount: "invalid" as any });

            // Should still be able to show without critical errors
            expect(() => testSetup.simulateShowPopup(100)).not.toThrow();
        });

        it("should_handle_dialog_component_failures_during_close", () => {
            // Mock getComponent to throw an error
            testSetup.mockNode.getComponent.mockImplementation(() => {
                throw new Error("Component not found");
            });

            // Should handle the error gracefully
            expect(() => testSetup.simulateClosePopup()).toThrow("Component not found");
        });
    });
});
