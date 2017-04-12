// extending promise is not correctly implemented in Safari and Firefox

export class HasPromise {
    protected dfd = {
        resolve: undefined as any,
        reject: undefined as any,
    }
    promise = new Promise<any>((resolve, reject) => {
        this.dfd.resolve = resolve
        this.dfd.reject = reject
    })
}