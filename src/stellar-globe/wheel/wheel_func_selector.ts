import { ZoomWheelFunc } from './funcs/zoom_wheel_func'
import { Globe } from '../globe'


export class WheelFuncSelector {
    constructor(private globe: Globe) { }

    zoomWheel = new ZoomWheelFunc(this.globe)

    select(ev: WheelEvent) {
        return this.zoomWheel
    }
}