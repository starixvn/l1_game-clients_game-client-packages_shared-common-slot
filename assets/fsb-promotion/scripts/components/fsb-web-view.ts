import { _decorator } from 'cc';
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import Observer from "observer";
import { FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
const { render, handle } = Observer;

const { ccclass, property } = _decorator;
@ccclass('fsb_web_view')
export class FsbWebView extends LoadWebView {
    onLoad(): void {
        super.onLoad();
        this.hideWebView();
        this.showLoading();
    }

    @render(FSBPromotionUIStore, (store) => store.promotionUrl)
    loadFreeSpinsPromotionSite(promotionUrl: string) {
        if (!promotionUrl) {
            return;
        }
        this.scheduleOnce(() => {
            this.showLoading();
            this.hideWebView();
            this.webView && (this.webView.url = promotionUrl);
        }, 0.3);
    }

    showWebView() {
        this.setOpacity(255);
        this.onWebViewLoaded();
    }

    showLoading() {
        this.nodeLoading.active = true;
        this.changeWebViewLoadingTrue();
    }

    hideLoading() {
        this.nodeLoading.active = false;
        this.changeWebViewLoadingFalse();
    }


    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(false))
    changeWebViewLoadingFalse() {
    }

    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(true))
    changeWebViewLoadingTrue() {
    }
}


