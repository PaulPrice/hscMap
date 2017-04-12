type onDropCallback<T> = (arg: T) => void
type Pack<T> = { key: string, num: number, value: T }

export class SizeLimitedDict<T> {
    private byKey: { [key: string]: Pack<T> | undefined } = {}
    private byNum: { [num: number]: Pack<T> | undefined } = {}
    private seq = 0
    private count = 0
    private oldestNum = 0

    constructor(private maxCache: number, private onDrop: undefined | onDropCallback<T> = undefined) {
    }

    set(key: string, value: T) {
        if (this.byKey[key]) {
            this.deleteByKey(key)
            this.set(key, value)
        } else {
            let num = this.seq++
            let pack = { key, num, value }
            this.byKey[key] = pack
            this.byNum[num] = pack
            this.count++
            while (this.count > this.maxCache) {
                this.disposeOldest()
            }
        }
        return this
    }

    get(key: string) {
        let pack: Pack<T> | undefined
        if ((pack = this.byKey[key])) {
            delete this.byNum[pack.num]
            pack.num = this.seq++
            this.byNum[pack.num] = pack
            return pack.value
        } else {
            return undefined
        }
    }

    keys() {
        return Object.keys(this.byKey)
    }

    deleteByKey(key: string) {
        let pack = this.byKey[key]
        if (pack) {
            delete this.byKey[pack.key]
            delete this.byNum[pack.num]
            if (this.onDrop) {
                this.onDrop(pack.value)
            }
            this.count--
        }
    }

    private disposeOldest() {
        let pack: Pack<T> | undefined
        while ((pack = this.byNum[this.oldestNum]) == undefined) {
            this.oldestNum++
        }
        return this.deleteByKey(pack.key)
    }

    clear() {
        while (this.count > 0) {
            this.disposeOldest()
        }
    }

    release() {
        this.clear()
    }

    setMaxCache(newMaxCache: number) {
        this.clear()
        this.maxCache = newMaxCache
    }
}