import {
    MenuBar as xMenuBar,
    MenuBarItem as xMenuBarItem,
    Menu as xMenu,
    MenuItem as xMenuItem,
    Divider as xDivider,
} from './menu'

import xPanel from './panel.vue'
import xFlatButton from './flat_button.vue'
import xColorPicker from './color_picker.vue'
import xFieldset from './fieldset.vue'
import xSelect from './select.vue'

export const components = {
    xMenuBar, xMenuBarItem, xMenu, xMenuItem, xDivider,
    xPanel,
    xFlatButton,
    xColorPicker,
    xFieldset,
    xSelect,
}

interface Rect {
    left: number
    top: number
    right?: number
    bottom?: number
    width?: number
    height?: number
}

export interface PanelBind {
    opened: boolean,
    rect: Rect | null,
    activate?: () => void
}

export function panelBind(opened: boolean): PanelBind {
    return {
        opened,
        rect: null,
    }
}