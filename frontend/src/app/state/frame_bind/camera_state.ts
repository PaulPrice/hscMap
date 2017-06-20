import { event, CameraParams, CameraMode } from "stellar-globe"
import { FrameBind, FrameComponent, PropBinder } from "."
import { serializable } from '../../utils/serialize'
import _ from "lodash"


@serializable({ exclude: ['fb'] })
export class CameraState implements PropBinder {
    p: CameraParams = {
        mode: CameraMode.FLOATING_EYE,
        a: 0,
        d: 0,
        fovy: 1,
        tilt: 0,
        roll: 0,
    }

    fb: FrameBind

    constructor(template?: FrameBind) {
        if (template)
            Object.assign(this.p, template.camera.p)
    }

    setMode(mode: CameraMode | undefined) {
        const globe = this.fb.vm!.globe!
        globe.setCameraMode(mode)
        this.p = { ...globe.cameraParams }
    }

    onMount(vm: FrameComponent, fb: FrameBind) {
        this.fb = fb
        const globe = vm.globe!

        const onMove = (e: event.MoveEndEvent | event.MoveEndEvent) => {
            Object.assign(this.p, e.cameraParams)
            vm.$emit('move', e)
        }

        globe.on(event.MoveEvent, _.throttle((e: event.MoveEvent) => vm.emitMoveEventContinuously && onMove(e), 500))
        globe.on(event.MoveEndEvent, onMove)

        vm.$watch(() => this.p, () => {
            globe.cameraParams = { ...this.p }
            globe.requestRedraw()
        }, { immediate: true, deep: true })
    }
}