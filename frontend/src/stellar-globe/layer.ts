import { Globe } from './globe'
import { ResourceHolder } from './resource_holder'

enum Pane {
    BASE,
    OVERLAY,
    SPRITE,
}

export class Layer extends ResourceHolder {
    readonly globe: Globe
    readonly gl: WebGLRenderingContext
    enabled = true

    constructor(globe: Globe) {
        super()
        this.globe = globe
        this.gl = globe.gl
        this.globe._addLayer(this)
    }

    draw() { }

    release() {
        super.release()
        this.globe._removeLayer(this)
    }

    static Pane = Pane
    pane() { return Pane.OVERLAY }

    static attributions: Attribution[] = []
}

export interface Attribution {
    which: string,
    label: string
    link: string
}