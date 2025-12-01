import { _decorator, Slider } from 'cc';
import { HyperSpinHandler } from 'db://shared-cascading-slot/handlers/hyper-spin-handler';
import { BetControlStore } from 'db://shared-cascading-slot/stores/bet-control-store';
import { HyperSpinStore } from 'db://shared-cascading-slot/stores/hyper-spin-store';
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

    @render(HyperSpinStore, store => store.stopOnProfitSliderProgress)
    private renderStopOnProfitSliderProgress(progress: number) {
        this.stopOnProfitSliderCtrl.setSliderProgress(progress);
    }

    @render(HyperSpinStore, store => store.stopOnLossSliderProgress)
    private renderStopOnLossSliderProgress(progress: number) {
        this.stopOnLossSliderCtrl.setSliderProgress(progress);
    }

    @render(HyperSpinStore, store => store.formattedStopOnProfit)
    renderFormattedStopOnProfit(formattedStopOnProfit: string) {
        this.stopOnProfitSliderCtrl.setValue(formattedStopOnProfit);
    }

    @render(HyperSpinStore, store => store.formattedStopOnLoss)
    renderFormattedStopOnLoss(formattedStopOnLoss: string) {
        this.stopOnLossSliderCtrl.setValue(formattedStopOnLoss);
    }

    @render(HyperSpinStore, store => store.interactableStopOnProfit)
    renderInteractableStopOnProfit(interactable: { increase: boolean; decrease: boolean }) {
        this.stopOnProfitSliderCtrl.setInteractable(interactable);
    }

    @render(HyperSpinStore, store => store.interactableStopOnLoss)
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

    @render(HyperSpinStore, store => store.interactableTotalBet)
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

    @handle(HyperSpinHandler, (handle, value: boolean) => handle.changeTotalBet(value))
    changeTotalBet(value: boolean) {
        return value;
    }

    @handle(HyperSpinHandler, (handle, value: boolean) => handle.changeStopOnProfit(value))
    changeStopOnProfit(value: boolean) {
        return value;
    }

    @handle(HyperSpinHandler, (handle, value: boolean) => handle.changeStopOnLoss(value))
    changeStopOnLoss(value: boolean) {
        return value;
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnProfitFromSlider(progress))
    private handleStopOnProfitSliderChange(progress: number) {
        return progress;
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnLossFromSlider(progress))
    private handleStopOnLossSliderChange(progress: number) {
        return progress;
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setTotalBetFromSlider(progress))
    private handleTotalBetSliderChange(progress: number) {
        return progress;
    }
}


