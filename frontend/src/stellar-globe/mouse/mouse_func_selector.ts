import { Globe } from '../globe'
import { MouseFunc } from './mouse_func'
import { PanMouseFunc } from './funcs/pan_mouse_func'
import { ZoomMouseFunc } from './funcs/zoom_mouse_func'
import { RollTileMouseFunc } from './funcs/roll_mouse_func'


export class MouseFuncSelector {
    panMouseFunc = new PanMouseFunc(this.globe)
    zoomMouseFunc = new ZoomMouseFunc(this.globe)
    rollMouseFunc = new RollTileMouseFunc(this.globe)
    doNothingFunc = new DoNothingFunc(this.globe)

    constructor(private globe: Globe) {
    }

    select(ev: MouseEvent): MouseFunc {
        switch (emulatedButton(ev)) {
            case Button.LEFT:
                return this.panMouseFunc
            case Button.MIDDLE:
                return this.zoomMouseFunc
            case Button.ALT:
                return this.rollMouseFunc
            default:
                return this.doNothingFunc
        }
    }
}


enum Button {
    LEFT,
    MIDDLE,
    RIGHT,
    ALT,
}


function emulatedButton(ev: MouseEvent) {
    if (ev.button == 2 || ev.button == 0 && ev.ctrlKey)
        return Button.RIGHT
    if (ev.button == 1 || ev.button == 0 && ev.shiftKey)
        return Button.MIDDLE
    if (ev.button == 0 && ev.altKey)
        return Button.ALT
    return Button.LEFT
}


class DoNothingFunc extends MouseFunc {
    protected inertial() { return false }
}