import { Globe } from '../globe'
import { Layer } from '../layer'
import { Tract } from '../tract'
import * as event from '../event'
import { SizeLimitedDict } from '../size_limited_dict'
import * as math from '../math'
import { PathLayer } from '../layers/path_layer'
import { vec3, vec4 } from 'gl-matrix'
import { Camera, CameraMode } from "../camera"
import * as status from "../devel/status";


type TileRequest = {
    tile: TileBase
    fade: boolean
}
type TileDict = { [id: string]: TileBase }
type ReqeustDict = { [id: string]: TileRequest }


export abstract class TileLayer extends Layer {
    private version = 0
    private loadingTiles: ReqeustDict = {}
    private readyTiles = this.track(new SizeLimitedDict<TileBase>(1000, (tile) => {
        this.removeFromDescendantIndex(tile)
        tile.release()
    }))

    constructor(globe: Globe) {
        super(globe)
    }

    protected abstract walkTracts(callback: (tract: Tract) => void): void

    protected parallel() {
        return 2
    }

    alpha() {
        return 1 - PathLayer.alpha(this.globe.camera.effectiveFovy)
    }

    draw() {
        if (this.alpha() <= 0) {
            return
        }
        const activeTiles: TileDict = {}
        const tilesToLoad: ReqeustDict = {}
        const scaleBias = this.scaleBias()

        this.updateActiveTiles(activeTiles, tilesToLoad, scaleBias)
        this.resreshOldTiles(tilesToLoad, activeTiles)
        this.loadTiles(tilesToLoad)

        const tiles = Object.values(activeTiles)
        this.sortTilesForDraw(tiles)
        for (const tile of tiles) {
            if (tile.ok)
                this.drawOneTile(tile)
        }
    }

    protected sortTilesForDraw(tiles: TileBase[]) {
        tiles.sort((a, b) => {
            return b.level - a.level
        })
    }

    protected scaleBias() {
        return 1
    }

    searchAltTiles = true

    private updateActiveTiles(activeTiles: TileDict, tilesToLoad: ReqeustDict, scaleBias: number) {
        this.walkTracts(tract =>
            tract.tileIndices(
                this.globe.camera.inv,
                this.gl.drawingBufferWidth,
                this.gl.drawingBufferHeight,
                scaleBias,
                (level, i, j, lodAlpha, maxLevel) => {
                    this.pickActiveTilesFor(activeTiles, tract, level, i, j, lodAlpha)
                    this.refreshLoadQueue(tilesToLoad, tract, level, this.searchAltTiles ? maxLevel : level, i, j)
                }
            )
        )
    }

    private pickActiveTilesFor(activeTiles: TileDict, tract: Tract, level: number, i: number, j: number, lodAlpha: number) {
        const tileId = TileBase.id(tract, level, i, j)
        // lodAlpha = 1
        // search regular tile
        const baseTile = this.readyTiles.get(tileId)
        if (baseTile) {
            baseTile.lodAlpha = lodAlpha
            activeTiles[baseTile.id] = baseTile
            if (lodAlpha >= 1 && baseTile.fadeDone())
                return
        }
        // search upper tiles
        const upperAltTiles = this.upperAltTiles(tract, level, i, j)
        for (const t of upperAltTiles) {
            t.lodAlpha = 1
            activeTiles[t.id] = t
        }
        if (upperAltTiles.length > 0)
            return

        // search lower Tiles
        const [filled, lowerAltTiles] = this.lowerAltTiles(tract, level, i, j)
        for (const t of lowerAltTiles) {
            t.lodAlpha = 1
            activeTiles[t.id] = t
        }
    }

