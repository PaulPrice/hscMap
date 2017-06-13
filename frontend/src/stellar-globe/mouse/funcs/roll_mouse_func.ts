import { CameraMode } from '../../camera'
import { MouseFunc, MouseState } from '../mouse_func'


export class RollTileMouseFunc extends MouseFunc {
    mousemove({ x, y, dx, dy }: MouseState) {
        const params = this.globe.cameraParams
        if (params.mode == CameraMode.TILT) {
            params.roll -= Math.PI * dx / this.globe.element.clientWidth
            params.tilt -= Math.PI * dy / this.globe.element.clientHeight
        }
        else {
            let el = this.globe.element
            x -= el.clientWidth / 2
            y -= el.clientHeight / 2
            if (x != 0 && y != 0) {
                params.roll += (y * dx - x * dy) / (x * x + y * y)
            }
        }
        this.globe.checkCameraParams()
        //                   (x+ddx, y+ddy)
        //                   /
        //       O--------(x, y)
    }
}