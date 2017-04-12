import { Program, Texture, ResourceHolder, AttribList, glUtils } from '..'


export class ImageFilter extends ResourceHolder {
    private attribList: AttribList
    private frameBuffer: WebGLFramebuffer
    private textures: Texture[] = []

    constructor(public gl: WebGLRenderingContext) {
        super()
        this.attribList = this.track(new AttribList(gl, {
            members: [{ name: 'a_texCoord', nComponents: 2 }],
            array: new Float32Array([
                0, 0, 1, 0, 1, 1,
                0, 0, 1, 1, 0, 1
            ])
        }))
        this.frameBuffer = glUtils.nonNull(gl.createFramebuffer())
        this.onRelease(() => gl.deleteFramebuffer(this.frameBuffer))
    }

    applyFilter(program: Program, outTexture: Texture, outWidth: number, outHeight: number, images: HTMLImageElement[]) {
        const gl = this.gl
        const p = program // must be "use"d beforehand

        outTexture.bind()
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, outWidth, outHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, undefined)
        outTexture.unbind()

        while (this.textures.length < images.length) {
            this.textures.push(this.track(new Texture(gl)))
        }

        for (let i = 0; i < images.length; ++i) {
            gl.uniform1i(p.uniformLocation(`u_texture${i}`), i)
            this.textures[i].setImage(images[i])
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture.name, 0)
        const { drawingBufferWidth, drawingBufferHeight } = gl
        gl.viewport(0, 0, outWidth, outHeight)
        this.attribList.enable(p, () => {
            for (let i = 0; i < images.length; ++i) {
                gl.activeTexture((gl as any)[`TEXTURE${i}`])
                this.textures[i].bind()
            }
            gl.viewport(0, 0, outWidth, outHeight)
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            gl.viewport(0, 0, drawingBufferWidth, drawingBufferHeight)
        })
        for (let i = 0; i < images.length; ++i) {
            gl.activeTexture((gl as any)[`TEXTURE${i}`])
            gl.bindTexture(gl.TEXTURE_2D, null)
        }
        gl.activeTexture(gl.TEXTURE0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
}