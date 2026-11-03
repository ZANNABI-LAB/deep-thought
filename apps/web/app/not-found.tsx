import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="mono">&gt; SIGNAL LOST // 404</p>
      <h1>이 좌표에는 아무것도 없어요.</h1>
      <p>
        찾는 페이지가 우주 저편으로 떠내려갔거나, 처음부터 없었던 곳이에요. <Link href="/">섬으로 돌아가기</Link>
      </p>
    </main>
  );
}
