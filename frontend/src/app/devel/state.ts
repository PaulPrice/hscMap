import { serializable } from "../utils/serialize"
import { panelBind } from 'hsc_ui'


@serializable()
export class DevelState {
    panel = panelBind(false)
    checkBoard = false
    flashOnLoad = false
}