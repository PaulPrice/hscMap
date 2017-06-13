import { Globe, UserCatalogLayer, math } from "stellar-globe"
import { KdTree } from "../utils/kd_tree"
import { serializable } from "../utils/serialize"
import gzip from 'gzip-js'
import csvParser from 'csv-parse/lib/sync'
type Vector3 = math.Vector3


interface CatalogSource {
    name: string
    aCol: number
    dCol: number
    header: string[]
    payload: (any[])[]
}


@serializable({ exclude: ['spatialIndex'] })
export class Catalog implements CatalogSource {
    name: string
    aCol: number
    dCol: number
    header: string[]
    payload: (any[])[]
    spatialIndex: KdTree<3, any>

    constructor(source: CatalogSource) {
        Object.assign(this, source)
        const aCol = this.aCol
        const dCol = this.dCol
        this.spatialIndex = new KdTree<3, any>(this.payload, (row) =>
            math.radec2xyz(math.deg2rad(row[aCol]), math.deg2rad(row[dCol]))
        )
        Object.freeze(this.payload) // prevent vuejs from observing payload
        Object.freeze(this.spatialIndex)
    }

    static reviver(source: CatalogSource) {
        const catalog = new Catalog(source)
        return catalog
    }

    static async makeFromFile(f: File) {
        const catalogSource = await processFile(f)
        const catalog = new Catalog({ ...catalogSource, name: f.name })
        return catalog
    }

    makeLayer(globe: Globe) {
        const { aCol, dCol } = this
        const rows = this.payload.map(row => {
            return { coord: this.xyzOf(row) }
        })
        return new UserCatalogLayer(globe, rows)
    }

    coordOf(row: any) {
        const a = math.deg2rad(row[this.aCol])
        const d = math.deg2rad(row[this.dCol])
        return { a, d }
    }

    xyzOf(row: any) {
        const a = math.deg2rad(row[this.aCol])
        const d = math.deg2rad(row[this.dCol])
        const cos_d = Math.cos(d)
        return [
            cos_d * Math.cos(a),
            cos_d * Math.sin(a),
            Math.sin(d)
        ] as Vector3
    }
}


async function processFile(f: File) {
    let buffer = new Uint8Array(await readFileAsBuffer(f))
    if (f.type == 'application/x-gzip') {
        buffer[2] &= ~0x01 // clear FTEXT bit
        buffer = new Uint8Array(gzip.unzip(buffer) as number[])
    }
    const array = csvParser(new TextDecoder().decode(buffer))
    return array2catalog(array)
}


function array2catalog(array: (string[])[]) {
    let i
    const searchHeaderMaxRow = 100
    for (i = 0; i < searchHeaderMaxRow; ++i) {
        if (!array[i][0].match(/^\s*#/))
            break
    }
    if (i == searchHeaderMaxRow)
        throw new Error(`Couldn't find a header line`)

    if (i == 0) // the first row is header row
        i = +1

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
            const cell = array[i][j]
            const num = Number(cell)
            switch (j) {
                case aCol:
                    row.push(parseAlphaText(cell))
                    break
                case dCol:
                    row.push(parseDeltaText(cell))
                    break;
                default:
                    const parsed = parseNumberString(cell)
                    row.push(parsed.value)
            }
        }
        payload.push(row)
    }

    return {
        aCol,
        dCol,
        header,
        payload,
    }
}


function parseNumberString(s: string): { number: true, value: number } | { number: false, value: string } {
    let value = (() => {
        let m = s.match(/^(\+|-)?inf(inity)?$/i)
        if (m) {
            if (m[1] == '+' || !m[1])
                return Infinity
            return -Infinity
        }
        m = s.match(/^nan$/i)
        if (m)
            return NaN
    })()
    if (value !== undefined) {
        return { value, number: true }
    }
    else {
        value = Number(s)
        if (Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
            return { value, number: true }
        }
        else {
            return { value: s, number: false }
        }
    }
}


function parseAngleText(text: string, hourInDeg: number) {
    const f = Number(text)
    if (isNaN(f)) {
        const match = text.match(/^'?([+-])?(\d+)(?:[:\s+])(\d+)(?:[:\s])((?:\d+)(?:\.\d*)?)'?$/)
        if (match) {
            const [_, sign, h, m, s] = match
            _ // <- for noUnusedParameters check
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