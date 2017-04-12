export class ResourceHolder {
    private releaseCallbacks: Callback[] = []

    release() {
        for (let [func, args] of this.releaseCallbacks) {
            func(...args)
        }
    }

    protected track<T extends Releasable>(resource: T): T {
        this.onRelease(resource.release.bind(resource))
        return resource
    }

    protected onRelease(func: { (...args: any[]): void; }, ...args: any[]) {
        this.releaseCallbacks.push([func, args])
    }
}

interface Releasable {
    release(): void
}

type Callback = [{ (...args: any[]): void; }, any[]]