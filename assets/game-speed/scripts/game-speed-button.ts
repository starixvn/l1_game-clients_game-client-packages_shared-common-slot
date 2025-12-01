import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { GameSpeedHandlers } from "./game-speed-handlers";
import { GameSpeedStore } from "./game-speed-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("game_speed_button")
export class GameSpeedButton extends ObserverComponent {
    @property({ type: Node })
    nodeSpeedList: Node[] = [];

    private currentSpeedIndex = 0;

    @render(GameSpeedStore, (store) => store.gameSpeed)
    getGameSpeed(gameSpeed: string) {
        const targetSpeed = gameSpeed.toLowerCase();
        const targetIndex = this.findTargetSpeedIndex(targetSpeed);

        if (targetIndex === -1) {
            return;
        }

        this.currentSpeedIndex = targetIndex;
        this.updateSpeedNodesDisabledState(targetIndex);
        this.playSoundClick();
    }

    private findTargetSpeedIndex(targetSpeed: string): number {
        return this.nodeSpeedList.findIndex((node) => node.name === targetSpeed);
    }

    private updateSpeedNodesDisabledState(targetIndex: number): void {
        this.nodeSpeedList.forEach((node, index) => {
            const disabledNode = node.getChildByName("disabled");
            // Nodes before and at target speed: disabled = false
            // Nodes after target speed: disabled = true
            disabledNode.active = index > targetIndex;
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(GameSpeedHandlers, (handle, gameSpeed: string) => handle.handleGameSpeed(gameSpeed))
    onClickSpeedChanged() {
        this.currentSpeedIndex++;
        if (this.currentSpeedIndex >= this.nodeSpeedList.length) {
            this.currentSpeedIndex = 0;
        }
        return this.nodeSpeedList[this.currentSpeedIndex].name.toUpperCase();
    }
}
