import { GridMode, event, DynamicGridLayer, Vector4 } from "stellar-globe"
import { FrameBind, FrameComponent, PropBinder } from "."
import { serializable } from '../../utils/serialize'


@serializable()
export class DynamicGridState implements PropBinder {
    mode: GridMode = GridMode.SEXAGESIMAL
    live = true
    color: Vector4 = [0.25, 0.5, 1, 0.25]

    toggle() {
        const mode = this.mode
        this.mode = GridMode[mode + 1] == undefined ? 0 : mode + 1
    }

    onMount(vm: FrameComponent, b: FrameBind) {
        vm.globe!.on(event.TicChangeEvent, (e) => {
            vm.gridTic = e.tic
        })

        vm.$watch(() => this, () => {
            vm.globe!.layerOf(DynamicGridLayer, (layer) => {
                layer.mode = this.mode
                layer.live = this.live
                layer.refreshGrid()
            })
            vm.globe!.requestRedraw()
        }, { immediate: true, deep: true })

        vm.$watch(() => b.layers.DynamicGridLayer, (show) => {
            if (show)
                vm.globe!.layerOf(DynamicGridLayer, (layer) => {
                    vm.gridTic = layer.tic
                })
            else
                vm.gridTic = null

        }, { immediate: true })

        vm.$watch(() => this.color, () => {
            vm.globe!.layerOf(DynamicGridLayer, (layer) => {
                layer.color = Array.from(this.color) as Vector4
            })
            vm.globe!.requestRedraw()
        }, { immediate: true })
    }
}