// type Key = any[]

export class TupleKeyMap<Key extends any[], V> {
    private root = new Map<any, any>()
    keyLength = -1
    private count = 0

    get size() {
        return this.count
    }

    private checkKeyLength(key: Key) {
        if (this.keyLength < 0) {
            this.keyLength = key.length
        }
        if (this.keyLength != key.length) {
            throw new Error(`invalid key length. [${key}].length != ${this.keyLength}`)
        }
    }

    get(key: Key): V | undefined {
        this.checkKeyLength(key)
        let m: any = this.root
        for (let i = 0; i < key.length; i++) {
            m = m.get(key[i])
            if (m == undefined)
                return undefined
        }
        return m
    }

    set(key: Key, value: V) {
        this.checkKeyLength(key)
        let m = this.root
        for (let i = 0; i < key.length - 1; i++) {
            if (!m.has(key[i]))
                m.set(key[i], new Map())
            m = m.get(key[i])
        }
        const k = key[key.length - 1]
        if (!m.has(k))
            this.count++
        m.set(k, value)
        return this
    }

    has(key: Key) {
        this.checkKeyLength(key)
        let m = this.root
        for (let i = 0; i < key.length - 1; i++) {
            m = m.get(key[i])
            if (m == undefined)
                return false
        }
        return true
    }

    delete(key: Key): boolean {
        this.checkKeyLength(key)
        let m = this.root as any
        let stack = []
        let i
        for (i = 0; i < key.length - 1; i++) {
            stack.push(m)
            m = m.get(key[i])
            if (m == undefined)
                return false
        }
        const ret = m.delete(key[i--])
        while (i >= 0 && m.size == 0) {
            m = stack.pop()
            m.delete(key[i--])
        }
        if (ret)
            this.count--
        return ret
    }

    fetch(key: Key, generator: () => V): V {
        const cache = this.get(key)
        if (cache)
            return cache
        else {
            const value = generator()
            this.set(key, value)
            return value
        }
    }
}


if (process.env.NODE_ENV != 'production') {
    (function spec() {
        const m = new TupleKeyMap<[number, number], string>()
        for (let i = 1; i <= 3; ++i) for (let j = 1; j <= 3; ++j) {
            m.set([i, j], `${i * j}`)
        }
        console.assert(m.get([2, 3]) == '6')
        console.assert(m.get([3, 1]) == '3')
        console.assert(m.size == 9)
        for (let i = 1; i <= 3; ++i) {
            m.delete([i, i])
        }
        console.assert(m.size == 6)
        for (let i = 1; i <= 3; ++i) {
            m.delete([i, i])
        }
        console.assert(m.size == 6)
    })()
}