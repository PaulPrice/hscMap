import { Globe } from "../../globe"
import { Layer } from "../../layer"
import { Program } from "../../webgl/program"
import { AttribList } from "../../webgl/attrib_list"
import { Texture } from "../../webgl/texture"
import { Vector2, Vector3, Vector4 } from '../../math'
import { packRectsOptimally, Rect, powerOf2 } from "./pack_rects"
import * as glUtils from "../../webgl/utils"
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'


interface SpriteImage {
    imageData: ImageData
    origin?: Vector2
}

interface SpriteImageDict {
    [name: string]: SpriteImage
}

interface Sprite {
    name: string
    position: Vector3
}

interface BBox {
    rect: Rect
    origin: Vector2
}


export class SpriteLayer extends Layer {
    private program: Program
    private attribList: AttribList
    private texture: Texture
    private packedTexture: { imageData: ImageData, bbox: { [name: string]: BBox } }

    color: Vector4 = [1, 1, 1, 1]

    constructor(globe: Globe, textures: SpriteImageDict = {}, sprites: Sprite[] = []) {
        super(globe)
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_vCoord', nComponents: 3 },
                { name: 'a_size', nComponents: 2 },
                { name: 'a_tCoord', nComponents: 2 },
            ]
        }))
        this.texture = this.track(new Texture(this.gl))
        this.setData(textures, sprites)
    }

    setData(textures: SpriteImageDict, sprites: Sprite[]) {
        const gl = this.gl
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        this.packedTexture = packTextures(textures, maxTextureSize)
        glUtils.bind([this.texture], () => {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.packedTexture.imageData);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.generateMipmap(gl.TEXTURE_2D)
        })

        const attrs: number[] = []
        const { width: W, height: H } = this.packedTexture.imageData
        for (const s of sprites) {
            const [x, y, z] = s.position
            const { rect: { left: l, right: r, top: t, bottom: b, width: w, height: h }, origin: o } = this.packedTexture.bbox[s.name]
            attrs.push(
                x, y, z, (-1 + o[0]) * w, (-1 + o[1]) * h, l / W, b / H,
                x, y, z, (+1 + o[0]) * w, (-1 + o[1]) * h, r / W, b / H,
                x, y, z, (+1 + o[0]) * w, (+1 + o[1]) * h, r / W, t / H,
                x, y, z, (-1 + o[0]) * w, (-1 + o[1]) * h, l / W, b / H,
                x, y, z, (+1 + o[0]) * w, (+1 + o[1]) * h, r / W, t / H,
                x, y, z, (-1 + o[0]) * w, (+1 + o[1]) * h, l / W, t / H,
            )
        }
        this.attribList.setData({
            array: new Float32Array(attrs)
        })
    }

    draw() {
        const alpha = this.alpha()
        if (this.attribList.vertexCount == 0 || alpha <= 0)
            return
        const gl = this.gl
        const p = this.program
        p.use()
        const ratio = this.scale() * (this.globe.retina ? devicePixelRatio : 1)
        p.uniformMatrix4fv({ u_pvMatrix: this.globe.camera.pv })
        p.uniform4fv({ u_color: this.color })
        p.uniform1i({ u_texture: 0 })
        p.uniform1f({
            u_alpha: alpha,
            u_width: 2 / ratio * gl.drawingBufferWidth,
            u_height: 2 / ratio * gl.drawingBufferHeight,
        })
        glUtils.enable(gl, [gl.BLEND], () => {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            glUtils.bind([this.texture], () => {
                this.attribList.enable(p, () => {
                    gl.drawArrays(gl.TRIANGLES, 0, this.attribList.vertexCount)
                })
            })
        })
    }

    protected scale() {
        return 1
    }

    protected alpha() {
        return 1
    }

    pane() {
        return Layer.Pane.SPRITE
    }
}


function packTextures(textures: SpriteImageDict, maxTextureSize: number) {
    const names = Object.keys(textures)
    const rects = names.map((k) => textures[k]).map(t => new Rect(t.imageData.width + 2, t.imageData.height + 2))
    try {
        packRectsOptimally(rects, maxTextureSize)
    } catch (e) {
        console.warn(e)
        return {
            imageData: new ImageData(1, 1),
            bbox: {},
        }
    }
    const { canvas, ctx } = getCanvas()
    const width = powerOf2(Math.max(...rects.map(r => r.right)))
    const height = powerOf2(Math.max(...rects.map(r => r.bottom)))
    canvas.height = height
    canvas.width = width
    const bbox: { [name: string]: BBox } = {}
    for (let i = 0; i < names.length; ++i) {
        const name = names[i]
        const rect = rects[i]
        const t = textures[name]
        ctx.putImageData(t.imageData, rect.left + 1, rect.top + 1)
        bbox[name] = { rect, origin: t.origin || [0, 0] }
    }
    return {
        imageData: ctx.getImageData(0, 0, width, height),
        bbox,
    }
}


const getCanvas = (() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    return () => ({ canvas, ctx })
})()