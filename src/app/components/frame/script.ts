import Vue from 'vue'
import { Component, Prop, Model } from 'vue-property-decorator'
import { FrameState, layerClass, LayerName, CatalogState } from "../../store/frame"
import { Globe, Layer, event, StatLayer, GridLayer, DynamicGridLayer, GridMode, GridTic, UserCatalogLayer } from 'stellar-globe'
import { SspImageLayer } from 'hsc_ssp/layers/ssp_image_layer'
import { SimpleRgbMixer } from 'hsc_ssp/layers/ssp_image_layer/mixers/simple_rgb_mixer'
import { SdssTrueColorMixer } from 'hsc_ssp/layers/ssp_image_layer/mixers/sdss_true_color_mixer'
import * as _ from 'underscore'


@Component({
    model: { prop: 'model' },
})
export default class FrameComponent extends Vue {
    globe: Globe

    gridTic: GridTic | null = null // setting to null is for being observed

    @Prop({ default: false, type: Boolean })
    emitMoveEventContinuously: boolean

    @Prop({ default: true, type: Boolean })
    retina: boolean

    @Prop({ required: true })
    model: FrameState

    mounted() {
        this.globe = new Globe(this.$el)
        this.model.component = this
        this.initEvents()
        this.bindProps()
    }

    beforeDestroy() {
        this.model.component = undefined
        this.globe.release()
    }

    toggleGridMode() {
        const mode = this.model.grid.mode
        this.model.grid.mode = GridMode[mode + 1] == undefined ? 0 : mode + 1
    }

    private initEvents() {
        for (const k in events)
            (events as any)[k].call(this)
    }

    private bindProps(this: FrameComponent) {
        for (const k in props)
            (props as any)[k].call(this)
    }

}


const events = {
    move(this: FrameComponent) {
        this.globe.on(event.MoveEvent, (e) => {
            if (this.emitMoveEventContinuously) {
                Object.assign(this.model.cameraParams, e.cameraParams)
                this.$emit('move', e)
            }
        })
        this.globe.on(event.MoveEndEvent, (e) => {
            Object.assign(this.model.cameraParams, e.cameraParams)
            this.$emit('move', e)
        })
    },

    mouseHoverOnCatalogObject(this: FrameComponent) {
        this.globe.on(event.MouseMoveEvent, (e: event.MouseMoveEvent) => {
            const maxDistance = 15 / this.globe.element.clientHeight * this.globe.camera.effectiveFovy
            for (const c of this.model.catalogs) {
                let row = null as any
                for (const hitRow of c.catalog.spatialIndex.nearest(e.xyz, 1, maxDistance))
                    row = hitRow
                this.$emit('mouseHoverOnCatalogObject', {
                    catalog: c.catalog, row
                })
            }
        })
    }
}


const props = {
    retina(this: FrameComponent) {
        this.$watch(() => this.retina, (retina) => {
            this.globe.retinaSupport = retina
            this.globe.onResize()
        })
    },


    cameraParams(this: FrameComponent) {
        this.$watch(() => this.model.cameraParams, () => {
            this.globe.cameraParams = { ...this.model.cameraParams }
            this.globe.requestRedraw()
        }, { immediate: true })
    },


    layers(this: FrameComponent) {
        this.$watch(() => this.model.layers, () => {
            for (const key in layerClass) {
                const klass = layerClass[key as LayerName]
                const enabled = this.model.layers[key as LayerName]
                if (this.globe.layerOf(klass, (layer: Layer) => { layer.enabled = enabled }) == 0 && enabled) {
                    new klass(this.globe)
                }
            }
            this.globe.requestRedraw()
        }, { immediate: true, deep: true })
    },


    mixer(this: FrameComponent) {
        this.$watch(() => this.model.mixer.current, (mixerName) => {
            this.globe.layerOf(SspImageLayer, (layer) => {
                layer.changeMixer(mixerName)
            })
        }, { immediate: true })
    },


    simpleRgbMixer(this: FrameComponent) {
        this.$watch(() => this.model.mixer.simpleRgb.filters, (newFilters) => {
            this.globe.layerOf(SspImageLayer, (layer) => {
                layer.mixers.simpleRgb.filters = newFilters
                layer.refreshTiles()
                this.globe.requestRedraw()
            })
        }, { immediate: true })

        this.$watch(() => {
            const { logA, min, max } = this.model.mixer.simpleRgb // just touch to observe them
            return { logA, min, max }
        }, () => {
            this.globe.layerOf(SspImageLayer, (layer) => {
                const mixer = layer.mixer as SimpleRgbMixer
                const params = this.model.mixer.simpleRgb
                mixer.min = params.min
                mixer.max = params.max
                mixer.logA = params.logA
                layer.refreshTiles(false)
                this.globe.requestRedraw()
            })
        }, { immediate: true })
    },


    sdssTrueColorMixer(this: FrameComponent) {
        this.$watch(() => this.model.mixer.sdssTrueColor.filters, (newFilters) => {
            this.globe.layerOf(SspImageLayer, (layer) => {
                layer.mixers.sdssTrueColor.filters = newFilters
                layer.refreshTiles()
                this.globe.requestRedraw()
            })
        }, { immediate: true })

        this.$watch(() => {
            const { logA, b } = this.model.mixer.sdssTrueColor // just touch to observe them
            return { logA, b }
        }, (newParams) => {
            this.globe.layerOf(SspImageLayer, (layer) => {
                const mixer = layer.mixer as SdssTrueColorMixer
                const params = this.model.mixer.sdssTrueColor
                Object.assign(mixer, newParams)
                layer.refreshTiles(false)
                this.globe.requestRedraw()
            })
        }, { immediate: true })
    },


    gridSettings(this: FrameComponent) {
        this.globe.on(event.TicChangeEvent, (e) => {
            this.gridTic = e.tic
        })

        this.$watch(() => this.model.grid, ({ mode, live }) => {
            this.globe.layerOf(DynamicGridLayer, (layer) => {
                layer.mode = mode
                layer.live = live
                layer.refreshGrid()
            })
            this.globe.requestRedraw()
        }, { immediate: true, deep: true })

        this.$watch(() => this.model.layers.DynamicGridLayer, (show) => {
            if (show)
                this.globe.layerOf(DynamicGridLayer, (layer) => {
                    this.gridTic = layer.tic
                })
            else
                this.gridTic = null

        }, { immediate: true })
    },


    catalogs(this: FrameComponent) {
        const layers = new Map<CatalogState, UserCatalogLayer>()

        this.$watch(() => this.model.catalogs, (newCatalogs) => {
            for (const c of newCatalogs) {
                if (!layers.has(c)) // added
                    layers.set(c, c.catalog.makeLayer(this.globe))
            }
            for (const [c, l] of layers) {
                if (newCatalogs.indexOf(c) < 0) { // removed
                    l.release()
                    layers.delete(c)
                }
            }
        }, { immediate: true })
    }

}