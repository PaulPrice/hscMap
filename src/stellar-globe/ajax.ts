import { HasPromise } from './has_promise'

interface AjaxOptions {
    responseType: string
    method: string
}

type Callback = (ratio: number) => void

export class Ajax extends HasPromise {
    public xhr: XMLHttpRequest
    private progressCallbacks: Callback[] = []

    constructor(url: string, private options: AjaxOptions) {
        super()
        this.xhr = new XMLHttpRequest()
        this.xhr.open(options.method, url, true)
        this.xhr.responseType = options.responseType
        this.xhr.onload = this.onload
        this.xhr.onerror = this.onerror
        this.xhr.onprogress = this.onprogress
        this.xhr.send()
    }

    progress(callback: Callback) {
        this.progressCallbacks.push(callback)
    }

    private onload = () => {
        let response = this.xhr.response
        if (this.options.responseType == 'json' && typeof (response) == 'string') { // for IE
            console.warn('xhr.responseType seems to be ignored')
            try { response = JSON.parse(response) }
            catch (e) { }
        }
        this.dfd.resolve(response)
    }

    private onerror = (ev: ErrorEvent) => {
        this.dfd.reject([this.xhr, ev])
    }

    private onprogress = (ev: ProgressEvent) => {
        let ratio = ev.lengthComputable ? ev.loaded / ev.total : NaN
        for (let p of this.progressCallbacks)
            p(ratio)
    }
}

export function getJSON(url: string) {
    return new Ajax(url, {
        method: 'get',
        responseType: 'json',
    })
}