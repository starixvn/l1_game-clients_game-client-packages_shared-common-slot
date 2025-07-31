import { _decorator, Node, instantiate, Prefab, Component } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import Observer from "observer";
const { handle, render } = Observer;
const { ccclass, property } = _decorator;

// Constants
const BUNDLE_NAME = "fsb-promotion-resource";
const PREFAB_GIFT_CODE_PATH = "prefabs/gift-code";
const CONTAINER_NAME = "fsb-promotion-container";
const NODE_NAMES = {
    CENTER: "center",
    AUTO_SCALE_WIDGET: "auto-scale-widget",
    IN_GAME_MENU: "in-game-menu",
} as const;

@ccclass("FSBPromotionUIManager")
export class FSBPromotionUIManager extends ObserverComponent {
    public fsbPromotionContainer: Node = null;
    private giftCodeNode: Node = null;

    onLoad() {
        this.createFsbPromotionContainer();
        super.onLoad();
    }

    @render(FSBPromotionUIStore, (store) => store.pendingUIEvent?.event === FreeSpinsPromotionEvents.OPEN_GIFT_CODE)
    initGiftCode(isOpenGiftCode: boolean) {
        if (isOpenGiftCode) {
            this.loadAndShowGiftCode();
        }
    }
    
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
