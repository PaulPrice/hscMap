import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { math } from "stellar-globe"
import { CatalogState } from "../../state/frame_bind/catalog_state"
import { FrameBind } from "../../state/frame_bind"


@Component
export default class CatalogTablePanelComponent extends Vue {
    @Prop({ required: true })
    catalogState: CatalogState

    @Prop({ required: true })
    frame: FrameBind

    get cs() { return this.catalogState }

    focus = true
    sortCol = 0
    page = 0
    perPage = 500
    reverse = false

    created() {
        this.$watch(() => [this.sortCol, this.reverse], () => this.page = 0)
    }

    get paginatedRows() {
        return this.sortedRows.slice(this.page * this.perPage, (this.page + 1) * this.perPage)
    }

    get sortedRows() {
        const sortedRows = this.cs.catalog.payload.slice().sort((a, b) => {
            const aValue = a[this.sortCol]
            const bValue = b[this.sortCol]
            if (Number.isNaN(aValue) && Number.isNaN(bValue))
                return 0
            if (Number.isNaN(aValue))
                return +1
            if (Number.isNaN(bValue))
                return -1
            return this.reverse ? bValue - aValue : aValue - bValue
        })
        return sortedRows
    }

    get pageMax() {
        return Math.floor((this.cs.catalog.payload.length - 1) / this.perPage)
    }

    focusInFrame(row: any) {
        if (this.focus)
            this.frame.jumpTo({
                ...this.cs.catalog.coordOf(row),
                fovy: math.arcmin2rad(1),
            }, { duration: 200 })
    }
}