import Vue from 'vue'
import { Component, Inject } from 'vue-property-decorator'
import { filters } from 'hsc_ssp/filters'
import { RootComponent } from "../root"
import { MotionAnimation } from "stellar-globe"


@Component
export default class ColorMixerPanelComponent extends Vue {
    @Inject()
    root: RootComponent
    
    get value() {
        return this.root.s.frameManager.currentFrame.mixer
    }
    
    filters = filters
    options = [
        { value: 'simpleRgb', text: 'Simple Rgb' },
        { value: 'sdssTrueColor', text: 'SDSS True Color' },
    ]

    reset() {
        this.value.reset()
    }

    simpleRgbSingleBand(i: number) {
        for (let j = 0; j < 3; ++j)
            Vue.set(this.value.simpleRgb.filters, j, filters[i].name)
    }

    sdssTrueColorSingleBand(i: number) {
        for (let j = 0; j < 3; ++j)
            Vue.set(this.value.sdssTrueColor.filters, j, filters[i].name)
    }

    motionAnimation?: MotionAnimation
    motionMode(on: boolean) {
        const globe = this.root.s.frameManager.currentFrame.vm!.globe!
        this.motionAnimation && this.motionAnimation.quit()
        if (on) {
            this.motionAnimation = new MotionAnimation(globe, {
                callback: () => { }
            })
            this.motionAnimation.then(() => {
                this.motionAnimation = undefined
            })
        }
    }
}