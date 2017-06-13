import { State } from "../../state"


const storageKey = `hscMap3-storage`


export function save(state: State) {
    if (storageAvailable()) {
        if (BUILD_SETTINGS.DEBUG) {
            const json = state.serialize(2)
            console.log(json)
            window.localStorage.setItem(storageKey, json)
        }
        else {
            window.localStorage.setItem(storageKey, state.serialize())
        }
    }
}


export function load() {
    if (storageAvailable()) {
        try {
            const json = window.localStorage.getItem(storageKey)
            if (json)
                return State.fromJSON(json)
        }
        catch (e) {
            console.warn(`failed to restore state: ${e}`)
        }
    }
    return new State()
}


export function clear() {
    storageAvailable() && window.localStorage.removeItem(storageKey)
}


function storageAvailable() {
    try {
        var storage = window.localStorage,
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        console.warn('WebStorage is not available')
        return false;
    }
}