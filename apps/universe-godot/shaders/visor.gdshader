// 얼굴 창 유리 (assets/zannabi/visor_v3.obj). 실제 반사 대신 그림처럼: 살짝 청록빛, 비스듬한 가장자리는 조금 진하게, 왼쪽 위에 반사광 두 개.
// 선글라스·미소가 게임 크기에서도 보이게 옅게 둔다. 반사광은 카메라 기준이라 캐릭터가 돌아도 늘 같은 자리에 맺힌다
shader_type spatial;
render_mode unshaded, blend_mix, cull_back, depth_draw_never;

uniform vec4 glass_color : source_color = vec4(0.55, 0.9, 0.95, 0.13);
uniform vec4 band_color : source_color = vec4(0.55, 0.93, 1.0, 0.3);
// 법선이 이만큼 기울면(1 - n.z) 가장자리 띠
uniform float band = 0.55;
uniform vec3 glint_dir = vec3(-0.5, 0.55, 0.67);
uniform float glint_size : hint_range(0.9, 1.0) = 0.975;
uniform vec3 glint2_dir = vec3(-0.25, 0.75, 0.6);
uniform float glint2_size : hint_range(0.9, 1.0) = 0.993;
uniform float glint_alpha : hint_range(0.0, 1.0) = 0.6;

void fragment() {
	vec3 n = normalize(NORMAL);
	float rim = 1.0 - clamp(n.z, 0.0, 1.0);
	float aa = fwidth(rim);
	vec4 c = mix(glass_color, band_color, smoothstep(band - aa, band + aa, rim));
	float g1 = dot(n, normalize(glint_dir));
	float g2 = dot(n, normalize(glint2_dir));
	float ga = fwidth(g1);
	float glint = max(smoothstep(glint_size - ga, glint_size + ga, g1), smoothstep(glint2_size - ga, glint2_size + ga, g2));
	c = mix(c, vec4(1.0), glint * glint_alpha);
	ALBEDO = c.rgb;
	ALPHA = c.a;
}
