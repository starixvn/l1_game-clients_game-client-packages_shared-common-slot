import { _decorator, Button, Component, Node, tween, Tween, Vec3 } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class SimpleClaimButton extends Component {
    @property(Node)
    activeNode: Node = null;

    @property(Node)
    disableNode: Node = null;

    public setClaimable(isClaimable: boolean) {
        if (this.activeNode) {
            this.activeNode.active = isClaimable;
        }
        if (this.disableNode) {
            this.disableNode.active = !isClaimable;
        }

        const btn = this.getComponent(Button);
        if (btn) {
            btn.interactable = isClaimable;
        }
    }

    startClaimButtonPulse() {
        const node = this.node;
        node.scale = new Vec3(1.0, 1.0, 1.0);

        tween(node)
            .repeatForever(
                tween(node)
                    .to(0.2, { scale: new Vec3(0.93, 0.93, 0.93) }, { easing: "sineIn" })
                    .to(0.4, { scale: new Vec3(1.05, 1.05, 1.05) }, { easing: "sineOut" })
                    .to(0.3, { scale: new Vec3(1.0, 1.0, 1.0) }, { easing: "sineInOut" })
            )
            .start();
    }

    stopClaimButtonPulse() {
        Tween.stopAllByTarget(this.node);
    }
}
