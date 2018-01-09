import { Globe } from "../../globe"
import { Layer } from "../../layer"
import { LineSegmentLayer } from "../../layers/line_segment_layer"
import * as math from '../../math'
import { SizeLimitedDict } from '../../size_limited_dict'
import * as glUtils from "../../webgl/utils"
import { Program } from "../../webgl/program"
import { Texture } from "../../webgl/texture"
import { AttribList } from "../../webgl/attrib_list"
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'
import * as image from '../../image'


let HealpixIndex = (window as any).HealpixIndex
let SpatialVector = (window as any).SpatialVector
let HealpixCache = (window as any).HealpixCache
HealpixCache.init()


interface TileTextureId {
    id: string,
    nside: number,
    ipix: number,
}


type TileTextureIdDict = { [id: string]: TileTextureId }


export class HipsLayer extends Layer {
    program: Program
    attribList: AttribList

    constructor(globe: Globe) {
        super(globe)
        this.program = this.track(Program.make(this.gl, vertSource, fragSource))
        this.attribList = this.track(new AttribList(this.gl, {
            members: [
                { name: 'a_xyzCoord', nComponents: 3 },
                { name: 'a_tCoord', nComponents: 2 },
            ]
        }))
    }

    draw() {
        const order = this.hipsTileOrder()
        const nside: number = 1 << order
        const npix: number = HealpixIndex.nside2Npix(nside)
        const h = new HealpixIndex(nside)
        h.init()

        const { a, d } = this.globe.cameraParams
        const v = new SpatialVector(...math.radec2xyz(a, d))
        const tileIndices: number[] = h.queryDisc(v, Math.min(Math.PI, this.globe.camera.effectiveFovy / 2), true, true)

        const tileTexruesToLoad: TileTextureIdDict = {}

        const gl = this.gl
        const p = this.program
        p.use()
        p.uniformMatrix4fv({ u_pvMatrix: this.globe.camera.pv })
        p.uniform1i({ u_texture: 0 })
        this.attribList.enable(p, () => {
            glUtils.enable(gl, [gl.BLEND], () => {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
                for (const i of tileIndices)
                    this.drawTile(nside, i, tileTexruesToLoad)
            })
        })

        this.loadTileTextures(tileTexruesToLoad)
    }

    readyTileTexture = new SizeLimitedDict<TileTexture>(1000, tile => {
        tile.release()
    })


    private drawTile(nside: number, ipix: number, tileTexruesToLoad: TileTextureIdDict) {
        const gl = this.gl
        const p = this.program

        const tc = this.tileTextureAndCoord(nside, ipix, tileTexruesToLoad)
        if (tc) {
            const { tileTexture, coord } = tc
            p.uniform1f({ u_flash: 0.05, u_alpha: 1 })
            glUtils.bind([tileTexture.texture], () => {
                const a: number[] = []
                let q = HealpixCache.corners_nest(ipix, nside)
                q = [q[2], q[1], q[3], q[0]]

                for (let i = 0; i < 4; ++i) {
                    const { x, y, z } = q[i]
                    a.push(x, y, z, coord[i][0], coord[i][1])
                }

                this.attribList.setData({ array: new Float32Array(a), usage: gl.DYNAMIC_DRAW })
                this.attribList.enable(p, () => {
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.attribList.vertexCount)
                })
            })
        }
    }

    private loadingTileTextures: { [id: string]: TileTextureId } = {}

    minOrder = 3

    private tileTextureAndCoord(nside: number, ipix: number, tileTexruesToLoad: TileTextureIdDict) {
        const tileId = TileTexture.id(nside, ipix)
        const tileTexture = this.readyTileTexture.get(tileId)
        if (tileTexture) {
            return {
                tileTexture,
                coord: [[0, 0], [1, 0], [0, 1], [1, 1]]
            }
        }
        const id = TileTexture.id(nside, ipix)
        tileTexruesToLoad[id] = {
            nside, ipix, id
        }
    }

    private textureUrl(id: TileTextureId) {
        const { nside, ipix } = id
        const order: number = HealpixIndex.nside2order(nside)
        const dir = Math.floor(ipix / 10000) * 10000
        return `/aladin/DSS/DSSColor/Norder${order}/Dir${dir}/Npix${ipix}.jpg`
        // return `/aladin/Fermi/Color/Norder${order}/Dir${dir}/Npix${ipix}.jpg`
    }

    parallel = 4
    private async loadTileTextures(tileTexturesToLoad: TileTextureIdDict) {
        const tileTextures = Object.values(tileTexturesToLoad).sort((a, b) => {
            return a.nside - b.nside
        })
        while (Object.keys(this.loadingTileTextures).length < this.parallel && tileTextures.length > 0) {
            const tileTexture = tileTextures.shift()!
            this.loadingTileTextures[tileTexture.id] = tileTexture
            try {
                const img = await image.load(this.textureUrl(tileTexture))
                const texture = new Texture(this.gl)
                texture.setImage(img)
                this.readyTileTexture.set(tileTexture.id, new TileTexture(texture))
                this.globe.requestRedraw()
            }
            finally {
                delete this.loadingTileTextures[tileTexture.id]
            }
        }
    }

    private hipsTileOrder() {
        // return this.globe.camera.effectiveFovy
        return 3
    }

    pane() { return Layer.Pane.BACKGROUND }
}


class TileTexture {
    texture: Texture

    static id(nside: number, ipix: number) {
        return `${nside}/${ipix}`
    }

    constructor(texture: Texture) {
        this.texture = texture
    }

    release() {
        this.texture.release()
    }
}