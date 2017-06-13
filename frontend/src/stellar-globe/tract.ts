import { Wcs } from './wcs'
import * as math from './math'
import { mat4, vec4 } from 'gl-matrix'


export class Tract {
    wcs: Wcs
    naxis1: number
    naxis2: number
    maxLevel: number = 9
    tileSize = 256
    mMatrix: mat4 // model matrix
    invMMatrix: mat4 // inverted model matrix

    constructor(public id: string, public header: any) {
        this.wcs = new Wcs(header)
        this.naxis1 = header.NAXIS1
        this.naxis2 = header.NAXIS2
        this.mMatrix = this.computeMMatrix()
        this.invMMatrix = mat4.invert(math.mat4create(), this.mMatrix)!
    }

    private computeMMatrix() {
        let d2r = math.deg2rad
        let h = this.header
        let m = math.mat4create()
        mat4.rotateZ(m, m, d2r(h.CRVAL1))
        mat4.rotateY(m, m, - d2r(h.CRVAL2))
        mat4.translate(m, m, [1, 0, 0])
        mat4.rotateY(m, m, d2r(90))
        mat4.rotateZ(m, m, d2r(90))
        // # how to deal with LONPOLE?
        // # mat4.rotateZ(m, m, d2r(h.LONPOLE ? 180))
        m = mat4.mul(m, m, <any>[
            d2r(h.CD1_1), d2r(h.CD2_1), 0, 0,
            d2r(h.CD1_2), d2r(h.CD2_2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ])
        mat4.translate(m, m, [- h.CRPIX1, - h.CRPIX2, 0])
        mat4.translate(m, m, [0.5, 0.5, 0])
        mat4.scale(m, m, [h.NAXIS1, h.NAXIS2, 1])
        mat4.translate(m, m, [0, 1, 0])
        mat4.scale(m, m, [1, -1, 1])
        return m
    }

    tileIndices(
        invPvMatrix: mat4,
        bWidth: number,
        bHeight: number,
        scaleBias: number,
        callback: (level: number, i: number, j: number, lodAlpha: number, maxLevel: number) => void
    ) {
        let invPvmMatrix = mat4.mul(mat4Tmp, this.invMMatrix, invPvMatrix)
        let { onScreen, cps } = crossPoint2D(invPvmMatrix, [[-1, -1], [-1, 1], [1, -1], [1, 1]])
        if (onScreen) {
            const dTractPixX = this.naxis1 * (cps[0][0] - cps[1][0])
            const dTractPixY = this.naxis2 * (cps[0][1] - cps[1][1])
            const scale2 = (dTractPixX * dTractPixX + dTractPixY * dTractPixY) / bHeight / bHeight
            let level = scaleBias + 0.5 * Math.log(scale2) / Math.LN2
            if (level < 0) level = 0
            else if (level > this.maxLevel) level = this.maxLevel
            let baseLevel = Math.floor(level)
            let minT = cps[0][0]
            let maxT = cps[0][0]
            let minU = cps[0][1]
            let maxU = cps[0][1]
            for (let k = 1; k < 4; ++k) {
                const [t, u] = cps[k]
                if (t < minT) minT = t
                if (t > maxT) maxT = t
                if (u < minU) minU = u
                if (u > maxU) maxU = u
            }
            const lodAlpha = 1 - (level - baseLevel)
            const maxLevel = this.maxLevel
            // const d = Math.max(bWidth, bHeight)
            // const s2 = d * d * scale2 / this.tileSize / this.tileSize
            // const maxLevel = Math.min(this.maxLevel, Math.ceil(0.5 * Math.log(s2) / Math.LN2))
            // if the level == maxLevel, screen will be filled by at the most 4 tiles.
            if (minT <= 1 && maxT >= 0 && minU <= 1 && maxU >= 0) {
                let tileScale = this.tileSize * (1 << baseLevel)
                const tmp3 = this.naxis1 / tileScale
                const tmp4 = this.naxis2 / tileScale
                let minI = Math.floor(tmp3 * (minT < 0 ? 0 : (minT > 1 ? 1 : minT)))
                let maxI = Math.floor(tmp3 * (maxT < 0 ? 0 : (maxT > 1 ? 1 : maxT)))
                let minJ = Math.floor(tmp4 * (minU < 0 ? 0 : (minU > 1 ? 1 : minU)))
                let maxJ = Math.floor(tmp4 * (maxU < 0 ? 0 : (maxU > 1 ? 1 : maxU)))
                for (let i = minI; i <= maxI; ++i) for (let j = minJ; j <= maxJ; ++j)
                    callback(baseLevel, i, j, lodAlpha, maxLevel)
            }
        }
    }
}

const mat4Tmp = math.mat4create()


function crossPoint2D(b: mat4, pqs: [number, number][]) {
    // b = inv(pvmMatrix)

    //  A = pvMatrix * mMatrix
    //  B = A^-1
    //  A.v = (x, y, z, w)T
    //  p = x / w
    //  q = y / w
    //
    //       b11(0)  b12(4)  b13(8)  b14(12)
    //  B =  b21(1)  b22(5)  b23(9)  b24(13)
    //       b31(2)  b32(6)  b33(10) b34(14)
    //       b41(3)  b42(7)  b43(11) b44(15)

    let r = [
        - b[2] / b[10],   // - b31 / b33
        - b[6] / b[10],   // - b32 / b33
        - b[14] / b[10],  // - b34 / b33
    ]
    let s = [
        b[3] - b[11] * b[2] / b[10],    // b41 - b43*b31/b33
        b[7] - b[11] * b[6] / b[10],    // b42 - b43*b32/b33
        b[15] - b[11] * b[14] / b[10],  // b44 - b43*b34/b33
    ]
    const cps: [number, number, number][] = []
    for (const [p, q] of pqs) {
        let g = p * r[0] + q * r[1] + r[2]
        let w = 1 / (p * s[0] + q * s[1] + s[2])
        if (w < 0)
            return { onScreen: false, cps: [] }
        let v = [p * w, q * w, g * w, w]; // clip
        vec4.transformMat4(<any>v, v, b)
        cps.push([v[0], v[1], w])
    }
    return { onScreen: true, cps }
}