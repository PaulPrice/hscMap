import { CatalogLayer } from '../../layers/catalog_layer'
import { Animation } from '../../animation'
import LoadWorker from 'worker-loader!./loader.worker.ts'


export class HipparcosCatalogLayer extends CatalogLayer {
    private alphaValue = 1

    loadCatalog() {
        let loadWorker = new LoadWorker()
        loadWorker.addEventListener('message', (event: MessageEvent) => {
            let array = new Float32Array(event.data as ArrayBuffer)
            this.attribList.setData({ array: array })
            this.globe.requestRedraw()
            this.fadeIn()
        })
        loadWorker.postMessage(null)
    }

    fadeIn() {
        this.alphaValue = 0
        new Animation(this.globe, {
            duration: 500,
            callback: ({ ratio }) => { this.alphaValue = ratio; }
        })
    }

    protected alpha() {
        return super.alpha() * this.alphaValue
    }

    static attributions = [
        {
            which: '',
            label: 'Hipparcos Main Catalog',
            link: 'https://heasarc.gsfc.nasa.gov/W3Browse/all/hipparcos.html',
        }
    ]
}