// 실루엣 검출용 보조 화면 (outline.gdshader가 읽는다): 몸이 있는 곳은 불투명(A = 1), 나머지는 투명 배경
shader_type spatial;
render_mode unshaded, cull_back;

void fragment() {
	ALBEDO = vec3(1.0);
}
