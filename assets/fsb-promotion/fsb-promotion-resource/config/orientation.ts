// orientation.ts
import { screen } from "cc";

export const isPortraitMode = (): boolean => {
  const { width, height } = screen.windowSize;
  return width < height;
};
