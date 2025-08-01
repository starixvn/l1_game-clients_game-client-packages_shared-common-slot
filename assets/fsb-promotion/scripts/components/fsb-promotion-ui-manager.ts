import { _decorator, Node, instantiate, Prefab, Component } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import Observer from "observer";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
const { handle, render } = Observer;
const { ccclass, property } = _decorator;

// Constants
const BUNDLE_NAME = "fsb-promotion-resource";
const PREFAB_GIFT_CODE_PATH = "prefabs/gift-code";
const PREFAB_REDEEM_GIFT_CODE_POPUP_PATH = "prefabs/redeem-gift-code-popup";
const PREFAB_EFFECT_UNBOX_GIFT_PATH = "prefabs/effect-unbox-gift";
const PREFAB_FSB_BANNER_PATH = "prefabs/fsb-banner";
const CONTAINER_NAME = "fsb-promotion-container";
const POPUP_CONTAINER_NAME = "fsb-promotion-popup-container";
const NODE_NAMES = {
    CENTER: "center",
    AUTO_SCALE_WIDGET: "auto-scale-widget",
    IN_GAME_MENU: "in-game-menu",
} as const;

@ccclass("FSBPromotionUIManager")
export class FSBPromotionUIManager extends ObserverComponent {
    public fsbPromotionContainer: Node = null;
    public fsbPromotionPopupContainer: Node = null;
    private giftCodeNode: Node = null;
    private redeemGiftCodePopupNode: Node = null;
    private effectUnboxGiftNode: Node = null;
    private fsbBannerNode: Node = null;
    private UNIT_SECOND_EFFECT_UNBOX_GIFT = 2000;
    onLoad() {
        this.createFsbPromotionContainer();
        this.createFsbPromotionPopupContainer();
        super.onLoad();
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_GIFT_CODE)
    initGiftCode(isOpenGiftCode: boolean) {
        if (isOpenGiftCode) {
            this.loadAndShowGiftCode();
        }
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT)
    initEffectUnboxGift(shouldPlayEffect: boolean) {
        if (shouldPlayEffect) {
            this.loadAndPlayEffectUnboxGift();
        }
    }
    
    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION)
    initFsbBanner(isOpenFsbBanner: boolean) {
        if (isOpenFsbBanner) {
            this.loadAndShowFsbBanner();
        }
    }

    private async loadAndPlayEffectUnboxGift() {
        if (this.effectUnboxGiftNode && this.effectUnboxGiftNode.isValid) {
            this.effectUnboxGiftNode.destroy();
            this.effectUnboxGiftNode = null;
        }

        const prefab = await this.loadPrefab(PREFAB_EFFECT_UNBOX_GIFT_PATH);
        const effectNode = instantiate(prefab);

        this.fsbPromotionContainer.addChild(effectNode);
        this.effectUnboxGiftNode = effectNode;
        setTimeout(() => {
            this.openGiftCodeRedeemPopup();
        }, 500);
        await FunctionUtils.delay(this.UNIT_SECOND_EFFECT_UNBOX_GIFT);

        this.effectUnboxGiftNode.destroy();
        this.effectUnboxGiftNode = null;
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_GIFT_CODE_REDEEM_POPUP)
    initRedeemGiftCodePopup(isOpenRedeemGiftCodePopup: boolean) {
        if (isOpenRedeemGiftCodePopup) {
            this.loadAndShowRedeemGiftCodePopup();
        }
    }

    @handle(FSBPromotionUIStore, (store) => store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE_REDEEM_POPUP))
    @handle(FSBPromotionUIStore, (store) => store.removePendingUIEvent(FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT))
    private openGiftCodeRedeemPopup() {}
    private createFsbPromotionContainer(): void {
        const autoScaleWidget = this.findAutoScaleWidget();
        if (!autoScaleWidget) {
            throw new Error("Auto-scale widget not found");
        }

        const existingContainer = autoScaleWidget.getChildByName(CONTAINER_NAME);
        if (existingContainer) {
            this.fsbPromotionContainer = existingContainer;
            return;
        }

        const fsbPromotionContainer = new Node(CONTAINER_NAME);
        autoScaleWidget.addChild(fsbPromotionContainer);

        this.positionContainer(fsbPromotionContainer, autoScaleWidget);
        this.fsbPromotionContainer = fsbPromotionContainer;
    }

    createFsbPromotionPopupContainer(): void {
        const autoScaleWidget = this.findAutoScaleWidget();
        if (!autoScaleWidget) {
            throw new Error("Auto-scale widget not found");
        }

        const existingContainer = autoScaleWidget.getChildByName(POPUP_CONTAINER_NAME);
        if (existingContainer) {
            this.fsbPromotionPopupContainer = existingContainer;
            return;
        }

        const fsbPromotionPopupContainer = new Node(POPUP_CONTAINER_NAME);
        autoScaleWidget.addChild(fsbPromotionPopupContainer);
        this.fsbPromotionPopupContainer = fsbPromotionPopupContainer;
    }

    private findAutoScaleWidget(): Node | null {
        const center = this.node.getChildByName(NODE_NAMES.CENTER);
        if (!center) {
            return null;
        }

        const autoScaleWidget = center.getChildByName(NODE_NAMES.AUTO_SCALE_WIDGET);
        if (!autoScaleWidget) {
            return null;
        }

        return autoScaleWidget;
    }

    private positionContainer(container: Node, parent: Node): void {
        const inGameMenu = parent.getChildByName(NODE_NAMES.IN_GAME_MENU);
        if (inGameMenu) {
            const inGameMenuIndex = inGameMenu.getSiblingIndex();
            container.setSiblingIndex(Math.max(0, inGameMenuIndex - 1));
        }
    }

    async loadAndShowGiftCode() {
        if (this.giftCodeNode) {
            this.showGiftCode();
        }

        const prefab = await this.loadPrefab(PREFAB_GIFT_CODE_PATH);
        const giftCodeNode = instantiate(prefab);
        this.fsbPromotionContainer.addChild(giftCodeNode);
        this.giftCodeNode = giftCodeNode;
    }

    async loadAndShowRedeemGiftCodePopup() {
        const prefab = await this.loadPrefab(PREFAB_REDEEM_GIFT_CODE_POPUP_PATH);
        const redeemGiftCodePopupNode = instantiate(prefab);
        this.fsbPromotionPopupContainer.addChild(redeemGiftCodePopupNode);
        this.redeemGiftCodePopupNode = redeemGiftCodePopupNode;
    }

    async loadAndShowFsbBanner() {
        const prefab = await this.loadPrefab(PREFAB_FSB_BANNER_PATH);
        const fsbBannerNode = instantiate(prefab);
        this.fsbPromotionPopupContainer.addChild(fsbBannerNode);
        this.fsbBannerNode = fsbBannerNode;
    }

    private async loadPrefab(prefabPath: string): Promise<Prefab | null> {
        return await bundleManager.loadAssetsFromBundle<Prefab>(BUNDLE_NAME, prefabPath, Prefab, null);
    }

    showGiftCode() {
        if (this.giftCodeNode) {
            this.giftCodeNode.active = true;
        }
    }

    hideGiftCode() {
        if (this.giftCodeNode) {
            this.giftCodeNode.active = false;
        }
    }

    removeGiftCode() {
        if (this.giftCodeNode && this.giftCodeNode.isValid) {
            this.giftCodeNode.destroy();
            this.giftCodeNode = null;
        }
    }
}
