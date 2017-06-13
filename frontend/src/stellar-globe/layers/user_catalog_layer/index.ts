import { SpriteLayer } from "../sprite_layer"
import { Globe } from '../../globe'
import { Vector3, Vector4 } from "../../math"
import { markerImageData, MarkerStyle } from '../../marker'


export interface Row {
    coord: Vector3
}


export class UserCatalogLayer extends SpriteLayer {
    constructor(globe: Globe, rows?: Row[]) {
        super(globe)
        if (rows)
            this.rows = rows
        this.refresh()
    }

    private rows: Row[] = []
    private markerStyle = MarkerStyle.CIRCLE
    color: Vector4 = [0, 1, 0, 0.5]

    setMarkerStyle(markerStyle: MarkerStyle) {
        this.markerStyle = markerStyle
        this.refresh()
    }

    setRows(rows: Row[]) {
        this.rows = rows
        this.refresh()
    }

    private refresh() {
        const textures = {
            marker: { imageData: markerImageData(this.markerStyle) },
        }
        const sprites = this.rows.map(row => ({ name: 'marker', position: row.coord }))
        this.setData(textures, sprites)
        this.globe.requestRedraw()
    }
}