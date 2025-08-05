import { _decorator } from 'cc';
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import { FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
import Observer from "observer";
const { render, handle } = Observer;

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
        this.changeWebViewLoadingTrue();
        this.showLoading();
        this.hideWebView();
        this.webView && (this.webView.url = promotionUrl);
    }

    showWebView() {
        this.changeWebViewLoadingFalse();
        this.setOpacity(255);
        this.onWebViewLoaded();
    }

    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(false))
    changeWebViewLoadingFalse() {
    }

    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(true))
    changeWebViewLoadingTrue() {
    }
}


