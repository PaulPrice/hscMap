import { Globe } from './globe'
import * as math from './math'
import { vec3 } from "gl-matrix"
import { CameraParams, CameraMode } from './camera'
import { Mode as GridMode, Tic as GridTic } from './layers/dynamic_grid_layer'


export type Handler<T> = (event: T) => void

export class Event {
}

export class MoveEvent extends Event {
    constructor(globe: Globe, public cameraParams = globe.cameraParams) { super() }
}

export class MoveStartEvent extends Event {
    constructor(globe: Globe, public cameraParams = globe.cameraParams) { super() }
}

export class MoveEndEvent extends Event {
    constructor(globe: Globe, public cameraParams = globe.cameraParams) { super() }
}

class MyMouseEvent extends Event {
    public xyz: math.Vector3
    constructor(globe: Globe, ev: MouseEvent) {
        super()
        const { x, y } = globe.elementCoord(ev)
        this.xyz = globe.screen2xyz(x, y) as any
    }
}

export class ClickEvent extends MyMouseEvent { }
export class MouseMoveEvent extends MyMouseEvent { }

export class CameraModeChangeEvent extends Event {
    constructor(globe: Globe, public CameraMode: CameraMode = globe.cameraParams.mode) { super() }
}

export class ResizeEvent extends Event { }

export class TicChangeEvent extends Event {
    constructor(public tic: GridTic | null) { super() }
}

export type Class<T extends Event> = {
    new (...args: any[]): T
}