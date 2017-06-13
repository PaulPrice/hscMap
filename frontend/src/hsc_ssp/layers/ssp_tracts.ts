interface Tract {
    wcsInfo: { [cardName: string]: any }
    filters: string[]
}

interface TractDict {
    [id: string]: Tract
}

export default async function () {
    return await (await fetch('/data/ssp_tiles/tracts.json')).json()
}