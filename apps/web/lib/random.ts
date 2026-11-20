export const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

export const count = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
