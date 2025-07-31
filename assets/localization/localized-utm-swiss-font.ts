import { _decorator } from "cc";
import { FontMapping, LocalizedFont } from "db://shared-components/shared/common-components/localization/localized-font";

const { ccclass } = _decorator;

@ccclass()
export class LocalizedUTMSwissFont extends LocalizedFont {
    initData() {
        const utmSwiss = "utm-swiss-721-black-condensed";
        this.fontBases = {
            vi: utmSwiss,
            id: utmSwiss,
            en: utmSwiss,
            th: "noto-serif-bold-thai",
            zh_cn: "noto-serif-bold-zhcn",
            zh_tw: "noto-serif-bold-zhtw",
        } as FontMapping;
    }
}
