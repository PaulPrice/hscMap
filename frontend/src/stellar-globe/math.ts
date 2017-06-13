export type Vector2 = [number, number]
export type Vector3 = [number, number, number]
export type Vector4 = [number, number, number, number]


export function deg2rad(deg: number) {
    return 0.01745329252 * deg; // deg / 180 * Math.PI
}

export function arcsec2rad(arcsec: number) {
    return 0.000004848136811 * arcsec; // arcsec / 3600 / 180 * Math.PI
}

export function arcmin2rad(arcmin: number) {
    return 0.0002908882087 * arcmin; // arcmin / 60 / 180 * Math.PI
}

export function rad2deg(rad: number) {
    return 57.295779513 * rad; // rad / Math.PI * 180 
}

export function radec2xyz(ra: number, dec: number): Vector3 {
    var cos_dec = Math.cos(dec)
    return [
        cos_dec * Math.cos(ra),
        cos_dec * Math.sin(ra),
        Math.sin(dec)
    ]
}

export function xyz2radec(xyz: number[]): Vector2 {
    var r = Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1]),
        ra = r > 0 ? (Math.atan2(xyz[1], xyz[0]) + 2 * Math.PI) % (2 * Math.PI) : 0.
    let dec = Math.atan2(xyz[2], r)
    return [ra, dec]
}

export function clamp(x: number, min: number, max: number) {
    return x < min ? min : (x > max ? max : x)
}

export function wrapTo2Pi(a: number) {
    if (a < 0) {
        return 2 * Math.PI - (-a % (2 * Math.PI))
    }
    else {
        return a % (2 * Math.PI)
    }
}

import { vec3, vec4, mat3, mat4 } from 'gl-matrix'
export const mat3create = () => [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1] as any as mat3
export const mat4create = () => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1] as any as mat4
export const vec3create = () => [0, 0, 0] as any as vec3
export const vec4create = () => [0, 0, 0, 0] as any as vec4


export const sign = (<any>Math).sign || ((x: number) => x == 0 ? 1 : (x > 0 ? 1 : -1))