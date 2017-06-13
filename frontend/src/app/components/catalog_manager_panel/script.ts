import Vue from 'vue'
import { Component, Inject } from 'vue-property-decorator'
import { RootComponent } from '../root'
import { Catalog } from '../../models/catalog'
import { math, MarkerStyle } from 'stellar-globe'


@Component
export default class CatalogManagerPanelComponent extends Vue {
    @Inject() root: RootComponent

    get frame() {
        return this.root.s.frameManager.currentFrame
    }

    async loadCatalogFile(changeEvent: Event) {
        const files = Array.from((changeEvent.target as any).files) as File[]
        !(this.$refs.form as HTMLFormElement).reset()
        const catalogs = await Promise.all(files.map(f => Catalog.makeFromFile(f)))
        return catalogs
    }

    goToFirstObject(catalog: Catalog) {
        this.frame.jumpTo({
            ...catalog.coordOf(catalog.payload[0]),
            fovy: math.arcmin2rad(1)
        })
    }

    get markers() {
        return [
            { text: 'o', value: MarkerStyle.CIRCLE },
            { text: '+', value: MarkerStyle.CROSS1 },
            { text: 'x', value: MarkerStyle.CROSS2 },
        ]
    }
}