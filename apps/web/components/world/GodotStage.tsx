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

type Anchors = Partial<Record<WorldObjectId, ScreenPoint>>;

const DESKTOP_QUERY = '(min-width: 1024px)';

/** 히어로(왼쪽)와 패널(오른쪽) 사이의 빈 가로 범위 (stage 기준 CSS px). 좁은 화면은 UI가 아래에 쌓이므로 전체 */
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
 * 홈 월드: 웹이 배경 그림(public/world/space-bg.webp)을 깔고, 그 위에 투명한 Godot 화면(public/godot/, ?bg=web)을 얹는다.
 * Godot은 첫 프레임을 그린 뒤 WORLD_READY를 보내고 섬이 커지며 나타난다. 그때 iframe을 서서히 보이게 한다.
 * - 섬은 히어로·패널 사이 빈 영역에 맞춘다 (SET_SAFE_AREA). 빈 곳 클릭은 .hero/.panel의 pointer-events 규칙으로 iframe에 내려간다
 * - 건물에 겹친 이름표: Godot이 알려 준 자리(OBJECT_ANCHORS)에 띄운다. 클릭하면 Zannabi가 문 앞까지 걸어가서 실행한다 (MOVE_TO_OBJECT)
 * - 건물 가까이 가면(OBJECT_NEAR) 그 이름표가 제자리에서 커지며 밝아지고 글자 뒤에 E가 펼쳐진다. 실행(INTERACT)은 아직 data-interact로만 남긴다 (시설 화면은 다시 만들 예정)
 * - 수레 가까이 가거나 타면(RIDE_PROMPT) 수레 위에 이름표 모양의 안내(RIDE / GET OFF + E)를 띄운다
 * - 웹 입력창에 포커스가 있으면 PAUSE_INPUT, 빠지면 RESUME_INPUT을 보낸다
 * iframe 주소는 메시지 수신을 연 뒤에 넣는다: 캐시로 Godot이 hydration보다 먼저 뜨면 한 번뿐인 WORLD_READY를 놓쳐
 * 섬은 숨겨진 채 이름표만 보였다. 그래도 놓치면 OBJECT_ANCHORS(첫 프레임 뒤에만 온다)를 준비 신호로 본다.
 * 브라우저가 지원하지 않거나 시작에 실패하면(WORLD_ERROR) 로딩 문구를 안내로 바꾼다. 배경 그림은 그대로 둔다.
 * 준비 시간은 data-ready-ms로 남긴다 (e2e/godot.spec.ts).
 */
export function GodotStage() {
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
  /** 수레 안내 (RIDE_PROMPT): 'ride' | 'dismount' | null. 자리는 메시지마다 DOM에 직접 */
  const [ride, setRide] = useState<'ride' | 'dismount' | null>(null);
  const rideRef = useRef<HTMLDivElement>(null);
  /** iframe 주소는 메시지를 듣기 시작한 뒤에 넣는다 (SSR HTML에 미리 있으면 캐시로 빨리 뜬 Godot의 WORLD_READY를 놓친다) */
  const [frameSrc, setFrameSrc] = useState<string>();

  const send = useCallback((msg: WebToWorld) => {
    frameRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  /** 키 입력이 다시 월드로 가게: iframe 속 캔버스에 포커스 (같은 출처라 접근 가능) */
  const focusWorld = useCallback(() => {
    const frame = frameRef.current;
    frame?.focus({ preventScroll: true });
    frame?.contentDocument?.querySelector('canvas')?.focus({ preventScroll: true });
  }, []);

  /** 이름표를 건물 자리에 맞춘다 (메시지마다 DOM에 직접, React 상태는 건드리지 않음) */
  const place = useCallback(() => {
    const a = anchorsRef.current;
    for (const id of WORLD_OBJECT_IDS) {
      const el = labelRefs.current.get(id);
      const p = a[id];
      if (el && p) el.style.translate = `${Math.round(p.x)}px ${Math.round(p.y)}px`;
    }
  }, []);

  // ── 월드 → 웹 ──
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
          // 자리는 첫 프레임 뒤에만 온다: WORLD_READY를 놓쳤어도 월드는 떠 있다
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
          break;
        case 'INTERACT':
          if (isWorldObjectId(msg.objectId)) setInteracted(msg.objectId);
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

  // ── 히어로·패널 사이 빈 영역 → 월드 ──
  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const measure = () => {
      const safe = measureSafeArea(stage);
      safeRef.current = safe;
      send({ type: 'SET_SAFE_AREA', left: safe.left, right: safe.right });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [send]);

  // ── 웹 입력창에 글자를 치는 동안 월드 키 입력을 멈춘다 ──
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

  /** 월드가 떠 있으면 Zannabi가 문 앞까지 걸어가서 실행한다 */
  const onLabelClick = (id: WorldObjectId) => () => {
    if (!live) return;
    send({ type: 'MOVE_TO_OBJECT', objectId: id });
    focusWorld();
  };

  return (
    <div
      ref={stageRef}
      className="stage"
      data-testid="godot-stage"
      data-phase={live ? 'live' : 'loading'}
      data-ready-ms={readyMs ?? ''}
      data-input={paused ? 'paused' : 'live'}
      data-interact={interacted ?? ''}
    >
      {/* 배경 그림은 웹이 깔고, Godot(?bg=web)은 투명한 화면에 섬·캐릭터만 그린다 */}
      <img className="space-plate" src="/world/space-bg.webp" alt="" />
      <iframe
        ref={frameRef}
        title="Zannabi's Little Universe"
        src={frameSrc}
        className="godot-frame"
      />
      {!live && (
        <div className="godot-boot mono" aria-live="polite">
          {failed === 'unsupported'
            ? 'WORLD OFFLINE — 이 브라우저에서는 섬을 띄울 수 없어요'
            : failed
              ? 'WORLD OFFLINE — 섬을 불러오지 못했어요. 새로고침해 주세요'
              : `WORLD LOADING ${Math.round(progress * 100)}%`}
        </div>
      )}
      <div className="stage-overlay" data-placed={placed || undefined}>
        {WORLD_OBJECT_IDS.map((id) => {
          const def = WORLD_OBJECTS[id];
          const near = live && nearId === id;
          return (
            <button
              key={id}
              type="button"
              className="obj-label"
              data-near={near}
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
        {/* 수레 안내: 건물 이름표와 같은 모양 (클릭은 받지 않는다. 타기·내리기는 E) */}
        <div ref={rideRef} className="obj-label ride-prompt" data-near="true" data-kind="rover" data-on={(live && ride) || undefined} aria-hidden={!ride}>
          <Icon name="box" size={14} />
          {ride === 'dismount' ? 'GET OFF' : 'RIDE'}
          <kbd>E</kbd>
        </div>
      </div>
    </div>
  );
}
