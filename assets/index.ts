import { FSBPromotionHandlers } from "./fsb-promotion/scripts/fsb-promotion-handlers";
import { FSBPromotionStore } from "./fsb-promotion/scripts/fsb-promotion-store";
import { FSBPromotionUIHandler } from "./fsb-promotion/scripts/fsb-promotion-ui-handler";
import { FSBPromotionUIStore } from "./fsb-promotion/scripts/fsb-promotion-ui-store";

export * from "./game-message-slot";
export * from "./fsb-promotion/scripts/fsb-promotion-handlers";
export * from "./fsb-promotion/scripts/fsb-promotion-store";
export * from "./fsb-promotion/scripts/fsb-promotion-ui-handler";
export * from "./fsb-promotion/scripts/fsb-promotion-ui-store";

export const FEATURE_NAME = "common-slot";

export const CommonSlotFeature = {
    name: FEATURE_NAME,
    onContainerCreated: (container: any) => {
        container.bind(FSBPromotionStore).to(FSBPromotionStore).inSingletonScope();
        container.bind(FSBPromotionUIStore).to(FSBPromotionUIStore).inSingletonScope();
        container.bind(FSBPromotionUIHandler).to(FSBPromotionUIHandler).inSingletonScope();
        container.bind(FSBPromotionHandlers).to(FSBPromotionHandlers).inSingletonScope();
    },
};
