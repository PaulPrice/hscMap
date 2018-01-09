import { Globe, Layer, GridLayer, DynamicGridLayer, HipparcosCatalogLayer, ConstellationsLayer, EsoMilkyWayLayer, PathLayer } from "stellar-globe"
import { UserCatalogLayer, Vector2, Vector3, math, event } from "stellar-globe"
import { SspSurveyAreaLayer, SspImageLayer, M31Layer } from "hsc_ssp";
import { KdTree } from "app/utils/kd_tree"
import { Cameraman } from './cameraman'
import { filters } from "hsc_ssp"


window.addEventListener('load', e => {
    removeElement(document.querySelector('.loader')!)

    const globe = initGlobe(fullsizeElement())
    const cameraman = new Cameraman(initGlobe(hiddenElement(), false))

    const layers: { [id: number]: Layer } = {}

    window.addEventListener('message', e => {
        checkSecurity(e)
        const query = e.data.query
        if (query) switch (query.type) {
            case 'getView':
                sendBack(e, globe.cameraParams)
                break
            case 'setView':
                globe.cameraParams = { ...globe.cameraParams, ...query.view }
                globe.requestRedraw()
                break
            case 'getWheelSensitivity':
                sendBack(e, { k: globe.wheelFuncSelector.zoomWheel.k })
                break
            case 'setWheelSensitivity':
                globe.wheelFuncSelector.zoomWheel.k = query.k
                break
            case 'getVisibleDepth': {
                let result = false
                console.log(query.which)
                globe.layerOf(SspImageLayer, l => {
                    result = (l as any)[query.which]
                })
                sendBack(e, result)
                break
            }
            case 'setVisibleDepth': {
                for (const g of [globe, cameraman.globe]) {
                    g.layerOf(SspImageLayer, l => {
                        (l as any)[query.which] = query.visibility
                    })
                    g.requestRedraw()
                }
                break
            }
            case 'getFilters': {
                globe.layerOf(SspImageLayer, l => {
                    sendBack(e, { filters: l.mixers.simpleRgb.filters })
                })
                break
            }
            case 'setFilters': {
                for (const g of [globe, cameraman.globe]) {
                    g.layerOf(SspImageLayer, l => {
                        l.mixers.simpleRgb.filters = query.filters as [string, string, string]
                        l.refreshTiles()
                    })
                    g.requestRedraw()
                }
                break
            }
            case 'jumpTo':
                globe.jumpTo(query.view, query.duration)
                break
            // case 'imageDataURL':
            //     if (globe.canvas.toBlob) {
            //         globe.canvas.toBlob(blob => sendBack(e, URL.createObjectURL(blob)))
            //     } else {
            //         sendBack(e, globe.canvas.toDataURL())
            //     }
            //     break
            case 'saveImage': {
                const pixelArray = globe.pixelArray()
                sendBack(e, pixelArray, [pixelArray.buffer])
                break
            }
            case 'queryImage': {
                (async () => {
                    sendBack(e, await cameraman.shoot(query.view, query.size));
                })()
                break
            }
            case 'addCatalog':
                layers[query.catalogId] = catalogLayer(e, globe, query.radecs, query.onClick)
                break
            case 'removeCatalog':
                layers[query.catalogId].release()
                break
            case 'setCatalogCoords':
                (layers[query.catalogId] as UserCatalogLayer).setRows(radecs2rows(query.radecs))
                break
            case 'getCatalogColor':
                sendBack(e, (layers[query.catalogId] as UserCatalogLayer).color)
                break
            case 'setCatalogColor':
                (layers[query.catalogId] as UserCatalogLayer).color = query.color
                globe.requestRedraw()
                break
            case 'addContour':
                layers[query.contourId] = new ContourLayer(globe, query.contour)
                break
            default:
                console.warn('unknown message', e)
        }
    })
})


function sendBack(e: MessageEvent, result: any, transfer?: any[]) {
    const data = e.data
    e.source.postMessage({
        ...data,
        result,
    }, '*', transfer)
}


