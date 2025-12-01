import gc from "@sg/game-client-base";
import { _decorator, Button, Color, Node, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { GameSpeedHandlers } from "./game-speed-handlers";
import { GameSpeed, GameSpeedStore } from "./game-speed-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("game_speed_button")
export class GameSpeedAutoPlay extends ObserverComponent {
    @property({ type: Node })
    nodeSpeedList: Node[] = [];

    onLoad(): void {
        super.onLoad();
        this.nodeSpeedList.forEach((node) => {
            let button = node.getComponent(Button);
            if (!button) {
                button = node.addComponent(Button);
                button.node.on(Button.EventType.CLICK, () => this.onButtonClick(node.name));
            }
        });
    }

    @handle(GameSpeedHandlers, (handle, gameSpeed: string) => handle.handleGameSpeed(gameSpeed))
    onButtonClick(speed: string) {
        this.playSoundClick();
        return GameSpeed[speed.toUpperCase()];
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    private findTargetSpeedIndex(targetSpeed: string): number {
        return this.nodeSpeedList.findIndex((node) => node.name === targetSpeed);
    }

    @render(GameSpeedStore, (store) => store.gameSpeed)
    renderGameSpeed(gameSpeed: string) {
        this.playSoundClick();
        const targetSpeed = gameSpeed.toLowerCase();
        const targetIndex = this.findTargetSpeedIndex(targetSpeed);

        if (targetIndex === -1) {
            return;
        }
        this.nodeSpeedList.forEach((node, index) => {
            const sprIcon = node.getComponent(Sprite);
            sprIcon.color = index === targetIndex ? new Color().fromHEX("548FF8") : new Color().fromHEX("807E7E");
        });
    }
}
