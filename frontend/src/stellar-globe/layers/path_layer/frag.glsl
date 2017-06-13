precision mediump float;

uniform  float  u_fovy;
varying  vec4   v_color;
varying  float  v_y;
varying  float  v_w;

void main() {
    float alpha = 1. - smoothstep(0., 0.9, abs(v_y));
    alpha *= clamp(4. * (v_w - 0.2), 0., 1.);
    gl_FragColor = vec4(v_color.rgb, alpha * v_color.a);    
}