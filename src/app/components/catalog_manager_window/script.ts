import Vue from 'vue'
import { Component, Prop, Inject } from 'vue-property-decorator'
import { Root } from '../root'
import { Catalog } from '../../models/catalog'
import { mixin as FrameStoreMixin } from '../../store/frame'
import { math } from 'stellar-globe'


@Component
export default class CatalogManagerComponent extends Vue {
    @Inject() root: Root

    async loadCatalogFile(changeEvent: Event) {
        const files = Array.from((changeEvent.target as any).files) as File[]
        const catalogs = await Promise.all(files.map(f => Catalog.makeFromFile(f)))
        !(this.$refs.form as HTMLFormElement).reset()
        return catalogs
    }

    goToFirstObject(catalog: Catalog) {
        this.root.state.frame.current.jumpTo({
            ...catalog.coordOf(catalog.payload[0]),
            fovy: math.arcmin2rad(1)
        })
    }
}