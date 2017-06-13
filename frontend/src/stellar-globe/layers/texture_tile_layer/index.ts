import { Globe } from "../../globe"
import { Animation } from "../../animation"
import { TileLayer, TileBase } from "../tile_layer"
import { Program } from "../../webgl/program"
import { AttribList } from "../../webgl/attrib_list"
import { Texture } from "../../webgl/texture"
import * as event from "../../event"
import * as glUtils from "../../webgl/utils"
import * as easing from "../../easing"
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'


export abstract class TextureTileLayer extends TileLayer {
    program: Program
    attribList: AttribList

    dissolveEffect = true

    constructor(globe: Globe) {
        super(globe)
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_xyCoord', nComponents: 2 },
                { name: 'a_tCoord', nComponents: 2 },
            ]
        }))
        this.setupMotionEvents()
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
        p.uniform1f({ u_flash: tile.flash, u_alpha: tile.lodAlpha * tile.fade * this.alpha() })
        p.uniformMatrix4fv({ u_mMatrix: tile.tract.mMatrix })
        glUtils.bind([texture], () => {
            this.attribList.setData({ array: tile.coords, usage: gl.DYNAMIC_DRAW })
            this.attribList.enable(p, () => {
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.attribList.vertexCount)
            })
        })
    }

    motionLod = 2
    lodDuration = 200
    private lodFade = 0
    protected scaleBias() {
        return (this.motionLod + (this.globe.retina ? Math.log2(window.devicePixelRatio) : 0)) * this.lodFade
    }
    private lodAnimation?: Animation
    private setupMotionEvents() {
        this.onRelease(this.globe.on(event.MoveStartEvent, () => {
            this.lodAnimation && this.lodAnimation.quit()
            this.lodFade = 1
        }))
        this.onRelease(this.globe.on(event.MoveEndEvent, () => {
            this.lodAnimation && this.lodAnimation.quit()
            this.lodAnimation = new Animation(this.globe, {
                duration: this.lodDuration,
                callback: ({ ratio }) => this.lodFade = (1 - ratio)
            })
            this.lodAnimation.then(() => this.lodAnimation = undefined)
        }))
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
    done = true

    initialize(layer: TileLayer) {
        this.texture = new Texture(layer.gl)
    }

    fadeIn() {
        this.done = false
        if ((this.layer as TextureTileLayer).dissolveEffect) {
            this.fade = 0
            new Animation(this.layer.globe, {
                duration: 200,
                callback: ({ ratio }) => this.fade = ratio
            }).then(() => {
                this.done = true
            })
        }
        else {
            this.fade = 1
            this.done = true
        }
        // this.startFlash()
    }

    fadeDone() {
        return this.done
    }

    startFlash() {
        new Animation(this.layer.globe, {
            duration: 500,
            callback: ({ ratio }) => this.flash = 1 - easing.fastStart4(ratio)
        })
    }

    release() {
        this.texture.release()
    }
}