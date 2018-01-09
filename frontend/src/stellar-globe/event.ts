import { Globe } from './globe'
import * as math from './math'
import { CameraMode } from './camera'
import { Tic as GridTic } from './layers/dynamic_grid_layer'
import { Layer } from './layer'


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

class myMouseEvent extends Event {
    public xyz: math.Vector3
    constructor(globe: Globe, ev: MouseEvent) {
        super()
        const { x, y } = globe.elementCoord(ev)
        this.xyz = globe.screen2xyz(x, y) as any
    }
}

export class ClickEvent extends myMouseEvent { }
export class MouseMoveEvent extends myMouseEvent { }

export class CameraModeChangeEvent extends Event {
    constructor(globe: Globe, public CameraMode: CameraMode = globe.cameraParams.mode) { super() }
}

export class ResizeEvent extends Event { }

export class TicChangeEvent extends Event {
    constructor(public tic: GridTic | null) { super() }
}


export class LoadDoneEvent extends Event {
    constructor(public layer: Layer) { super() }
}

export type Class<T extends Event> = {
    new(...args: any[]): T
}