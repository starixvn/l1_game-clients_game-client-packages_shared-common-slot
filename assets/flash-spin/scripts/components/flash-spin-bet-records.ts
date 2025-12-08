import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { DetailRecord, FlashSpinBatchData, FlashSpinSingleSpinData } from "../flash-spin-definitions";
import { FlashSpinStore } from "../handlers/flash-spin-store";
import FlashSpinRecordBodyItem from "./flash-spin-record-body-item";

const { ccclass, menu, property } = _decorator;
const { render } = Observer;

@ccclass("FlashSpinBetRecords")
export class FlashSpinBetRecords extends ObserverComponent {
    @property(Prefab)
    prfHyperSpinRecordBodyItem: Prefab = null;

    @property(Node)
    scrollContent: Node = null;

    @property(Label)
    hyperTotalWinValue: Label = null;

    @property(Label)
    lblTotalBetValue: Label = null;

    @property(Label)
    lblHyperSpinStatus: Label = null;

    @property(Node)
    startRow: Node = null;

    @property(Node)
    endRow: Node = null;

    currentRecordItem: FlashSpinRecordBodyItem = null;

    onLoad() {
        this.startRow.active = false;
        this.endRow.active = false;
        super.onLoad();
    }

    private initHyperSpinRecords(spins: FlashSpinBatchData['spins']) {
        if (!spins || spins.length === 0) {
            return;
        }

        // For decreasing sort order, render cascade records first, then main records
        // This ensures cascade records appear below their parent when sorted in reverse
        spins.forEach((spin) => {
            // Then render main spin record
            this.renderSpinRecord(spin);
        });
    }

    private renderSpinRecord(spin: FlashSpinSingleSpinData) {
        if (!this.currentRecordItem || this.currentRecordItem.spinId !== spin.spinId) {
            this.currentRecordItem?.setCurrentActive(false);
            this.currentRecordItem = this.createNewRecordItem();
            this.currentRecordItem.setCurrentActive(true);
        }
        const item = this.currentRecordItem;
        if (item) {
            item.setSpinData(spin);
        }
    }

    private createNewRecordItem() {
        const node = instantiate(this.prfHyperSpinRecordBodyItem);
        const recordBodyItem = node.getComponent(FlashSpinRecordBodyItem);
        this.scrollContent.addChild(node);
        return recordBodyItem;
    }

    private renderCascadeRecord(parentSpinId: string | number, cascadeRecord: DetailRecord) {
    }

    @render(FlashSpinStore, (store) => store.singleSpinData)
    private renderSingleSpinRecord(spin: FlashSpinSingleSpinData) {
        if (!spin) {
            return;
        }
        this.renderSpinRecord(spin);
    }

    @render(FlashSpinStore, (store) => store.spinBatchData)
    private renderHyperSpinRecords(data: FlashSpinBatchData) {
        if (!data) {
            return;
        }

        const spins = data?.spins;
        if (spins) {
            // Always re-initialize for now since the structure is more complex
            // with cascade records mixed in. Could be optimized later.
            this.initHyperSpinRecords(spins);
        }
    }


    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.totalWin)
    private updateHyperTotalWinValue(totalWin: number) {
        if (this.hyperTotalWinValue) {
            const displayValue = totalWin > 0 ? gc.FormatUtils.numberWithCommas(totalWin, 2) : "0.00";
            this.hyperTotalWinValue.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.totalBet)
    private updateLblTotalBetValue(totalBet: number) {
        if (this.lblTotalBetValue) {
            const displayValue = totalBet > 0 ? gc.FormatUtils.numberWithCommas(totalBet, 2) : "0.00";
            this.lblTotalBetValue.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.startingBalance)
    private updateStartingBalanceLabel(startingBalance: number) {
        if (startingBalance > 0) {
            const value = gc.FormatUtils.numberWithCommas(startingBalance, 2, true);
            this.scrollContent.destroyAllChildren();

            const node = instantiate(this.startRow);
            node.active = true;
            this.scrollContent.addChild(node);
            const label = node.getComponentsInChildren(Label).find(child => child.node.name === "value");
            if (label) {
                label.string = value;
            }
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.endBalance)
    private updateEndBalanceLabel(endBalance: number) {
        const value = gc.FormatUtils.numberWithCommas(endBalance, 2, true);
        const node = instantiate(this.endRow);
        node.active = true;
        this.scrollContent.addChild(node);
        const label = node.getComponentsInChildren(Label).find(child => child.node.name === "value");
        if (label) {
            label.string = value;
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.status)
    private updateHyperSpinStatusLabel(hyperSpinStatus: string) {
        if (this.lblHyperSpinStatus) {
            const displayValue = hyperSpinStatus?.toUpperCase() || "";
            this.lblHyperSpinStatus.string = displayValue;
        }
    }

}

