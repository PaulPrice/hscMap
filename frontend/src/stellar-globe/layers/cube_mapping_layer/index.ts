import { Globe } from '../../globe'
import { Layer } from '../../layer'
import { Program } from '../../webgl/program'
import { AttribList } from '../../webgl/attrib_list'
import { IndexBuffer } from '../../webgl/index_buffer'
import * as glUtils from '../../webgl/utils'
import { mat4 } from 'gl-matrix'
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'


export abstract class CubeMappingLayer extends Layer {
    private program: Program
    private attribList: AttribList
    private element: IndexBuffer
    private texture: WebGLTexture

    constructor(globe: Globe) {
        super(globe)
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.setupBuffers()
        this.loadImages().then(this.onImageLoad.bind(this))
    }

    draw() {
        if (this.texture == undefined)
            return
        let alpha = this.alpha()
        if (alpha <= 0)
            return
        let p = this.program
        let gl = this.gl
        p.use()
        p.enableAttribList(this.attribList, () => {
            p.uniform1i({ u_cubeTexture: 0 })
            p.uniformMatrix4fv({ u_pvMatrix: this.globe.camera.pv, u_mMatrix: this.mMatrix() })
            p.uniform3fv({ u_eyePosition: <any>this.globe.camera.pos })
            p.uniform1f({
                u_alpha: alpha,
                u_radius: 1,
            })
            glUtils.enable(gl, [gl.BLEND, gl.CULL_FACE], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
                glUtils.bind([this.element], () => {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)
                    gl.drawElements(gl.TRIANGLES, this.element.length, gl.UNSIGNED_SHORT, 0)
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
                })
            })
        })
    }

    private identityMatrix = mat4.create()

    protected mMatrix() {
        return this.identityMatrix
    }

    private setupBuffers() {
        let vertices = [
            -1, -1, -1,
            -1, -1, +1,
            -1, +1, -1,
            -1, +1, +1,
            +1, -1, -1,
            +1, -1, +1,
            +1, +1, -1,
            +1, +1, +1,
        ]
        let indices = [
            1, 0, 2, 1, 2, 3,
            1, 7, 5, 1, 3, 7,
            5, 7, 6, 4, 5, 6,
            3, 6, 7, 2, 6, 3,
            0, 6, 2, 0, 4, 6,
            0, 1, 5, 0, 5, 4,
        ]
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_position', nComponents: 3 },
            ],
            array: new Float32Array(vertices),
        }))
        this.element = this.track(new IndexBuffer(this.gl, {
            array: new Int16Array(indices),
        }))
    }

    private setupTexture() {
        let gl = this.gl
        this.texture = glUtils.nonNull(gl.createTexture())
        this.onRelease(() => gl.deleteTexture(this.texture))
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    }

    protected alpha() {
        return 1
    }

    abstract loadImages(): Promise<HTMLImageElement[]>

    static faces = ['px', 'py', 'pz', 'nx', 'ny', 'nz']

    private onImageLoad(images: HTMLImageElement[]) {
        if (this.texture == undefined)
            this.setupTexture()

        let gl = this.gl
        let targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        ]
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)
        for (let i in targets) {
            gl.texImage2D(targets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i])
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
        this.globe.requestRedraw()
    }
}