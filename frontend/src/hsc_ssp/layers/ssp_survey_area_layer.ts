import { Globe, Tract, LineSegmentLayer, PathLayer, Vector3 } from 'stellar-globe'
import { vec4 } from 'gl-matrix'
import tractsLoader from './ssp_tracts'



export class SspSurveyAreaLayer extends PathLayer {
    constructor(globe: Globe) {
        super(globe)
        this.startLoading()
    }

    stencilTest = true

    private async startLoading() {
        const surveyRegion = await (await fetch('data/ssp/survey_area.json', { credentials: 'include' })).json() as Vector3[][]

        this.stroke(pen => {
            pen.width = 0.005
            pen.color = [0, 0.75, 0.25, 1]
            for (const piece of surveyRegion) {
                for (const v of piece)
                    pen.lineTo(v)
                pen.closePath()
            }
        })
        this.globe.requestRedraw()
    }
}