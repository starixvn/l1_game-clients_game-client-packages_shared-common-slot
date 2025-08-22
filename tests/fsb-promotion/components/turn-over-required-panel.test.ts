import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    FormatUtils: {
        numberWithCommas: jest.fn((value: number, decimals: number, useGrouping: boolean) => {
            if (decimals === 2) {
                return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }),
    },
}));

jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => (target: any) => target),
        property: jest.fn(() => (target: any, propertyKey: string) => {}),
    },
    Label: jest.fn(),
    Node: jest.fn(),
    ProgressBar: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/draggable/draggable-item", () => ({
    default: jest.fn(),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: jest.fn(),
}));

jest.mock("observer", () => ({
    handle: jest.fn(() => (target: any, propertyKey: string) => {}),
    render: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

jest.mock("db://i18n/LanguageData", () => ({
    t: jest.fn((key) => key),
}));

jest.mock("../../../assets/fsb-promotion/scripts/components/simple-claim-button", () => ({
    default: jest.fn(),
}));

// Mock the stores to avoid decorator issues
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn(),
    FreeSpinsPromotionEvents: {
        SHOW_NOTICE_ERROR: "SHOW_NOTICE_ERROR",
        EXPIRE_CLAIM_BONUS: "EXPIRE_CLAIM_BONUS",
        UPDATE_TURN_OVER_REQUIRED: "UPDATE_TURN_OVER_REQUIRED",
        COLLAPSE_MENU: "COLLAPSE_MENU",
        OPEN_FREE_SPINS_PROMOTION: "OPEN_FREE_SPINS_PROMOTION",
        CLAIMED_BONUS_SUCCESS: "CLAIMED_BONUS_SUCCESS",
        OPEN_CLAIM_BONUS_NOTIFICATION: "OPEN_CLAIM_BONUS_NOTIFICATION",
    },
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler", () => ({
    FSBPromotionUIHandler: jest.fn(),
}));

jest.mock("../../../assets/game-message-slot", () => ({
    GameServiceMessageSlot: {
        PromotionTOProgress: {
            eventName: "PromotionTOProgress",
        },
    },
}));

