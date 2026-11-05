'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  WORLD_OBJECTS,
  WORLD_OBJECT_IDS,
  isWorldObjectId,
  type ScreenPoint,
  type WebToWorld,
  type WorldObjectId,
  type WorldToWeb,
} from '@deep-thought/contracts';
import { Icon } from '../Icon';
import { FacilityWidget, type LatestPost } from './FacilityWidget';
import styles from './GodotStage.module.css';

type Anchors = Partial<Record<WorldObjectId, ScreenPoint>>;

const DESKTOP_QUERY = '(min-width: 1024px)';

/** data-safe 왼쪽·오른쪽 요소 사이의 빈 가로 범위 (stage 기준 CSS px). 좁은 화면은 UI가 아래에 쌓이므로 전체 */
function measureSafeArea(stage: HTMLElement) {
  const r = stage.getBoundingClientRect();
  const safe = { left: 0, right: r.width };
  if (window.matchMedia(DESKTOP_QUERY).matches) {
    const hero = document.querySelector('[data-safe="left"]');
    const panel = document.querySelector('[data-safe="right"]');
    if (hero) safe.left = hero.getBoundingClientRect().right - r.left;
    if (panel) safe.right = panel.getBoundingClientRect().left - r.left;
  }
  return safe;
}

/**
 * 배경 그림 위에 투명한 Godot 월드(iframe)와 건물 이름표를 얹는다. 메시지 계약은 @deep-thought/contracts.
 * INTERACT는 시설 위젯을 연다. 열린 채로 돌아다닐 수 있도록 포커스는 월드에 둔다.
 */
