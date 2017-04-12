precision highp float;

uniform sampler2D  u_texture0, u_texture1, u_texture2;
uniform float      u_min, u_max, u_a;
varying vec2       v_texCoord;

vec3 mySinh(in vec3 x) {
    return 0.5 * (exp(x) - exp(-x));
}

vec3 myAsinh(in vec3 x) {
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

void main(void){
    vec3 color = linearize(vec3(
        texture2D(u_texture0, v_texCoord).r,
        texture2D(u_texture1, v_texCoord).r,
        texture2D(u_texture2, v_texCoord).r
    ));

    color = myAsinh(u_a*color) / myAsinh(vec3(u_a));
    color = (color - vec3(u_min)) / (u_max - u_min);
    gl_FragColor = vec4(color, 1.);
}