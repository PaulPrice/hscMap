import { Globe } from '../../globe'
import { MouseFunc, MouseState } from '../mouse_func'


export class ZoomMouseFunc extends MouseFunc {
    constructor(globe: Globe){
        super(globe)
    }

    mousemove({x, y, dx, dy}: MouseState) {
        this.globe.cameraParams.fovy *= Math.exp(- 2 * dy / this.globe.gl.drawingBufferHeight)
        this.globe.checkCameraParams()
    }
}