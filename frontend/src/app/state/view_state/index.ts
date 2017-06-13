import { State } from ".."
import { event } from "stellar-globe"
import { serializable } from "../../utils/serialize"
import { requestFullscreen, exitFullscreen, onFullscreenchange } from "./fullscreen"


@serializable({ inject: ['rootState'], exclude: ['fullscreen'] })
export class ViewState {
    fullscreen = false
    retina = false
    dissolveEffect = true
    jumpDuration = 350 // ms
    motionLod = 1
    mouseInertia = true
    lock = {
        wcs: true,
        wcsOnlyCenter: false,
    }

    constructor(public rootState: State) {
        onFullscreenchange((isFullscreen) => {
            this.fullscreen = isFullscreen
        })
    }

    frameOnMove(e: event.MoveEvent | event.MoveEvent) {
        if (this.lock.wcs)
            for (const fp of this.rootState.frameManager.framePanels) {
                if (this.lock.wcsOnlyCenter) {
                    const { a, d } = e.cameraParams
                    fp.frame.camera.p = { ...fp.frame.camera.p, a, d }
                }
                else
                    fp.frame.camera.p = { ...e.cameraParams }
            }
    }

    inRetinaDisplay() {
        return window.devicePixelRatio > 1
    }

    toggleFullscreen() {
        if (this.fullscreen)
            exitFullscreen()
        else {
            requestFullscreen(document.body)
            const globe = this.rootState.frameManager.currentFrame.vm!.globe!
        }
    }
}