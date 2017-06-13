export function deepCopy<T>(o: T): T {
    if (Array.isArray(o)) {
        return o.map(c => deepCopy(c)) as any as T
    }
    else if (typeof o == 'object') {
        const clone: any = {}
        for (const k in o)
            clone[k] = deepCopy(o[k])
        return clone
    }
    return o
}