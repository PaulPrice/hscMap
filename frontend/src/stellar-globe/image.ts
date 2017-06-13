import { ImageLike } from "./webgl/texture"


interface Options {
    wait?: number
    modifier?: (img: HTMLImageElement) => void
    fallbackBlack?: boolean
}


export function load(url: string, options: Options = {}) {
    return new Promise<ImageLike>((resolve, reject) => {
        let img = new Image()
        if (options.modifier) {
            options.modifier(img)
        }
        img.onload = () => {
            resolve(img)
        }
        img.onerror = (ev: ErrorEvent) => {
            if (options.fallbackBlack)
                resolve(black)
            else
                reject(ev)
        }
        if (options.wait)
            setTimeout(() => { img.src = url; }, options.wait)
        else
            img.src = url
    })
}


const black = new ImageData(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1)