    private refreshLoadQueue(tilesToLoad: ReqeustDict, tract: Tract, level: number, maxLevel: number, i: number, j: number) {
        let tileToLoad: [number, number, number] | undefined
        for (let l = level; l <= maxLevel; l++) {
            const tileId = TileBase.id(tract, l, i, j)
            if (!this.readyTiles.peek(tileId)) {
                tileToLoad = [l, i, j]
            }
            i >>= 1
            j >>= 1
        }
        if (tileToLoad) {
            const [l, i, j] = tileToLoad
            const tileId = TileBase.id(tract, l, i, j)
            if (!this.loadingTiles[tileId]) {
                tilesToLoad[tileId] = {
                    tile: new (this.tileConstructor())(this, tileId, tract, l, i, j, this.version),
                    fade: true
                }
            }
        }
    }

    private loadTiles(tilesToLoad: ReqeustDict) {
        const tiles: TileRequest[] = Object.values(tilesToLoad)
        const cParams = this.globe.cameraParams
        const center = math.radec2xyz(cParams.a, cParams.d)
        tiles.sort((a, b) => {
            if (a.tile.version != b.tile.version)
                return a.tile.version - b.tile.version
            if (a.tile.level != b.tile.level)
                return b.tile.level - a.tile.level
            return vec3.sqrDist(center, <any>a.tile.centerXYZ) - vec3.sqrDist(center, <any>b.tile.centerXYZ)
        })
        const parallel = this.parallel()
        while (Object.keys(this.loadingTiles).length < parallel && tiles.length > 0) {
            const tileReq = tiles.shift()!
            const tile = tileReq.tile
            tile.version = this.version
            this.loadingTiles[tile.id] = tileReq
            tile.initialize(this)
            tile.afterInitialize()
            this.loadOneTile(tile).then(() => {
                tile.ok = true
                tileReq.fade && tile.fadeIn()
            }).catch(e => {
                tile.ok = false
                return Promise.resolve()
            }).then(() => { // finally
                delete this.loadingTiles[tile.id]
                this.readyTiles.set(tile.id, tile)
                this.addToDescendantIndex(tile)
                this.globe.requestRedraw()
                this.globe.trigger(new event.LoadDoneEvent(this))
            })
        }
    }

    private resreshOldTiles(tilesToLoad: ReqeustDict, activeTiles: TileDict) {
        for (const tileId in activeTiles) {
            const tile = activeTiles[tileId]
            if (tile.version < this.version && !this.loadingTiles[tileId])
                tilesToLoad[tileId] = {
                    tile: tile.clone(),
                    fade: false
                }
        }
    }

    private upperAltTiles(tract: Tract, level: number, i: number, j: number) {
        const tiles: TileBase[] = []
        for (let l = level + 1; l <= tract.maxLevel; l++) {
            i >>= 1
            j >>= 1
            const tile = this.readyTiles.get(TileBase.id(tract, l, i, j))
            if (tile) {
                tiles.push(tile)
                if (tile.fadeDone())
                    break
            }
        }
        return tiles
    }

    private descendantIndex: { [tileId: string]: boolean } = {}

    private lowerAltTiles(tract: Tract, level: number, i: number, j: number): [boolean, TileBase[]] {
        const tiles: TileBase[] = []
        const pick = (ll: number, ii: number, jj: number): boolean => {
            if (ll < 0)
                return false
            const id = TileBase.id(tract, ll, ii, jj)
            if (this.descendantIndex[id]) {
                const tile = this.readyTiles.get(id)
                if (tile) {
                    tiles.push(tile)
                    return true
                }
                else {
                    let filled = true
                    for (const [iii, jjj] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
                        filled = pick(ll - 1, (ii << 1) + iii, (jj << 1) + jjj) && filled
                    }
                    return filled
                }
            }
            return false
        }
        return [pick(level, i, j), tiles]
    }

    addToDescendantIndex(tile: TileBase) {
        let ii = tile.i
        let jj = tile.j
        for (let ll = tile.level; ll <= tile.tract.maxLevel; ll++) {
            this.descendantIndex[TileBase.id(tile.tract, ll, ii, jj)] = true
            ii >>= 1
            jj >>= 1
        }
    }

