import { TextureTileLayer, Globe, Tract, image, TextureTileBase } from 'stellar-globe'


export class M31Layer extends TextureTileLayer {
    private tract = new Tract('m31', {
        "CTYPE1": "RA---TAN", "CTYPE2": "DEC--TAN",
        "NAXIS": 2,
        "NAXIS1": 35840, "NAXIS2": 35588,
        "CD1_1": -4.66666666666667e-05, "CD1_2": 0.0,
        "CD2_1": 0.0, "CD2_2": 4.66666666666667e-05,
        "CUNIT1": "deg", "CUNIT2": "deg",
        "CRVAL1": 10.6900706417301, "CRVAL2": 41.2976905372908,
        "CRPIX1": 17828.0, "CRPIX2": 18275.0,
    })

    protected walkTracts(cb: (tract: Tract) => void) {
        cb(this.tract)
    }

    protected async loadOneTile(tile: TextureTileBase) {
        let url = `/data/m31/${tile.level}/${tile.j}/${tile.i}.png`
        let img = await image.load(url)
        tile.texture.setImage(img)
    }
}