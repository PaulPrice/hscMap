import { Globe } from "../../globe"
import { Layer } from "../../layer"
import { Program } from "../../webgl/program"
import * as glUtils from '../../webgl/utils'
import { AttribList } from "../../webgl/attrib_list"
import { IndexBuffer } from "../../webgl/index_buffer"
import { mat4 } from 'gl-matrix'
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'


export class ViewFrustumLayer extends Layer {
    program: Program
    attribList: AttribList
    ibo: IndexBuffer

    constructor(globe: Globe) {
        super(globe)
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.setBufferObject()
    }

    draw() {
        const cp = this.globe.cameraParams
        const p = this.program
        const gl = this.gl
        p.use()
        p.enableAttribList(this.attribList, () => {
            p.uniformMatrix4fv({
                u_pvMatrix: this.globe.camera.pv,
                u_mMatrix: this.mMatrix(),
            })
            p.uniform1f({
                u_fovy: cp.fovy
            })
            glUtils.enable(gl, [gl.BLEND], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
                glUtils.bind([this.ibo], () => {
                    gl.drawElements(gl.TRIANGLES, this.ibo.length, gl.UNSIGNED_SHORT, 0)
                })
            })
        })
    }

    private mMatrix() {
        const cp = this.globe.cameraParams
        const z = cp.fovy / 2
        const y = z * this.globe.camera.aspectRatio
        const m = mat4.create()
        mat4.rotateZ(m, m, cp.a)
        mat4.rotateY(m, m, - cp.d)
        mat4.rotateX(m, m, + cp.roll)
        mat4.scale(m, m, [1, y, z])
        return m
    }

    private setBufferObject() {
        const v = [
            +0, +0, +0,
            +1, -1, -1,
            +1, -1, +1,
            +1, +1, +1,
            +1, +1, -1,
        ]
        const i = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,
        ]
        this.attribList = this.track(new AttribList(this.gl, {
            members: [{ name: 'a_position', nComponents: 3 }],
            array: new Float32Array(v),
        }))
        this.ibo = this.track(new IndexBuffer(this.gl, {
            array: new Int16Array(i)
        }))
    }

}