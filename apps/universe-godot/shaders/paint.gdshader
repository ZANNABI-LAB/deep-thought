// 모델 재질: Tripo 원본 색 텍스처 + 부드러운 명암 한 단계. 조명 계산 없이(unshaded) 그림처럼 늘 같은 쪽에 그늘이 진다.
// 빛은 카메라 기준 고정 방향이라 모델이 돌아도 일러스트처럼 보인다. 실루엣 선은 outline.gdshader가 그린다.
shader_type spatial;
render_mode unshaded, cull_back;

uniform sampler2D raw_tex : source_color, filter_linear_mipmap, repeat_disable;
// 밉맵 선택을 앞당긴다(음수: 더 선명). 게임 크기에서 텍스처가 크게 줄어 무늬가 뭉개지지 않게. -2는 계단이 보였다
uniform float mip_bias = -1.0;
uniform vec3 light_dir = vec3(-0.45, 0.6, 0.65);
uniform float shade_strength : hint_range(0.0, 1.0) = 0.2;
uniform float shade_softness : hint_range(0.01, 1.0) = 0.45;

void fragment() {
	vec3 tex = texture(raw_tex, UV, mip_bias).rgb;
	float lit = smoothstep(-shade_softness, shade_softness, dot(normalize(NORMAL), normalize(light_dir)));
	ALBEDO = tex * (1.0 - shade_strength * (1.0 - lit));
}
