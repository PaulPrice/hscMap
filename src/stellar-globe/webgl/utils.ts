import { sprintf } from 'sprintf-js'


export function enable(gl: WebGLRenderingContext, features: number[], callback: () => void) {
    for (let feature of features)
        gl.enable(feature)
    callback()
    for (let feature of features)
        gl.disable(feature)
}


export function bind(objects: Bindable[], callback: () => void) {
    for (let o of objects) o.bind()
    callback()
    for (let o of objects) o.unbind()
}


export function addLineNumber(body: string) {
    return body.split("\n")
        .map((line, n) => sprintf('%4d | %s', n + 1, line))
        .join("\n")
}


export function nonNull<T1, T2>(value: T1): T2 {
    if (! value) {
        throw new Error(`non-null check error: ${value}`)
    }
    return <T2><any>value
}


interface Bindable {
    bind(): void
    unbind(): void
}