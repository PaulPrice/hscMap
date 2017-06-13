import { serializable } from "../../utils/serialize"
import { PropBinder, FrameComponent, FrameBind } from "."
import { SspImageLayer } from "hsc_ssp"


@serializable({ exclude: ['vm'] })
export class DatasetState implements PropBinder {
    udeep = true
    deep = true
    wide = true

    private vm: FrameComponent

    onMount(vm: FrameComponent, b: FrameBind) {
        this.vm = vm
        const globe = vm.globe!
        vm.$watch(() => [this.udeep, this.deep, this.wide], () => {
            globe.layerOf(SspImageLayer, layer => {
                layer.udeep = this.udeep
                layer.deep = this.deep
                layer.wide = this.wide
            })
            globe.requestRedraw()
        }, { immediate: true })
    }
}