import { Globe } from '../globe'
import { Layer, Pane } from '../layer'
import { Tract } from '../tract'
import { SizeLimitedDict } from '../size_limited_dict'
import * as math from '../math'
import { PathLayer } from '../layers/path_layer'
import { vec3, vec4 } from 'gl-matrix'

type TileDict = { [id: string]: TileBase }

export abstract class TileLayer extends Layer {
    private version = 0
    private tracts: Tract[] = []
    private loadingTiles: TileDict = {}
    private tilesToLoad: TileDict = {}
    private activeTiles: TileDict = {}
    private runningRequest = 0
    private readyTiles = this.track(new SizeLimitedDict<TileBase>(1000, (tile) => {
        this.removeFromDescendantIndex(tile)
        tile.release()
    }))

    constructor(globe: Globe) {
        super(globe)
    }

    addTract(tract: Tract) {
        this.tracts.push(tract)
    }

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
        this.updateTiles()
        this.loadTiles()
        let tiles: TileBase[] = []
        for (let id in this.activeTiles) {
            tiles.push(this.activeTiles[id])
        }
        this.sortTilesForDraw(tiles)
        for (let tile of tiles) {
            if (tile.ok)
                this.drawOneTile(tile)
        }
    }

    protected sortTilesForDraw(tiles: TileBase[]) {
        tiles.sort((a, b) => {
            return b.level - a.level
        })
    }

    protected scale() {
        return 1
    }

    private updateTiles() {
        const scale = this.scale()
        this.tilesToLoad = {}
        this.activeTiles = {}
        for (let tract of this.tracts) {
            tract.tileIndices(
                this.globe.camera.inv,
                this.globe.gl.drawingBufferHeight,
                scale,
                (level, i, j) => {
                    let tileId = TileBase.id(tract, level, i, j)
                    let regularTile = this.readyTiles.get(tileId)
                    if (regularTile) {
                        this.activeTiles[tileId] = regularTile
                        if (!this.loadingTiles[regularTile.id] && regularTile.version < this.version) {
                            this.tilesToLoad[regularTile.id] = regularTile.clone()
                        }
                    }
                    else {
                        let maxLevel = tract.maxLevel
                        const [filled, lowerAltTiles] = this.lowerAltTiles(tract, level, i, j)
                        for (let tile of lowerAltTiles) {
                            this.activeTiles[tile.id] = tile
                        }
                        const tile = this.upperAltTile(tract, level, i, j)
                        if (tile) {
                            this.activeTiles[tile.id] = tile
                            if (!this.loadingTiles[tile.id] && tile.version < this.version) {
                                this.tilesToLoad[tile.id] = tile.clone()
                            }
                            maxLevel = tile.level - 1
                        }
                        for (let l = level; l <= maxLevel; l++) {
                            let loadId = TileBase.id(tract, l, i, j)
                            if (!this.loadingTiles[loadId]) {
                                this.tilesToLoad[loadId] = new (this.tileConstructor())(this.globe, loadId, tract, l, i, j, this.version)
                            }
                            i >>= 1
                            j >>= 1
                        }
                    }
                }
            )
        }
    }

    private loadTiles() {
        let tiles: TileBase[] = []
        for (let tileId in this.tilesToLoad) {
            tiles.push(this.tilesToLoad[tileId])
        }
        let cParams = this.globe.cameraParams
        let center = math.radec2xyz(cParams.a, cParams.d)
        tiles.sort((a, b) => {
            if (a.version != b.version)
                return a.version - b.version
            if (a.level != b.level)
                return b.level - a.level
            return vec3.sqrDist(center, <any>a.centerXYZ) - vec3.sqrDist(center, <any>b.centerXYZ)
        })
        let parallel = this.parallel()
        while (Object.keys(this.loadingTiles).length < parallel && tiles.length > 0) {
            let tile = tiles.shift() as TileBase
            this.loadingTiles[tile.id] = tile
            tile.initialize(this)
            tile.afterInitialize()
            this.loadOneTile(tile).then(() => {
                tile.ok = true
                tile.afterLoad()
            }).catch(e => {
                tile.ok = false
                return Promise.resolve()
            }).then(() => { // finally
                tile.version = this.version
                delete this.loadingTiles[tile.id]
                this.readyTiles.set(tile.id, tile)
                this.addToDescendantIndex(tile)
                this.globe.requestRedraw()
            })
        }
    }

    private upperAltTile(tract: Tract, level: number, i: number, j: number) {
        let tile: TileBase | undefined
        for (let l = level + 1; l <= tract.maxLevel; l++) {
            i >>= 1
            j >>= 1
            if (tile = this.readyTiles.get(TileBase.id(tract, l, i, j)))
                break
        }
        return tile
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
        for (let ll = tile.level; ll < tile.tract.maxLevel; ll++) {
            this.descendantIndex[TileBase.id(tile.tract, ll, ii, jj)] = true
            ii >>= 1
            jj >>= 1
        }
    }

    removeFromDescendantIndex(tile: TileBase) {
        let ii = tile.i
        let jj = tile.j
        for (let ll = tile.level; ll < tile.tract.maxLevel; ll++) {
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
            this.updateTiles()
            for (const k of this.readyTiles.keys()) {
                if (!this.activeTiles[k]) {
                    this.readyTiles.deleteByKey(k)
                }
            }
        }
        this.version++
        this.globe.requestRedraw()
    }

    pane() { return Pane.BASE }
}


export class TileBase {
    static id(tract: Tract, level: number, i: number, j: number) {
        return `${tract.id}:${level}:${i}:${j}`
    }

    coords: Float32Array
    centerXYZ: vec4
    ok = false

    constructor(protected globe: Globe, public id: string, public tract: Tract, public level: number, public i: number, public j: number, public version: number) {
        let scale = 1 << this.level
        let tileScale = scale * this.tract.tileSize
        let naxis1 = this.tract.naxis1
        let naxis2 = this.tract.naxis2
        let safeNaxis1 = Math.max(0, naxis1 - 2 * scale)
        let safeNaxis2 = Math.max(0, naxis2 - 2 * scale)
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
        let minT = minX / naxis1
        let maxT = maxX / naxis1
        let minU = minY / naxis2
        let maxU = maxY / naxis2
        this.coords = new Float32Array([
            minT, minU, 0, 0,
            minT, maxU, 0, q,
            maxT, minU, p, 0,
            maxT, maxU, p, q,
        ])
        let centerT = (maxT + minT) / 2
        let centerU = (maxU + minU) / 2
        this.centerXYZ = vec4.transformMat4(math.vec4create(), [centerT, centerU, 0, 1], tract.mMatrix)
    }

    clone() {
        return new (this.constructor as any)(this.globe, this.id, this.tract, this.level, this.i, this.j, this.version)
    }

    initialize(layer: TileLayer) { }

    afterInitialize() { }

    afterLoad() { }

    release() { }
}