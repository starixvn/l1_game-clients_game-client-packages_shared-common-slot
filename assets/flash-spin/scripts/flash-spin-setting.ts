import { _decorator, instantiate, Node, Prefab, Slider } from 'cc';
import { FlashSpinHandler } from 'db://shared-cascading-slot/flash-spin/handlers/flash-spin-handler';
import { FlashSpinStore } from 'dbdb://shared-common-slot/flash-spin/scripts/handlers/flash-spin-handler
import { BetControlStore } from db://shared-common-slot/flash-spin/scripts/handlers/flash-spin-store
import HyperSpinRoundNumber from 'db://shared-common-slot/flash-spin/scripts/components/hyper-spin-round-number';
import { AudioUtils } from 'db://shared-components/game/audios/utils';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';
import Observer from "observer";
import { SliderControl } from './slider-control';
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
@ccclass('FlashSpinSetting')
export class FlashSpinSetting extends ObserverComponent {
    @property(SliderControl)
    stopOnProfitSliderCtrl: SliderControl = null;

    @property(SliderControl)
    stopOnLossSliderCtrl: SliderControl = null;

    @property(SliderControl)
    betSliderCtrl: SliderControl = null;

    @property(Prefab)
    numberItemPrefab: Prefab = null;

    @property(Node)
    numberContainer: Node = null;

    @property(Node)
    stopOnFeatureNode: Node = null;

    @render(FlashSpinStore, (store) => {
        return {
            roundsList: store.roundsList,
            selectedRoundOnPopup: store.selectedRoundOnPopup
        }
    })
    initContentRounds(data: { roundsList: number[]; selectedRoundOnPopup: number }) {
        const { roundsList, selectedRoundOnPopup } = data;

        this.numberContainer.destroyAllChildren();

        roundsList.forEach((round) => {
            const node = instantiate(this.numberItemPrefab);
            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            if (roundNumber) {
                roundNumber.setValue(round);
            }
            this.numberContainer.addChild(node);
        });

        this.renderSelectedRounds(selectedRoundOnPopup);
    }

    @render(FlashSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.numberContainer.children.forEach((child) => {
            const roundNumber = child.getComponent(HyperSpinRoundNumber);
            if (!roundNumber) {
                return;
            }
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
        });
    }

    @render(FlashSpinStore, store => store.stopOnProfitSliderProgress)
    private renderStopOnProfitSliderProgress(progress: number) {
        this.stopOnProfitSliderCtrl.setSliderProgress(progress);
    }

    @render(FlashSpinStore, store => store.stopOnLossSliderProgress)
    private renderStopOnLossSliderProgress(progress: number) {
        this.stopOnLossSliderCtrl.setSliderProgress(progress);
    }

    @render(FlashSpinStore, store => store.formattedStopOnProfit)
    renderFormattedStopOnProfit(formattedStopOnProfit: string) {
        this.stopOnProfitSliderCtrl.setValue(formattedStopOnProfit);
    }

    @render(FlashSpinStore, store => store.formattedStopOnLoss)
    renderFormattedStopOnLoss(formattedStopOnLoss: string) {
        this.stopOnLossSliderCtrl.setValue(formattedStopOnLoss);
    }

    @render(FlashSpinStore, store => store.interactableStopOnProfit)
    renderInteractableStopOnProfit(interactable: { increase: boolean; decrease: boolean }) {
        this.stopOnProfitSliderCtrl.setInteractable(interactable);
    }

    @render(FlashSpinStore, store => store.interactableStopOnLoss)
    renderInteractableStopOnLoss(interactable: { increase: boolean; decrease: boolean }) {
        this.stopOnLossSliderCtrl.setInteractable(interactable);
    }

    @render(BetControlStore, store => store.formattedTotalBet)
    renderFormattedTotalBet(formattedTotalBet: string) {
        this.betSliderCtrl.setValue(formattedTotalBet);
    }

    @render(BetControlStore, store => store.totalBetSliderProgress)
    renderTotalBetSliderProgress(progress: number) {
        this.betSliderCtrl.setSliderProgress(progress);
    }

    @render(FlashSpinStore, store => store.interactableTotalBet)
    renderInteractableTotalBet(interactable: { increase: boolean; decrease: boolean }) {
        this.betSliderCtrl.setInteractable(interactable);
    }

    onLoad(): void {
        this.stopOnProfitSliderCtrl.listener = {
            onClickIncrease: () => {
                this.changeStopOnProfit(true);
            },
            onClickDecrease: () => {
                this.changeStopOnProfit(false);
            },
            onSliderChange: (slider: Slider) => {
                this.handleStopOnProfitSliderChange(slider.progress);
            },
        }

        this.stopOnLossSliderCtrl.listener = {
            onClickIncrease: () => {
                this.changeStopOnLoss(true);
            },
            onClickDecrease: () => {
                this.changeStopOnLoss(false);
            },
            onSliderChange: (slider: Slider) => {
                this.handleStopOnLossSliderChange(slider.progress);
            },
        }

        this.betSliderCtrl.listener = {
            onClickIncrease: () => {
                this.changeTotalBet(true);
            },
            onClickDecrease: () => {
                this.changeTotalBet(false);
            },
            onSliderChange: (slider: Slider) => {
                this.handleTotalBetSliderChange(slider.progress);
            },
        }

        super.onLoad();
    }

    @handle(FlashSpinHandler, (handle, value: boolean) => handle.changeTotalBet(value))
    changeTotalBet(value: boolean) {
        return value;
    }

    @handle(FlashSpinHandler, (handle, value: boolean) => handle.changeStopOnProfit(value))
    changeStopOnProfit(value: boolean) {
        return value;
    }

    @handle(FlashSpinHandler, (handle, value: boolean) => handle.changeStopOnLoss(value))
    changeStopOnLoss(value: boolean) {
        return value;
    }

    @handle(FlashSpinHandler, (handle, progress: number) => handle.setStopOnProfitFromSlider(progress))
    private handleStopOnProfitSliderChange(progress: number) {
        return progress;
    }

    @handle(FlashSpinHandler, (handle, progress: number) => handle.setStopOnLossFromSlider(progress))
    private handleStopOnLossSliderChange(progress: number) {
        return progress;
    }

    @handle(FlashSpinHandler, (handle, progress: number) => handle.setTotalBetFromSlider(progress))
    private handleTotalBetSliderChange(progress: number) {
        return progress;
    }

    @handle(FlashSpinHandler, (handle) => handle.toggleStopOnFeature())
    onClickStopOnFeature() {
        AudioUtils.playClick();
    }

    @render(FlashSpinStore, (store) => store.stopOnFeature)
    updateStopOnFeatureButton(stopOnFeature: boolean) {
        const state = stopOnFeature ? "on" : "off";
        const childNames = ["on", "off"];
        childNames.forEach((childName) => {
            this.stopOnFeatureNode.getChildByName(childName).active = childName === state;
        });
    }
}


