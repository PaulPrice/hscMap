import { Vector2 } from "stellar-globe"


export class Rect {
    constructor(public width: number, public height: number, public position: Vector2 = [0, 0]) { }

    get left() { return this.position[0] }
    get top() { return this.position[1] }
    get right() { return this.left + this.width }
    get bottom() { return this.top + this.height }

    intersect(other: Rect) {
        return !(this.right <= other.left || this.left >= other.right) && !(this.top >= other.bottom || this.bottom <= other.top)
    }
}


function packRects(rects: Rect[], height: number) {
    rects = rects.slice().sort((a, b) => a.height - b.height)
    const packed: Rect[] = []
    const cands: Vector2[] = [[0, 0]]
    while (rects.length > 0) {
        const r = rects.pop()!
        cands.sort((a, b) => a[0] - b[0])
        for (let i = 0; i < cands.length; ++i) {
            const c = cands[i]
            r.position = c
            if (r.bottom <= height && packed.every(p => !p.intersect(r))) {
                packed.push(r)
                cands.splice(i, 1, [r.right, r.top], [r.left, r.bottom])
                break
            }
        }
    }
}


export function packRectsOptimally(rects: Rect[], maxSize: number) {
    const maxWidth = powerOf2(Math.max(...rects.map(r => r.width)))
    let height = powerOf2(Math.max(...rects.map(r => r.height)))
    let minArea = Infinity
    let optimalHeight = -1
    for (; true; height <<= 1) {
        const packed = packRects(rects, height)
        const width = powerOf2(Math.max(...rects.map(r => r.right)))
        if (width > maxSize) {
            continue
        }
        const area = width * height
        if (area < minArea) {
            minArea = area
            optimalHeight = height
        }
        if (width == maxWidth)
            break
    }
    if (optimalHeight < 0) {
        throw new Error(`Sprite Texture too large`)
    }
    packRects(rects, optimalHeight)
}


export function powerOf2(n: number) {
    let p = 1
    while (p < n)
        p *= 2
    return p
}