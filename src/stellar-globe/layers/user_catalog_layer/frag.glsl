precision mediump float;
uniform float u_alpha;


void main() {
    u_alpha;
    // float v = 2. * length(gl_PointCoord - vec2(0.5));
    vec2 r = 2. * (gl_PointCoord - vec2(0.5));
    float v = (abs(r.x) < 0.1 || abs(r.y) < 0.1) ? 1. : 0.;
    gl_FragColor = vec4(0., v, 0., 0.4);
}