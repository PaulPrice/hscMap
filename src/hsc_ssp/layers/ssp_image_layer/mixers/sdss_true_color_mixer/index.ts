import { Program, image, TextureTileBase as Tile } from 'stellar-globe'
import BaseMixer from '../base_mixer'
import { filters } from '../../../../filters'


export const defaultParams = {
    filters: filters.slice(0, 3).reverse().map(f => f.name),
    logA: 10,
    b: 0.05,
}


export class SdssTrueColorMixer extends BaseMixer {
    filters = defaultParams.filters
    logA = defaultParams.logA
    b = defaultParams.b

    async loadOneTile(tile: Tile) {
        const images = await Promise.all(this.filters.map(filter => {
            const url = `/images/ssp/${tile.tract.id}/${filter}/${tile.level}/${tile.j}/${tile.i}.png`
            return image.load(url, { fallbackBlack: true })
        }))
        this.applyFilter(tile, images)
    }

    bindParams() {
        const p = this.program
        p.uniform1f({
            u_a: Math.exp(this.logA),
            u_b: this.b,
        })
    }

    makeProgram() {
        const vertSource = require('raw-loader!./vert.glsl')
        const fragSource = require('raw-loader!./frag.glsl')
        return this.track(Program.make(this.gl, vertSource, fragSource))
    }
}