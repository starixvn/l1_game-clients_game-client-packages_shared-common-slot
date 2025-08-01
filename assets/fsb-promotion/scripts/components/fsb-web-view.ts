import { _decorator } from 'cc';
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import { FsbPromotionDialog } from "./fsb-promotion-dialog";
const CLOSE_FREE_SPINS_PROMOTION_EVENT = "closeFreeSpinsPromotionPopup";

const { ccclass, property } = _decorator;
@ccclass('fsb_web_view')
export class FsbWebView extends LoadWebView {
    @property(FsbPromotionDialog)
    freeSpinsPromotionDialog: FsbPromotionDialog = null;

    @property(FSBPromotionUIHandler)
    fsbPromotionUIHandler: FSBPromotionUIHandler = null;

    onLoad(): void {
        this.loadFreeSpinsPromotionSite();
        if (this.freeSpinsPromotionDialog) {
            this.node.destroy();
        }
        window.addEventListener("message", this.handleEvent, false);
        super.onLoad();
    }

    public onDestroy(): void {
        window.removeEventListener("message", this.handleEvent);
    }

    handleEvent = async ({ data }: { data: string }) => {
        if (data === CLOSE_FREE_SPINS_PROMOTION_EVENT) {
            this.freeSpinsPromotionDialog.closeDialog();
        }
    };

    loadFreeSpinsPromotionSite() {
        this.showLoading();
        this.hideWebView();
        const url = this.fsbPromotionUIHandler.getPromoUrl();
        this.webView && (this.webView.url = url);
    }

    showWebView() {
        this.setOpacity(255);
        this.onWebViewLoaded();
    }
}


