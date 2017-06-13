import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { FrameBind } from "../../state/frame_bind"
import { Globe, GridTic, Layer, TextureTileLayer } from "stellar-globe"
import { CatalogObserver } from "./catalog_observer"


const components = {
    myCatalogObserver: CatalogObserver
}


// import rawMassmap from './co.json'
// const massmap = rawMassmap as MassmapData
// import rawMassmap2 from './small-contour.json'
// const massmap2 = rawMassmap2 as MassmapData


@Component({ components })
export class FrameComponent extends Vue {
    frameComponent: FrameComponent | null = null
    globe?: Globe

    @Prop()
    value: FrameBind

    @Prop({ default: false })
    emitMoveEventContinuously: boolean

    mounted() {
        this.frameComponent = this
        this.globe = new Globe(this.$refs.globe as HTMLElement)
        // TODO: remove following lines
        // new RingsTractLayer(this.globe)
        // new MassmapLayer(this.globe, massmap)
        // new MassmapLayer(this.globe, massmap2)
        this.value.onMount(this)
        runWatchers(this)
    }

    beforeDestroy() {
        this.value.onUnmount()
    }

    @Prop({ default: false })
    retina: boolean
    @Watch('retina', { immediate: true })
    onRetinaChange() {
        if (this.globe)
            this.globe.setRetina(this.retina)
    }

    @Prop({ default: false })
    dissolveEffect: boolean
    @Watch('dissolveEffect', { immediate: true })
    onDissolveEffectChange() {
        if (this.globe) {
            this.globe.eachLayer((l) => {
                if (l instanceof TextureTileLayer)
                    l.dissolveEffect = this.dissolveEffect
            })
            this.globe.requestRedraw()
        }
    }

    @Prop({ default: 2, type: Number })
    motionLod: number
    @Watch('motionLod', { immediate: true })
    onMotionLodChange() {
        if (this.globe) {
            this.globe.eachLayer((l) => {
                if (l instanceof TextureTileLayer)
                    l.motionLod = this.motionLod
            })
            this.globe.requestRedraw()
        }
    }

    gridTic: GridTic | null = true as any
}


function runWatchers(vm: any) {
    for (const w of vm._watchers)
        w.cb.call(vm, w.value)
}


import { PathLayer, LineSegmentLayer, Vector2 } from "stellar-globe"
import { math } from 'stellar-globe'
import { vec3 } from 'gl-matrix'
import tinycolor from "tinycolor2"

let show = true

window.addEventListener('load', () => {
    document.addEventListener('keydown', e => {
        if (e.keyCode == 'Q'.charCodeAt(0)) {
            console.log({ show })
            show = !show
        }
    })
})

interface MassmapPath {
    level: number, vertices: Vector2[]
}
type MassmapData = MassmapPath[]


class MassmapLayer extends LineSegmentLayer {
    constructor(globe: Globe, data: MassmapData) {
        super(globe)
        this.build(data)
    }

    alpha() {
        return 1
    }

    draw() {
        if (show)
            super.draw()
    }

    minWidth(): number {
        return this.globe.retina ? 6 : 5
    }

    darkenNarrowLine = false

    build(data: MassmapData) {
        this.stroke(pen => {
            pen.width = 0
            for (const p of data) {
                if (p.level >= 0) {
                    const { r, g, b } = tinycolor({ h: 240 - p.level * 20, s: 100, v: 100 }).toRgb()
                    pen.color = [r / 255, g / 255, b / 255, 0.5 * (0.5 + Math.min(0.5, p.level / 10))]
                    for (const [a, d] of p.vertices) {
                        const p = math.radec2xyz(math.deg2rad(a), math.deg2rad(d))
                        pen.lineTo(p)
                    }
                }
                pen.up()
            }
        })
    }
}


// https://github.com/lsst/skymap/blob/master/python/lsst/skymap/ringsSkyMap.py
class RingsTractLayer extends PathLayer {
    numRings = 120
    tractOverlap = 1.0 / 60 // Overlap between tracts (degrees)
    pixelScale = 0.168
    raStart = 0
    patchInnerDimensions = [4000, 4000]

    constructor(globe: Globe) {
        super(globe)
        this.makeRingsTract()
    }

    private ringSize: number
    private ringNums: number[] = []

    makeRingsTract() {
        this.stroke(pen => {
            pen.color = [0, 0.5, 0.5, 0.4]
            const n = this.numTracts()
            for (let i = 0; i < n; ++i) {
                const [ra, dec] = this.generateTract(i)
                const r = math.radec2xyz(ra, dec)
                const ax1 = vec3.cross(vec3.create(), [0, 0, 1], r)
                vec3.normalize(ax1, ax1)
                const ax2 = vec3.cross(vec3.create(), r, ax1)
                for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                    const a = math.arcsec2rad(this.pixelScale) * 36000 / 2
                    const p = vec3.scaleAndAdd(vec3.create(), vec3.scaleAndAdd(vec3.create(), r, ax1, a * x), ax2, a * y)
                    pen.lineTo(p as any)
                }
                pen.closePath()
            }
        })
    }

    private numTracts() {
        this.ringSize = Math.PI / (this.numRings + 1)
        this.ringNums = []
        for (let i = 0; i < this.numRings; ++i) {
            const startDec = this.ringSize * (i + 0.5) - 0.5 * Math.PI
            const stopDec = startDec + this.ringSize
            const dec = Math.min(Math.abs(startDec), Math.abs(stopDec)) // Declination for determining division in RA
            this.ringNums.push(Math.floor(2 * Math.PI * Math.cos(dec) / this.ringSize) + 1)
        }
        return this.ringNums.reduce((sum, n) => sum + n, 0) + 2
    }

    private generateTract(index: number) {
        // Generate the TractInfo for this index
        const [ringNum, tractNum] = this.getRingIndices(index)
        let [ra, dec] = [NaN, NaN]
        if (ringNum == -1) // South polar cap
            [ra, dec] = [0, -0.5 * Math.PI]
        else if (ringNum == this.numRings)
            [ra, dec] = [0, 0.5 * Math.PI]
        else {
            dec = this.ringSize * (ringNum + 1) - 0.5 * Math.PI
            ra = (this.raStart + 2 * Math.PI * tractNum / this.ringNums[ringNum]) % (2 * Math.PI)
        }
        return [ra, dec]
    }

    private getRingIndices(index: number) {
        //     https://github.com/lsst/skymap/blob/master/python/lsst/skymap/ringsSkyMap.py#L72
        //     """Calculate ring indices given a numerical index of a tract
        //     The ring indices are the ring number and the tract number within
        //     the ring.
        //     The ring number is -1 for the south polar cap and increases to the
        //     north.  The north polar cap has ring number = numRings.  The tract
        //     number is zero for either of the polar caps.
        //     """
        if (index == 0)
            return [-1, 0]
        if (index == this.numTracts() - 1)
            return [this.numRings, 0]
        index--
        let ring = 0
        while (ring < this.numRings && index > this.ringNums[ring]) {
            index -= this.ringNums[ring]
            ring++
        }
        return [ring, index]
    }

    alpha() {
        return 1
    }
}