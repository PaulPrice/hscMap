import { serializable } from "../../utils/serialize"
import { Vector4, MarkerStyle } from "stellar-globe"
import { panelBind, PanelBind } from 'hsc_ui'
import { Catalog } from "../../models/catalog"


@serializable()
export class CatalogState {
    catalog: Catalog
    show: boolean
    markerStyle: MarkerStyle
    markerColor: Vector4
    table: PanelBind
}


export function catalogState(catalog: Catalog): CatalogState {
    return {
        catalog,
        show: true,
        markerStyle: MarkerStyle.CIRCLE,
        markerColor: [0, 1, 0, 0.5],
        table: panelBind(false),
    }
}