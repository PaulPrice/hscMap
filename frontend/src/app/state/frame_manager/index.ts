import { State } from ".."
import { serializable } from "../../utils/serialize"
import { FrameBind } from "../frame_bind"
import { panelBind, PanelBind } from 'hsc_ui'
import { Attribution, event } from "stellar-globe"
import { layerClass, LayerName } from "../frame_bind/layers_state"
import { Catalog } from "../../models/catalog"
import { catalogState } from "../frame_bind/catalog_state"


type FrameMode = 'single' | 'panel'


@serializable({ inject: ['rootState'] })
export class FrameManager {
    mode: FrameMode = 'single'
    currentFrameIndex = 0
    framePanels: FramePanelBind[] = [this.makeFramePanel()]

    constructor(private rootState: State) { }

    get currentFrame() {
        return this.framePanels[this.currentFrameIndex].frame
    }
    set currentFrame(f: FrameBind) {
        if (this.framePanels.map(fp => fp.frame).indexOf(f) == -1)
            debugger
        this.currentFrameIndex = this.framePanels.map(fp => fp.frame).indexOf(f)
    }

    get attributions() {
        const set = new Set<Attribution>()
        for (const f of this.mode == 'panel' ? this.framePanels.map(fp => fp.frame) : [this.currentFrame]) {
            for (const k in layerClass)
                if (f.layers[k as LayerName])
                    for (const a of layerClass[k as LayerName].attributions)
                        set.add(a)
        }
        return Array.from(set)
    }

    makeFramePanel() {
        const template = this.framePanels && this.currentFrame
        return {
            frame: new FrameBind(!template, template),
            panel: panelBind(true),
        }
    }

    newFrame() {
        this.framePanels.push(this.makeFramePanel())
        this.currentFrameIndex = this.framePanels.length - 1
    }

    deleteFrame(fb: FrameBind) {
        const i = this.framePanels.map(fp => fp.frame).indexOf(fb)
        if (this.framePanels.length > 1) {
            this.framePanels.splice(i, 1)
            this.currentFrameIndex = Math.max(i - 1, 0)
        }
        else {
            this.framePanels[i].panel.opened = true
        }
    }

    deleteCurrentFrame() {
        this.deleteFrame(this.currentFrame)
    }
}


interface FramePanelBind {
    frame: FrameBind
    panel: PanelBind
}


export function setupFileDrop(s: State) {
    const drop = async (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.dataTransfer.files
        for (let i = 0; i < files.length; ++i) {
            s.frameManager.currentFrame.pushCatalog(await Catalog.makeFromFile(files[i]))
            s.panelManager.catalogManager.opened = true
        }
    }
    const dragover = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
    }
    document.addEventListener('drop', drop)
    document.addEventListener('dragover', dragover)
    const cleanup = () => {
        document.removeEventListener('drop', drop)
        document.removeEventListener('dragover', dragover)
    }
    return cleanup
}