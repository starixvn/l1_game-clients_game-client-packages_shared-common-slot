import { _decorator } from 'cc';
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import { FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
import Observer from "observer";
const { render } = Observer;

const { ccclass, property } = _decorator;
@ccclass('fsb_web_view')
export class FsbWebView extends LoadWebView {
    onLoad(): void {
        super.onLoad();
    }

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
    }
}


