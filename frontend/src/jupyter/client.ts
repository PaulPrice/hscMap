import * as hscMap from './client-module'
import 'style-loader!css-loader!sass-loader!./jupyter-client.scss'


if ((window as any).hscMap) {
    alert('clear all outputs first & save & reload')
}
else {
    (window as any).hscMap = hscMap
    hscMap.init()
}