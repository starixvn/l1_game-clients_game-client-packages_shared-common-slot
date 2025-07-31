import { _decorator, Font } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { FontMapping, LocalizedFont } from "db://shared-components/shared/common-components/localization/localized-font";

const { ccclass } = _decorator;

@ccclass()
export class LocalizedUTMBryantLGFont extends LocalizedFont {
    initData() {
        const utmBryantLG = "utm-bryantlg";
        this.loadFont(utmBryantLG);
        this.fontBases = {
            vi: utmBryantLG,
            id: utmBryantLG,
            en: utmBryantLG,
            th: "noto-serif-regular-thai",
            zh_cn: "noto-serif-regular-zhcn",
            zh_tw: "noto-serif-regular-zhtw",
        } as FontMapping;
    }
}
