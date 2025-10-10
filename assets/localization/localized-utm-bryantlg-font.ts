import { _decorator } from "cc";
import { FontMapping, LocalizedFont } from "db://shared-components/shared/common-components/localization/localized-font";

const { ccclass } = _decorator;

@ccclass()
export class LocalizedUTMBryantLGFont extends LocalizedFont {
    initData() {
        const utmBryantLG = "utm-bryantlg";
        this.fontBases = {
            vi: {
                name: utmBryantLG,
                loadRemote: false,
            },
            id: {
                name: utmBryantLG,
                loadRemote: false,
            },
            en: {
                name: utmBryantLG,
                loadRemote: false,
            },
            th: {
                name: "noto-serif-regular-thai",
                loadRemote: false,
            },
            zh_tw: {
                name: "noto-serif-regular-zhtw",
                loadRemote: false,
            },
            zh_cn: {
                name: "noto-serif-regular-zhcn",
                loadRemote: false,
            },
            "es-ES": {
                name: utmBryantLG,
                loadRemote: false,
            },
            ...globalThis?.fontMapping?.bold,
        } as FontMapping;
    }
}
