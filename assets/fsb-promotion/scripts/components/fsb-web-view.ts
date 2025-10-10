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
        this.showLoading();
    }

    @render(FSBPromotionUIStore, (store) => store.promotionUrl)
    loadFreeSpinsPromotionSite(promotionUrl: string) {
        if (!promotionUrl) {
            return;
        }
        this.hideWebView();
        this.webView && (this.webView.url = promotionUrl);
    }

    override showWebView() {
        this.onWebViewLoaded();
        this.changeWebViewLoadingFalse();
        this.scheduleOnce(() => {
            this.setOpacity(255);
        }, 0.1);
    }

    showLoading() {
        this.nodeLoading.active = true;
        this.changeWebViewLoadingTrue();
    }


    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(false))
    changeWebViewLoadingFalse() {
    }

    @handle(FSBPromotionUIStore, (store) => store.setWebViewLoading(true))
    changeWebViewLoadingTrue() {
    }
}


