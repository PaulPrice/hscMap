import { Globe, Tract, Animation, image, easing, TextureTileBase, TextureTileLayer, glUtils } from 'stellar-globe'
import { ImageFilter } from 'stellar-globe/webgl/image_filter'
import Mixer from './mixers/base_mixer'
import { SimpleRgbMixer } from './mixers/simple_rgb_mixer'
import { SdssTrueColorMixer } from './mixers/sdss_true_color_mixer'
import tractsLoader from './../ssp_tracts'


export class SspImageLayer extends TextureTileLayer {
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

    private async startLoading() {
        const tracts = await tractsLoader()
        for (const id in tracts) {
            const tract = new Tract(id, tracts[id].wcsInfo)
            this.addTract(tract)
        }
        this.globe.requestRedraw()
    }

    changeMixer(mixerName: string) {
        this.mixer = (this.mixers as any)[mixerName]
        if (!this.mixer) throw new Error(`No such mixer: ${mixerName}`)
        this.refreshTiles()
    }

    protected async loadOneTile(tile: Tile) {
        // if (tile.level == 0) {
        //     glUtils.bind([tile.texture], () => {
        //         const gl = this.gl
        //         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        //     })
        // }
        await this.mixer.loadOneTile(tile)
        // tile.startFlash()
    }

    protected tileConstructor() {
        return Tile
    }

    protected parallel() {
        return 3
    }

    protected sortTilesForDraw(tiles: Tile[]) {
        tiles.sort((a, b) =>
            a.tract != b.tract ?
                (a.priority < b.priority ? 1 : -1) :
                b.level - a.level
        )
    }

    static attributions = [{
        which: 'Images in Green Frames',
        label: 'HSC SSP',
        link: 'http://hsc.mtk.nao.ac.jp/ssp/',
    }]
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