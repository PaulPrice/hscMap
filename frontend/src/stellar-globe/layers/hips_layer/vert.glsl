uniform    mat4   u_pvMatrix;
attribute  vec3   a_xyzCoord;
attribute  vec2   a_tCoord;
varying    vec2   v_tCoord;

void main(void) {
    gl_Position = u_pvMatrix * vec4(a_xyzCoord, 1.);
    v_tCoord = a_tCoord;
}