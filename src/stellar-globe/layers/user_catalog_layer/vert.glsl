uniform    mat4   u_pvMatrix;
attribute  vec3   a_position;


void main(void) {
    gl_Position = u_pvMatrix * vec4(a_position, 1.);
    gl_PointSize = 20.;
}