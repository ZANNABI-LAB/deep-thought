/**
 * 머니그라피 픽셀 서브셋 — 빌드 시점에 생성한다.
 *
 * 원본 woff2는 한글 11,172음절 완성형으로 162 KB다. 콘텐츠가 실제로 쓰는
 * 문자만 남기면 64 KB로 떨어진다. Core Web Vitals가 SEO 목표에 걸려 있어(§5)
 * 98 KB는 그냥 넘길 차이가 아니다.
 *
 * 안전망(KS X 1001 2,350자)을 넣는 방식도 재봤으나 177 KB로 원본보다 커진다.
 * 그래서 안전망 대신 **빌드마다 다시 뜨는 방식**을 택했다. 글이 추가되면
 * 서브셋도 함께 갱신되므로 누락이 생기지 않는다.
 *
 * 사용법: npx tsx scripts/subset-fonts.ts  (npm run build 앞단에서 자동 실행)
 */
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";

const ROOT = path.join(import.meta.dirname, "..");
const SRC = path.join(ROOT, "design/fonts");
const OUT = path.join(ROOT, "apps/web/public/fonts");

const FACES = ["Moneygraphy-Pixel"];

/** 디렉터리를 훑어 해당 확장자 파일의 모든 문자를 모은다. */
const collect = (dir: string, exts: string[], into: Set<string>) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, exts, into);
    else if (exts.some((e) => entry.name.endsWith(e)))
      for (const ch of fs.readFileSync(full, "utf-8")) into.add(ch);
  }
};

const main = async () => {
  const chars = new Set<string>();

  // 1. 콘텐츠 — 실제 발행되는 글
  collect(path.join(ROOT, "content"), [".md"], chars);
  // 2. UI 문자열 — 컴포넌트에 직접 쓰인 한글
  collect(path.join(ROOT, "apps/web/src"), [".tsx", ".ts"], chars);
  // 3. 라틴·숫자·구두점 전 범위와 자주 쓰는 기호
  for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCodePoint(c));
  for (const ch of "―–—…‘’“”·•→←↑↓×÷±≈≤≥°※©®™₩€¥「」『』〈〉《》【】✓✗") chars.add(ch);

  // 제어문자는 글리프가 없다
  for (const ch of [...chars]) if (ch.codePointAt(0)! < 0x20) chars.delete(ch);

  const text = [...chars].join("");
  const hangul = [...chars].filter((c) => {
    const cp = c.codePointAt(0)!;
    return cp >= 0xac00 && cp <= 0xd7a3;
  }).length;

  console.log(`수록 ${chars.size.toLocaleString()}자 (한글 음절 ${hangul.toLocaleString()})`);
  fs.mkdirSync(OUT, { recursive: true });

  for (const name of FACES) {
    const src = path.join(SRC, `${name}.ttf`);
    if (!fs.existsSync(src)) {
      console.error(`  원본 없음: ${src} — 서브셋을 건너뛴다`);
      continue;
    }
    const buf = await subsetFont(fs.readFileSync(src), text, { targetFormat: "woff2" });
    fs.writeFileSync(path.join(OUT, `${name}.woff2`), buf);
    console.log(`  ${name} → ${(buf.length / 1024).toFixed(1)} KB`);
  }
};

main();
