import { _decorator, Node, instantiate, Prefab, Component, Vec3, tween } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import Observer from "observer";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
import { FSBPromotionHandlers } from "../handlers/fsb-promotion-handlers";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
const { handle, render } = Observer;
const { ccclass, property } = _decorator;

// Constants
const BUNDLE_NAME = "fsb-promotion-resource";
const PREFAB_GIFT_CODE_PATH = "prefabs/gift-code";
const PREFAB_REDEEM_GIFT_CODE_POPUP_PATH = "prefabs/redeem-gift-code-popup";
const PREFAB_EFFECT_REDEEM_SUCCESS_PATH = "prefabs/effect-redeem-success";
const PREFAB_EFFECT_UNBOX_GIFT_PATH = "prefabs/effect-unbox-gift";
const PREFAB_FSB_BANNER_PATH = "prefabs/fsb-banner";
const PREFAB_PROMOTION_INFO_PATH = "prefabs/fsb-promotion-info";
const PREFAB_PROMOTION_ENDED_POPUP_PATH = "prefabs/promotion-ended-popup";
const PREFAB_CLAIM_BONUS_NOTIFICATION_PATH = "prefabs/claim-bonus-notification";
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
    private effectRedeemSuccessNode: Node = null;
    private effectUnboxGiftNode: Node = null;
    private fsbBannerNode: Node = null;
    private promotionEndedPopupNode: Node = null;
    private claimBonusNotificationNode: Node = null;

    private fsbPromotionInfoNode: Node = null;
    private UNIT_SECOND_EFFECT_UNBOX_GIFT = 2000;
    private UNIT_SECOND_REDEEM_SUCCESS = 2000;
    private UNIT_SECOND_ANIMATION_UNBOX_GIFT = 0.8;
    private UNIT_SECOND_ANIMATION_REDEEM_SUCCESS = 0.6;
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

    @render(FSBPromotionUIStore, (store) => store.isRedeemSuccess())
    initRedeemSuccess(isRedeemSuccess: boolean) {
        if (isRedeemSuccess) {
            this.loadAndPlayRedeemSuccess();
            this.destroyNode(this.giftCodeNode);
        }
    }

    @render(FSBPromotionUIStore, (store) => store.isShowFsbBanner())
    initFsbBanner(isOpenFsbBanner: boolean) {
        if (isOpenFsbBanner) {
            this.loadAndShowFsbBanner();
        }
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.CLOSE_GIFT_CODE_ICON)
    closeGiftCodeIcon(isCloseGiftCodeIcon: boolean) {
        if (isCloseGiftCodeIcon) {
            this.giftCodeNode.destroy();
        }
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent)
    initPromotionInfo(pendingUIEvent: any) {
        if (pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO) {
            this.loadAndShowPromotionInfo(pendingUIEvent.data);
        }
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP)
    initPromotionEndedPopup(isOpenPromotionEndedPopup: boolean) {
        if (isOpenPromotionEndedPopup) {
            this.loadAndShowPromotionEndedPopup();
        }
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_CLAIM_BONUS_NOTIFICATION)
    initClaimBonusNotification(isOpenClaimBonusNotification: boolean) {
        if (isOpenClaimBonusNotification) {
            this.loadAndShowClaimBonusNotification();
        }
    }

    private async loadAndShowPromotionInfo(isAutoPlay = false) {
        const delay = isAutoPlay ? 900 : 0;
        if (this.fsbPromotionInfoNode && this.fsbPromotionInfoNode.isValid) {
            this.showPromotionInfoWithAnimation(delay, isAutoPlay);
        } else {
            const prefab = await this.loadPrefab(PREFAB_PROMOTION_INFO_PATH);
            const fsbPromotionInfoNode = instantiate(prefab);

            fsbPromotionInfoNode.active = false;

            this.fsbPromotionContainer.addChild(fsbPromotionInfoNode);
            this.fsbPromotionInfoNode = fsbPromotionInfoNode;

            this.showPromotionInfoWithAnimation(delay, isAutoPlay);
        }
    }

    private async showPromotionInfoWithAnimation(delay: number, isAutoPlay: boolean) {
        if (!this.fsbPromotionInfoNode || !this.fsbPromotionInfoNode.isValid) {
            return;
        }

        await FunctionUtils.delay(delay);

        this.fsbPromotionInfoNode.active = true;
        this.fsbPromotionInfoNode.setScale(new Vec3(0, 0, 0));

        tween(this.fsbPromotionInfoNode)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
            .start();

        if (isAutoPlay) {
            this.spinOnFSBPromotionFirstTime();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME))
    spinOnFSBPromotionFirstTime() {}

    private async loadAndPlayEffectUnboxGift() {
        if (this.effectUnboxGiftNode && this.effectUnboxGiftNode.isValid) {
            this.effectUnboxGiftNode.destroy();
            this.effectUnboxGiftNode = null;
        }

        const prefab = await this.loadPrefab(PREFAB_EFFECT_UNBOX_GIFT_PATH);
        const effectNode = instantiate(prefab);

        this.fsbPromotionContainer.addChild(effectNode);
        this.effectUnboxGiftNode = effectNode;
        this.scheduleOnce(() => {
            this.openGiftCodeRedeemPopup();
        }, this.UNIT_SECOND_ANIMATION_UNBOX_GIFT);
        await FunctionUtils.delay(this.UNIT_SECOND_EFFECT_UNBOX_GIFT);

        this.effectUnboxGiftNode.destroy();
        this.effectUnboxGiftNode = null;
    }

    private async loadAndPlayRedeemSuccess() {
        if (this.effectRedeemSuccessNode && this.effectRedeemSuccessNode.isValid) {
            this.effectRedeemSuccessNode.destroy();
            this.effectRedeemSuccessNode = null;
        }

        const prefab = await this.loadPrefab(PREFAB_EFFECT_REDEEM_SUCCESS_PATH);
        const effectNode = instantiate(prefab);

        this.fsbPromotionContainer.addChild(effectNode);
        this.effectRedeemSuccessNode = effectNode;
        this.scheduleOnce(() => {
            this.loadAndShowFsbBanner();
        }, this.UNIT_SECOND_ANIMATION_REDEEM_SUCCESS);
        await FunctionUtils.delay(this.UNIT_SECOND_REDEEM_SUCCESS);

        this.effectRedeemSuccessNode.destroy();
        this.effectRedeemSuccessNode = null;
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_GIFT_CODE_REDEEM_POPUP)
    initRedeemGiftCodePopup(isOpenRedeemGiftCodePopup: boolean) {
        if (isOpenRedeemGiftCodePopup) {
            this.loadAndShowRedeemGiftCodePopup();
        }
    }

    @handle(FSBPromotionUIHandler, (handle) => handle.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_GIFT_CODE_REDEEM_POPUP))
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

    private async loadAndShowPromotionEndedPopup() {
        if (this.promotionEndedPopupNode) {
            this.promotionEndedPopupNode.active = true;
        } else {
            const prefab = await this.loadPrefab(PREFAB_PROMOTION_ENDED_POPUP_PATH);
            const promotionEndedPopupNode = instantiate(prefab);
            this.fsbPromotionPopupContainer.addChild(promotionEndedPopupNode);
            this.promotionEndedPopupNode = promotionEndedPopupNode;
        }
    }

    private async loadAndShowClaimBonusNotification() {
        if (this.claimBonusNotificationNode) {
            this.claimBonusNotificationNode.active = true;
        } else {
            const prefab = await this.loadPrefab(PREFAB_CLAIM_BONUS_NOTIFICATION_PATH);
            const claimBonusNotificationNode = instantiate(prefab);
            this.fsbPromotionPopupContainer.addChild(claimBonusNotificationNode);
            this.claimBonusNotificationNode = claimBonusNotificationNode;
        }
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
        } else {
            const prefab = await this.loadPrefab(PREFAB_GIFT_CODE_PATH);
            const giftCodeNode = instantiate(prefab);
            this.fsbPromotionContainer.addChild(giftCodeNode);
            this.giftCodeNode = giftCodeNode;
        }
    }

    async loadAndShowRedeemGiftCodePopup() {
        const prefab = await this.loadPrefab(PREFAB_REDEEM_GIFT_CODE_POPUP_PATH);
        const redeemGiftCodePopupNode = instantiate(prefab);
        this.fsbPromotionPopupContainer.addChild(redeemGiftCodePopupNode);
        this.redeemGiftCodePopupNode = redeemGiftCodePopupNode;
    }

    async loadAndShowFsbBanner() {
        if (this.fsbBannerNode) {
            this.fsbBannerNode.active = true;
        } else {
            const prefab = await this.loadPrefab(PREFAB_FSB_BANNER_PATH);
            const fsbBannerNode = instantiate(prefab);
            this.fsbPromotionPopupContainer.addChild(fsbBannerNode);
            this.fsbBannerNode = fsbBannerNode;
        }
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

    destroyNode(node: Node) {
        if (node) {
            node.destroy();
            node = null;
        }
    }
}
