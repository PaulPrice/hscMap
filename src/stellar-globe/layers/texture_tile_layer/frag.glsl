precision mediump float;
uniform   sampler2D  u_texture;
uniform   float      u_alpha;
uniform   float      u_flash;
varying   vec2       v_tCoord;

void main() {
    gl_FragColor = vec4(texture2D(u_texture, v_tCoord).xyz, u_alpha);
    gl_FragColor.b += u_flash;
}