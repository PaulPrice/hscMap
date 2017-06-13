uniform      mat4       u_pvMatrix;
uniform      mat4       u_mMatrix;
attribute    vec3       a_position;
varying      vec4       v_position;

void main(void) {
    v_position = u_mMatrix * vec4(a_position, 1.);
    gl_Position = u_pvMatrix * v_position;
}