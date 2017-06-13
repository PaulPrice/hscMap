import * as time from './time'
type Callback<T> = () => T
type Resolve<T> = (result: T) => void
type Task<T> = { cb: Callback<T>, resolve: Resolve<T> }


export let timeout = 0


export function push<T>(cb: Callback<T>): Promise<T> {
    return new Promise((resolve) => {
        q.push({ cb, resolve })
        requestProcess()
    })
}


let requested = false
function requestProcess() {
    if (!requested) {
        requested = true
        requestAnimationFrame(() => {
            requested = false
            const start = time.now()
            do {
                let task = q.shift()
                if (task == undefined)
                    break
                const { cb, resolve } = task
                resolve(cb())
            } while (time.now() - start <= timeout)
            if (q.length > 0)
                requestProcess()
        })
    }
}


const q: Task<any>[] = []