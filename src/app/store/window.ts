import { WindowState, windowState } from "hsc_ui"


export interface State {
    aboutWindow: WindowState
    colorMixerWindow: WindowState
    catalogManagerWindow: WindowState
}


export function initialState(): State {
    return {
        aboutWindow: windowState(false),
        colorMixerWindow: windowState(true),
        catalogManagerWindow: windowState(false),
    }
}