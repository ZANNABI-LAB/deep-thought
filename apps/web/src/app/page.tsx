import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { getAllLogs } from "@/lib/logs";

/**
 * 메인은 읽는 화면이 아니라 관문이다.
 *
 * 정거장 배경이 화면 전체를 채우고 콘텐츠가 그 위에 얹힌다. 배경의 중앙 45%가
 * 비어 있도록 그려졌으므로(에어록 창) 본문 컬럼은 자연히 그 자리에 놓인다.
 * 좌우 장비는 배경이 담당하므로 패널을 따로 두지 않는다.
 */
const Home = () => {
  const posts = getAllPosts();
  const logs = getAllLogs();
  const latest = [
    ...logs.slice(0, 2).map((l) => ({ ...l, kind: "LOG", href: `/log/${l.slug}` })),
    ...posts.slice(0, 4).map((p) => ({ ...p, kind: "TECH", href: `/tech/${p.slug}` })),
  ].slice(0, 4);

  return (
    <>
      {/* 배경이 테마와 무관하게 항상 어둡다. 이 화면에서만 토큰을 다크로 고정한다 —
        * 라이트 모드에서 토큰을 따라가면 어두운 이미지 위에 어두운 글자가 얹힌다. */}
      <style>{`:root{
        --bg:#05080a; --bg-code:#0c1310;
        --text:#dce7df; --text-body:#c2d0c6; --text-muted:#93a399; --text-faint:#5c6b61;
        --accent:#3dff88; --accent-hover:#96ffc2;
        --line:#1c2622; --line-soft:#141c18;
        /* 헤더·푸터가 배경 위에 떠서 영역을 차지하지 않게 한다 */
        --header-position:fixed; --footer-position:fixed;
        --chrome-bg:transparent; --chrome-border:transparent; --chrome-blur:none;
        --main-py:0;
      }`}</style>

      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-[#05080a] bg-[url('/images/station-hero.png')] bg-cover bg-center"
      />
      {/* 배경이 fixed라 화면상 같은 위치에는 스크롤과 무관하게 같은 배경 픽셀이 온다.
        * 배경 하단은 밝은 바닥 패널이므로 아래로 갈수록 짙어지는 막 한 장이면
        * 어느 지점의 글자든 읽힌다. 구획을 나누지 않아 배경은 그대로 이어져 보인다. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-gradient-to-b from-[#05080a]/30 via-[#05080a]/40 to-[#05080a]/88"
      />

      {/* 한 화면에 딱 들어가야 하므로 뷰포트 높이를 그대로 쓴다.
        * 헤더·푸터는 떠 있으므로 위아래 여백만 그만큼 비워 둔다. */}
      <div className="flex h-[100dvh] flex-col justify-center gap-14 pt-[var(--nav-height)] pb-16">
        <div className="text-center">
          <h1 className="text-[clamp(2rem,7vw,3.5rem)] leading-none tracking-[-0.04em]">
            DEEP THOUGHT
          </h1>
          <p className="mt-4 font-mono text-[11px] tracking-[0.26em] text-accent">
            A ZANNABI LAB STATION
          </p>
          <p className="mt-6 text-[15px] text-text-body">
            백엔드 엔지니어의 Applied AI 학습 기록
          </p>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="size-[5px] bg-accent" />
            <span className="font-mono text-[11px] tracking-[0.18em] text-text-muted">
              LATEST
            </span>
            <span className="ml-auto font-mono text-[11px] tracking-wider text-text-faint">
              {posts.length} ARCHIVED
            </span>
          </div>
          <ul>
            {latest.map((item) => (
              <li key={item.href} className="border-t border-line-soft">
                <Link href={item.href} className="flex gap-5 py-2.5 hover:text-accent">
                  <span className="w-[80px] shrink-0 font-mono text-xs text-text-faint">
                    {item.kind}
                  </span>
                  <span className="truncate text-[14.5px]">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
};

export default Home;
