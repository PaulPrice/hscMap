import { Globe, Tract, TextureTileBase, TextureTileLayer } from 'stellar-globe'
import { ImageFilter } from 'stellar-globe/webgl/image_filter'
import Mixer from './mixers/base_mixer'
import { SimpleRgbMixer } from './mixers/simple_rgb_mixer'
import { SdssTrueColorMixer } from './mixers/sdss_true_color_mixer'
import tractsLoader from './../ssp_tracts'


type DepthName = 'udeep' | 'deep' | 'wide'


export class SspImageLayer extends TextureTileLayer {
    udeep = true
    deep = true
    wide = true

    private readonly imageFilter = this.track(new ImageFilter(this.gl))
    mixers = {
        simpleRgb: this.track(new SimpleRgbMixer(this.imageFilter)),
        sdssTrueColor: this.track(new SdssTrueColorMixer(this.imageFilter)),
    }
    mixer: Mixer = this.mixers.simpleRgb

    constructor(globe: Globe) {
        super(globe)
        this.startLoading()
    }

    private tracts = {
        udeep: [] as Tract[],
        deep: [] as Tract[],
        wide: [] as Tract[],
    }

    walkTracts(cb: (tract: Tract) => void) {
        if (this.udeep)
            for (const t of this.tracts.udeep)
                cb(t)
        if (this.deep)
            for (const t of this.tracts.deep)
                cb(t)
        if (this.wide)
            for (const t of this.tracts.wide)
                cb(t)
    }

    private async startLoading() {
        const tracts = await tractsLoader()
        for (const id in tracts) {
            const tract = new Tract(id, tracts[id].wcsInfo)
            const depth = id.split('-')[0]
            this.tracts[depth as DepthName].push(tract)
        }
        this.globe.requestRedraw()
    }

    changeMixer(mixerName: string) {
        this.mixer = (this.mixers as any)[mixerName]
        if (!this.mixer) throw new Error(`No such mixer: ${mixerName}`)
        this.refreshTiles()
    }

    checkBoard = false
    flashOnLoad = false

    protected async loadOneTile(tile: Tile) {
        await this.mixer.loadOneTile(tile)
        if (this.flashOnLoad)
            tile.startFlash()
        if (this.checkBoard)
            if ((tile.i + tile.j) % 2 == 1)
                tile.flash = 0.5
        // if (tile.level == tile.tract.maxLevel) {
        //     glUtils.bind([tile.texture], () => {
        //         const gl = this.gl
        //         gl.generateMipmap(gl.TEXTURE_2D)
        //         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        //     })
        // }
        // if (tile.level == 0) {
        //     glUtils.bind([tile.texture], () => {
        //         const gl = this.gl
        //         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        //     })
        // }
    }

    protected tileConstructor() {
        return Tile
    }

    protected parallel() {
        return 2
    }

    protected sortTilesForDraw(tiles: Tile[]) {
        tiles.sort((a, b) =>
            a.tract != b.tract ?
                (a.priority < b.priority ? 1 : -1) :
                b.level - a.level
        )
    }

    static attributions = [
        {
            which: '',
            label: 'HSC SSP',
            link: 'http://hsc.mtk.nao.ac.jp/ssp/',
        }
    ]
}


class Tile extends TextureTileBase {
    priority: string

    afterInitialize() {
        // tract.id := wide-9317
        const depth: number = ({
            udeep: 0,
            deep: 1,
            wide: 2,
        } as any)[this.tract.id.split('-')[0]]
        this.priority = `${depth}/${this.tract.id}`
    }
}