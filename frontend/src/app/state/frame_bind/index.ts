import { CameraParams, easing } from 'stellar-globe'
import { FrameComponent } from "../../components/frame/frame_component"
import { serializable } from "../../utils/serialize"
import { State } from ".."
import { Catalog } from "../../models/catalog"
import { CatalogState, catalogState } from "./catalog_state"
import { CameraState } from "./camera_state"
import { LayersState } from "./layers_state"
import { MixerState } from './mixer_state'
import { DynamicGridState } from "./dynamic_grid_state"
import { DatasetState } from "./dataset_state"
export { FrameComponent }


@serializable({ exclude: ['vm'] })
export class FrameBind {
    static number = 0

    vm?: FrameComponent

    name: string
    camera: CameraState
    layers: LayersState
    mixer: MixerState
    dynamicGrid: DynamicGridState
    catalogs: CatalogState[] = []
    dataset: DatasetState

    constructor(primary: boolean = false, template?: FrameBind) {
        this.name = `Frame-${++FrameBind.number}`
        this.camera = new CameraState(template)
        this.layers = new LayersState(primary)
        this.mixer = new MixerState()
        this.dynamicGrid = new DynamicGridState()
        this.dataset = new DatasetState()
    }

    propBinders() {
        return [
            this.camera,
            this.layers,
            this.mixer,
            this.dynamicGrid,
            this.dataset,]
    }

    onMount(component: FrameComponent) { // called by FrameComponent.mounted
        this.vm = component
        for (const b of this.propBinders())
            b.onMount(this.vm, this)
    }

    onUnmount() { // called by FrameComponent.beforeDestroy
        this.vm = undefined
    }

    jumpTo(params: Partial<CameraParams>, options: { easingFunc?: (r: number) => number, duration?: number } = {}) {
        const jumpDuration = options.duration || 350
        const easingFunc = options.easingFunc || easing.fastStart4
        this.vm!.globe!.jumpTo(params, jumpDuration, easingFunc)
    }

    pushCatalog(catalog: Catalog) {
        this.catalogs.push(catalogState(catalog))
    }
}


export interface PropBinder {
    onMount(vm: FrameComponent, b: FrameBind): void
}