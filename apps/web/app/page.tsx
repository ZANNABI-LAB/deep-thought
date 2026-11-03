import { GodotStage } from '@/components/world/GodotStage';

/**
 * 홈: 배경 그림 + Godot 월드 + 건물 이름표. 헤더·히어로·패널은 다시 디자인한 뒤 얹는다.
 * 얹을 때는 data-safe="left"/"right" 요소를 GodotStage가 재서 섬을 그 사이에 맞춘다.
 */
export default function Home() {
  return (
    <div className="home">
      <GodotStage />
    </div>
  );
}
