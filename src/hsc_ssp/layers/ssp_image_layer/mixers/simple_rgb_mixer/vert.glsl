attribute  vec2   a_texCoord;
varying    vec2   v_texCoord;

void main() {
    gl_Position = vec4(
        2. * a_texCoord.x - 1.,
        2. * a_texCoord.y - 1.,
        0.,
        1.
    );
    v_texCoord = a_texCoord;
}