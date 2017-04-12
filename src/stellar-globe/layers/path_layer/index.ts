import { Globe } from '../../globe'
import { Layer } from '../../layer'
import { Program } from '../../webgl/program'
import { AttribList } from '../../webgl/attrib_list'
import { EsoMilkyWayLayer } from '../../layers/eso_milky_way_layer'
import * as math from '../../math'
import { Vector3, Vector4 } from '../../math'
import * as glUtils from '../../webgl/utils'


export class PathLayer extends Layer {
    private program: Program
    private attribList: AttribList
    stencilTest = false
    depthTest = false

    constructor(globe: Globe) {
        super(globe)
        let vertSource = require('raw-loader!./vert.glsl') as string
        let fragSource = require('raw-loader!./frag.glsl') as string
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_p', nComponents: 3 },
                { name: 'a_a', nComponents: 3 },
                { name: 'a_b', nComponents: 3 },
                { name: 'a_y', nComponents: 1 },
                { name: 'a_width', nComponents: 1 },
                { name: 'a_color', nComponents: 4 },
            ],
        }))
    }

    protected alpha() {
        return PathLayer.alpha(this.globe.camera.effectiveFovy)
    }

    static alpha(fovy: number) {
        return math.clamp(4 * (fovy - 0.2), 0, 1)
    }

    darkenNarrowLine = true

    minWidth() {
        return this.globe.retinaSupport ? 8 : 4
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
            p.uniformMatrix4fv({ u_pvMatrix: this.pvMatrix() })
            p.uniform1f({
                u_alpha: alpha,
                u_fovy: view.fovy,
                u_aspectRatio: view.aspectRatio,
                u_minWidth: this.minWidth() / gl.drawingBufferHeight
            })
            p.uniform1i({ u_darkenNarrowLine: this.darkenNarrowLine ? 1 : 0 })
            let features = [gl.BLEND]
            let clearBit = 0
            if (this.stencilTest) {
                features.push(gl.STENCIL_TEST)
                clearBit |= gl.STENCIL_BUFFER_BIT
                gl.clearStencil(0)
                gl.stencilFunc(gl.EQUAL, 0, ~0)
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
            }
            if (this.depthTest) {
                features.push(gl.DEPTH_TEST)
                clearBit |= gl.DEPTH_BUFFER_BIT
            }
            if (clearBit) {
                gl.clear(clearBit)
            }
            glUtils.enable(gl, features, () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.attribList.vertexCount)
            })
        })
    }

    protected pvMatrix() {
        return this.globe.camera.pv
    }

    protected pen() {
        return new Pen(this)
    }

    protected stroke(block: (pen: Pen) => void, redraw = true) {
        let pen = this.pen()
        block(pen)
        let array = pen._finish()
        this.attribList.setData({ array: new Float32Array(array) })
        if (redraw) {
            this.globe.requestRedraw()
        }
    }
}



type PathPoint = {
    pos: Vector3
    color: Vector4
    width: number
}


export class Pen {
    protected path: PathPoint[] = []
    protected attrs: number[] = []
    color: Vector4 = [1, 0, 0, 1]
    width = 0.003

    constructor(private layer: Layer) {
    }

    moveTo(pos: Vector3) {
        this.finishCurrentPath(false)
        this.lineTo(pos)
    }

    closePath() {
        this.finishCurrentPath(true)
    }

    lineTo(pos: Vector3) {
        this.path.push({ pos, color: this.color, width: this.width })
    }

    up() {
        this.finishCurrentPath(false)
    }

    protected finishCurrentPath(close: boolean) {
        if (this.path.length >= 2) {
            if (close) {
                this.path.unshift(this.path[this.path.length - 1])
                this.path.push(this.path[1], this.path[2])
            }
            else {
                this.capEnds()
            }
            for (let i = 1; i < this.path.length - 1; ++i) {
                // (a) - (p) - (b) 
                let p = this.path[i]
                let a = this.path[i - 1]
                let b = this.path[i + 1]
                this.attrs.push(...p.pos, ...a.pos, ...b.pos, -1, 0.5 * p.width, ...p.color)
                if (i == 1)
                    this.repeatVertex()
                this.attrs.push(...p.pos, ...a.pos, ...b.pos, +1, 0.5 * p.width, ...p.color)
            }
            this.repeatVertex()
        }
        this.path = []
    }

    protected repeatVertex() {
        this.attrs.push(...this.attrs.slice(this.attrs.length - 15))
    }

    private capEnds() {
        this.path.unshift({
            ...this.path[0],
            pos: this.path[0].pos.map((p, i) => 2 * p - this.path[1].pos[i]),
        })

        const last = this.path.length - 1
        this.path.push({
            ...this.path[last],
            pos: this.path[last].pos.map((p, i) => 2 * p - this.path[last - 1].pos[i]),
        })
    }

    _finish(): number[] {
        this.finishCurrentPath(false)
        return this.attrs
    }
}