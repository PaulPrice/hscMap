import { WindowState } from "hsc_ui"
import * as frame from "./frame"
import * as window from "./window"
import * as view from "./view"


export interface State {
    frame: frame.State
    window: window.State
    view: view.State
}


export function initialState(): State {
    return {
        frame: frame.initialState(),
        window: window.initialState(),
        view: view.initialState(),
    }
}


export const mixins = [
    frame.mixin,
    view.mixin,
]