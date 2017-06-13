import { serializable, serialize, deserialize } from '../utils/serialize'
import { FrameManager, setupFileDrop } from "./frame_manager"
import { PanelManager } from "./panel_manager"
import { ViewState } from "./view_state"
import { BookmarkManager } from "./bookmark_manager"
import { DevelState } from "../devel/state";


@serializable({ exclude: ['onRelease'] })
export class State {
    frameManager = new FrameManager(this)
    panelManager = new PanelManager(this)
    viewState = new ViewState(this)
    bookmarkManager = new BookmarkManager(this)
    develState = new DevelState()

    serialize(space?: number) {
        return serialize(this, space)
    }

    static fromJSON(json: string): State {
        const rootState = new this
        return Object.assign(rootState, deserialize(json, { rootState }))
    }

    onRelease: { (): void }[] = []

    onMount() {
        this.onRelease.push(setupFileDrop(this))
    }

    onUnmount() {
        for (const cb of this.onRelease)
            cb()
    }
}