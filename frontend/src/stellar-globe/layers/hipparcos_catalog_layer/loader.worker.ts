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