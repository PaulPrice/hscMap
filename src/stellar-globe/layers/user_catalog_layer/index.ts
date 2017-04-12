import { Layer } from '../../layer'
import { Program } from '../../webgl/program'
import { AttribList } from '../../webgl/attrib_list'
import { Globe } from '../../globe'
import * as glUtils from '../../webgl/utils'
import * as math from '../../math'
import { Vector3 } from "../../math"


export interface Row {
    coord: Vector3
}


export class UserCatalogLayer extends Layer {
    private program: Program
    protected attribList: AttribList

    constructor(globe: Globe, rows?: Row[]) {
        super(globe)
        let vertSource = require('raw-loader!./vert.glsl')
        let fragSource = require('raw-loader!./frag.glsl')
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_position', nComponents: 3 },
            ],
        }))
        if (rows) {
            this.setData(rows)
        }
    }

    protected alpha() {
        return 1
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
                u_alpha: alpha,
            })
            glUtils.enable(gl, [gl.BLEND], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
                gl.drawArrays(gl.POINTS, 0, this.attribList.vertexCount)
            })
        })
    }

    setData(rows: Row[]) {
        let attrs: number[] = []
        for (const row of rows)
            attrs.push(...row.coord)
        this.attribList.setData({ array: new Float32Array(attrs) })
    }
}