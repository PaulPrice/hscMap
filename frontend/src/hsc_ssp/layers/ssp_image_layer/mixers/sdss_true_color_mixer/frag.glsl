precision highp float;

uniform sampler2D  u_texture0, u_texture1, u_texture2;
uniform float      u_a, u_b;
varying vec2       v_texCoord;

vec3 mySinh(in vec3 x) {
    return 0.5 * (exp(x) - exp(-x));
}

float myAsinh(in float x) {
    return log(x + sqrt(x*x + 1.));
}

vec3 linearize(in vec3 z) {
    /*
    *  a    = 10000.,
    *  minx = -0.1;
    *
    *  = pack =
    *  y = asinh(a * x) / asinh(a);
    *  z = (x-minx) / (1-minx);
    *
    *  = unpack =
    *  y = z * (1 - minx) + minx;
    *  x = (1./a) * sinh(y * asinh(a));
    *
    */

    vec3 y = (z * 1.1) - 0.1;
    vec3 x = 0.0001 * mySinh(9.903487555 * y);
    return x;
}

float scale(in float x) {
    return myAsinh(u_a*x) / myAsinh(u_a);
}

void main(void){
    vec3 raw = linearize(vec3(
        texture2D(u_texture0, v_texCoord).r,
        texture2D(u_texture1, v_texCoord).r,
        texture2D(u_texture2, v_texCoord).r
    ));

    float i = (raw.r + raw.g + raw.b) / 3.;
    vec3 color = scale(i) / i * raw;
    color += u_b;
    gl_FragColor = vec4(color, 1.);
}