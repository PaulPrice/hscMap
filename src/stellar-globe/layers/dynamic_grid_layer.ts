import { Globe } from '../globe'
import { Animation } from '../animation'
import * as math from '../math'
import { Vector4 } from '../math'
import * as event from '../event'
import * as easing from '../easing'
import { mat4 } from 'gl-matrix'
import { PathLayer } from '../layers/path_layer'
import { LineSegmentLayer } from '../layers/line_segment_layer'
import { EsoMilkyWayLayer } from '../layers/eso_milky_way_layer';
import * as _ from 'underscore'


export enum Mode {
    DEGREE,
    SEXAGESIMAL,
}

export interface Tic {
    name: string
    size: number
    mode: Mode
}

export class DynamicGridLayer extends LineSegmentLayer {
    darkenNarrowLine = false
    color: Vector4 = [0.25, 0.5, 1, 0.25]
    live = true

    constructor(globe: Globe) {
        super(globe)
        this.refreshGrid()
        this.onRelease(this.globe.on(event.ResizeEvent, () => this.refreshGrid()))
        this.onRelease(this.globe.on(event.MoveEndEvent, () => {
            if (this.live) return
            this.fade = 0
            this.fadeAnimation && this.fadeAnimation.quit()
            this.fadeAnimation = new Animation(this.globe, {
                duration: 100,
                callback: ({ ratio }) => this.fade = ratio
            })
        }))
    }

    fadeAnimation: Animation | undefined
    fade = 1
    protected alpha() {
        return this.fade * (1 - PathLayer.alpha(this.globe.camera.effectiveFovy))
    }

    tic: Tic | null

    draw() {
        const newTic = this.computeTic(this.globe.camera.effectiveFovy, this.globe.element.clientHeight)
        if (!_.isEqual(this.tic, newTic)) {
            this.tic = newTic
            this.globe.trigger(new event.TicChangeEvent(newTic))
        }
        if (this.tic && (this.live || !this.globe.inMotion()))
            super.draw()
    }

    mode = Mode.SEXAGESIMAL
    minPixel = 100

    private computeTic(
        fovy: number, // raidan
        height: number, // pixel
    ) {
        const minPixel = this.minPixel
        const minTic = minPixel / height * fovy
        for (const [size, name] of tics[this.mode]) {
            if (size >= minTic)
                return { size, name, mode: this.mode }
        }
        return null
    }

    protected pvMatrix() {
        const p = this.globe.cameraParams
        const m = math.mat4create() // model projection
        const size = this.tic!.size
        mat4.rotateZ(m, m, p.a)
        mat4.rotateY(m, m, -p.d)
        mat4.rotateX(m, m, p.roll)
        mat4.translate(m, m, [1, 0, 0])
        mat4.scale(m, m, [size, size, size])
        return mat4.mul(m, this.globe.camera.pv, m)
    }

    refreshGrid() {
        const { clientHeight, clientWidth } = this.globe.element
        const ni = Math.floor(clientHeight / 2 / this.minPixel) + 1
        const nj = Math.floor(clientWidth / 2 / this.minPixel) + 1
        this.stroke(pen => {
            pen.color = this.color
            pen.width = 0.0
            for (let i = -ni; i <= ni; ++i) {
                for (let j = -nj; j <= nj; ++j) {
                    pen.lineTo([0, j, i])
                }
                pen.up()
            }
            for (let j = -nj; j <= nj; ++j) {
                for (let i = -ni; i <= ni; ++i) {
                    pen.lineTo([0, j, i])
                }
                pen.up()
            }
        })
    }
}


const tics: { [mode: number]: [number, string][] } = {
    [Mode.DEGREE]: `
        2deg 1deg
        0.5deg 0.2deg 0.1deg
        0.05deg 0.02deg 0.01deg
        0.005deg 0.002deg 0.001deg
        0.0005deg 0.0002deg 0.0001deg
        `.split(/\s+/).filter(t => t.length > 0).reverse().map(parseAngleText),
    [Mode.SEXAGESIMAL]: `
        2deg 1deg
        30arcmin 10arcmin 5arcmin 2arcmin 1arcmin
        30arcsec 10arcsec 5arcsec 2arcsec 1arcsec
        0.1arcsec 0.05arcsec 0.02arcsec 0.001arcsec
        `.split(/\s+/).filter(t => t.length > 0).reverse().map(parseAngleText)
}


function parseAngleText(text: string) {
    const m = text.match(/(.*?)(deg|arcmin|arcsec)$/)
    return [
        (math as any)[`${m![2]}2rad`](Number(m![1])),
        ({
            deg: `${m![1]}&deg;`,
            arcmin: `${m![1]}&prime;`,
            arcsec: `${m![1]}&Prime;`,
        } as any)[m![2]]
    ] as [number, string]
}


if (process.env.NODE_ENV != 'production') (function spec() {
    console.assert(_.isEqual(parseAngleText('1.5deg'), [math.deg2rad(1.5), '1.5&deg;']))
    console.assert(_.isEqual(parseAngleText('4.5arcmin'), [math.arcmin2rad(4.5), '4.5&prime;']))
    console.assert(_.isEqual(parseAngleText('27arcsec'), [math.arcsec2rad(27), '27&Prime;']))
})()