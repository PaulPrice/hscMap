import * as glUtils from '../webgl/utils'
import * as status from '../devel/status'

let n = 0

export type ImageLike = HTMLImageElement | HTMLCanvasElement | ImageData

export class Texture {
    name: WebGLTexture

    constructor(private gl: WebGLRenderingContext) {
        this.name = glUtils.nonNull(gl.createTexture())
        glUtils.bind([this], () => {
            gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        })
        status.update({texture: ++n})
    }

    release() {
        this.gl.deleteTexture(this.name)
        status.update({texture: --n})
    }

    bind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.name)
    }

    unbind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    }

    setImage(img: ImageLike) {
        glUtils.bind([this], () => {
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
        })
    }
}