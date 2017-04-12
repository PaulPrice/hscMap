import { TextureTileLayer, Globe, Pane, Tract, image, TextureTileBase } from 'stellar-globe'
import { vec4, mat4 } from 'gl-matrix'


export class M31Layer extends TextureTileLayer {
    constructor(globe: Globe) {
        super(globe)
        let header = {
            "CTYPE1": "RA---TAN", "CTYPE2": "DEC--TAN",
            "NAXIS": 2,
            "NAXIS1": 35840, "NAXIS2": 35588,
            "CD1_1": -4.66666666666667e-05, "CD1_2": 0.0,
            "CD2_1": 0.0, "CD2_2": 4.66666666666667e-05,
            "CUNIT1": "deg", "CUNIT2": "deg",
            "CRVAL1": 10.6900706417301, "CRVAL2": 41.2976905372908,
            "CRPIX1": 17828.0, "CRPIX2": 18275.0,
        }
        let tract = new Tract('m31', header)
        this.addTract(tract)
    }

    protected async loadOneTile(tile: TextureTileBase) {
        let url = `/images/m31/${tile.level}/${tile.j}/${tile.i}.png`
        let img = await image.load(url)
        tile.texture.setImage(img)
    }
}