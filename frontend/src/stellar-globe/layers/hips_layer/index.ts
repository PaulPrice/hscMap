import { Layer } from "../../layer"
import { Globe } from "../../globe"
import { CatalogLayer } from "../catalog_layer"
import * as math from "../../math"


export class HipsLayer extends CatalogLayer {
    constructor(globe: Globe) {
        super(globe)
    }

    protected loadCatalog() {
        // this method is just a sample
        let attrs: number[] = []
        let flux = Math.pow(10, 0)

        const N_phi = 4
        const N_theta = 3
        const N_side = 8
        const N_pix = 12 * N_side ** 2

        for (let p = 0; p < N_pix; ++p) {
            const p_h = (p + 1) / 2
            const i = Math.floor(Math.sqrt(p_h - Math.sqrt(Math.floor(p_h)))) + 1
            const j = p + 1 - 2 * i * (i - 1)
            const z = 1 - i * i / (3 * N_side ** 2)
            const s = 1
            const phi = Math.PI / (2 * i) * (j - s / 2)
            const coz = Math.sqrt(1 - z*z)
            attrs.push(
                coz * Math.cos(phi),
                coz * Math.sin(phi),
                z,
                flux,
            )
        }
        this.attribList.setData({ array: new Float32Array(attrs) })
    }
}