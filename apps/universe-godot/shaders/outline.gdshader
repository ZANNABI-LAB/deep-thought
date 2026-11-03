// 화면 공간 실루엣 선 (outline_mask.gdshader 화면의 알파를 읽는다). 몸과 배경의 경계에 둥근 붓으로 선을 그린다
shader_type canvas_item;

uniform sampler2D mask : filter_linear, repeat_disable;
uniform vec2 texel = vec2(0.00125);
// 붓 반지름 (px). 선 굵기 ≈ 2 × radius
uniform float radius = 0.5;
uniform vec3 line_color : source_color = vec3(0.043, 0.051, 0.071);

float edge_at(vec2 uv) {
	float c = texture(mask, uv).a;
	float edge = 0.0;
	// 원 위 12점 + 안쪽 6점: 둥근 붓
	for (int i = 0; i < 12; i++) {
		float a = float(i) * TAU / 12.0;
		vec2 o = vec2(cos(a), sin(a)) * texel * radius;
		edge = max(edge, abs(c - texture(mask, uv + o).a));
		if (i % 2 == 0) {
			edge = max(edge, abs(c - texture(mask, uv + o * 0.5).a));
		}
	}
	return edge;
}

void fragment() {
	// 픽셀 안 4점을 나눠 검사해 선 가장자리의 계단을 없앤다
	float edge = edge_at(UV + vec2(-0.25, -0.25) * texel) + edge_at(UV + vec2(0.25, -0.25) * texel)
		+ edge_at(UV + vec2(-0.25, 0.25) * texel) + edge_at(UV + vec2(0.25, 0.25) * texel);
	COLOR = vec4(line_color, edge * 0.25);
}
