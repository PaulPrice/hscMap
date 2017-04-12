import { Layer } from '../../layer'
import { Program } from '../../webgl/program'
import { AttribList } from '../../webgl/attrib_list'
import { Globe } from '../../globe'
import * as glUtils from '../../webgl/utils'
import * as math from '../../math'


export class CatalogLayer extends Layer {
    private program: Program
    protected attribList: AttribList

    constructor(globe: Globe) {
        super(globe)
        let vertSource = `${this.shaderPreamble()}${require('raw-loader!./vert.glsl')}`
        let fragSource = `${this.shaderPreamble()}${require('raw-loader!./frag.glsl')}`
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_position', nComponents: 3 },
                { name: 'a_flux', nComponents: 1 },
            ],
        }))
        this.loadCatalog()
    }

    protected alpha() {
        return math.clamp(4 * this.globe.camera.effectiveFovy - 0.05, 0, 1)
    }

    draw() {
        let alpha = this.alpha()
        if (alpha <= 0 || this.attribList.vertexCount == 0)
            return
        let p = this.program
        let gl = this.gl
        let view = this.globe.camera
        p.use()
        p.enableAttribList(this.attribList, () => {
            p.uniformMatrix4fv({ u_pvMatrix: view.pv })
            p.uniform1f({
                u_bufferHeight: gl.drawingBufferHeight,
                u_fovy: view.fovy,
                u_alpha: alpha,
                u_rho: this.rho(),
            })
            glUtils.enable(gl, [gl.BLEND], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
                gl.drawArrays(gl.POINTS, 0, this.attribList.vertexCount)
            })
        })
    }

    sizeSirius = math.deg2rad(5) / 2

    protected rho() {
        let magSirius = -1.47
        let fluxSirius = Math.pow(10, -magSirius / 2.5)
        let rho = this.sizeSirius / Math.sqrt(fluxSirius)
        return rho
    }

    private shaderPreamble() {
        return `
            #define MIN_POINTSIZE 3.
            `
    }

    loadCatalog() {
        // this method is just a sample
        let attrs: number[] = []
        let flux = Math.pow(10, 0)
        for (let i = -90; i <= 90; ++i) {
            let dec = math.deg2rad(i)
            let ra = math.deg2rad(8 * i)
            attrs.push(
                Math.cos(dec) * Math.cos(ra),
                Math.cos(dec) * Math.sin(ra),
                Math.sin(dec),
                flux,
            )
        }
        this.attribList.setData({ array: new Float32Array(attrs) })
    }
}