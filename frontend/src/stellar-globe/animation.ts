import { Globe } from './globe'
import * as time from './time'
import { Vector3 } from './math'


interface Callback {
    (args: { t: number, dt: number, ratio: number }): void
}

interface AnimationArgs {
    duration?: number
    callback: Callback
}

export class Animation {
    private callback: Callback
    private duration: number
    private start: number
    private lastT: number
    private promise: Promise<{}>
    private resolve: () => void

    constructor(private globe: Globe, args: AnimationArgs) {
        this.callback = args.callback
        this.duration = args.duration || Infinity
        this.start = time.now()
        this.lastT = 0
        this.globe._addAnimation(this)
        this.promise = new Promise(resolve => this.resolve = resolve)
    }

    update() {
        let now = time.now()
        let t = now - this.start
        let done = false
        if (t > this.duration) {
            t = this.duration
            done = true
        }
        let dt = t - this.lastT
        this.callback({
            t,
            dt,
            ratio: t / this.duration,
        })
        if (done)
            this.quit()
        this.lastT = t
    }

    quit() {
        this.globe._removeAnimation(this)
        this.resolve()
    }

    abort() {
        this.globe._removeAnimation(this)
        // this.dfd.reject()
    }

    then(cb: () => void) {
        return this.promise.then(cb)
    }
}

export class MotionAnimation extends Animation {
}