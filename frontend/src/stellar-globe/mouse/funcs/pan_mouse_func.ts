import { MouseFunc, MouseState } from '../mouse_func'
import * as math from '../../math'


export class PanMouseFunc extends MouseFunc {
    private m: number[]
    private fovy: number

    mousedown({ x, y }: MouseState) {
        let [a0, d0] = this.globe.screen2radec(x, y)
        let [a1, d1] = this.globe.screen2radec(x + 1, y)
        let [a2, d2] = this.globe.screen2radec(x, y + 1)
        if (Math.abs(a1 - a0) > Math.PI) {
            a1 += (a0 > a1 ? 1 : -1) * 2 * Math.PI
        }
        if (Math.abs(a2 - a0) > Math.PI) {
            a2 += (a0 > a2 ? 1 : -1) * 2 * Math.PI
        }
        this.m = [
            a1 - a0, a2 - a0,
            d1 - d0, d2 - d0,
        ]
        this.fovy = this.globe.cameraParams.fovy
        // this.globe.trigger(new event.MoveStartEvent(this.globe))
    }

    mousemove({ x, y, dx, dy }: MouseState) {
        let scale = this.globe.cameraParams.fovy / this.fovy
        this.globe.cameraParams.a -= scale * (this.m[0] * dx + this.m[1] * dy)
        this.globe.cameraParams.d -= scale * (this.m[2] * dx + this.m[3] * dy)
        this.globe.cameraParams.d = math.clamp(this.globe.cameraParams.d, -Math.PI / 2, Math.PI / 2)
        this.globe.checkCameraParams()
        // this.globe.trigger(new event.MoveEvent(this.globe))
    }

    mouseup({}: MouseState) {
        // this.globe.trigger(new event.MoveEndEvent(this.globe))
    }
}