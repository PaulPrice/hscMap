import * as _ from 'underscore'

export function deepCopy<T>(o: T): T {
    if (_.isArray(o)) {
        return o.map(c => deepCopy(c)) as any as T
    }
    else if (_.isObject(o)) {
        const clone: any = {}
        for (const k in o)
            clone[k] = deepCopy(o[k])
        return clone
    }
    return o
}