import { Root } from "../components/root"
import { WindowState, windowState } from "hsc_ui"
import { Globe, Layer, Attribution, TextureTileLayer, CameraParams, CameraMode, GridMode, event, easing } from "stellar-globe"
import { deepCopy } from "../utils"
import { Catalog } from "../models/catalog"
import FrameComponent from '../components/frame/script'
import CatalogTableComponent from '../components/catalog_table_window/script'


export interface State {
    mode: 'single' | 'window'
    frameWindows: FrameWindowState[]
    current: FrameState
    lock: Lock
}


export function initialState(): State {
    const mode = 'single'
    const current = initialFrameState(true)
    const lock = { wcs: true }
    return {
        mode,
        current,
        frameWindows: [{
            frame: current,
            window: windowState(true),
        }],
        lock,
    }
}


interface FrameWindowState {
    frame: FrameState
    window: WindowState
}


interface Lock {
    wcs: boolean
}


import { defaultParams as simpleRgbMixerDefaultParams } from 'hsc_ssp/layers/ssp_image_layer/mixers/simple_rgb_mixer'
import { defaultParams as sdssTrueColorMixerDefaultParams } from 'hsc_ssp/layers/ssp_image_layer/mixers/sdss_true_color_mixer'
interface Mixer {
    current: 'simpleRgb' | 'sdssTrueColor'
    simpleRgb: typeof simpleRgbMixerDefaultParams
    sdssTrueColor: typeof sdssTrueColorMixerDefaultParams
}


import { GridLayer, DynamicGridLayer, ConstellationsLayer, HipparcosCatalogLayer, EsoMilkyWayLayer } from "stellar-globe"
import { SspSurveyAreaLayer, SspImageLayer, M31Layer } from "hsc_ssp"
export const layerClass = {
    GridLayer,
    DynamicGridLayer,
    ConstellationsLayer,
    SspSurveyAreaLayer,
    SspImageLayer,
    HipparcosCatalogLayer,
    EsoMilkyWayLayer,
    M31Layer,
}


export type LayerName = keyof typeof layerClass


class FrameData {
    component?: FrameComponent
    name: string
    cameraParams: CameraParams
    layers: Record<LayerName, boolean>
    grid: {
        mode: GridMode
        live: boolean
    }
    mixer: Mixer
    catalogs: CatalogState[]
}


export class FrameState extends FrameData {
    constructor(props: FrameData) {
        super()
        Object.assign(this, props)
    }

    globe(cb: (globe: Globe) => void) {
        if (this.component)
            cb(this.component.globe)
    }

    setCameraMode(mode: CameraMode | undefined) {
        if (mode == undefined)
            mode = this.cameraParams.mode + 1
        if (CameraMode[mode] == undefined)
            mode = 0
        this.globe(globe => {
            globe.setCameraMode(mode)
            this.cameraParams = { ...globe.cameraParams }
        })
        this.cameraParams = { ...this.cameraParams, mode }
    }

    jumpTo(params: Partial<CameraParams>) {
        this.globe(globe => globe.jumpTo(params, 350, easing.fastStart4))
    }
}


export interface CatalogState {
    catalog: Catalog
    tableWindow: WindowState
    tableComponent?: CatalogTableComponent
}


function newCatalogState(catalog: Catalog): CatalogState {
    return {
        catalog,
        tableWindow: windowState(true),
    }
}


let frameNum = 1
function initialFrameState(primary = false, override: Partial<FrameData> = {}): FrameState {
    const name = `Frame-${frameNum++}`
    const cameraParams: CameraParams = {
        a: 0,
        d: 0,
        fovy: 1,
        tilt: 0,
        roll: 0,
        mode: CameraMode.STEREOGRAPHIC,
    }
    const layers: Record<LayerName, boolean> = {
        GridLayer: true,
        HipparcosCatalogLayer: primary,
        ConstellationsLayer: true,
        DynamicGridLayer: true,
        EsoMilkyWayLayer: primary,
        SspImageLayer: true,
        SspSurveyAreaLayer: true,
        M31Layer: true,
    }
    const grid = {
        live: true,
        mode: GridMode.SEXAGESIMAL,
    }
    const mixer: Mixer = {
        current: 'simpleRgb',
        simpleRgb: deepCopy(simpleRgbMixerDefaultParams),
        sdssTrueColor: deepCopy(sdssTrueColorMixerDefaultParams),
    }
    const catalogs: CatalogState[] = []
    return new FrameState({
        name,
        cameraParams,
        layers,
        grid,
        mixer,
        catalogs,
        ...override
    })
}


export const mixin = {
    methods: {
        newFrame(this: Root) {
            const primary = this.state.frame.frameWindows.length == 0
            const newFrameWindow: FrameWindowState = {
                frame: initialFrameState(primary, { cameraParams: this.state.frame.current.cameraParams }),
                window: windowState(true),
            }
            this.state.frame.frameWindows.push(newFrameWindow)
            this.state.frame.current = newFrameWindow.frame
        },
        deleteFrameWindow(this: Root, fw: FrameWindowState) {
            const index = this.state.frame.frameWindows.indexOf(fw)
            this.state.frame.frameWindows.splice(index, 1)
        },
        syncCamera(this: Root, e: event.MoveEvent) {
            if (this.state.frame.lock.wcs)
                for (const fw of this.state.frame.frameWindows)
                    fw.frame.cameraParams = { ...e.cameraParams }
        },
        refreshTileLayers(this: Root) {
            for (const fw of this.state.frame.frameWindows)
                fw.frame.component && fw.frame.component.globe.layerOf(Layer, (layer) => {
                    if (layer instanceof TextureTileLayer)
                        layer.refreshTiles()
                })
        },
        pushCatalog(this: Root, catalog: Catalog) {
            this.state.frame.current.catalogs.push(newCatalogState(catalog))
        },
        mouseHoverOnCatalogObject(this: Root, e: { catalog: Catalog, row: any }) {
            for (const fw of this.state.frame.frameWindows)
                for (const cs of fw.frame.catalogs)
                    if (e.catalog == cs.catalog) {
                        cs.tableComponent && cs.tableComponent.markRow(e.row)
                    }
        }
    },
    computed: {
        attributions(this: Root) {
            const set = new Set<Attribution>()
            for (const fw of this.state.frame.frameWindows) {
                for (const k in layerClass)
                    if (fw.frame.layers[k as LayerName])
                        for (const a of layerClass[k as LayerName].attributions)
                            set.add(a)
            }
            return Array.from(set)
        }
    },
    mounted(this: Root) {
        setupFileDrop(this)
    }
}


function setupFileDrop(root: Root) {
    document.addEventListener('drop', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.dataTransfer.files
        for (let i = 0; i < files.length; ++i) {
            root.state.frame.current.catalogs.push(newCatalogState(await Catalog.makeFromFile(files[i])))
            root.state.window.catalogManagerWindow.opened = true
        }
    })
    document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
    })
}