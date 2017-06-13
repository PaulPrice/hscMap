import { Program, image, ImageLike, TextureTileBase as Tile } from 'stellar-globe'
import BaseMixer from '../base_mixer'
import { filters } from '../../../../filters'
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'



export const defaultParams = {
    filters: filters.slice(0, 3).reverse().map(f => f.name),
    min: -0.05,
    max: 2 / 3,
    logA: 10,
}


export class SimpleRgbMixer extends BaseMixer {
    filters = defaultParams.filters
    min = defaultParams.min
    max = defaultParams.max
    logA = defaultParams.logA

    tileImageUrls(tile: Tile) {
        return this.filters.map(f => {
            return `/data/ssp_tiles/${tile.tract.id}/${f}/${tile.level}/${tile.j}/${tile.i}.png`
        })
    }

    bindParams() {
        const p = this.program
        p.uniform1f({
            u_min: this.min,
            u_max: this.max,
            u_a: Math.exp(this.logA),
        })
    }

    makeProgram() {
        return this.track(Program.make(this.gl, vertSource, fragSource))
    }
}