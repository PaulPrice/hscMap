precision mediump float;
varying     vec4     v_position;
uniform     float    u_fovy;

void main() {
    float r = length(v_position.xyz);
    if (r >= 1.)
        discard;
    float l =  0.5 * r*r * smoothstep(0., min(0.01 * u_fovy, 0.05), 1. - r);
    gl_FragColor = vec4(0., 0.5, 0.5, l);
}