import packedCatalogUrl from 'file-loader!./hipparcos_catalog.packed.json'
import 'polyfill/worker'

interface PackedCatalog {
    nZones: number,
    precision: number,
    zones: Zone[],
}

interface Zone {
    nRaDiv: number,
    nDecDiv: number,
    minDec: number,
    maxDec: number,
    payload: [number, number, number][],
}

addEventListener('message', (event: MessageEvent) => {
    (async () => {
        try {
            const { nZones, zones } = await (await fetch(packedCatalogUrl)).json() as PackedCatalog
            let attrs: number[] = []
            for (const zone of zones) {
                const { nRaDiv, nDecDiv, minDec, maxDec, payload } = zone
                for (const star of payload) {
                    const [raIndex, decIndex, mag] = star
                    const ra = 2 * Math.PI * (raIndex / nRaDiv)
                    const dec = (decIndex / nDecDiv) * (maxDec - minDec) + minDec
                    let flux = Math.pow(10, -mag / 2.5)
                    attrs.push(
                        Math.cos(dec) * Math.cos(ra),
                        Math.cos(dec) * Math.sin(ra),
                        Math.sin(dec),
                        flux,
                    )
                }
            }
            const array = new Float32Array(attrs)
            postMessage(array, [array.buffer] as any)
        }
        catch (e) {
            console.log(e)
        }
        finally {
            close()
        }
    })()
})

/*

import catalogUrl from 'file-loader!./hipparcos_catalog.json'


addEventListener('message', (event: MessageEvent) => {
    (async () => {
        try {
            let catalog = await (await fetch(catalogUrl)).json() as { [id: string]: [number, number, number, number] }
            let attrs: number[] = []
            for (let id in catalog) {
                let [ra, dec, mag, color] = catalog[id]
                color // <- for noUnusedParameters check
                let flux = Math.pow(10, -mag / 2.5)
                attrs.push(
                    Math.cos(dec) * Math.cos(ra),
                    Math.cos(dec) * Math.sin(ra),
                    Math.sin(dec),
                    flux,
                )
            }
            let array = new Float32Array(attrs)
            postMessage(array, [array.buffer] as any)
        }
        finally {
            close()
        }
    })()
})

*/