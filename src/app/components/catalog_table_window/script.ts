import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { WindowState } from "hsc_ui"
import { easing, math } from "stellar-globe"
import { Catalog } from "../../models/catalog"
import { FrameState, CatalogState } from "../../store/frame"
import * as _ from 'underscore'


@Component
export default class CatalogTableComponent extends Vue {
    @Prop({ required: true })
    catalogState: CatalogState

    @Prop({ required: true })
    frame: FrameState

    get cs() { return this.catalogState }

    mounted() {
        this.cs.tableComponent = this
    }

    beforeDestroy() {
        this.cs.tableComponent = undefined
    }

    sortCol = 0
    page = 0
    perPage = 200
    reverse = false

    get rows() {
        return this.sortedRows.slice(this.page * this.perPage, (this.page + 1) * this.perPage)
    }

    get sortedRows() {
        const sortedRows = this.cs.catalog.payload.slice().sort((a, b) => a[this.sortCol] - b[this.sortCol])
        this.reverse && sortedRows.reverse()
        return sortedRows
    }

    get pageMax() {
        return Math.floor((this.cs.catalog.payload.length - 1) / this.perPage)
    }

    focusInFrame(row: any) {
        this.frame.globe(globe => {
            globe.jumpTo({
                ...this.cs.catalog.coordOf(row),
                fovy: math.arcmin2rad(1)
            }, 200, easing.fastStart4)
        })
    }

    markedRow: any = null
    markRow(row: any) {
        this.markedRow = row
    }
}