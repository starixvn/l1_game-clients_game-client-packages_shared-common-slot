import { _decorator } from "cc";
import { FontMapping, LocalizedFont } from "db://shared-components/shared/common-components/localization/localized-font";

const { ccclass } = _decorator;

@ccclass()
export class LocalizedUTMSwissFont extends LocalizedFont {
    initData() {
        const utmSwiss = "utm-swiss-721-black-condensed";
        this.fontBases = {
            vi: {
                name: utmSwiss,
                loadRemote: false,
            },
            id: {
                name: utmSwiss,
                loadRemote: false,
            },
            en: {
                name: utmSwiss,
                loadRemote: false,
            },
            th: {
                name: "noto-serif-bold-thai",
                loadRemote: false,
            },
            zh_tw: {
                name: "noto-serif-bold-zhtw",
                loadRemote: false,
            },
            zh_cn: {
                name: "noto-serif-bold-zhcn",
                loadRemote: false,
            },
            ...globalThis?.fontMapping?.bold,
        } as FontMapping;
    }
}
