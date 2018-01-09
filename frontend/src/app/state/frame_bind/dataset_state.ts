import { serializable } from "../../utils/serialize"
import { PropBinder, FrameComponent, FrameBind } from "."
import { SspImageLayer } from "hsc_ssp"


const citizenScience = !!location.search.match(/citizenScience/)


@serializable({ exclude: ['vm'] })
export class DatasetState implements PropBinder {
    udeep = !citizenScience
    deep = !citizenScience
    wide = true
    dud = !citizenScience
    uh_ssp = !citizenScience

    private vm: FrameComponent

    onMount(vm: FrameComponent, b: FrameBind) {
        this.vm = vm
        const globe = vm.globe!
        vm.$watch(() => [this.udeep, this.deep, this.wide, this.dud, this.uh_ssp], () => {
            globe.layerOf(SspImageLayer, layer => {
                layer.udeep = this.udeep
                layer.deep = this.deep
                layer.wide = this.wide
                layer.dud = this.dud
                layer.uh_ssp = this.uh_ssp
            })
            globe.requestRedraw()
        }, { immediate: true })
    }
}