    removeFromDescendantIndex(tile: TileBase) {
        let ii = tile.i
        let jj = tile.j
        for (let ll = tile.level; ll <= tile.tract.maxLevel; ll++) {
            if ([[0, 0], [0, 1], [1, 0,], [1, 1]].every(([iii, jjj]) => {
                return !this.descendantIndex[TileBase.id(tile.tract, ll + 1, (ii << 1) + iii, (jj << 1) + jjj)]
            })) {
                delete this.descendantIndex[TileBase.id(tile.tract, ll, ii, jj)]
            }
            else {
                break
            }
            ii >>= 1
            jj >>= 1
        }
    }

    protected abstract async loadOneTile(tile: TileBase): Promise<void>

    protected abstract drawOneTile(tile: TileBase): void

    protected tileConstructor() {
        return TileBase
    }

    refreshTiles(full = true) {
        if (full) {
            this.readyTiles.clear()
        }
        else {
            const activeTiles: TileDict = {}
            this.updateActiveTiles(activeTiles, {}, this.scaleBias())
            for (const k of this.readyTiles.keys()) {
                if (!activeTiles[k]) {
                    this.readyTiles.deleteByKey(k)
                }
            }
        }
        this.version++
        this.globe.requestRedraw()
    }

    pane() { return Layer.Pane.BASE }

    done() {
        this.globe.refreshCamera()

        const activeTiles: TileDict = {}
        const tilesToLoad: ReqeustDict = {}
        const scaleBias = this.scaleBias()

        this.updateActiveTiles(activeTiles, tilesToLoad, scaleBias)
        this.resreshOldTiles(tilesToLoad, activeTiles)
        this.loadTiles(tilesToLoad)

        return Object.keys(this.loadingTiles).length == 0 && Object.keys(tilesToLoad).length == 0
    }
}


export class TileBase {
    static id(tract: Tract, level: number, i: number, j: number) {
        return `${tract.id}:${level}:${i}:${j}`
    }

    coords: Float32Array
    centerXYZ: vec4
    lodAlpha: number
    ok = false

    constructor(protected layer: TileLayer, public id: string, public tract: Tract, public level: number, public i: number, public j: number, public version: number) {
        const scale = 1 << this.level
        const tileScale = scale * this.tract.tileSize
        const naxis1 = this.tract.naxis1
        const naxis2 = this.tract.naxis2
        const safeNaxis1 = Math.max(0, naxis1 - 2 * scale)
        const safeNaxis2 = Math.max(0, naxis2 - 2 * scale)
        let minX = tileScale * this.i
        let maxX = tileScale * (this.i + 1)
        let minY = tileScale * this.j
        let maxY = tileScale * (this.j + 1)
        let p = 1
        let q = 1
        if (maxX > safeNaxis1) {
            maxX = safeNaxis1
            p = (safeNaxis1 % tileScale) / tileScale
        }
        if (maxY > safeNaxis2) {
            maxY = safeNaxis2
            q = (safeNaxis2 % tileScale) / tileScale
        }
        const minT = minX / naxis1
        const maxT = maxX / naxis1
        const minU = minY / naxis2
        const maxU = maxY / naxis2
        this.coords = new Float32Array([
            minT, minU, 0, 0,
            minT, maxU, 0, q,
            maxT, minU, p, 0,
            maxT, maxU, p, q,
        ])
        const centerT = (maxT + minT) / 2
        const centerU = (maxU + minU) / 2
        this.centerXYZ = vec4.transformMat4(math.vec4create(), [centerT, centerU, 0, 1], tract.mMatrix)
    }

    clone() {
        const klass: typeof TileBase = this.constructor as any
        return new klass(this.layer, this.id, this.tract, this.level, this.i, this.j, this.version)
    }

    fadeDone() {
        return true
    }

    initialize(layer: TileLayer) { }

    afterInitialize() { }

    fadeIn() { }

    release() { }
}