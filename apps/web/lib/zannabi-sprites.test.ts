import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIPS, type Clip } from '../components/hud/zannabi-motion';

const WORLD = join(__dirname, '..', 'public', 'world');

function webpSize(file: string): [number, number] {
  const data = readFileSync(file);
  const chunk = data.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [data.readUIntLE(24, 3) + 1, data.readUIntLE(27, 3) + 1];
  if (chunk === 'VP8L') {
    const bits = data.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
}

describe('Zannabi 스프라이트 띠', () => {
  for (const [clip, spec] of Object.entries(CLIPS) as [Clip, (typeof CLIPS)[Clip]][]) {
    it(`${clip}의 띠 크기가 칸 정의와 맞는다`, () => {
      const [, , w, h] = spec.box ?? [0, 0, 200, 240];
      spec.cols.forEach((cols, i) => {
        const r = i + 1;
        const file = join(WORLD, `zannabi-${clip}${r === 2 ? '@2x' : ''}.webp`);
        expect(webpSize(file)).toEqual([w * r * cols, h * r * Math.ceil(spec.frames / cols)]);
      });
    });
  }
});
