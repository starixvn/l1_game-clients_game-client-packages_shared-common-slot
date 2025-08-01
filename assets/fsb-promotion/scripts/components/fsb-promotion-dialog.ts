import gc from "@sg/game-client-base";
import { _decorator, Node, director } from "cc";
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from '../stores/fsb-promotion-ui-store';
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import Observer from 'observer';
const { Shared } = gc;
const { utils } = Shared;
const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass("FsbPromotionDialog")
export class FsbPromotionDialog extends ObserverComponent{
    @property(Node)
    playNow: Node = null;

    @property(Node)
    playLater: Node = null;

    @property(Node)
    closeButton: Node = null;

    @property(Node)
    background: Node = null;

    private readonly TRACKING_OBJECT_NAME = "Free spins promotion";
    public gameOffers: { name: string; gameId: number }[] = [];

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.CLOSE_FREE_SPINS_PROMOTION))
    closeDialog() {
    }

    playGameNow() {
        this.closeDialog();
        this.openPromotionDetailsPanel();
        const gameId = this.gameOffers[0].gameId;
        if (!gameId) {
            return;
        }

        utils.AnalyticsManager.trackEvent(utils.TrackingEvent.Button, {
            location: director.getScene().name,
            action: utils.TrackingAction.Click,
            object_name: this.TRACKING_OBJECT_NAME,
        });
    }

    @render(FSBPromotionUIStore, (store) => store.gameOffers)
    setGameOffers(gameOffers: { name: string; gameId: number }[]) {
        this.gameOffers = gameOffers;
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL))
    openPromotionDetailsPanel() {}

}
