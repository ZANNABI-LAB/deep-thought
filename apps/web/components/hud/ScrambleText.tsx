'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ScrambleText.module.css';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=/<>';
const FLICKER_MS = 55;
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

type Cell = { ch: string; settled: boolean };

/**
 * 글자마다 무작위 글자로 깜빡이다가 왼쪽부터 조금씩 어긋나게 제자리에 맞춰지는 글자 줄.
 * 고정폭 글꼴이라 글자가 바뀌어도 줄 너비가 흔들리지 않는다. play가 켜지면 한 번 풀리고, 마우스를 올리면 다시 풀린다
 */
export function ScrambleText({ text, play }: { text: string; play: boolean }) {
  const [cells, setCells] = useState<Cell[]>(() => [...text].map((ch) => ({ ch, settled: true })));
  const [running, setRunning] = useState(false);
  const decodeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = 0;
    let settleAt: number[] = [];
    let nextFlick = 0;
    let active = false;

    const tick = (now: number) => {
      if (now >= nextFlick) {
        nextFlick = now + FLICKER_MS;
        const next = [...text].map((ch, i) => {
          const settled = ch === ' ' || now >= settleAt[i]!;
          return { ch: settled ? ch : glyph(), settled };
        });
        setCells(next);
        if (next.every((c) => c.settled)) {
          active = false;
          setRunning(false);
          return;
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    decodeRef.current = () => {
      if (active || still) return;
      const now = performance.now();
      settleAt = [...text].map((_, i) => now + 180 + i * 35 + Math.random() * 280);
      nextFlick = 0;
      active = true;
      setRunning(true);
      frameId = requestAnimationFrame(tick);
    };

    if (play) decodeRef.current();
    return () => cancelAnimationFrame(frameId);
  }, [text, play]);

  return (
    <span className={styles.line} data-running={running || undefined} onPointerEnter={() => decodeRef.current()}>
      <span aria-hidden="true">
        {cells.map((c, i) => (
          <span key={i} className={c.settled ? styles.settled : styles.scrambling}>
            {c.ch}
          </span>
        ))}
      </span>
      <span className={styles.caret} aria-hidden="true" />
      <span className={styles.sr}>{text}</span>
    </span>
  );
}
