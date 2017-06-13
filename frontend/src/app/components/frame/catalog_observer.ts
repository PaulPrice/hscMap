import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { CatalogState } from "../../state/frame_bind/catalog_state"
import { FrameComponent } from "./frame_component"
import { UserCatalogLayer, event } from "stellar-globe"


import Info from './info.vue'


@Component
export class CatalogObserver extends Vue {
    @Prop({ required: true })
    value: CatalogState

    @Prop({ required: true })
    frameComponent: FrameComponent

    layer: UserCatalogLayer
    focusLayer: UserCatalogLayer
    focusedRow: any = null

    mounted() {
        this.watch(() => this.value.markerStyle, () => {
            this.layer.setMarkerStyle(this.value.markerStyle)
            this.frameComponent.globe!.requestRedraw()
        })
        this.watch(() => this.value.markerColor, () => {
            this.layer.color = this.value.markerColor
            this.frameComponent.globe!.requestRedraw()
        })
        this.watch(() => this.value.show, () => {
            this.layer.enabled = this.value.show
            this.frameComponent.globe!.requestRedraw()
        })
        this.watch(() => { }, () => {
            const globe = this.frameComponent.globe!
            this.layer.onRelease(globe.on(event.MouseMoveEvent, (ev) => {
                const maxRadius = 32 / globe.element.clientHeight * globe.camera.effectiveFovy
                const hitRows = this.value.catalog.spatialIndex.nearest(ev.xyz, 1, maxRadius)
                this.focusLayer.setRows(hitRows.map(row => ({ coord: this.value.catalog.xyzOf(row) })))
                this.focusedRow = hitRows[0] || null
            }))
        })
    }

    watch<T>(target: () => T, cb: (target: T) => void) {
        this.$watch(() => { this.frameComponent; return { value: target() } }, ({ value }) => {
            if (this.frameComponent) {
                if (!this.layer) {
                    this.layer = this.value.catalog.makeLayer(this.frameComponent.globe!)
                    this.focusLayer = new UserCatalogLayer(this.frameComponent.globe!)
                    this.focusLayer.color = [1, 0, 0, 1]
                }
                cb(value)
            }
        }, { immediate: true })
    }

    beforeDestroy() {
        this.layer.release()
        this.focusLayer.release()
    }

    render(h: Vue.CreateElement) {
        return h(Info, {
            props: {
                headers: this.value.catalog.header,
                focusedRow: this.focusedRow,
            }
        })
    }
}