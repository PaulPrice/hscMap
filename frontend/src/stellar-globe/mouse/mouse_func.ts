import { Globe } from '../globe'
import { MotionAnimation } from '../animation'

interface Vector2 {
    x: number
    y: number
}

export interface MouseState extends Vector2 {
    dx: number
    dy: number
}

export abstract class MouseFunc {
    eventFilter: EventFilter
    protected inertial() { return true }

    constructor(public globe: Globe) {
        this.eventFilter = new (this.inertial() ? InertialEventFilter : DirectEventFilter)(this)
    }

    mousedown(position: Vector2) { }
    mousemove(state: MouseState) { }
    mouseup(position: Vector2) { }

    start(ev: MouseEvent) {
        this.eventFilter.mousedown(ev)
        document.addEventListener('mousemove', this.eventFilter.mousemove)
        document.addEventListener('mouseup', this.eventFilter.mouseup)
    }

    cleanupEvents() {
        document.removeEventListener('mousemove', this.eventFilter.mousemove)
        document.removeEventListener('mouseup', this.eventFilter.mouseup)
    }
}


abstract class EventFilter {
    constructor(protected mouseFunc: MouseFunc) { }
    mousedown = (ev: MouseEvent) => { }
    mousemove = (ev: MouseEvent) => { }
    mouseup = (ev: MouseEvent) => { }
}


class DirectEventFilter extends EventFilter {
    last: Vector2

    mousedown = (ev: MouseEvent) => {
        let down = this.mouseFunc.globe.elementCoord(ev)
        this.last = this.mouseFunc.globe.elementCoord(ev)
        this.mouseFunc.mousedown(down)
        this.mouseFunc.globe.requestRedraw()
    }

    mousemove = (ev: MouseEvent) => {
        ev.preventDefault()
        let coord = this.mouseFunc.globe.elementCoord(ev)
        this.mouseFunc.mousemove({
            x: coord.x,
            y: coord.y,
            dx: coord.x - this.last.x,
            dy: coord.y - this.last.y,
        })
        this.last = coord
        this.mouseFunc.globe.requestRedraw()
    }

    mouseup = (ev: MouseEvent) => {
        ev.preventDefault()
        this.mouseFunc.mouseup(this.mouseFunc.globe.elementCoord(ev))
        this.mouseFunc.cleanupEvents()
        this.mouseFunc.globe.requestRedraw()
    }
}


class InertialEventFilter extends EventFilter {
    // the virtual mouse cursor acts as if it is connected with a spring to the real mouse
    r: Vector2 // position
    v: Vector2 // velocity
    last: Vector2
    anchor: Vector2
    released: boolean
    k = 3.0e-2
    d = 0.02
    slick = true

    animation: MotionAnimation | undefined

    mousedown = (ev: MouseEvent) => {
        this.mouseFunc.globe.stopMotionAnimations()
        this.released = false
        this.r = this.mouseFunc.globe.elementCoord(ev)
        this.last = this.mouseFunc.globe.elementCoord(ev)
        this.mouseFunc.mousedown(this.r)
    }

    mousemove = (ev: MouseEvent) => {
        ev.preventDefault()
        this.anchor = this.mouseFunc.globe.elementCoord(ev)
        if (this.animation != undefined)
            return
        this.v = { x: 0, y: 0 }
        this.animation = new MotionAnimation(this.mouseFunc.globe, {
            callback: ({ dt }) => {
                dt = Math.min(17, dt) // for avoiding disastrous jump
                let k = this.k   // spring constant
                let a: Vector2   // acceleration
                let deltaX = this.anchor.x - this.r.x
                let deltaY = this.anchor.y - this.r.y
                if (this.slick && this.released) {
                    let d = Math.pow(this.d, dt / 1000)
                    this.v.x *= d
                    this.v.y *= d
                    this.r.x += k * dt * this.v.x
                    this.r.y += k * dt * this.v.y
                }
                else {
                    a = { // acceleration of critical damping
                        x: deltaX - 2 * this.v.x,
                        y: deltaY - 2 * this.v.y,
                    }
                    this.v.x += k * dt * a.x
                    this.v.y += k * dt * a.y
                    let dx = k * dt * this.v.x
                    let dy = k * dt * this.v.y
                    if (Math.abs(dx) <= Math.abs(deltaX))
                        this.r.x += dx
                    else {
                        this.v.x = deltaX / dt
                        this.r.x = this.anchor.x
                    }
                    if (Math.abs(dy) <= Math.abs(deltaY))
                        this.r.y += dy
                    else {
                        this.v.y = deltaY / dt
                        this.r.y = this.anchor.y
                    }
                }
                this.mouseFunc.mousemove({
                    x: this.r.x,
                    y: this.r.y,
                    dx: this.r.x - this.last.x,
                    dy: this.r.y - this.last.y,
                })
                this.last.x = this.r.x
                this.last.y = this.r.y
                if (this.still()) {
                    this.animation!.quit()
                }
            }
        })
        this.animation.then(() => {
            this.animation = undefined
            this.mouseFunc.mouseup(this.r)
        })
    }

    mouseup = (ev: MouseEvent) => {
        ev.preventDefault()
        this.released = true
        this.mouseFunc.cleanupEvents()
    }

    private still() {
        let v = this.v
        return v.x * v.x + v.y * v.y < 0.01
    }
}