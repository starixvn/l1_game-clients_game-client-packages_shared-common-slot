import { _decorator, Component, Node, Toggle, Label, Tween, tween, director } from "cc";
const { ccclass, property } = _decorator;
import gc from "@sg/game-client-base";
const { Shared } = gc;
const { utils } = Shared;
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "../stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "../handlers/fsb-promotion-ui-handler";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import Observer from "observer";
const { handle, render } = Observer;

@ccclass("FsbPromotionDialog")
export class FsbPromotionDialog extends Dialog {
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

    @property(FSBPromotionUIHandler)
    fsbPromotionUIHandler: FSBPromotionUIHandler = null;

    async start() {
        this.show();
    }

    onDisable(): void {
        super.onDisable();
        if (this._bgTween) {
            this._bgTween.stop();
            this._bgTween = null;
        }
    }

    closeDialog() {
        super.hide();
    }

    playGameNow() {
        this.closeDialog();
        this.openPromotionDetailsPanel();
        const gameId = this.fsbPromotionUIHandler.getGameId();
        if (!gameId) {
            return;
        }

        utils.AnalyticsManager.trackEvent(utils.TrackingEvent.Button, {
            location: director.getScene().name,
            action: utils.TrackingAction.Click,
            object_name: this.TRACKING_OBJECT_NAME,
        });
    }

    @handle(FSBPromotionUIStore, (store) => store.addPendingUIEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_DETAILS_PANEL))
    openPromotionDetailsPanel() {}

}
