import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import PromotionEndPopup from "../../../assets/fsb-promotion/scripts/components/promotion-end-popup";
import { Node, Label, Button } from "cc";
import { GameServiceMessageSlot } from "../../../assets/game-message-slot";
import { Translator } from "@sg/game-client-base";

// ========== Mocks ==========

// reflect-metadata (nếu project dùng)
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// cc
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

// GỘP mock @sg/game-client-base: export default + named
jest.mock("@sg/game-client-base", () => {
    const translate = jest.fn((k: string) => k);
    const gameTranslate = jest.fn();
    const commonTranslate = jest.fn((k: string) => k);
    const numberWithCommas = jest.fn((n: number, d: number, _g?: boolean) => Number(n).toFixed(d));

    const mod = {
        Translator: { translate, gameTranslate, commonTranslate },
        FormatUtils: { numberWithCommas },
        Player: { MainPlayerStore: { balance: 1000 } },
        Configs: { SiteConfigs: { env: "test" } },
        Connection: { ConnectionStore: { connection: { on: jest.fn() } } },
        Auth: { AuthStore: { session: "test_session", username: "test_username", language: "en" } },
        Notices: {
            NoticeStore: { addWarning: jest.fn() },
            NoticeErrorsHandlers: { AutoSignOutHandler: jest.fn(() => ({})) },
        },
        Notification: { NotificationStore: { connection: { on: jest.fn() } } },
    };
    return { __esModule: true, default: mod, ...mod };
});

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class MockObserverComponent {
        node: any = { active: false, getComponent: jest.fn() };
    },
}));

jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

