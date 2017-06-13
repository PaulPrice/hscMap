import Vue from 'vue'
import { Component, Inject } from 'vue-property-decorator'
import { RootComponent } from "../root"
import { MotionAnimation } from "stellar-globe"
import { sprintf } from "sprintf-js"


@Component
export default class extends Vue {
    @Inject()
    root: RootComponent

    get sprintf() {
        return sprintf
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