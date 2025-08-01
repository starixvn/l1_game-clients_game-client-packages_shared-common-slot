import { _decorator } from 'cc';
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import { FsbPromotionDialog } from "./fsb-promotion-dialog";
import { FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
import Observer from "observer";
const { handle, render } = Observer;
const CLOSE_FREE_SPINS_PROMOTION_EVENT = "closeFreeSpinsPromotionPopup";

const { ccclass, property } = _decorator;
@ccclass('fsb_web_view')
export class FsbWebView extends LoadWebView {
    @property(FsbPromotionDialog)
    freeSpinsPromotionDialog: FsbPromotionDialog = null;

    onLoad(): void {
        window.addEventListener("message", this.handleEvent, false);
        super.onLoad();
        this.node.setPosition(0, 0, 0);
    }

    public onDestroy(): void {
        window.removeEventListener("message", this.handleEvent);
    }

    handleEvent = async ({ data }: { data: string }) => {
        if (data === CLOSE_FREE_SPINS_PROMOTION_EVENT) {
            this.freeSpinsPromotionDialog.closeDialog();
        }
    };

    @render(FSBPromotionUIStore, (store) => store.promotionUrl)
    loadFreeSpinsPromotionSite(promotionUrl: string) {
        if (!promotionUrl) {
            return;
        }
        this.showLoading();
        this.hideWebView();
        this.webView && (this.webView.url = promotionUrl);
    }

    showWebView() {
        this.setOpacity(255);
        this.onWebViewLoaded();
        this.node.setPosition(0, 0, 0);
    }
}


