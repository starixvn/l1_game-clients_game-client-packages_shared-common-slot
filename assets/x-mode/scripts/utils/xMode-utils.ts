import gc from "@sg/game-client-base";

let xMode = 1;

export const getXMode = () => {
    return xMode;
};

export const setXMode = (value: number) => {
    xMode = value;
};

export const formatStringXMode = (value: number) => {
    return gc.FormatUtils.numberWithCommas(value * xMode, 6);
};

export const formatNumberXMode = (value: number) => {
    return gc.FormatUtils.formatXMode(value, xMode);
};