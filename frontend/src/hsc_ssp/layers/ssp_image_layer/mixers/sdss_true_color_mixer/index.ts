import { Program, image, TextureTileBase as Tile } from 'stellar-globe'
import BaseMixer from '../base_mixer'
import { filters } from '../../../../filters'
import vertSource from 'raw-loader!./vert.glsl'
import fragSource from 'raw-loader!./frag.glsl'



export const defaultParams = {
    filters: filters.slice(0, 3).reverse().map(f => f.name),
    logA: 10,
    b: 0.05,
}


export class SdssTrueColorMixer extends BaseMixer {
    filters = defaultParams.filters
    logA = defaultParams.logA
    b = defaultParams.b

    tileImageUrls(tile: Tile) {
        const [depth, tractNum] = tile.tract.id.split('-')
        return this.filters.map(f => {
            return `/data/ssp_tiles/${depth}/${f}/${tractNum}/${tile.level}/${tile.j}/${tile.i}.png`
        })
    }

    bindParams() {
        const p = this.program
        p.uniform1f({
            u_a: Math.exp(this.logA),
            u_b: this.b,
        })
    }

    makeProgram() {
        return this.track(Program.make(this.gl, vertSource, fragSource))
    }
}