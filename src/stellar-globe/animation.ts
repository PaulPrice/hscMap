import { Globe } from './globe'
import { HasPromise } from './has_promise'
import * as time from './time'


interface Callback {
    (args: { t: number, dt: number, ratio: number }): void
}

interface AnimationArgs {
    duration?: number
    callback: Callback
}

export class Animation extends HasPromise {
    private callback: Callback
    private duration: number
    private start: number
    private last: number

    constructor(private globe: Globe, args: AnimationArgs) {
        super()
        this.callback = args.callback
        this.duration = args.duration || Infinity
        this.start = this.last = time.now()
        this.globe._addAnimation(this)
    }

    update() {
        let now = time.now()
        let t = now - this.start
        if (t > this.duration) {
            t = this.duration
            this.quit()
        }
        let dt = now - this.last
        this.callback({
            t,
            dt: now - this.last,
            ratio: t / this.duration,
        })
        this.last = now
    }

    quit() {
        this.globe._removeAnimation(this)
        this.dfd.resolve()
    }

    abort() {
        this.globe._removeAnimation(this)
        // this.dfd.reject()
    }
}

export class MotionAnimation extends Animation {
}