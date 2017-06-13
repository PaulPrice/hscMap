type Handler = (info: Info) => void
type Info = { [name: string]: any }

let info: Info = {}
const handlers: Handler[] = []


export function update(o: { [name: string]: any }) {
    info = { ...info, ...o }
    for (const k of Object.keys(info)) {
        if (info[k] == undefined)
            delete info[k]
    }
    for (const h of handlers) {
        h(info)
    }
}


export function addHandler(handler: Handler) {
    handlers.push(handler)
    return () => removeHandler(handler)
}


export function removeHandler(handler: Handler) {
    const index = handlers.indexOf(handler)
    if (index >= 0)
        handlers.splice(index, 1)
}