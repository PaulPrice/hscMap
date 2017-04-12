import { Program, image, TextureTileBase as Tile } from 'stellar-globe'
import BaseMixer from '../base_mixer'
import { filters } from '../../../../filters'


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
            u_min: this.min,
            u_max: this.max,
            u_a: Math.exp(this.logA),
        })
    }

    makeProgram() {
        const vertSource = require('raw-loader!./vert.glsl')
        const fragSource = require('raw-loader!./frag.glsl')
        return this.track(Program.make(this.gl, vertSource, fragSource))
    }
}