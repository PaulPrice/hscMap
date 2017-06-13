import { vec3, vec4, mat4 } from 'gl-matrix'
import *  as math from './math'

export const MIN_FOVY = math.arcsec2rad(10)
export const MAX_FOVY = 4

export enum CameraMode {
    GNOMONIC,
    STEREOGRAPHIC,
    GLOBE,
    TILT,
    FLOATING_EYE,
}

export interface CameraParams {
    mode: CameraMode
    a: number
    d: number
    fovy: number
    roll: number
    tilt: number
}

export class Camera {
    pv: mat4
    inv = math.mat4create()
    pos = math.vec3create()
    dir = math.vec3create()
    up: vec3
    fovy: number
    effectiveFovy: number
    aspectRatio: number

    constructor(pv: mat4) {
        this.pv = pv
        /*
        *      y         A
        *      ^       / |
        *      |     /   |
        *      |   /     |
        *      | /       |
        *      O ------- B ---> z
        *
        *  O:pos, A: up, B: center
        */
        mat4.invert(this.inv, this.pv)

        // set pos
        let b = this.inv
        let v = vec4.copy(math.vec4create(), [0, 0, 1 / b[11], 0])
        vec4.transformMat4(v, v, b)
        vec3.copy(this.pos, [v[0], v[1], v[2]])

        // set dir, fovy, wCoeff
        let center = this.ndc2xyz([0, 0, 0])
        vec3.sub(this.dir, center, this.pos)
        this.up = this.ndc2xyz([0, 1, 0])
        vec3.sub(this.up, this.up, center)
        let upSquredLen = vec3.sqrLen(this.up)
        this.fovy = Math.sqrt(upSquredLen / vec3.sqrLen(this.dir))
        vec3.normalize(this.dir, this.dir)

        // aspectRatio
        let right = this.ndc2xyz([1, 0, 0])
        vec3.sub(right, right, center)
        this.aspectRatio = Math.sqrt(vec3.sqrLen(right) / upSquredLen)

        // effectiveFovy
        let d = this.pv[15] + 1
        this.effectiveFovy = 2 * this.fovy * d
    }

    static fromEquatorialCoord(aspectRatio: number, cameraParams: CameraParams) {
        const { mode, a, d, fovy, roll, tilt } = cameraParams
        const near = 0.05
        const far = 10
        let p = math.mat4create()
        let v = math.mat4create()
        switch (mode) {
            case CameraMode.GNOMONIC: {
                let h = near * fovy
                let w = aspectRatio * h
                mat4.frustum(p, -w / 2, w / 2, -h / 2, h / 2, near, far)
                mat4.rotateZ(v, v, roll)
                mat4.rotateX(v, v, -Math.PI / 2)
                mat4.rotateX(v, v, -d)
                mat4.rotateZ(v, v, Math.PI / 2 - a)
                break
            }
            case CameraMode.STEREOGRAPHIC: {
                let h = near * fovy / 2
                let w = aspectRatio * h
                mat4.frustum(p, -w / 2, w / 2, -h / 2, h / 2, near, far)
                mat4.rotateZ(v, v, roll)
                mat4.rotateX(v, v, -Math.PI / 2)
                mat4.translate(v, v, [0, 1, 0])
                mat4.rotateX(v, v, - d)
                mat4.rotateZ(v, v, Math.PI / 2 - a)
                break
            }
            case CameraMode.TILT: {
                let h = near * fovy * 2
                let w = aspectRatio * h
                mat4.frustum(p, -w / 2, w / 2, -h / 2, h / 2, near, far)
                mat4.rotateX(v, v, -Math.PI / 2)
                mat4.translate(v, v, [0, 0.5, 0])
                mat4.rotateX(v, v, tilt)
                mat4.translate(v, v, [0, -1, 0])
                mat4.rotateY(v, v, -roll)
                mat4.rotateX(v, v, - d)
                mat4.rotateZ(v, v, Math.PI / 2 - a)
                break
            }
            case CameraMode.GLOBE: {
                let fovy2 = math.deg2rad(45)
                let h = near * fovy2
                let w = aspectRatio * h
                mat4.frustum(p, -w / 2, w / 2, -h / 2, h / 2, near, far)
                mat4.rotateX(v, v, -Math.PI / 2)
                mat4.translate(v, v, [0, 3.5, 0])
                mat4.rotateX(v, v, math.deg2rad(15))
                mat4.rotateY(v, v, - roll)
                mat4.rotateX(v, v, - d)
                mat4.rotateZ(v, v, Math.PI / 2 - a)
                break
            }
            case CameraMode.FLOATING_EYE: {
                let h = near * fovy / (fovy + 1)
                let w = aspectRatio * h
                mat4.frustum(p, -w / 2, w / 2, -h / 2, h / 2, near, far)
                mat4.rotateZ(v, v, roll)
                mat4.rotateX(v, v, -Math.PI / 2)
                mat4.translate(v, v, [0, fovy, 0])
                mat4.rotateX(v, v, -d)
                mat4.rotateZ(v, v, Math.PI / 2 - a)
                break

            }
        }
        return new Camera(mat4.mul(math.mat4create(), p, v))
    }

    static composite(matrices: { scale: number, matrix: mat4 }[]) {
        let m = mat4.fromScaling(math.mat4create(), [0, 0, 0])
        m[15] = 0
        for (let { scale, matrix } of matrices) {
            mat4.multiplyScalarAndAdd(m, m, matrix, scale)
        }
        return new Camera(m)
    }

    ndc2xyz(ndc3: number[]) {
        /*
         *     b11[ 0] b12[ 4] b13[ 8] b14[12]
         *     b21[ 1] b22[ 5] b23[ 9] b24[13]
         *     b31[ 2] b32[ 6] b33[10] b34[14]
         *     b41[ 3] b42[ 7] b43[11] b44[15]
         */
        let b = this.inv
        let v = math.vec4create()
        v[0] = ndc3[0]
        v[1] = ndc3[1]
        v[2] = ndc3[2]
        v[3] = 1
        vec4.transformMat4(v, v, b)
        let c = b[3] * ndc3[0] + b[7] * ndc3[1] + b[11] * ndc3[2] + b[15]
        return vec3.copy(math.vec3create(), [v[0] / c, v[1] / c, v[2] / c])
    }

    ndc2sphereXyz(ndcx: number, ndcy: number, safe = false, r = 1) {
        let o = this.ndc2xyz([ndcx, ndcy, -1])
        let d = vec3.sub(math.vec3create(), this.ndc2xyz([ndcx, ndcy, +1]), o)
        vec3.normalize(d, d)
        let a = 1
        let b = 2 * vec3.dot(o, d)
        let c = vec3.dot(o, o) - r * r
        let D = b * b - 4 * a * c
        if (safe)
            D = Math.abs(D)
        let t = (-b + Math.sqrt(D)) / (2 * a)
        let p = vec3.add(o, o, vec3.scale(math.vec3create(), d, t))
        return p
    }

    ndc2sphereRadec(ndcx: number, ndcy: number, safe = false, r = 1) {
        return math.xyz2radec(<any>this.ndc2sphereXyz(ndcx, ndcy, safe, r))
    }

}