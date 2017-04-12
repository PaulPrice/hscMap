import { Globe, UserCatalogLayer, math } from "stellar-globe"
import { KdTree } from "../utils"
type Vector3 = math.Vector3
const gzip = require('gzip-js')
const csvParser = require('csv-parse/lib/sync')


class CatalogData {
    name: string
    aCol: number
    dCol: number
    count: number
    header: string[]
    payload: (any[])[]
    fileSize: number
    spatialIndex: KdTree<3, any>
}


export class Catalog extends CatalogData {
    constructor(data: CatalogData) {
        super()
        Object.assign(this, data)
    }

    static async makeFromFile(f: File) {
        const catalog = await processFile(f)
        const { aCol, dCol } = catalog
        const spatialIndex = new KdTree<3, any>(catalog.payload, (row) => math.radec2xyz(math.deg2rad(row[aCol]), math.deg2rad(row[dCol])))
        const model = new Catalog({
            ...catalog,
            spatialIndex,
            name: f.name, fileSize: f.size,
        })
        Object.freeze(model.payload) // prevent vuejs from observing payload
        Object.freeze(model.spatialIndex)
        return model
    }

    makeLayer(globe: Globe) {
        const { aCol, dCol } = this
        const rows = this.payload.map(row => {
            const a = math.deg2rad(row[aCol])
            const d = math.deg2rad(row[dCol])
            const cos_d = Math.cos(d)
            return {
                coord: [
                    cos_d * Math.cos(a),
                    cos_d * Math.sin(a),
                    Math.sin(d)] as Vector3
            }
        })
        return new UserCatalogLayer(globe, rows)
    }

    coordOf(row: any) {
        const a = math.deg2rad(row[this.aCol])
        const d = math.deg2rad(row[this.dCol])
        return { a, d }
    }
}


async function processFile(f: File) {
    let buffer = await readFileAsBuffer(f)
    if (f.type == 'application/x-gzip')
        buffer = gzip.unzip(new Uint8Array(buffer))
    const array = csvParser(new Buffer(buffer)) as (string[])[]
    return array2catalog(array)
}


function array2catalog(array: (string[])[]) {
    let i
    for (i = 0; i < array.length; ++i) {
        if (!array[i][0].match(/^\s*#/))
            break
    }
    if (i == array.length)
        throw new Error(`Couldn't find a header line`)

    let aCol = -1
    let dCol = -1
    const aCands = 'ra ra2000 a a2000'.split(' ')
    const dCands = 'dec dec2000 decl decl2000 d d2000'.split(' ')
    const header = array[i - 1].map(h => h.replace(/^\s*#?\s*(.*)\s*$/, '$1'))
    for (let j = header.length; --j >= 0;) {
        if (aCands.indexOf(header[j].toLowerCase()) >= 0) aCol = j
        if (dCands.indexOf(header[j].toLowerCase()) >= 0) dCol = j
    }
    if (aCol == -1 || dCol == -1)
        throw new Error(`Columns for coordinates are not found: ${header.join(', ')}`)

    const nCols = array[i].length
    const payload: (any[])[] = []
    for (; i < array.length; ++i) {
        const row: any[] = []
        for (let j = 0; j < nCols; ++j) {
            const num = Number(array[i][j])
            switch (j) {
                case aCol:
                    row.push(parseAlphaText(array[i][j]))
                    break
                case dCol:
                    row.push(parseDeltaText(array[i][j]))
                    break;
                default:
                    row.push(Math.abs(num) <= Number.MAX_SAFE_INTEGER ? num : array[i][j])
            }
        }
        payload.push(row)
    }

    return {
        aCol,
        dCol,
        header,
        payload,
        count: payload.length,
    }
}


function parseAngleText(text: string, hourInDeg: number) {
    const f = Number(text)
    if (isNaN(f)) {
        const match = text.match(/^'?([+-])?(\d+):(\d+):((?:\d+)(?:\.\d*)?)'?$/)
        if (match) {
            const [_, sign, h, m, s] = match
            const deg = ((!sign || sign == '+') ? 1 : -1) * (
                Number(s) +
                60 * Number(m) +
                3600 * Number(h)
            ) / 3600
            return hourInDeg * deg
        }
        else {
            return NaN
        }
    }
    else {
        return f
    }
}


function parseAlphaText(text: string) {
    return parseAngleText(text, 15)
}


function parseDeltaText(text: string) {
    return parseAngleText(text, 1)
}


function readFileAsBuffer(f: File) {
    return new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader()
        reader.addEventListener('load', e => resolve(reader.result))
        reader.readAsArrayBuffer(f)
    })
}