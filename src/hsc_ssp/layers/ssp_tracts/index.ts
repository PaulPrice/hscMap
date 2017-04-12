import { ajax } from "stellar-globe"


interface Tract {
    wcsInfo: { [cardName: string]: any }
    filters: string[]
}

interface TractDict {
    [id: string]: Tract
}


export default function (): Promise<TractDict> {
    if (process.env.HSCMAP_IMAGE_SERVER == 'internal_release') {
        return ajax.getJSON('/images/tract-info.json').promise
    }
    else {
        return new Promise<TractDict>(resolve => {
            process.nextTick(() => {
                resolve(require(`json-loader!./public_release.json`))
            })
        })
    }
}