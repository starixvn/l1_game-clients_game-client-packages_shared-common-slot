import { _decorator, Component, instantiate, Label, Node, Sprite, UIRenderer } from "cc";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
const { ccclass, property } = _decorator;

@ccclass
export default class FlashSpinId extends Component {
    @property(Label)
    mainIdLabel: Label = null;

    @property(Label)
    otherIdLabels: Label = null;

    @property(Node)
    nodeArrow: Node = null;

    @property(Sprite)
    borderSprite: Sprite = null;

    expandNodes: Node[] = [];

    setWin(isWin: boolean) {
        this.borderSprite.enabled = isWin;
    }

    setColor(color: string) {
        this.getComponentsInChildren(UIRenderer).forEach(renderer => {
            ComponentUtils.setNodeColor(renderer.node, color);
        });
    }

    setId(id: number) {
        [this.mainIdLabel, this.otherIdLabels].forEach(label => {
            label.string = id.toString();
            label.updateRenderData();
        });

        const lblIdTransform = ComponentUtils.getTransform(this.mainIdLabel.node);
        const padding = 8;
        const width = Math.max(lblIdTransform.width + 2 * padding, 38);
        ComponentUtils.setNodeTransform(this.borderSprite.node, { width });
    }

    setExpand(expand: boolean) {
        this.expandNodes.forEach(node => node.active = expand);
        this.mainIdLabel.node.parent.active = true;
    }

    setRow(row: number) {
        console.log(`set row ${row}`);
        if (row > 1) {
            this.expandNodes.push(this.otherIdLabels.node.parent);
        }
        if (row > 2) {
            this.expandNodes.push(this.nodeArrow);

            const moreNodeCount = row - 3;
            console.log('moreNodeCount', moreNodeCount);
            const parent = this.nodeArrow.parent;
            for (let i = 0; i < moreNodeCount; i++) {
                const node = instantiate(this.nodeArrow);
                node.active = true;
                parent.addChild(node);
                const lastIndex = parent.children[parent.children.length - 1].getSiblingIndex();
                node.setSiblingIndex(lastIndex - 1);
                this.expandNodes.push(node);
            }
        }
    }

}