export function GodotStage({ active, latestPost }: { active: boolean; latestPost?: LatestPost }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const labelRefs = useRef(new Map<WorldObjectId, HTMLElement>());
  const anchorsRef = useRef<Anchors>({});
  const safeRef = useRef({ left: 0, right: 0 });
  const started = useRef(0);
  const liveRef = useRef(false);
  const [readyMs, setReadyMs] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState<'unsupported' | 'failed' | null>(null);
  const [paused, setPaused] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [nearId, setNearId] = useState<WorldObjectId | null>(null);
  const [interacted, setInteracted] = useState<WorldObjectId | null>(null);
  const [openId, setOpenId] = useState<WorldObjectId | null>(null);
  const widgetRef = useRef<HTMLElement>(null);
  const [ride, setRide] = useState<'ride' | 'dismount' | null>(null);
  const rideRef = useRef<HTMLDivElement>(null);
  /** 메시지를 듣기 시작한 뒤에 넣는다: SSR HTML에 미리 있으면 캐시로 빨리 뜬 Godot의 한 번뿐인 WORLD_READY를 놓친다 */
  const [frameSrc, setFrameSrc] = useState<string>();

  const send = useCallback((msg: WebToWorld) => {
    frameRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  /** 키 입력이 월드로 가도록 iframe 속 캔버스에 포커스 (같은 출처) */
  const focusWorld = useCallback(() => {
    const frame = frameRef.current;
    frame?.focus({ preventScroll: true });
    frame?.contentDocument?.querySelector('canvas')?.focus({ preventScroll: true });
  }, []);

  /** 자리는 메시지마다 바뀌므로 React 상태 대신 DOM에 직접 넣는다 */
  const place = useCallback(() => {
    const a = anchorsRef.current;
    for (const id of WORLD_OBJECT_IDS) {
      const el = labelRefs.current.get(id);
      const p = a[id];
      if (el && p) el.style.translate = `${Math.round(p.x)}px ${Math.round(p.y)}px`;
    }
    const widget = widgetRef.current;
    const anchor = widget && a[widget.dataset.kind as WorldObjectId];
    if (widget && anchor) widget.style.translate = `${Math.round(anchor.x)}px ${Math.round(anchor.y)}px`;
  }, []);

  useEffect(() => {
    started.current = performance.now();
    const ready = () => {
      setReadyMs((cur) => cur ?? Math.round(performance.now() - started.current));
      const safe = safeRef.current;
      send({ type: 'SET_SAFE_AREA', left: safe.left, right: safe.right });
    };
    const onMessage = (e: MessageEvent<WorldToWeb>) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      const msg = e.data;
      switch (msg.type) {
        case 'WORLD_PROGRESS':
          if (msg.total > 0) setProgress(msg.loaded / msg.total);
          break;
        case 'WORLD_READY':
          ready();
          break;
        case 'WORLD_ERROR':
          setFailed(msg.reason);
          break;
        case 'OBJECT_ANCHORS':
          // 첫 프레임 뒤에만 오므로 WORLD_READY를 놓쳤어도 월드는 떠 있다
          if (!liveRef.current) ready();
          anchorsRef.current = msg.anchors;
          setPlaced(true);
          place();
          break;
        case 'OBJECT_NEAR':
          if (isWorldObjectId(msg.objectId)) setNearId(msg.objectId);
          break;
        case 'OBJECT_LEAVE':
          setNearId((cur) => (cur === msg.objectId ? null : cur));
          setOpenId((cur) => (cur === msg.objectId ? null : cur));
          break;
        case 'INTERACT':
          if (isWorldObjectId(msg.objectId)) {
            const id = msg.objectId;
            setInteracted(id);
            setOpenId((cur) => (cur === id ? null : id));
          }
          break;
        case 'WORLD_ESCAPE':
          setOpenId(null);
          break;
        case 'RIDE_PROMPT':
          setRide(msg.action);
          if (rideRef.current) rideRef.current.style.translate = `${Math.round(msg.at.x)}px ${Math.round(msg.at.y)}px`;
          break;
      }
    };
    window.addEventListener('message', onMessage);
    setFrameSrc('/godot/index.html?bg=web');
    return () => window.removeEventListener('message', onMessage);
  }, [send, place]);

  useLayoutEffect(() => {
    if (!active) return;
    const stage = stageRef.current!;
    const measure = () => {
      const safe = measureSafeArea(stage);
      safeRef.current = safe;
      send({ type: 'SET_SAFE_AREA', left: safe.left, right: safe.right });
    };
    measure();
    // data-safe 요소 폭은 화면 크기와 따로 바뀐다 (폰트 로드, 내용 변경)
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.querySelectorAll('[data-safe]').forEach((el) => ro.observe(el));
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [send, active]);

  useLayoutEffect(place, [openId, place]);

  // 숨기면 iframe이 포커스를 잃어서 돌아올 때 다시 준다
  const wasHidden = useRef(false);
  useEffect(() => {
    if (active && wasHidden.current) focusWorld();
    wasHidden.current = !active;
  }, [active, focusWorld]);

  // 월드가 뜨기 전에 페이지를 떠났을 수 있어 준비된 뒤에도 다시 알린다
  useEffect(() => {
    send({ type: active ? 'WAKE_WORLD' : 'SLEEP_WORLD' });
  }, [active, readyMs, send]);

  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openId]);

  // 웹 입력창에 글자를 치는 동안 월드 키 입력을 멈춘다
  useEffect(() => {
    const isTyping = (el: Element | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    const onFocusIn = (e: FocusEvent) => {
      if (!isTyping(e.target as Element)) return;
      send({ type: 'PAUSE_INPUT' });
      setPaused(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isTyping(e.target as Element)) return;
      send({ type: 'RESUME_INPUT' });
      setPaused(false);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [send]);

  const live = readyMs !== null;
  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  const onLabelClick = (id: WorldObjectId) => () => {
    if (!live) return;
    send({ type: 'MOVE_TO_OBJECT', objectId: id });
    focusWorld();
  };

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-testid="godot-stage"
      data-active={active || undefined}
      data-phase={live ? 'live' : 'loading'}
      data-ready-ms={readyMs ?? ''}
      data-input={paused ? 'paused' : 'live'}
      data-interact={interacted ?? ''}
    >
      <img className={styles.plate} src="/world/space-bg.webp" alt="" data-testid="space-plate" />
      <iframe
        ref={frameRef}
        title="Zannabi's Little Universe"
        src={frameSrc}
        className={styles.frame}
      />
      {!live && (
        <div className={`${styles.boot} mono`} aria-live="polite">
          {failed === 'unsupported'
            ? 'WORLD OFFLINE — 이 브라우저에서는 섬을 띄울 수 없어요'
            : failed
              ? 'WORLD OFFLINE — 섬을 불러오지 못했어요. 새로고침해 주세요'
              : `WORLD LOADING ${Math.round(progress * 100)}%`}
        </div>
      )}
      <div className={styles.overlay} data-placed={placed || undefined}>
        {WORLD_OBJECT_IDS.map((id) => {
          const def = WORLD_OBJECTS[id];
          const near = live && nearId === id;
          return (
            <button
              key={id}
              type="button"
              className={styles.label}
              data-near={near}
              data-open={openId === id || undefined}
              data-kind={id}
              data-testid={`label-${id}`}
              ref={(el) => {
                if (el) labelRefs.current.set(id, el);
                else labelRefs.current.delete(id);
              }}
              onClick={onLabelClick(id)}
            >
              <Icon name={def.icon} size={14} />
              {def.label}
              <kbd aria-hidden={!near}>E</kbd>
            </button>
          );
        })}
        <div ref={rideRef} className={`${styles.label} ${styles.ride}`} data-near="true" data-kind="rover" data-on={(live && ride) || undefined} aria-hidden={!ride}>
          <Icon name="box" size={14} />
          {ride === 'dismount' ? 'GET OFF' : 'RIDE'}
          <kbd>E</kbd>
        </div>
        {openId && (
          <FacilityWidget
            ref={widgetRef}
            id={openId}
            latestPost={latestPost}
            onClose={() => {
              setOpenId(null);
              focusWorld();
            }}
          />
        )}
      </div>
    </div>
  );
}
