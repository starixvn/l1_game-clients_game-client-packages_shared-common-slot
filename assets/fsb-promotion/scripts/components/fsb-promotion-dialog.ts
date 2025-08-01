import { _decorator, Component, Node, Toggle, Label, Tween, tween, director } from "cc";
const { ccclass, property } = _decorator;
import gc from "@sg/game-client-base";
const { Shared } = gc;
const { utils } = Shared;
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import Observer from "observer";
const { handle, render } = Observer;
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";

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
    private _bgTween: Tween<Node> = null;
    public gameOffers: { name: string; gameId: number }[] = [];

    onLoad(): void {
        if (this._bgTween) {
            this._bgTween.stop();
            this._bgTween = null;
        }
    }

    closeDialog() {
        this.background.active = false;
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

    @handle(FSBPromotionUIStore, (store) => store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL))
    openPromotionDetailsPanel() {}

}
