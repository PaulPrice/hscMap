import { PathLayer, Pen as PenBase } from '../layers/path_layer'


export class LineSegmentLayer extends PathLayer {
    pen() {
        return new Pen(this)
    }
}


class Pen extends PenBase {
    finishCurrentPath(close: boolean) {
        if (this.path.length >= 2) {
            if (close) {
                this.path.push(this.path[0])
            }
            for (let i = 0; i < this.path.length - 1; ++i) {
                let a = this.path[i]
                let b = this.path[i + 1]
                let a2 = [0, 1, 2].map(i => 2 * a.pos[i] - b.pos[i]) // a + (a - b) 
                let b2 = [0, 1, 2].map(i => 2 * b.pos[i] - a.pos[i]) // b + (b - a)
                this.attrs.push(...a.pos, ...a2, ...b.pos, +1, 0.5 * a.width, ...a.color)
                this.attrs.push(...a.pos, ...a2, ...b.pos, +1, 0.5 * a.width, ...a.color)
                this.attrs.push(...a.pos, ...a2, ...b.pos, -1, 0.5 * a.width, ...a.color)
                this.attrs.push(...b.pos, ...a.pos, ...b2, +1, 0.5 * b.width, ...b.color)
                this.attrs.push(...b.pos, ...a.pos, ...b2, -1, 0.5 * b.width, ...b.color)
                this.attrs.push(...b.pos, ...a.pos, ...b2, -1, 0.5 * b.width, ...b.color)
            }
        }
        this.path = []
    }
}