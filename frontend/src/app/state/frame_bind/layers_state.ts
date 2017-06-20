import { FrameBind, FrameComponent, PropBinder } from "."
import { Layer } from "stellar-globe"
import { serializable } from '../../utils/serialize'


@serializable()
export class LayersState implements PropBinder, Record<LayerName, boolean> {
    GridLayer: boolean
    DynamicGridLayer: boolean
    ConstellationsLayer: boolean
    ConstellationNamesLayer: boolean
    ConstellationJapaneseNamesLayer: boolean
    ConstellationKanjiJapaneseNamesLayer: boolean
    EsoMilkyWayLayer: boolean
    HipparcosCatalogLayer: boolean
    SspFieldNameLayer: boolean
    SspImageLayer: boolean
    SspSurveyAreaLayer: boolean
    JamiesonCelestialAtlasLayer: boolean
    M31Layer: boolean
    ViewFrustumLayer: boolean
    HipsLayer: boolean


    constructor(primary: boolean) {
        this.GridLayer = true
        this.DynamicGridLayer = true
        this.ConstellationsLayer = true
        this.ConstellationNamesLayer = false
        this.ConstellationJapaneseNamesLayer = false
        this.ConstellationKanjiJapaneseNamesLayer = false
        this.EsoMilkyWayLayer = primary
        this.HipparcosCatalogLayer = primary
        this.SspFieldNameLayer = primary
        this.SspImageLayer = true
        this.SspSurveyAreaLayer = true
        this.JamiesonCelestialAtlasLayer = false
        this.M31Layer = true
        this.ViewFrustumLayer = false
        this.HipsLayer = false
    }

    onMount(vm: FrameComponent, b: FrameBind) {
        vm.$watch(() => this, () => {
            const globe = vm.globe!
            for (const key in layerClass) {
                const klass = layerClass[key as LayerName]
                const enabled = this[key as LayerName]
                if (globe.layerOf(klass, (layer: Layer) => { layer.enabled = enabled }, true) == 0 && enabled) {
                    new klass(globe)
                }
            }
            vm.globe!.requestRedraw()
        }, { immediate: true, deep: true })
    }
}


import {
    GridLayer,
    HipsLayer,
    DynamicGridLayer,
    ConstellationsLayer,
    ConstellationNamesLayer,
    ConstellationJapaneseNamesLayer,
    ConstellationKanjiJapaneseNamesLayer,
    HipparcosCatalogLayer,
    EsoMilkyWayLayer,
    // JamiesonCelestialAtlasLayer,
    ViewFrustumLayer,
} from "stellar-globe"

import {
    SspSurveyAreaLayer,
    SspFieldNameLayer,
    SspImageLayer,
    M31Layer,
} from "hsc_ssp";

export const layerClass = {
    GridLayer,
    DynamicGridLayer,
    ConstellationsLayer,
    ConstellationNamesLayer,
    ConstellationJapaneseNamesLayer,
    ConstellationKanjiJapaneseNamesLayer,
    SspSurveyAreaLayer,
    SspFieldNameLayer,
    SspImageLayer,
    HipparcosCatalogLayer,
    EsoMilkyWayLayer,
    // JamiesonCelestialAtlasLayer,
    M31Layer,
    ViewFrustumLayer,
    HipsLayer,
}

export type LayerName = keyof typeof layerClass