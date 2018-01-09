import { Globe } from '../../globe'
import { WheelFunc, Vector2 } from '../wheel_func'
import * as math from '../../math'


export class ZoomWheelFunc extends WheelFunc {
    constructor(globe: Globe) {
        super(globe)
    }

    k = 5.e-3

    wheel(wheel: Vector2, mouse: Vector2) {
        let cParams = this.globe.cameraParams
        let dScale = Math.exp(this.k * wheel.y)
        let [x1, y1, z1] = math.radec2xyz(cParams.a, cParams.d)
        let [x2, y2, z2] = this.globe.screen2xyz(mouse.x, mouse.y) as any
        let dx = (1 - dScale) * (x2 - x1)
        let dy = (1 - dScale) * (y2 - y1)
        let dz = (1 - dScale) * (z2 - z1)
        let xy = Math.sqrt(1 - z1 * z1)
        if (xy < cParams.fovy) {
            dx *= xy / cParams.fovy
            dy *= xy / cParams.fovy
        }
        let scale = 1
        x1 += scale * dx
        y1 += scale * dy
        z1 += scale * dz;
        [cParams.a, cParams.d] = math.xyz2radec([x1, y1, z1])
        cParams.fovy *= dScale
        this.globe.checkCameraParams()
    }

}