import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";

const { ccclass, property } = _decorator;

@ccclass()
export class FSBPromotionInfo extends ObserverComponent {
    @property(Label) labelTotalWin: Label = null;
    @property(Label) labelFSB: Label = null;
    @property(Label) labelBetLevel: Label = null;
    @property(Label) labelTotalBet: Label = null;
}
