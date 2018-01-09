import { Globe, Layer, CameraParams, TileLayer, TextureTileLayer, event } from "stellar-globe";


class Sync {
    q: any[] = []
    open = true

    critical<T>(f: () => Promise<T>) {
        return new Promise(resolve => {
            this.q.push(async () => {
                resolve(await f())
            })
            this.challenge()
        })
    }

    private async challenge() {
        if (this.open && this.q.length > 0) {
            this.open = false
            const g = this.q.shift()
            await g()
            this.open = true
            setTimeout(this.challenge.bind(this), 0)
        }
    }
}


export class Cameraman extends Sync {
    constructor(public globe: Globe) {
        super()
        globe.layerOf(Layer, l => {
            if (l instanceof TextureTileLayer) {
                l.searchAltTiles = false
                l.dissolveEffect = false;
                (l as any).scaleBias = () => {
                    return 0
                }
            }
        })
        this.resize(400, 400)
    }

    resize(width: number, height: number) {
        this.globe.resize(width, height)
    }

    async shoot(view: Partial<CameraParams>, size?: number) {
        return this.critical(async () => {
            size && this.resize(size, size)
            this.globe.cameraParams = { ...this.globe.cameraParams, ...view }
            await this.waitForDone()
            return this.globe.pixelArray()
        })
    }

    private async waitForDone() {
        await new Promise(resolve => {
            const check = () => {
                let done = true
                let cnt = 0
                this.globe.layerOf(Layer, l => {
                    if (l instanceof TileLayer) {
                        cnt++
                        done = done && l.done()
                    }
                })
                if (done) {
                    this.globe.off(event.LoadDoneEvent, check)
                    this.globe.requestRedraw()
                    requestAnimationFrame(resolve)
                }
            }
            this.globe.on(event.LoadDoneEvent, check)
            check()
        })
    }
}