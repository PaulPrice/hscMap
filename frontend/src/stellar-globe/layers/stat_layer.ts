import * as time from '../time'
import * as math from '../math'
import * as status from '../devel/status'
import { Layer } from '../layer'
import { Globe } from '../globe'
import { sprintf } from 'sprintf-js'

const nFrames = 30


export class StatLayer extends Layer {
    last = time.now()
    count = 0
    fps = 0

    constructor(globe: Globe) {
        super(globe)
        this.setupEvent()
    }

    private position = [0, 0] as [number, number]

    draw() {
        this.count++
        if (this.count % nFrames == 0) {
            let now = time.now()
            let dt = now - this.last
            this.last = now
            this.fps = 1000 * nFrames / dt
        }
        this.update()
    }

    private setupEvent() {
        this.globe.element.addEventListener('mousemove', (ev) => {
            this.position = this.globe.screen2radec(ev.clientX, ev.clientY)
            this.update()
        })
    }

    // TODO: throttle
    private update() {
        status.update({
            'frame rate': sprintf('%6.2f fps', this.fps),
            fovy: sprintf('%8.4f&deg;', math.rad2deg(this.globe.camera.effectiveFovy)),
            "&alpha;, &delta;": sprintf('%8.4f&deg;, %+8.4f&deg;', ...this.position.map(math.rad2deg)),
        })
    }
}