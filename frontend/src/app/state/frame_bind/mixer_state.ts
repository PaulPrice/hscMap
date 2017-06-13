import { FrameBind, FrameComponent, PropBinder } from ".";
import { serializable } from "../../utils/serialize";
import { deepCopy } from "../../utils/deep_copy"
import {
    SspImageLayer,
    SimpleRgbMixer,
    SdssTrueColorMixer,
    simpleRgbMixerDefaultParams,
    sdssTrueColorMixerDefaultParams
} from "hsc_ssp";


@serializable()
export class MixerState implements PropBinder {
    current: 'simpleRgb' | 'sdssTrueColor'
    simpleRgb: typeof simpleRgbMixerDefaultParams
    sdssTrueColor: typeof sdssTrueColorMixerDefaultParams

    constructor() {
        this.reset()
    }

    reset() {
        this.current = 'simpleRgb'
        this.simpleRgb = deepCopy(simpleRgbMixerDefaultParams)
        this.sdssTrueColor = deepCopy(sdssTrueColorMixerDefaultParams)
    }

    onMount(vm: FrameComponent, b: FrameBind) {
        this.bindMixer(vm, b)
        this.bindSimpleRgb(vm, b)
        this.bindSdssTrueColor(vm, b)
    }

    private bindMixer(vm: FrameComponent, b: FrameBind) {
        vm.$watch(() => this.current, mixerName => {
            vm.globe!.layerOf(SspImageLayer, (layer) => {
                layer.changeMixer(mixerName)
            })
        }, { immediate: true })
    }

    private bindSimpleRgb(vm: FrameComponent, b: FrameBind) {
        vm.$watch(() => this.simpleRgb.filters, (newFilters) => {
            vm.globe!.layerOf(SspImageLayer, (layer) => {
                layer.mixers.simpleRgb.filters = newFilters
                layer.refreshTiles()
                vm.globe!.requestRedraw()
            })
        }, { immediate: true })

        vm.$watch(() => {
            const { logA, min, max } = this.simpleRgb // just touch to observe them
            return { logA, min, max }
        }, () => {
            vm.globe!.layerOf(SspImageLayer, (layer) => {
                const mixer = layer.mixer as SimpleRgbMixer
                const params = this.simpleRgb
                mixer.min = params.min
                mixer.max = params.max
                mixer.logA = params.logA
                layer.refreshTiles(false)
                vm.globe!.requestRedraw()
            })
        }, { immediate: true })
    }

    private bindSdssTrueColor(vm: FrameComponent, b: FrameBind) {
        vm.$watch(() => this.sdssTrueColor.filters, (newFilters) => {
            vm.globe!.layerOf(SspImageLayer, (layer) => {
                layer.mixers.sdssTrueColor.filters = newFilters
                layer.refreshTiles()
                vm.globe!.requestRedraw()
            })
        }, { immediate: true })

        vm.$watch(() => {
            const { logA, b } = this.sdssTrueColor // just touch to observe them
            return { logA, b }
        }, (newParams) => {
            vm.globe!.layerOf(SspImageLayer, (layer) => {
                const mixer = layer.mixer as SdssTrueColorMixer
                Object.assign(mixer, newParams)
                layer.refreshTiles(false)
                vm.globe!.requestRedraw()
            })
        }, { immediate: true })
    }
}