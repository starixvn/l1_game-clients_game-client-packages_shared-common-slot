import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Layout, Node, UIRenderer, Widget } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { DetailRecord, HyperSpinSingleSpinData } from "../handlers/flash-spin-store";
import FlashSpinDetailItem from "./flash-spin-detail-item";
import FlashSpinId from "./flash-spin-id";
import FlashSpinMultiplierView from "./flash-spin-multiplier-view";
const { ccclass, property } = _decorator;

@ccclass
export default class HyperSpinRecordBodyItem extends Component {
    @property(FlashSpinId)
    spinIdView: FlashSpinId = null;

    @property(Label)
    lblBalanceBefore: Label = null;

    @property(Label)
    balanceFinalLabels: Label[] = [];

    @property(Label)
    lblTotalWin: Label = null;

    @property(FlashSpinMultiplierView)
    multiplierView: FlashSpinMultiplierView = null;

    @property(Node)
    nodeBgWinning: Node = null;

    @property(Node)
    nodeBgCurrent: Node = null;

    @property(Node)
    nodeFreespinMarker: Node = null;

    @property(Node)
    sampleDetailRecord: Node = null;

    @property(Node)
    nodeDetailRecordContent: Node = null;

    @property({ type: Node })
    detailNodes: Node[] = [];

    @property(Node)
    summaryNode: Node = null;

    spinId = 0;

    expanded = false;
    rowHeight = 0;
    animating = false;

    onLoad() {
        this.rowHeight = ComponentUtils.getTransform(this.node).height;
        this.sampleDetailRecord.active = false;
        this.updateExpandVisibility();
    }

    setCurrentActive(active: boolean) {
        this.nodeBgCurrent.active = active;
        const color = active ? "#000000" : "#FFFFFF";
        this.spinIdView.setColor(color);
        [
            this.lblBalanceBefore, ...this.balanceFinalLabels, this.lblTotalWin,
            ... this.nodeDetailRecordContent.getComponentsInChildren(UIRenderer),
            ... this.multiplierView.getComponentsInChildren(UIRenderer),
        ].forEach(renderer => {
            ComponentUtils.setNodeColor(renderer.node, color);
        });
    }

    setSpinData(spinData: HyperSpinSingleSpinData) {
        this.spinId = spinData.spinId;

        this.spinIdView.setId(spinData.spinId);
        this.spinIdView.setWin(spinData.totalWin > 0);
        this.spinIdView.setRow(spinData.detailRecords?.length ?? 0);
        this.spinIdView.setExpand(true);
        this.nodeFreespinMarker.active = spinData.isFreeSpin;

        if (this.lblTotalWin) {
            this.lblTotalWin.string = gc.FormatUtils.numberWithCommas(spinData.totalWin, 2);
        }

        this.balanceFinalLabels.forEach(label => {
            label.string = gc.FormatUtils.numberWithCommas(spinData.balanceAfter, 2);
        });

        if (this.lblBalanceBefore) {
            this.lblBalanceBefore.string = gc.FormatUtils.numberWithCommas(spinData.balanceBefore, 2);
        }

        if (this.nodeBgWinning) {
            this.nodeBgWinning.active = spinData.totalWin > 0;
        }

        this.multiplierView.setMultiplier(spinData.totalMultiplier, spinData.winLevel);

        if (spinData.detailRecords && spinData.detailRecords.length > 0) {
            this.registerTouchExpand();
            this.initDetailRecords(spinData.detailRecords);
        }
    }

    onDestroy() {
        this.unregisterTouchExpand();
    }

    registerTouchExpand() {
        this.node.on(Node.EventType.TOUCH_END, this.onClickExpand, this);
    }

    unregisterTouchExpand() {
        this.node.off(Node.EventType.TOUCH_END, this.onClickExpand, this);
    }

    async initDetailRecords(detailRecords: DetailRecord[]) {
        this.expanded = true;
        this.updateExpandVisibility();

        this.animating = true;
        for (const [index, record] of detailRecords.entries()) {
            index > 0 && await AnimationUtils.delayTime(0.5);
            const node = instantiate(this.sampleDetailRecord);
            node.active = true;
            const detailItem = node.getComponent(FlashSpinDetailItem);
            detailItem.setData(record);
            this.nodeDetailRecordContent.addChild(node);
            this.updateHeightContent();
        };
        this.animating = false;
        this.scheduleOnce(() => this.toggleExpanded(), 3);
    }

    private updateHeightContent() {
        const height = this.nodeDetailRecordContent.active ? this.getDetailContentHeight() : this.rowHeight;
        ComponentUtils.setNodeTransform(this.node, { height });
        this.node.getComponentsInChildren(Widget).forEach(widget => {
            widget.updateAlignment();
        });
    }

    private getDetailContentHeight() {
        const layout = this.nodeDetailRecordContent.getComponent(Layout);
        layout.updateLayout();
        const transform = ComponentUtils.getTransform(this.nodeDetailRecordContent);
        const height = transform.height;
        return height;
    }

    onClickExpand() {
        if (this.animating) {
            return;
        }
        this.unscheduleAllCallbacks();
        AudioUtils.playClick();
        this.toggleExpanded();
    }

    private toggleExpanded() {
        this.expanded = !this.expanded;
        this.spinIdView.setExpand(this.expanded);
        this.updateExpandVisibility();
        this.updateHeightContent();
    }

    private updateExpandVisibility() {
        this.nodeDetailRecordContent.active = this.expanded;
        this.summaryNode.active = !this.expanded;
        this.detailNodes.forEach(node => {
            node.active = this.expanded;
        });
    }
}