jest.mock("db://shared-components/shared/common-components/dialogs/dialog", () => ({
    Dialog: jest.fn(),
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-store");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-handlers");
jest.mock("../../../assets/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler");
jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store");
jest.mock("../../../assets/game-message-slot");

// ========== Helpers ==========

class FinishPromotionTestDataBuilder {
    private data: Partial<GameServiceMessageSlot.FinishPromotion> = {};
    static create() {
        return new FinishPromotionTestDataBuilder();
    }
    withTotalWin(totalWin: number) {
        this.data.totalWin = totalWin;
        return this;
    }
    withEndPromotion(endPromotion: boolean) {
        this.data.endPromotion = endPromotion;
        return this;
    }
    build(): GameServiceMessageSlot.FinishPromotion {
        return {
            totalWin: this.data.totalWin ?? 1000,
            endPromotion: this.data.endPromotion ?? false,
        } as any;
    }
    static createDefault() {
        return this.create().build();
    }
    static createWithWin(totalWin: number) {
        return this.create().withTotalWin(totalWin).build();
    }
    static createWithZeroWin() {
        return this.create().withTotalWin(0).build();
    }
    static createHighWin() {
        return this.create().withTotalWin(2500.5).build();
    }
}

class UIComponentMockFactory {
    static createLabel(initial = "") {
        return { string: initial };
    }
    static createButton() {
        return {};
    }
    static createNode(active = false) {
        return { active, getComponent: jest.fn() };
    }
    static createDialog() {
        return { hide: jest.fn() };
    }
    static createAll() {
        const dialog = this.createDialog();
        const node = this.createNode();
        node.getComponent.mockReturnValue(dialog);
        return {
            node,
            dialog,
            labels: {
                title: this.createLabel(),
                main: this.createLabel(),
                sub: this.createLabel(),
                totalWin: this.createLabel(),
            },
            btn: this.createButton(),
        };
    }
}

const createInstance = () => {
    const inst: any = Object.create((PromotionEndPopup as any).prototype);
    const ui = UIComponentMockFactory.createAll();
    inst.node = ui.node;
    inst.labelTitle = ui.labels.title;
    inst.labelMainMessage = ui.labels.main;
    inst.labelSubMessage = ui.labels.sub;
    inst.labelTotalWin = ui.labels.totalWin;
    inst.closeButton = ui.btn;
    inst.currentSpinCount = 0;

    // override methods invoked via decorators
    inst.closeFSBBanner = jest.fn();
    inst.onDestroy = jest.fn();
    inst.openTurnOverRequired = jest.fn();
    inst.setShowFreeSpinMessage = jest.fn();

    return { inst, ui };
};

// ========== Tests ==========

describe("PromotionEndPopup", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (PromotionEndPopup as any).hasShown = false;
    });

    describe("updateCurrentSpinCount", () => {
        it("updates currentSpinCount", () => {
            const { inst } = createInstance();
            inst.updateCurrentSpinCount(5);
            expect(inst.currentSpinCount).toBe(5);
        });
    });

    describe("show()", () => {
        it("returns early if no payload", () => {
            const { inst } = createInstance();
            inst.show(null as any);
            expect(PromotionEndPopup.hasShown).toBe(false);
            expect(inst.node.active).toBe(false);
            expect(inst.closeFSBBanner).not.toHaveBeenCalled();
        });

        it("sets hasShown, formats totalWin, activates node", () => {
            const { inst } = createInstance();
            const gc = require("@sg/game-client-base");
            gc.FormatUtils.numberWithCommas.mockReturnValue("2,500.50");

            const payload = FinishPromotionTestDataBuilder.createHighWin();
            inst.show(payload);

            expect(PromotionEndPopup.hasShown).toBe(true);
            expect(inst.closeFSBBanner).toHaveBeenCalled();
            expect(inst.node.active).toBe(true);
            expect(gc.FormatUtils.numberWithCommas).toHaveBeenCalledWith(2500.5, 2, false);
            expect(inst.labelTotalWin.string).toBe("2,500.50");
            expect(inst.setShowFreeSpinMessage).toHaveBeenCalled();
        });
    });

    describe("setupContent()", () => {
        it("win_allUsed: totalWin>0 & currentSpinCount===0", () => {
            const { inst } = createInstance();
            inst.currentSpinCount = 0;

            (inst as any).setupContent(123);

            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_notification_para1a");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_message");

            expect(inst.labelTitle.string).toBe("FreeSpinBonus.FSB_notification_para1a".toUpperCase());
            expect(inst.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification");
            expect(inst.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_message");
        });

        it("win_withRemaining: totalWin>0 & currentSpinCount>0", () => {
            const { inst } = createInstance();
            inst.currentSpinCount = 5;

            (inst as any).setupContent(50);

            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message1");

            expect(inst.labelTitle.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS".toUpperCase());
            expect(inst.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(inst.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });

        it("zero_allUsed: totalWin===0 & currentSpinCount===0 (main empty)", () => {
            const { inst } = createInstance();
            inst.currentSpinCount = 0;

            (inst as any).setupContent(0);

            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_zero_win");
            expect(Translator.translate).not.toHaveBeenCalledWith("");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_zero_win_message");

            expect(inst.labelTitle.string).toBe("FreeSpinBonus.FSB_end_notification_zero_win".toUpperCase());
            expect(inst.labelMainMessage.string).toBe("");
            expect(inst.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_zero_win_message");
        });

        it("zero_withRemaining: totalWin===0 & currentSpinCount>0", () => {
            const { inst } = createInstance();
            inst.currentSpinCount = 2;

            (inst as any).setupContent(0);

            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(Translator.translate).toHaveBeenCalledWith("FreeSpinBonus.FSB_end_notification_unusedFS_message1");

            expect(inst.labelTitle.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS".toUpperCase());
            expect(inst.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message");
            expect(inst.labelSubMessage.string).toBe("FreeSpinBonus.FSB_end_notification_unusedFS_message1");
        });

        it("uppercases title (translate returns lowercase)", () => {
            const { inst } = createInstance();
            const t = Translator.translate as jest.Mock;
            t.mockImplementationOnce(() => "test title").mockImplementation((k: string) => k);

            (inst as any).setupContent(999); // win_allUsed

            expect(inst.labelTitle.string).toBe("TEST TITLE");
        });

        it("handles empty messages correctly (translate returns '')", () => {
            const { inst } = createInstance();
            const t = Translator.translate as jest.Mock;
            t.mockImplementation((k: string) => (k === "FreeSpinBonus.FSB_end_notification_message" ? "" : k));

            (inst as any).setupContent(100); // win_allUsed

            expect(inst.labelTitle.string).toBe("FreeSpinBonus.FSB_notification_para1a".toUpperCase());
            expect(inst.labelMainMessage.string).toBe("FreeSpinBonus.FSB_end_notification");
            expect(inst.labelSubMessage.string).toBe("");
        });
    });

    describe("onCloseClicked()", () => {
        it("hides dialog (if exists) và gọi openTurnOverRequired()", () => {
            const { inst, ui } = createInstance();

            (inst as any).onCloseClicked();

            expect(inst.node.getComponent).toHaveBeenCalled();
            if (ui.dialog && ui.dialog.hide) {
                expect(ui.dialog.hide).toHaveBeenCalled();
            }
            expect(inst.openTurnOverRequired).toHaveBeenCalled();
        });

        it("still calls openTurnOverRequired when dialog is null", () => {
            const { inst } = createInstance();
            inst.node.getComponent = jest.fn().mockReturnValue(null);

            (inst as any).onCloseClicked();

            expect(inst.node.getComponent).toHaveBeenCalled();
            expect(inst.openTurnOverRequired).toHaveBeenCalled();
        });
    });

    describe("static hasShown", () => {
        it("initially false", () => {
            expect(PromotionEndPopup.hasShown).toBe(false);
        });

        it("true after valid show()", () => {
            const { inst } = createInstance();
            inst.show(FinishPromotionTestDataBuilder.createWithWin(100));
            expect(PromotionEndPopup.hasShown).toBe(true);
        });

        it("stays false with null payload", () => {
            const { inst } = createInstance();
            inst.show(null as any);
            expect(PromotionEndPopup.hasShown).toBe(false);
        });

        it("persists true across multiple calls", () => {
            const { inst } = createInstance();
            const payload = FinishPromotionTestDataBuilder.createDefault();
            inst.show(payload);
            expect(PromotionEndPopup.hasShown).toBe(true);
            inst.show(payload);
            expect(PromotionEndPopup.hasShown).toBe(true);
        });
    });
});
