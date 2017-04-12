import { Root } from '../components/root'


export interface State {
    fullscreen: boolean
    retina: boolean
}


export function initialState(): State {
    return {
        fullscreen: false,
        retina: false,
    }
}


export const mixin = {
    methods: {
        toggleFullscreen(this: Root) {
            this.state.view.fullscreen = !this.state.view.fullscreen
            if (this.state.view.fullscreen)
                requestFullscreen(this.$el)
            else
                exitFullscreen()
        },
        inRetinaDisplay() {
            return window.devicePixelRatio > 1
        }
    },
}


const requestFullscreen = (() => {
    const div = document.createElement('div') as any
    const f = div.requestFullscreen || div.webkitRequestFullScreen || div.mozRequestFullScreen
    return (el: HTMLElement) => {
        return f.call(el)
    }
})()


const exitFullscreen = (() => {
    const d = document as any
    const f = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen
    return () => {
        return f.call(document)
    }
})()