import { _decorator, Node, Tween, tween, Vec3, Component } from "cc";

const { ccclass } = _decorator;

@ccclass()
export class ButtonPulseEffect extends Component {
    private activeTween: Tween<Node> | null = null;

    onEnable() {
        this.onDisable();
        this.node.setScale(new Vec3(1, 1, 1));
        this.activeTween = tween(this.node)
            .repeatForever(
                tween()
                    .to(0.2, { scale: new Vec3(0.93, 0.93, 0.93) }, { easing: "sineIn" })
                    .to(0.4, { scale: new Vec3(1.05, 1.05, 1.05) }, { easing: "sineOut" })
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "sineInOut" })
            )
            .start();
    }

    onDisable() {
        if (this.activeTween) {
            this.activeTween.stop();
            this.activeTween = null;
        }
        this.node.setScale(new Vec3(1, 1, 1));
    }
}
