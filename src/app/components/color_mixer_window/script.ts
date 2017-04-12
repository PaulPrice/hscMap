import Vue from 'vue'
import { Component, Prop, Inject } from 'vue-property-decorator'
import { State } from '../../store'

import { filters } from 'hsc_ssp/filters'


@Component
export default class ColorMixerComponent extends Vue {
    @Inject() state: State

    get mixer() {
        return this.state.frame.current.mixer
    }

    filters = filters
    options = [
        { value: 'simpleRgb', text: 'Simple Rgb' },
        { value: 'sdssTrueColor', text: 'SDSS True Color' },
    ]

    simpleRgbSingleBand(i: number) {
        for (let j = 0; j < 3; ++j)
            Vue.set(this.mixer.simpleRgb.filters, j, filters[i].name)
    }

    sdssTrueColorSingleBand(i: number) {
        for (let j = 0; j < 3; ++j)
            Vue.set(this.mixer.sdssTrueColor.filters, j, filters[i].name)
    }
}