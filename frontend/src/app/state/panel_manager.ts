import { panelBind } from "hsc_ui";
import { State } from "."
import { serializable } from '../utils/serialize'


const citizenScience = !!location.search.match(/citizenScience/)


@serializable({ inject: ['rootState'] })
export class PanelManager {
    about = panelBind(false)
    colorMixer = panelBind(true)
    catalogManager = panelBind(false)
    devel = panelBind(false)
    preferences = panelBind(false)
    citizenScience = panelBind(citizenScience)

    constructor(public rootState: State) { }

    toggle(name: string) {
        const self = this as any
        self[name].opened = !self[name].opened
    }
}