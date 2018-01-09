import { Globe, SpriteLayer, text2imageData, PathLayer, math, Vector3 } from 'stellar-globe'
import tractsLoader from './ssp_tracts'


export class SspFieldNameLayer extends SpriteLayer {
    constructor(globe: Globe) {
        super(globe)
        const textures: { [name: string]: { imageData: ImageData } } = {}
        const sprites: { name: string, position: math.Vector3 }[] = []
        for (const name in fields) {
            const position = fields[name]
            textures[name] = { imageData: text2imageData(name, '36px sans-serif') }
            sprites.push({
                position,
                name: name,
            })
        }
        this.setData(textures, sprites)
        this.globe.requestRedraw()
    }

    protected alpha() {
        return 0.5 * PathLayer.alpha(this.globe.camera.effectiveFovy)
    }
}


const fields: { [name: string]: Vector3 } = {
    "SXDS": [0.8235226223144847, 0.5599780192825095, -0.0907474983496084],
    "AEGIS": [-0.494942512287926, -0.3469946584393124, 0.7966345564590461],
    "HECTOMAP": [-0.2929384798414137, -0.6779091356520174, 0.6742597799273929],
    "GAMA15H": [-0.7903260692668805, -0.6125489261184914, -0.012981423197972988],
    "GAMA09H": [-0.7047582686956577, 0.7093287427962116, 0.012981423197973217],
    "COSMOS": [-0.8675226003731931, 0.4958715188284965, 0.03893551921386405],
    "WIDE01H": [0.94459370376398366, 0.32801833373878997, 0.012112288828602569],
    "WIDE12H": [-0.9998321746731913, 0.012926915333220804, -0.012981423197972988],
    "ELAIS-N1": [-0.2513068068214377, -0.5030149505987969, 0.8269346094579079],
    "VVDS": [0.9439561820094772, -0.32981541670735437, 0.012981423197973217],
    "DEEP2-3": [0.9915709439195408, -0.1289129389404573, -0.012981423197972988]
}