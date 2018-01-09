import { ResourceHolder } from "../resource_holder"
import * as image from '../image'
import { Texture } from '../webgl/texture'
import * as glUtils from "../webgl/utils"
import * as smallTasks from "../small_tasks"


export class TextureLoader extends ResourceHolder {
    constructor(private gl: WebGLRenderingContext) {
        super()
    }

    textures: Texture[] = []
    nonBlocking = false

    load(imageUrls: string[], cb: (textures: Texture[]) => void, modifier = (img: HTMLImageElement) => { }) {
        return this.nonBlocking ? new Promise((resolve) => {
            const gl = this.gl
            const textures: Texture[] = new Array(imageUrls.length)
            let done = 0
            for (let i = 0; i < imageUrls.length; ++i) {
                const url = imageUrls[i]
                image.load(url, { fallbackBlack: true, modifier }).then(img => {
                    smallTasks.push(() => {
                        textures[i] = new Texture(gl)
                        textures[i].setImage(img)
                        if (++done == imageUrls.length) {
                            smallTasks.push(() => {
                                cb(textures)
                                for (const t of textures)
                                    t.release()
                                resolve()
                            })
                        }
                    })
                })
            }
        }) : Promise.all(imageUrls.map(url => image.load(url, { fallbackBlack: true }))).then((imgs) => {
            const gl = this.gl
            for (let i = this.textures.length; i < imageUrls.length; ++i)
                this.textures[i] = new Texture(gl)
            for (let i = 0; i < imgs.length; ++i) {
                const img = imgs[i]
                this.textures[i].setImage(img)
            }
            cb(this.textures)
        })
    }
}