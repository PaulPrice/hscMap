import { Globe } from '../globe'
import { Vector4 } from '../math'
import { PathLayer } from '../layers/path_layer'


export class GridLayer extends PathLayer {
    constructor(globe: Globe) {
        super(globe)
        this.stroke(pen => {
            pen.width = 0.008
            const defaultColor: Vector4 = [0.25, 0.5, 1, 0.5]
            let n_d: number
            let n_a: number
            // decl lines
            n_d = 18
            n_a = 360
            for (let i_d = 1; i_d < n_d; ++i_d) {
                let theta = Math.PI * (i_d - 9) / n_d
                pen.color = i_d == 9 ? [1, 0, 0, 0.75] : defaultColor
                for (let i_a = 0; i_a < n_a; ++i_a) {
                    let phi = 2 * Math.PI * i_a / n_a
                    pen.lineTo([
                        Math.cos(theta) * Math.cos(phi),
                        Math.cos(theta) * Math.sin(phi),
                        Math.sin(theta)
                    ])
                }
                pen.closePath()
            }
            // ra lines
            n_d = 180
            n_a = 24
            for (let i_a = 0; i_a < n_a; ++i_a) {
                let phi = 2 * Math.PI * i_a / n_a
                pen.color = ({
                    0: [1, 0, 0, 0.75],
                    6: [0.5, 1, 0, 0.75],
                    12: [0, 1, 1, 0.75],
                    18: [0.5, 0, 1, 0.75],
                } as { [i: number]: Vector4 })[i_a] || defaultColor
                for (let i_d = 0; i_d <= n_d; ++i_d) {
                    let theta = Math.PI * (i_d - 90) / n_d
                    pen.lineTo([
                        Math.cos(theta) * Math.cos(phi),
                        Math.cos(theta) * Math.sin(phi),
                        Math.sin(theta)
                    ])
                }
                pen.up()
            }
        })
    }
}