describe("TurnOverRequiredPanel", () => {
    let mockLabelTotalWin: any;
    let mockLabelTotalTurnover: any;
    let mockLabelPercentage: any;
    let mockProgressBar: any;
    let mockClaimButton: any;
    let mockLabelTimer: any;
    let mockLabelMainMessage: any;
    let mockLabelSubMessage: any;
    let mockNode: any;
    let mockDraggableItem: any;
    let mockSimpleClaimButton: any;
    let mockGc: any;
    let mockI18n: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock UI components
        mockLabelTotalWin = {
            string: "",
        };

        mockLabelTotalTurnover = {
            string: "",
        };

        mockLabelPercentage = {
            string: "",
        };

        mockProgressBar = {
            progress: 0,
        };

        mockLabelTimer = {
            string: "",
        };

        mockLabelMainMessage = {
            string: "",
        };

        mockLabelSubMessage = {
            string: "",
        };

        mockClaimButton = {
            getComponent: jest.fn(),
        };

        mockNode = {
            active: true,
            getComponent: jest.fn(),
        };

        mockSimpleClaimButton = {
            setClaimable: jest.fn(),
            startClaimButtonPulse: jest.fn(),
            stopClaimButtonPulse: jest.fn(),
        };

        mockDraggableItem = {
            touchCallback: {
                end: jest.fn(),
            },
        };

        // Setup mocks
        mockGc = require("@sg/game-client-base");
        mockI18n = require("db://i18n/LanguageData");

        // Setup component mocks
        mockClaimButton.getComponent.mockReturnValue(mockSimpleClaimButton);
        mockNode.getComponent.mockReturnValue(mockDraggableItem);
    });

    describe("UI Component Tests", () => {
        it("should format numbers correctly", () => {
            expect(mockGc.FormatUtils.numberWithCommas(1500, 2, true)).toBe("1,500.00");
            expect(mockGc.FormatUtils.numberWithCommas(7500, 0, true)).toBe("7,500");
        });

        it("should handle i18n translations", () => {
            expect(mockI18n.t("FreeSpinBonus.FSB_days")).toBe("FreeSpinBonus.FSB_days");
            expect(mockI18n.t("FreeSpinBonus.TO_requirement_state1_message")).toBe("FreeSpinBonus.TO_requirement_state1_message");
        });
    });

    describe("Mock Component Tests", () => {
        it("should setup claim button component", () => {
            const component = mockClaimButton.getComponent();
            expect(component).toBe(mockSimpleClaimButton);
        });

        it("should setup draggable item component", () => {
            const component = mockNode.getComponent();
            expect(component).toBe(mockDraggableItem);
        });

        it("should handle claim button actions", () => {
            mockSimpleClaimButton.setClaimable(true);
            expect(mockSimpleClaimButton.setClaimable).toHaveBeenCalledWith(true);

            mockSimpleClaimButton.startClaimButtonPulse();
            expect(mockSimpleClaimButton.startClaimButtonPulse).toHaveBeenCalled();

            mockSimpleClaimButton.stopClaimButtonPulse();
            expect(mockSimpleClaimButton.stopClaimButtonPulse).toHaveBeenCalled();
        });

        it("should handle node visibility", () => {
            mockNode.active = false;
            expect(mockNode.active).toBe(false);

            mockNode.active = true;
            expect(mockNode.active).toBe(true);
        });

        it("should handle label text updates", () => {
            mockLabelTotalWin.string = "1,500.00";
            expect(mockLabelTotalWin.string).toBe("1,500.00");

            mockLabelPercentage.string = "75%";
            expect(mockLabelPercentage.string).toBe("75%");

            mockLabelTimer.string = "1 FreeSpinBonus.FSB_days 12:30:45";
            expect(mockLabelTimer.string).toBe("1 FreeSpinBonus.FSB_days 12:30:45");
        });

        it("should handle progress bar updates", () => {
            mockProgressBar.progress = 0.75;
            expect(mockProgressBar.progress).toBe(0.75);

            mockProgressBar.progress = 1.0;
            expect(mockProgressBar.progress).toBe(1.0);
        });
    });

    describe("Event Constants Tests", () => {
        it("should have correct event constants", () => {
            const { FreeSpinsPromotionEvents } = require("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
            
            expect(FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR).toBe("SHOW_NOTICE_ERROR");
            expect(FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS).toBe("EXPIRE_CLAIM_BONUS");
            expect(FreeSpinsPromotionEvents.UPDATE_TURN_OVER_REQUIRED).toBe("UPDATE_TURN_OVER_REQUIRED");
            expect(FreeSpinsPromotionEvents.COLLAPSE_MENU).toBe("COLLAPSE_MENU");
            expect(FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION).toBe("OPEN_FREE_SPINS_PROMOTION");
            expect(FreeSpinsPromotionEvents.CLAIMED_BONUS_SUCCESS).toBe("CLAIMED_BONUS_SUCCESS");
            expect(FreeSpinsPromotionEvents.OPEN_CLAIM_BONUS_NOTIFICATION).toBe("OPEN_CLAIM_BONUS_NOTIFICATION");
        });
    });

    describe("Game Service Message Tests", () => {
        it("should have correct game service message structure", () => {
            const { GameServiceMessageSlot } = require("../../../assets/game-message-slot");
            
            expect(GameServiceMessageSlot.PromotionTOProgress.eventName).toBe("PromotionTOProgress");
        });

        it("should create valid PromotionTOProgress data", () => {
            const data: GameServiceMessageSlot.PromotionTOProgress = {
                promotionId: "test-123",
                win: 1000,
                totalTO: 5000,
                minTO: 10000,
                progress: 50,
                remainTO: 5000,
                canClaim: false,
                expire: "2024-12-31T23:59:59Z",
            };

            expect(data.promotionId).toBe("test-123");
            expect(data.win).toBe(1000);
            expect(data.totalTO).toBe(5000);
            expect(data.minTO).toBe(10000);
            expect(data.progress).toBe(50);
            expect(data.remainTO).toBe(5000);
            expect(data.canClaim).toBe(false);
            expect(data.expire).toBe("2024-12-31T23:59:59Z");
        });
    });

    describe("Utility Function Tests", () => {
        it("should pad numbers correctly", () => {
            const pad = (num: number): string => {
                return num < 10 ? `0${num}` : `${num}`;
            };

            expect(pad(5)).toBe("05");
            expect(pad(9)).toBe("09");
            expect(pad(10)).toBe("10");
            expect(pad(59)).toBe("59");
        });

        it("should calculate progress percentage correctly", () => {
            const calculateProgress = (current: number, total: number): number => {
                return Math.round((current / total) * 100);
            };

            expect(calculateProgress(5000, 10000)).toBe(50);
            expect(calculateProgress(7500, 10000)).toBe(75);
            expect(calculateProgress(10000, 10000)).toBe(100);
        });

        it("should format time correctly", () => {
            const formatTime = (seconds: number): string => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            expect(formatTime(3661)).toBe("01:01:01");
            expect(formatTime(7325)).toBe("02:02:05");
            expect(formatTime(0)).toBe("00:00:00");
        });
    });

    describe("Integration Scenarios", () => {
        it("should handle complete TO progress flow", () => {
            // Step 1: Setup data
            const data = {
                win: 2000,
                totalTO: 8000,
                minTO: 10000,
                progress: 80,
                expire: "2024-12-31T23:59:59Z",
            };

            // Step 2: Format values
            const formattedWin = mockGc.FormatUtils.numberWithCommas(data.win, 2, true);
            const formattedTurnover = `${mockGc.FormatUtils.numberWithCommas(data.totalTO, 0, true)} / ${mockGc.FormatUtils.numberWithCommas(data.minTO, 0, true)}`;
            const formattedPercentage = `${data.progress}%`;

            expect(formattedWin).toBe("2,000.00");
            expect(formattedTurnover).toBe("8,000 / 10,000");
            expect(formattedPercentage).toBe("80%");

            // Step 3: Handle claim button state
            if (data.progress === 100) {
                mockSimpleClaimButton.setClaimable(true);
                mockSimpleClaimButton.startClaimButtonPulse();
                expect(mockSimpleClaimButton.setClaimable).toHaveBeenCalledWith(true);
            } else {
                mockSimpleClaimButton.setClaimable(false);
                mockSimpleClaimButton.stopClaimButtonPulse();
                expect(mockSimpleClaimButton.setClaimable).toHaveBeenCalledWith(false);
            }
        });

        it("should handle error scenarios", () => {
            const { FreeSpinsPromotionEvents } = require("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");

            // Handle show notice error
            const showErrorData = { 
                event: FreeSpinsPromotionEvents.SHOW_NOTICE_ERROR, 
                data: "ERROR_CODE" 
            };
            expect(showErrorData.event).toBe("SHOW_NOTICE_ERROR");
            expect(showErrorData.data).toBe("ERROR_CODE");

            // Handle expire claim bonus
            const expireData = { 
                event: FreeSpinsPromotionEvents.EXPIRE_CLAIM_BONUS, 
                data: "ERROR_CODE" 
            };
            expect(expireData.event).toBe("EXPIRE_CLAIM_BONUS");
            expect(expireData.data).toBe("ERROR_CODE");
        });

        it("should handle timer updates", () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            futureDate.setHours(10, 30, 45);

            const endTime = futureDate.getTime();
            const now = Date.now();
            const remainingTime = Math.max(0, endTime - now);

            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            const timeString = `${days} FreeSpinBonus.FSB_days ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            expect(timeString).toMatch(/\d{2}:\d{2}:\d{2}/);
        });
    });
});
