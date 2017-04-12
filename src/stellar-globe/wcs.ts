import * as math from './math'


type vector3 = number[]
type vector2 = number[]
type matrix3 = vector3[]


export class Wcs {
    private crpix: vector3
    private cd: vector3
    private crval: vector3
    private longpole: number
    private A: matrix3
    private B: matrix3
    private cpp: number; // cos(phi_p)
    private spp: number; // sin(phi_p)

    constructor(private header: any) {
        let h = header

        if (
            h.CTYPE1 != "RA---TAN" ||
            h.CTYPE2 != "DEC--TAN" ||
            h.CUNIT1 != "deg" || h.CUNIT2 != "deg"
        ) {
            console.error(h)
            throw new Error("unknown CTYPE and/or CUNIT")
        }

        this.crpix = [h.CRPIX1, h.CRPIX2]
        this.cd = [math.deg2rad(h.CD1_1), math.deg2rad(h.CD1_2),
        math.deg2rad(h.CD2_1), math.deg2rad(h.CD2_2)]
        this.crval = [math.deg2rad(h.CRVAL1), math.deg2rad(h.CRVAL2)]
        this.longpole = math.deg2rad(h.LONPOLE == undefined ? 180 : h.LONPOLE)

        this.A = [[0., 0., 0.], [0., 0., 0.], [0., 0., 0.]]
        this.B = [[0., 0., 0.], [0., 0., 0.], [0., 0., 0.]]

        let alpha_p = this.crval[0],
            delta_p = this.crval[1],
            phi_p = this.longpole,
            cap = Math.cos(alpha_p), sap = Math.sin(alpha_p),
            cdp = Math.cos(delta_p), sdp = Math.sin(delta_p)
        this.cpp = Math.cos(phi_p)
        this.spp = Math.sin(phi_p)

        // xyz = A . native
        this.A[0][0] = cap * cdp; this.A[0][1] = sap; this.A[0][2] = -cap * sdp
        this.A[1][0] = sap * cdp; this.A[1][1] = -cap; this.A[1][2] = -sap * sdp
        this.A[2][0] = sdp; this.A[2][1] = 0.; this.A[2][2] = cdp

        // B == A^-1
        this.B[0][0] = cap * cdp; this.B[0][1] = sap * cdp; this.B[0][2] = sdp
        this.B[1][0] = sap; this.B[1][1] = -cap; this.B[1][2] = 0.
        this.B[2][0] = -cap * sdp; this.B[2][1] = -sap * sdp; this.B[2][2] = cdp
    }

    pixel2xyz(pixel: vector2) {
        return this.iwc2xyz(this.pixel2iwc(pixel))
    }

    pixel2iwc(pixel: vector2) {
        let u = pixel[0] - this.crpix[0],
            v = pixel[1] - this.crpix[1]
        let x = this.cd[0] * u + this.cd[1] * v,
            y = this.cd[2] * u + this.cd[3] * v
        return [x, y]
    }

    iwc2xyz(iwc: vector3) {
        let x = iwc[0], y = iwc[1]

        let r2 = Math.sqrt(x * x + y * y), cp: number, sp: number
        if (r2 == 0.) {
            cp = 1.; // cos(phi)
            sp = 0.; // sin(phi)
        }
        else {
            cp = -y / r2; // cos(phi)
            sp = x / r2; // sin(phi)
        }

        let
            r3 = Math.sqrt(r2 * r2 + 1.),
            ct = r2 / r3, // cos(theta)
            st = 1. / r3; // sin(theta)

        let
            cp_p = cp * this.cpp + sp * this.spp,  // cos(phi - phi_p)
            sp_p = sp * this.cpp - cp * this.spp;  // sin(phi - phi_p)

        // native == [
        //  sin(theta),
        //  cos(theta) * sin(phi - phi_p),
        //  cos(theta) * cos(phi - phi_p)
        // ]
        return mult(this.A, [st, ct * sp_p, ct * cp_p])
    }

    xyz2native(xyz: vector3) {
        return mult(this.B, xyz)
    }

    xyz2iwc(xyz: vector3) {
        let nat = this.xyz2native(xyz)
        // native = [
        //  sin(theta),
        //  cos(theta) * sin(phi - phi_p),
        //  cos(theta) * cos(phi - phi_p)
        // ]
        nat[1] /= nat[0]
        nat[2] /= nat[0]
        // native = [
        //  1.0,
        //  cot(theta) * sin(phi - phi_p),
        //  cot(theta) * cos(phi - phi_p)
        // ]
        // cot(theta) = hypot(x, y)
        // x =  cot(theta) * sin(phi)
        // y = -cot(theta) * cos(phi)
        return [
            this.cpp * nat[1] + this.spp * nat[2],
            this.spp * nat[1] - this.cpp * nat[2]
        ]
    }

    xyz2pixel(xyz: vector3) {
        return this.iwc2pixel(this.xyz2iwc(xyz))
    }

    iwc2pixel(iwc: vector2) {
        let D = this.cd[0] * this.cd[3] - this.cd[1] * this.cd[2]
        return [
            (this.cd[3] * iwc[0] - this.cd[1] * iwc[1]) / D + this.crpix[0],
            (-this.cd[2] * iwc[0] + this.cd[0] * iwc[1]) / D + this.crpix[1]
        ]
    }

    radec2pixel(sky: vector2) {
        let ra = sky[0], dec = sky[1]
        let xyz = math.radec2xyz(math.deg2rad(ra), math.deg2rad(dec))
        return this.xyz2pixel(xyz)
    }

    pixel2radec(pixel: vector2) {
        let xyz = this.pixel2xyz(pixel)
        let radec_rad = math.xyz2radec(xyz)
        return [math.rad2deg(radec_rad[0]), math.rad2deg(radec_rad[1])]
    }

}


function mult(A: matrix3, b: vector3) {
    return [
        A[0][0] * b[0] + A[0][1] * b[1] + A[0][2] * b[2],
        A[1][0] * b[0] + A[1][1] * b[1] + A[1][2] * b[2],
        A[2][0] * b[0] + A[2][1] * b[1] + A[2][2] * b[2]
    ]
}