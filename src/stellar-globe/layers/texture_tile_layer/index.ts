import { Globe } from "../../globe"
import { Animation } from "../../animation"
import { TileLayer, TileBase } from "../tile_layer"
import { Program } from "../../webgl/program"
import { AttribList } from "../../webgl/attrib_list"
import { Texture } from "../../webgl/texture"
import * as glUtils from "../../webgl/utils"
import * as easing from "../../easing"
import * as image from "../../image"
import { Tract } from "../../tract"
import { vec4, mat4 } from 'gl-matrix'


export abstract class TextureTileLayer extends TileLayer {
    program: Program
    attribList: AttribList

    constructor(globe: Globe) {
        super(globe)
        let vertSource = require('raw-loader!./vert.glsl')
        let fragSource = require('raw-loader!./frag.glsl')
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_xyCoord', nComponents: 2 },
                { name: 'a_tCoord', nComponents: 2 },
            ]
        }))
    }

    draw() {
        let gl = this.gl
        let p = this.program
        p.use()
        p.uniformMatrix4fv({ u_pvMatrix: this.globe.camera.pv })
        p.uniform1i({ u_texture: 0 })
        this.attribList.enable(p, () => {
            glUtils.enable(gl, [gl.BLEND], () => {
            // glUtils.enable(gl, [gl.BLEND, gl.STENCIL_TEST], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                // gl.clearStencil(0)
                // gl.clear(gl.STENCIL_BUFFER_BIT)
                // gl.stencilFunc(gl.EQUAL, 0, ~0)
                // gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
                super.draw()
            })
        })
    }

    protected drawOneTile(tile: TextureTileBase) {
        let texture = tile.texture as Texture
        let p = this.program
        let gl = this.gl
        p.uniform1f({ u_flash: tile.flash, u_alpha: tile.fade * this.alpha() })
        p.uniformMatrix4fv({ u_mMatrix: tile.tract.mMatrix })
        glUtils.bind([texture], () => {
            this.attribList.setData({ array: tile.coords, usage: gl.DYNAMIC_DRAW })
            this.attribList.enable(p, () => {
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.attribList.vertexCount)
            })
        })
    }

    motionScale = 2
    protected scale() {
        return this.globe.inMotion() ? this.motionScale : 1
    }

    protected tileConstructor() {
        return TextureTileBase
    }

    protected parallel() {
        return 4
    }
}


export class TextureTileBase extends TileBase {
    texture: Texture
    flash = 0
    fade = 1

    initialize(layer: TileLayer) {
        this.texture = new Texture(layer.gl)
    }

    afterLoad() {
        if (this.level == this.tract.maxLevel) {
            this.fade = 0
            new Animation(this.globe, {
                duration: 200,
                callback: ({ ratio }) => this.fade = ratio
            })
        }
        // this.startFlash()
    }

    // for debug
    startFlash() {
        new Animation(this.globe, {
            duration: 500,
            callback: ({ ratio }) => this.flash = 0.5 * (1 - easing.fastStart4(ratio))
        })
    }

    release() {
        this.texture.release()
    }
}