uniform    mat4   u_pvMatrix, u_mMatrix;
attribute  vec2   a_xyCoord, a_tCoord;
varying    vec2   v_tCoord;

void main(void) {
    gl_Position = u_pvMatrix * u_mMatrix * vec4(a_xyCoord, 0., 1.);
    v_tCoord = a_tCoord;
}