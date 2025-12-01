import { _decorator, Button, Component, Label, Slider } from 'cc';
import { AudioIds } from 'db://assets/game/audios/AudioIds';
import { AudioUtils } from 'db://shared-components/game/audios/utils';
const { ccclass, property } = _decorator;

@ccclass('SliderControl')
export class SliderControl extends Component {
    @property(Label)
    lblValue: Label = null;

    @property(Slider)
    slider: Slider = null;

    private btnIncrease: Button = null;
    private btnDecrease: Button = null;
    private progress: number = 0;

    listener = {
        onClickIncrease: () => { },
        onClickDecrease: () => { },
        onSliderChange: (slider: Slider) => { },
    }

    onClickIncrease() {
        AudioUtils.playSFX(AudioIds.CLICK);
        this.listener.onClickIncrease();
    }

    onClickDecrease() {
        AudioUtils.playSFX(AudioIds.CLICK);
        this.listener.onClickDecrease();
    }

    onSliderChange(slider: Slider) {
        const delta = Math.abs(slider.progress - this.progress);
        if (delta < 0.001) {
            return;
        }
        console.log('onSliderChange ', slider.progress);
        this.progress = slider.progress;
        this.listener.onSliderChange(slider);
    }

    setSliderProgress(progress: number) {
        this.progress = progress;
        this.slider.progress = progress;
    }

    setValue(value: string) {
        this.lblValue.string = value;
    }

    onLoad() {
        const buttons = this.getComponentsInChildren(Button);
        this.btnIncrease = buttons.find(btn => btn.node.name === 'increase');
        this.btnDecrease = buttons.find(btn => btn.node.name === 'decrease');
    }

    setInteractable(interactable: { [key: string]: boolean }) {
        if (this.btnIncrease) {
            this.btnIncrease.interactable = interactable.increase;
        }
        if (this.btnDecrease) {
            this.btnDecrease.interactable = interactable.decrease;
        }
    }
}

