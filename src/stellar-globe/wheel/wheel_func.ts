import { Globe } from '../globe'
import { MotionAnimation } from '../animation'
import * as time from '../time'
import * as math from '../math'


export interface Vector2 {
    x: number,
    y: number,
}


export abstract class WheelFunc {
    bound = false
    eventFilter: EventFilter = new InertialEventFilter(this)
    constructor(public globe: Globe) { }

    start(ev: WheelEvent) {
        this.eventFilter.wheel(ev)
    }

    abstract wheel(wheel: Vector2, mouse: Vector2): void
}


abstract class EventFilter {
    constructor(protected wheelFunc: WheelFunc) { }
    abstract wheel(ev: WheelEvent): void
}


class DirectEventFilter extends EventFilter {
    wheel(ev: WheelEvent) {
        const wheel = {
            x: ev.deltaX,
            y: ev.deltaY,
        }
        const mouse = this.wheelFunc.globe.elementCoord(ev)
        this.wheelFunc.wheel(wheel, mouse)
    }
}


const MIN_INTERVAL = 20
const maxV = 1.5

class InertialEventFilter extends EventFilter {
    animation: MotionAnimation | undefined
    mouse = { x: -1, y: -1 }
    vy = 0
    lastTime = 0
    lastDeltaY = 0
    k = 0.9

    wheel(ev: WheelEvent) {
        let now = time.now()
        if (now - this.lastTime < MIN_INTERVAL)
            return
        if (this.lastDeltaY < Math.abs(ev.deltaY)) {
            this.vy += ev.deltaY > 0 ? 1 : -1
            this.vy = math.clamp(this.vy, -maxV, maxV)
        }
        this.mouse = this.wheelFunc.globe.elementCoord(ev)
        this.lastDeltaY = Math.abs(ev.deltaY)
        this.lastTime = now
        if (!this.animation) {
            this.animation = new MotionAnimation(this.wheelFunc.globe, {
                callback: ({ dt }) => {
                    if (time.now() - this.lastTime > MIN_INTERVAL)
                        this.vy *= this.k ** (dt / 10.)
                    this.wheelFunc.wheel({
                        x: 0,
                        y: dt * this.vy,
                    }, this.mouse)
                    if (this.still() && this.animation) {
                        this.animation.quit()
                    }
                }
            })
            this.animation.promise.then(() => {
                this.animation = undefined
            })
        }
    }

    private still() {
        return Math.abs(1000 * this.vy) <= 1
    }
}
