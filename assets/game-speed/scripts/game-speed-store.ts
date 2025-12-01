import inversify from "inversify";
import mobx from "mobx";

const { injectable } = inversify;
export const GameSpeed = {
    NORMAL: "NORMAL",
    TURBO: "TURBO",
    ULTRA: "ULTRA",
};

@injectable()
export class GameSpeedStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    private _gameSpeed = GameSpeed.NORMAL;

    set gameSpeed(gameSpeed: string) {
        this._gameSpeed = gameSpeed;
    }

    get gameSpeed() {
        return this._gameSpeed;
    }
}
