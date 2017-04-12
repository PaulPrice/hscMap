interface Options {
    wait?: number
    modifier?: (img: HTMLImageElement) => void
    fallbackBlack?: boolean
}


export function load(url: string, options: Options = {}) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        let img = new Image()
        if (options.modifier) {
            options.modifier(img)
        }
        img.onload = () => {
            resolve(img)
        }
        img.onerror = (ev: ErrorEvent) => {
            if (options.fallbackBlack)
                getBlackImage().then(black =>
                    resolve(black)
                )
            else
                reject(ev)
        }
        if (options.wait)
            setTimeout(() => { img.src = url; }, options.wait)
        else
            img.src = url
    })
}


let black: HTMLImageElement | undefined

const blackPromise = load(require('url-loader!./black.png')).then(img => {
    return black = img
})

function getBlackImage() {
    if (black) {
        return Promise.resolve(black)
    }
    else {
        return blackPromise
    }
}