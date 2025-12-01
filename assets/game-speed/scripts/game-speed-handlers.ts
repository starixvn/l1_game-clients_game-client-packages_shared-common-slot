import inversify from "inversify";
import { GameSpeedStore } from "./game-speed-store";

const { injectable, inject } = inversify;

@injectable()
export class GameSpeedHandlers {
    @inject(GameSpeedStore)
    protected readonly gameSpeedStore: GameSpeedStore;

    handleGameSpeed(gameSpeed: string) {
        this.gameSpeedStore.gameSpeed = gameSpeed;
    }
}
