#define MIN_POINTSIZE 3.
precision mediump float;
uniform float u_alpha;
varying float v_pointSize;
varying float v_w;


void main() {
    if (v_pointSize < 0.3)
        discard;
    float r = 2.*length(gl_PointCoord - vec2(0.5)),
          v = 1. - smoothstep(0.7, 1.0, r);
    v *= u_alpha * clamp(4. * (v_w - 0.2), 0., 1.);
    if (v_pointSize < MIN_POINTSIZE) {
        gl_FragColor = vec4(0.75, 0.75, 1., v  * v_pointSize * v_pointSize / (MIN_POINTSIZE * MIN_POINTSIZE));
    }
    else {
        gl_FragColor = vec4(0.75, 0.75, 1., v );
    }
}