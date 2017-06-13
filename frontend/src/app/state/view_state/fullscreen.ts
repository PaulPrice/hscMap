export const requestFullscreen = (() => {
    const div = document.createElement('div') as any
    const f = div.requestFullscreen || div.webkitRequestFullScreen || div.mozRequestFullScreen
    return (el: HTMLElement) => {
        return f.call(el)
    }
})()


export const exitFullscreen = () => {
    const d = document as any
    const f = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen
    return f.call(document)
}


export const onFullscreenchange = (cb: (isFullscreen: boolean) => void) => {
    const cb2 = () => {
        const doc = document as any
        cb(!!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement))
    }
    const eventNames = 'mozfullscreenchange fullscreenchange webkitfullscreenchange'.split(' ')
    for (const name of eventNames) {
        document.addEventListener(name, cb2)
    }
    const offFullscreenchange = () => {
        for (const name of eventNames) {
            document.removeEventListener(name, cb2)
        }
    }
    return offFullscreenchange
}