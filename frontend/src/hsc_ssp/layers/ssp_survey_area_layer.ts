import { Globe, Tract, LineSegmentLayer, Vector3 } from 'stellar-globe'
import { vec4 } from 'gl-matrix'
import tractsLoader from './ssp_tracts'


export class SspSurveyAreaLayer extends LineSegmentLayer {
    constructor(globe: Globe) {
        super(globe)
        this.startLoading()
    }

    private async startLoading() {
        const tracts = await tractsLoader()
        this.stroke(pen => {
            pen.width = 0.002
            pen.color = [0, 0.75, 0.25, 1]
            for (let id in tracts) {
                let tract = new Tract(id, tracts[id].wcsInfo)
                for (let [t, u] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
                    let xyzw = vec4.transformMat4(vec4.create(), [t, u, 0, 1], tract.mMatrix)
                    let xyz: Vector3 = [xyzw[0], xyzw[1], xyzw[2]]
                    pen.lineTo(xyz)
                }
                pen.closePath()
            }
        })
        this.globe.requestRedraw()
    }
}