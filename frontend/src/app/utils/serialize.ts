const deserializerKey = '__hsc_serializer__'


export function serialize(value: any, space?: number) {
    return JSON.stringify(value, undefined, space)
}


export function deserialize(json: string, context: any = {}) {
    return JSON.parse(json, function (key: any, value: any) {
        if (value && value[deserializerKey]) {
            const deserializer = deserializers[value[deserializerKey]]
            return deserializer(value, context)
        }
        return value
    })
}


export interface Options {
    exclude: string[]
    name: string | undefined
    inject: string[]
    only?: string[] | undefined
    reviver?: (value: any, context: any) => any
}


const defaultOptions: Options = {
    exclude: [],
    name: undefined,
    inject: [],
}


const deserializers: { [name: string]: any } = {}


export function serializable(options: Partial<Options> = {}) {
    return function (constructor: Function) {
        options = { ...defaultOptions, ...options }
        const name = options.name || constructor.name

        console.assert(constructor.prototype.toJSON == undefined)
        console.assert(deserializers[name] == undefined)

        constructor.prototype.toJSON = function (this: any, key: string) {
            options = { ...defaultOptions, ...options }
            const o: any = { [deserializerKey]: name }
            if (options.only) {
                for (const k of options.only) {
                    o[k] = this[k]
                }
            }
            else {
                for (const k in this)
                    if (this.hasOwnProperty(k))
                        if (options.exclude!.indexOf(k) == -1 && options.inject!.indexOf(k) == -1)
                            o[k] = this[k]
            }
            return o
        }

        deserializers[name] = (value: any, context: any) => {
            const reviver = options.reviver || (constructor as any).reviver
            if (reviver) {
                return reviver(value, context)
            }
            else {
                const o = new (constructor as any)()
                delete value[deserializerKey]
                Object.assign(o, value)
                for (const i of options.inject!)
                    o[i] = context[i]
                return o
            }
        }
    }
}