import Vue from 'vue'
import { Component, Inject } from 'vue-property-decorator'
import { RootComponent } from "../components/root"
import { TextureTileLayer } from "stellar-globe"
import { SspImageLayer } from "hsc_ssp"


@Component
export default class DevelObserver extends Vue {
    @Inject('root')
    root: RootComponent

    get develState() {
        return this.root.s.develState
    }

    get globe() {
        return this.root.s.frameManager.currentFrame.vm!.globe
    }

    mounted() {
        this.$watch(() => [
            this.develState.checkBoard,
            this.develState.flashOnLoad,
        ], () => {
            if (this.globe) {
                this.globe.eachLayer((l) => {
                    if (l instanceof SspImageLayer) {
                        l.checkBoard = this.develState.checkBoard
                        l.flashOnLoad = this.develState.flashOnLoad
                        l.refreshTiles()
                    }
                })
            }
        }, { immediate: true })
    }

    render(h: Vue.CreateElement) { return h('div') }
}