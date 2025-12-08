import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { DetailRecord, HyperSpinBatchData, HyperSpinSingleSpinData } from "../flash-spin-definitions";
import { FlashSpinStore } from "../handlers/flash-spin-store";
import FlashSpinRecordBodyItem from "./flash-spin-record-body-item";

const { ccclass, menu, property } = _decorator;
const { render } = Observer;

@ccclass("FlashSpinBetRecords")
export class FlashSpinBetRecords extends ObserverComponent {
    @property(Prefab)
    prfHyperSpinRecordBodyItem: Prefab = null;

    @property(Node)
    hyperSpinRecordBodyContentNode: Node = null;

    @property(Label)
    startingBalanceLabel: Label = null;

    @property(Label)
    endBalanceLabel: Label = null;

    @property(Label)
    hyperTotalWinValue: Label = null;

    @property(Label)
    lblTotalBetValue: Label = null;

    @property(Label)
    lblHyperSpinStatus: Label = null;

    @property(Node)
    endBalanceNode: Node = null;

    currentRecordItem: FlashSpinRecordBodyItem = null;

    private initHyperSpinRecords(spins: HyperSpinBatchData['spins']) {
        if (!spins || spins.length === 0) {
            return;
        }

        console.trace('initHyperSpinRecords');
        this.hyperSpinRecordBodyContentNode.destroyAllChildren();

        // For decreasing sort order, render cascade records first, then main records
        // This ensures cascade records appear below their parent when sorted in reverse
        spins.forEach((spin) => {
            // Then render main spin record
            this.renderSpinRecord(spin);
        });
    }

    private renderSpinRecord(spin: HyperSpinSingleSpinData) {
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
        this.hyperSpinRecordBodyContentNode.addChild(node);
        return recordBodyItem;
    }

    private renderCascadeRecord(parentSpinId: string | number, cascadeRecord: DetailRecord) {
    }

    @render(FlashSpinStore, (store) => store.singleSpinData)
    private renderSingleSpinRecord(spin: HyperSpinSingleSpinData) {
        if (!spin) {
            return;
        }
        this.renderSpinRecord(spin);
    }

    @render(FlashSpinStore, (store) => store.spinBatchData)
    private renderHyperSpinRecords(data: HyperSpinBatchData) {
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

    @render(FlashSpinStore, (store) => ({
        batchStartingBalance: store.spinBatchData?.summary?.startingBalance,
        hasBatchData: !!store.spinBatchData,
        userBalance: store.userBalance
    }))
    private updateStartingBalanceLabel(data: { batchStartingBalance: string; hasBatchData: boolean, userBalance: number }) {
        if (this.startingBalanceLabel) {
            let displayValue: string;

            if (data.hasBatchData && data.batchStartingBalance) {
                displayValue = data.batchStartingBalance;
            } else {
                const currentBalance = data.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.startingBalanceLabel.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => ({
        batchEndBalance: store.spinBatchData?.summary?.endBalance,
        hasBatchData: !!store.spinBatchData,
        batchStatus: store.spinBatchData?.summary?.hyperSpinStatus,
        userBalance: store.userBalance
    }))
    private updateEndBalanceLabel(data: { batchEndBalance: string; hasBatchData: boolean; batchStatus: string, userBalance: number }) {
        if (this.endBalanceLabel) {
            let displayValue: string;

            if (data.hasBatchData && data.batchStatus === "Ready" && data.batchEndBalance && data.batchEndBalance !== "0.00") {
                displayValue = data.batchEndBalance;
            } else {
                const currentBalance = data.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.endBalanceLabel.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.hyperSpinStatus)
    private updateHyperSpinStatusLabel(hyperSpinStatus: string) {
        if (this.lblHyperSpinStatus) {
            const displayValue = hyperSpinStatus?.toUpperCase() || "";
            this.lblHyperSpinStatus.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => ({
        batchStatus: store.spinBatchData?.summary?.hyperSpinStatus,
        batchEndBalance: store.spinBatchData?.summary?.endBalance,
        hasBatchData: !!store.spinBatchData
    }))
    private updateEndBalanceNodeVisibility(data: { batchStatus: string; batchEndBalance: string; hasBatchData: boolean }) {
        if (this.endBalanceNode) {
            // Show endBalanceNode only when batch is completed (Ready status) and endBalance is set
            const shouldShow = data.hasBatchData &&
                data.batchStatus === "Ready" &&
                data.batchEndBalance &&
                data.batchEndBalance !== "0.00";
            this.endBalanceNode.active = shouldShow;
        }
    }

}

