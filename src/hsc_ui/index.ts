import {
    MenuBar as xMenuBar,
    MenuBarItem as xMenuBarItem,
    Menu as xMenu,
    MenuItem as xMenuItem,
    Divider as xDivider
} from './menu'

export const components = {
    xWindow: require('./window'),
    xErrorConsole: require('./error_console.vue'),
    xMenuBar, xMenuBarItem, xMenu, xMenuItem, xDivider,
    xFlatButton: require('./flat_button'),
}

interface Rect {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
}

export interface WindowState {
    opened: boolean,
    rect: Rect | null
}

export function windowState(opened: boolean): WindowState {
    return {
        opened,
        rect: null,
    }
}