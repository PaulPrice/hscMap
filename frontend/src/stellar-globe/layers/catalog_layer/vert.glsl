#define MIN_POINTSIZE 3.
uniform    mat4   u_pvMatrix;
uniform    float  u_bufferHeight;
uniform    float  u_fovy;
uniform    float  u_rho;
attribute  vec3   a_position;
attribute  float  a_flux;
varying    float  v_pointSize;
varying    float  v_w;


void main(void) {
    gl_Position = u_pvMatrix * vec4(a_position, 1.);
    float worldPointSize = u_rho * sqrt(a_flux);
    v_pointSize = worldPointSize * u_bufferHeight / (gl_Position.w * u_fovy);
    v_w = gl_Position.w;
    gl_PointSize = max(v_pointSize, MIN_POINTSIZE);
}