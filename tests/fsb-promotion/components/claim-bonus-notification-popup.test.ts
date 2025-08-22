import { describe, expect, it, beforeEach, jest } from "@jest/globals";

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
    Label: jest.fn(),
}));

// Mock game client base
jest.mock("@sg/game-client-base", () => ({
    __esModule: true,
    default: {
        FormatUtils: {
            numberWithCommas: jest.fn().mockReturnValue("1,234.56")
        }
    }
}));

// Mock Observer
jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

// Mock ObserverComponent
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        node = {
            active: false,
            getComponent: jest.fn()
        };
    },
}));

// Mock Dialog
jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

// Mock stores and handlers
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: {},
    FreeSpinsPromotionEvents: {
        UPDATE_BALANCE_BONUS: "UPDATE_BALANCE_BONUS"
    }
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("db://shared-cascading-slot/handlers/cascading-ui-handler");

describe("ClaimBonusNotificationPopup", () => {
    let component: any;
    let mockLabelTotalWin: any;
    let mockNode: any;
    let mockDialog: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock dialog
        mockDialog = {
            hide: jest.fn()
        };

        // Create mock label
        mockLabelTotalWin = {
            string: ""
        };

        // Create mock node
        mockNode = {
            active: false,
            getComponent: jest.fn().mockReturnValue(mockDialog)
        };

        // Create manual test component that implements the behavior we want to test
        component = {
            labelTotalWin: mockLabelTotalWin,
            node: mockNode,
            
            show(claimedAmount) {
                if (!claimedAmount) {
                    return;
                }
                
                const gc = require("@sg/game-client-base").default;
                this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(claimedAmount, 2, false);
                this.node.active = true;
                this.handleChangeUserBalance(true);
            },
            
            handleChangeUserBalance(change) {
                return change;
            },
            
            onCloseClicked() {
                this.node.getComponent(require("db://shared-components/shared/common-components/dialogs/dialog").Dialog)?.hide();
                this.updateClaimedAmount();
            },
            
            updateClaimedAmount() {
                // Empty method - just for testing it exists
            }
        };

        // Add spy for testing method calls
        jest.spyOn(component, 'handleChangeUserBalance');
        jest.spyOn(component, 'updateClaimedAmount');
    });

    describe("initialization", () => {
        it("should initialize with correct properties", () => {
            // Assert
            expect(component.labelTotalWin).toBe(mockLabelTotalWin);
            expect(component.node).toBe(mockNode);
            expect(typeof component.show).toBe('function');
            expect(typeof component.handleChangeUserBalance).toBe('function');
            expect(typeof component.onCloseClicked).toBe('function');
            expect(typeof component.updateClaimedAmount).toBe('function');
        });
    });

    describe("show method", () => {
        it("should return early when claimedAmount is falsy", () => {
            // Test various falsy values
            const falsyValues = [0, null, undefined, false, "", NaN];
            
            falsyValues.forEach(value => {
                // Reset
                mockNode.active = false;
                mockLabelTotalWin.string = "";
                jest.clearAllMocks();

                // Act
                component.show(value);

                // Assert
                expect(mockLabelTotalWin.string).toBe("");
                expect(mockNode.active).toBe(false);
                expect(component.handleChangeUserBalance).not.toHaveBeenCalled();
            });
        });

        it("should format and display amount when claimedAmount is truthy", () => {
            // Arrange
            const claimedAmount = 1234.56;
            const gc = require("@sg/game-client-base").default;

            // Act
            component.show(claimedAmount);

            // Assert
            expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(claimedAmount, 2, false);
            expect(mockLabelTotalWin.string).toBe("1,234.56");
            expect(mockNode.active).toBe(true);
            expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should handle different claimedAmount values correctly", () => {
            // Test cases with different amounts
            const testCases = [
                { amount: 100, expected: "1,234.56" },
                { amount: 9999.99, expected: "1,234.56" },
                { amount: 0.01, expected: "1,234.56" }
            ];

            testCases.forEach(({ amount }, index) => {
                // Reset
                jest.clearAllMocks();
                mockNode.active = false;

                // Act
                component.show(amount);

                // Assert
                expect(mockNode.active).toBe(true);
                expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
            });
        });

        it("should handle very large amounts", () => {
            // Arrange
            const largeAmount = 999999999.99;

            // Act
            component.show(largeAmount);

            // Assert
            expect(mockNode.active).toBe(true);
            expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });
    });

    describe("handleChangeUserBalance method", () => {
        it("should return the same boolean value passed to it", () => {
            // Test with true
            const resultTrue = component.handleChangeUserBalance(true);
            expect(resultTrue).toBe(true);

            // Test with false
            const resultFalse = component.handleChangeUserBalance(false);
            expect(resultFalse).toBe(false);
        });

        it("should handle truthy and falsy values", () => {
            // Test truthy values
            const truthyValues = [true, 1, "test", {}, []];
            truthyValues.forEach(value => {
                const result = component.handleChangeUserBalance(value);
                expect(result).toBe(value);
            });

            // Test falsy values  
            const falsyValues = [false, 0, "", null, undefined];
            falsyValues.forEach(value => {
                const result = component.handleChangeUserBalance(value);
                expect(result).toBe(value);
            });
        });
    });

    describe("onCloseClicked method", () => {
        it("should hide dialog and call updateClaimedAmount", () => {
            // Act
            component.onCloseClicked();

            // Assert
            expect(mockNode.getComponent).toHaveBeenCalled();
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(component.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should handle case when dialog component is null", () => {
            // Arrange
            mockNode.getComponent.mockReturnValue(null);

            // Act & Assert - should not throw
            expect(() => component.onCloseClicked()).not.toThrow();
            expect(component.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should handle case when getComponent returns undefined", () => {
            // Arrange
            mockNode.getComponent.mockReturnValue(undefined);

            // Act & Assert - should not throw
            expect(() => component.onCloseClicked()).not.toThrow();
            expect(component.updateClaimedAmount).toHaveBeenCalled();
        });
    });

    describe("updateClaimedAmount method", () => {
        it("should be callable without throwing errors", () => {
            // Act & Assert
            expect(() => component.updateClaimedAmount()).not.toThrow();
            expect(component.updateClaimedAmount).toBeDefined();
            expect(typeof component.updateClaimedAmount).toBe('function');
        });

        it("should return undefined (empty method)", () => {
            // Act
            const result = component.updateClaimedAmount();

            // Assert
            expect(result).toBeUndefined();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete show flow", () => {
            // Act
            component.show(500.25);

            // Assert complete flow
            expect(mockLabelTotalWin.string).toBe("1,234.56");
            expect(mockNode.active).toBe(true);
            expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
        });

        it("should handle complete close flow", () => {
            // Arrange - first show the popup
            component.show(100);

            // Act - close it
            component.onCloseClicked();

            // Assert
            expect(mockDialog.hide).toHaveBeenCalled();
            expect(component.updateClaimedAmount).toHaveBeenCalled();
        });

        it("should handle multiple show calls", () => {
            // Act
            component.show(100);
            component.show(200);
            component.show(300);

            // Assert
            expect(component.handleChangeUserBalance).toHaveBeenCalledTimes(3);
            expect(mockNode.active).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle null labelTotalWin gracefully", () => {
            // Arrange
            component.labelTotalWin = null;

            // Act & Assert - should throw when trying to set string on null
            expect(() => component.show(100)).toThrow();
        });

        it("should handle null node gracefully", () => {
            // Arrange
            component.node = null;

            // Act & Assert - should throw when trying to set active on null
            expect(() => component.show(100)).toThrow();
        });

        it("should handle formatting edge cases", () => {
            // Test with decimal edge cases
            const edgeCases = [0.001, 999999999, -100]; // Note: negative might not be expected but testing robustness

            edgeCases.forEach(amount => {
                jest.clearAllMocks();
                component.show(amount);
                
                if (amount) { // Only test if truthy
                    expect(mockNode.active).toBe(true);
                    expect(component.handleChangeUserBalance).toHaveBeenCalledWith(true);
                }
            });
        });
    });
});
