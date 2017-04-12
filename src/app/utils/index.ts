export { KdTree } from "./kd_tree"
export { deepCopy } from "./deep_copy"


export const onRelease = {
    methods: {
        onRelease(this: any, ...cb: any[]) {
            this._releasePool = this._releasePool || []
            this._releasePool.push(cb)
        },
        track(this: any, resource: any) {
            this.onRelease(resource.release.bind(resource))
            return resource
        }
    },
    beforeDestroy(this: any) {
        for (const cb of this._releasePool || []) {
            const [f, ...args] = cb
            f(...args)
        }
    }
}