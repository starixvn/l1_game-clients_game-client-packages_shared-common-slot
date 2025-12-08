import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node, Slider, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { FlashSpinHandler } from "../handlers/flash-spin-handler";
import { FlashSpinStore } from "../handlers/flash-spin-store";

const { ccclass, menu, property } = _decorator;
const { observer, render, handle } = Observer;

type SliderEventType = Slider | Event | any;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

@ccclass("HyperSpinBetControl")
@menu('UI/HyperSpinBetControl')
export class HyperSpinBetControl extends ObserverComponent {
    @property(Label)
    hyperSpinRoundsLabel: Label = null;

    @property(Label)
    balanceLabel: Label = null;

    @property(Label)
    totalWinningsLabel: Label = null;

    @property(Label)
    playerTotalWinningsLabel: Label = null;

    @property(Sprite)
    sprIconPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Sprite)
    sprIconSettingsOff: Sprite = null;

    @property(Sprite)
    sprIconSettingsOn: Sprite = null;

    @property(Node)
    settingNode: Node = null;


    @handle(FlashSpinHandler, (handle) => handle.onClickPlayButton())
    onClickPlayButton() {
        this.playSoundClick();
    }

    @handle(FlashSpinHandler, (handle) => handle.pauseHyperSpinBatch())
    onClickPauseButton() {
        this.playSoundClick();
    }

    @render(FlashSpinStore, (store) => ({
        isHyperSpin: store.isActiveHyperSpin,
        isPaused: store.spinBatchData?.summary.hyperSpinStatus === "Paused"
    }))
    updatePlayHyperSpinButton(data: { isHyperSpin: boolean; isPaused: boolean }) {
        const { isHyperSpin, isPaused } = data;

        const showPlayButton = !isHyperSpin || (isHyperSpin && isPaused);
        if (this.sprIconPlay) {
            this.sprIconPlay.node.active = showPlayButton;
            this.hyperSpinRoundsLabel.node.active = false;
        }

        const showPauseButton = isHyperSpin && !isPaused;
        if (this.sprIconPause) {
            this.sprIconPause.node.active = showPauseButton;
        }
    }

    @render(FlashSpinStore, (store) => ({
        isSettingsOpen: store.isSettingsOpen,
        hyperSpinStatus: store.spinBatchData?.summary.hyperSpinStatus
    }))
    updateSettingsButton(data: { isSettingsOpen: boolean; hyperSpinStatus: string }) {
        const { isSettingsOpen, hyperSpinStatus } = data;
        const isPlaying = hyperSpinStatus === "Playing";

        if (!this.sprIconSettingsOff && !this.sprIconSettingsOn) {
            return;
        }

        if (this.sprIconSettingsOff) {
            this.sprIconSettingsOff.node.active = !isSettingsOpen;
            const buttonOff = this.sprIconSettingsOff.node.getComponent(Button);
            if (buttonOff) {
                buttonOff.interactable = !isPlaying;
            }
        }

        if (this.sprIconSettingsOn) {
            this.sprIconSettingsOn.node.active = isSettingsOpen;
        }
    }

    @render(FlashSpinStore, (store) => store.isSettingsOpen)
    updateHyperSpinControlsVisibility(isSettingsOpen: boolean) {
        if (this.settingNode) {
            this.settingNode.active = isSettingsOpen;
        }
    }

    @handle(FlashSpinHandler, (handle) => handle.closeHyperSpinBetControl())
    onCloseHyperSpinBetControl() {
        this.playSoundClick();
        this.node.destroy();
    }

    @handle(FlashSpinHandler, (handle) => handle.toggleSettings())
    onClickControlToggle() {
        this.playSoundClick();
    }


    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(FlashSpinStore, (store) => ({ selectedRoundOnPopup: store.selectedRoundOnPopup, isHyperSpin: store.isActiveHyperSpin, roundsHyperSpin: store.roundsHyperSpin }))
    updateHyperSpinRoundsLabel(data: { selectedRoundOnPopup: number; isHyperSpin: boolean; roundsHyperSpin: number }) {
        if (this.hyperSpinRoundsLabel) {
            this.hyperSpinRoundsLabel.node.active = data.isHyperSpin;

            let displayText: string;

            if (data.isHyperSpin && data.roundsHyperSpin > 0) {
                const remaining = data.roundsHyperSpin;
                displayText = `${remaining}`;
            } else {
                displayText = data.selectedRoundOnPopup.toString();
            }

            this.hyperSpinRoundsLabel.string = displayText;
        }
    }

    @render(FlashSpinStore, (store) => store.spinBatchData?.summary?.totalWin)
    private updateTotalWinningsLabels(totalWin: number) {
        const displayValue = totalWin > 0 ? gc.FormatUtils.numberWithCommas(totalWin, 2) : "0.00";

        if (this.totalWinningsLabel) {
            this.totalWinningsLabel.string = displayValue;
        }

        if (this.playerTotalWinningsLabel) {
            this.playerTotalWinningsLabel.string = displayValue;
        }
    }

    @render(FlashSpinStore, (store) => ({ balance: store.userBalance }))
    private renderBalance(data: { balance: number }) {
        if (!data) {
            return;
        }

        const value = data.balance;
        if (value === undefined || value === null) {
            return;
        }

        const formattedBalance = gc.FormatUtils.truncateFixedDecimals(value, 2).toString();
        this.balanceLabel && (this.balanceLabel.string = formattedBalance);
    }
}
