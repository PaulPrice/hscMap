import { State } from ".."
import { serializable } from "../../utils/serialize"
import { BookmarkFolder, Bookmark, BookmarkNode } from "../../models/bookmark"
import { CameraMode, CameraParams, easing } from "stellar-globe"
import csvStringify from 'csv-stringify'
import csvParser from 'csv-parse/lib/sync'


@serializable({ inject: ['rootState'] })
export class BookmarkManager {
    rootFolder = new BookmarkFolder('$ROOT')
    constructor(private rootState: State) { }

    addBookmark() {
        const name = prompt('name?')
        if (name) {
            this.rootFolder.children.push(new Bookmark(name, this.rootState.frameManager.currentFrame.camera.p))
        }
    }

    goto(bookmark: Bookmark) {
        this.rootState.frameManager.currentFrame.jumpTo(bookmark.cameraParams, {
            duration: 2000,
            easingFunc: easing.swing4,
        })
    }

    exportAsCsv() {
        const records: any[] = [['# Name', 'RA', 'DEC', 'Field of View Y', 'mode', 'tilt', 'roll']]
        const walk = (node: BookmarkNode, path: string[]) => {
            if (node instanceof BookmarkFolder)
                for (const child of node.children)
                    walk(child, [...path, node.name])
            else {
                const b = node as Bookmark
                const { mode, a, d, fovy, tilt, roll } = b.cameraParams

                records.push([[...path, b.name].slice(1).join('/'), a, d, fovy, mode, tilt, roll])
            }
        }
        walk(this.rootFolder, [])
        csvStringify(records, (err: any, csv: string) => {
            if (err) {
                console.error(err)
                return
            }
            download(csv, 'text/csv', 'bookmarks.csv')
        })
    }

    importFromCsv() {
        selectFile(async files => {
            for (const f of files) {
                let buffer = new Uint8Array(await readFileAsBuffer(f))
                try {
                    const array = csvParser(new TextDecoder().decode(buffer))
                    for (const row of array) {
                        if (row[0].substr(0, 1) == '#')
                            continue
                        this.applyCsvRow(row)
                    }
                }
                catch (e) {
                    alert(e)
                    console.error(e)
                }
            }
        })
    }

    private applyCsvRow(row: string[]) {
        const [pathString, a, d, fovy, mode, tilt, roll] = row
        const path = pathString.split('/')
        const cameraParams: CameraParams = {
            a: safeNumberParse(a),
            d: safeNumberParse(d),
            fovy: safeNumberParse(fovy, 1),
            mode: safeNumberParse(mode),
            tilt: safeNumberParse(tilt),
            roll: safeNumberParse(roll)
        }
        const name = path[path.length - 1]
        const parent = this.makeFolder(path.slice(0, -1))
        const index = parent.children.map(n => n.name).indexOf(name)
        if (index < 0)
            parent.children.push(new Bookmark(name, cameraParams))
        else {
            if (parent.children[index] instanceof BookmarkFolder)
                parent.children.push(new Bookmark(name, cameraParams))
            else
                (parent.children[index] as Bookmark).cameraParams = cameraParams
        }
    }

    private makeFolder(path: string[]) {
        let node = this.rootFolder
        let nextNode: BookmarkFolder
        for (const name of path) {
            const index = node.children.map(n => n.name).indexOf(name)
            if (index < 0) {
                nextNode = new BookmarkFolder(name)
                node.children.push(nextNode)
            }
            else {
                if (node.children[index] instanceof BookmarkFolder)
                    nextNode = node.children[index] as BookmarkFolder
                else {
                    nextNode = new BookmarkFolder(name)
                    node.children.push(nextNode)
                }
            }
            node = nextNode
        }
        return node
    }

    importFromHscMap2() {
        const json = prompt()
        if (json) {
            try {
                const dig = (node: any) => {
                    if (node.entries)
                        return new BookmarkFolder(node.name, node.entries.map((entry: any) => dig(entry)))
                    else {
                        const { mode, a, d, fovy, tilt, roll } = node
                        return new Bookmark(node.name, { mode, a, d, fovy: 2 * fovy, tilt, roll })
                    }
                }
                const importedBookmarks = dig(JSON.parse(json))
                importedBookmarks.name = 'Imported Bookmarks'
                this.rootFolder.children.push(importedBookmarks)
            }
            catch (e) {
                alert(e)
            }
        }
    }

    restoreToDefault() {
        this.rootFolder = new BookmarkFolder('$ROOT')
    }
}


function download(content: string, contentType: string, filename: string) {
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.download = filename
    a.href = `data:${contentType},${encodeURIComponent(content)}`
    a.click()
    document.body.removeChild(a)
}


function selectFile(callback: (files: File[]) => void) {
    const i = document.createElement('input')
    document.body.appendChild(i)
    i.type = 'file'
    i.addEventListener('change', ev => {
        const files = Array.from((ev.target as any).files) as File[]
        callback(files)
    })
    i.click()
    document.body.removeChild(i)
}


function readFileAsBuffer(f: File) {
    return new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader()
        reader.addEventListener('load', e => resolve(reader.result))
        reader.readAsArrayBuffer(f)
    })
}


function safeNumberParse(s: string, alt = 0) {
    const num = Number(s)
    return Number.isFinite(num) ? num : alt
}