function catalogLayer(e: MessageEvent, globe: Globe, radecs: Vector3[], onClick: boolean) {
    const layer = new UserCatalogLayer(globe, radecs2rows(radecs))

    const order = radecs.map((v, i) => i)

    if (onClick) {
        const focusLayer = new UserCatalogLayer(globe)
        layer.onRelease(() => {
            focusLayer.release()
        })

        function o2xyz(o: number) {
            const [a, d] = radecs[o]
            return math.radec2xyz(math.deg2rad(a), math.deg2rad(d))
        }

        const spatialIndex = new KdTree<3, number>(order, o2xyz)

        layer.onRelease(globe.on(event.MouseMoveEvent, ev => {
            const maxRadius = 16 / globe.element.clientHeight * globe.camera.effectiveFovy
            const hitRows = spatialIndex.nearest(ev.xyz, 1, maxRadius)
            focusLayer.setRows(hitRows.map(o => ({ coord: o2xyz(o) })))
        }))

        layer.onRelease(globe.on(event.ClickEvent, ev => {
            const maxRadius = 16 / globe.element.clientHeight * globe.camera.effectiveFovy
            const hitRows = spatialIndex.nearest(ev.xyz, 1, maxRadius)
            if (hitRows.length > 0) {
                const clickedIndex = hitRows[0]
                sendBack(e, clickedIndex)
            }
        }))
    }

    return layer
}


function radecs2rows(radecs: Vector2[]) {
    const rows: { coord: Vector3 }[] = []
    for (const [a, d] of radecs) {
        rows.push({ coord: math.radec2xyz(math.deg2rad(a), math.deg2rad(d)) })
    }
    return rows
}


// import contour_ from 'json-loader!./small-contour.json'
// const contour = contour_ as any as ContourData[]


interface ContourData {
    level: number,
    vertices: Vector2[]
}


class ContourLayer extends PathLayer {
    constructor(globe: Globe, contour: ContourData[]) {
        super(globe)
        this.darkenNarrowLine = false
        this.stroke(pen => {
            pen.width = 0
            pen.color = [0, 1, 0, 0.25]
            for (const p of contour) {
                for (const [a, d] of p.vertices) {
                    pen.lineTo(math.radec2xyz(math.deg2rad(a), math.deg2rad(d)))
                }
                pen.up()
            }
        })
    }

    alpha() {
        return 1
    }
}


function initGlobe(mountPoint: HTMLElement, grid = true) {
    const globe = new Globe(mountPoint, true)

    // globe.jumpTo({ a: 215.0783 / 180 * Math.PI, d: 0.9472 / 180 * Math.PI, fovy: 0.001 }, 1)
    globe.jumpTo({ a: 217.6837 / 180 * Math.PI, d: 0.2495 / 180 * Math.PI, fovy: 0.001 }, 1)

    new GridLayer(globe)
    new EsoMilkyWayLayer(globe)
    if (grid)
        new DynamicGridLayer(globe)
    new HipparcosCatalogLayer(globe)
    new ConstellationsLayer(globe)
    new SspSurveyAreaLayer(globe)
    const sspImageLayer = new SspImageLayer(globe)
    sspImageLayer.motionLod = 1
    new M31Layer(globe)
    return globe
}


function fullsizeElement() {
    const el = document.createElement('div')
    el.style.width = '100%'
    el.style.height = '100%'
    document.body.appendChild(el)
    return el
}


function hiddenElement() {
    const el = document.createElement('div')
    document.body.appendChild(el)
    return el
}


function removeElement(el: Element) {
    el.parentElement!.removeChild(el)
}


const whitelist: string[] = []
function checkSecurity(e: MessageEvent) {
    // if (e.origin.indexOf('http://localhost') == 0)
    //     return
    // if (whitelist.indexOf(e.origin) < 0) {
    //     if (confirm(`Would you like to allow ${e.origin} to control hscMap?`)) {
    //         whitelist.push(e.origin)
    //     }
    //     else {
    //         alert('security error')
    //         throw new Error('security error')
    //     }
    // }
}