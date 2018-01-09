import { math } from 'stellar-globe'

const candidate_sample = {
    "id": "37484559004095446",
    "training": true,
    "interacting": true as boolean | null,
    "disk_arms": false,
    "rings": false,
    "tidal_stream": true,
    "shell_fan": false,
    "perturbed_halo": false,
    "multiple_nuclei": false,
    "companion_galaxy": true,
    "how_bright": "faint" as string | null,
    "comments_en": "Infalling satellite on the bottom-right.",
    "comments_ja": "\u53f3\u4e0b\u306b\u843d\u3061\u8fbc\u3093\u3067\u304d\u3066\u3044\u308b\u885b\u661f\u9280\u6cb3\u306b\u3088\u308b\u30b9\u30c8\u30ea\u30fc\u30e0\u304c\u898b\u3048\u308b",
    "ra": 34.901673427979155,
    "dec": -5.522308495339009,
    "specz": 0.0842100009,
    "zcmodel_mag": 15.6949816
}


export type CandSource = typeof candidate_sample

export class Candidate implements CandSource {
    done = false
    readonly id: string
    readonly ra: number
    readonly dec: number
    readonly specz: number
    readonly zcmodel_mag: number
    readonly training = false
    readonly interacting: null | boolean = null
    readonly disk_arms = false
    readonly rings = false
    readonly shell_fan = false
    readonly tidal_stream = false
    readonly perturbed_halo = false
    readonly companion_galaxy = false
    readonly multiple_nuclei = false
    readonly how_bright: string | null = null
    readonly comments_en: string = ''
    readonly comments_ja: string = ''

    constructor(s: CandSource) {
        for (const k of Object.keys(s)) {
            (<any>this)[k] = (<any>s)[k]
        }
    }

    xyz() {
        return math.radec2xyz(
            math.deg2rad(this.ra),
            math.deg2rad(this.dec),
        )
    }
}


const candSources = (require('./candidates.json') as CandSource[])
export const candidates = candSources.map(s => new Candidate(s))