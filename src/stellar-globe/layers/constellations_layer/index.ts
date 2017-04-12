import { PathLayer } from '../../layers/path_layer'
import { Globe } from '../../globe'
import { Animation } from '../../animation'
import * as math from '../../math'
import * as ajax from '../../ajax'


interface Star {
    ra: number,
    dec: number,
    b: string,
    hip: number,
    name: string,
}

type Line = [number, number]

interface Constellation {
    ecliptical: boolean,
    stars: Star[],
    lines: Line[],
}


export class ConstellationsLayer extends PathLayer {
    constructor(globe: Globe, load = true) {
        super(globe)
        if (load)
            this.load()
    }

    async load() {
        const constellations = (await ajax.getJSON(require('file-loader!./constellations.json')).promise) as { [name: string]: Constellation }
        this.stroke(pen => {
            pen.width = 0.005
            for (let name of Object.keys(constellations)) {
                let c = constellations[name]
                pen.color = c.ecliptical ? [1, 0.75, 0, 0.5] : [1, 1, 1, 0.5]
                for (let [s, e] of c.lines) {
                    pen.lineTo(star2xyz(c.stars[s]))
                    pen.lineTo(star2xyz(c.stars[e]))
                    pen.up()
                }
            }
        })
    }
}


function star2xyz(star: Star) {
    return math.radec2xyz(
        math.deg2rad(star.ra),
        math.deg2rad(star.dec)
    )
}