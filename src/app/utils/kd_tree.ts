type Coord<N> = number[]


interface TreeNode<N, V> {
    coord: Coord<N>
    value: V
    left?: TreeNode<N, V>
    right?: TreeNode<N, V>
}


type Metric<N, V> = (value: V) => Coord<N>


export class KdTree<N, V> {
    readonly n: number
    readonly size: number
    private readonly root: TreeNode<N, V> | undefined

    constructor(values: V[], private value2coord: Metric<N, V>) {
        this.n = values.length == -1 ? 0 : value2coord(values[0]).length
        this.size = values.length
        this.root = this.constructTree(values.slice(), 0)!
    }

    private constructTree(values: V[], dimension: number): TreeNode<N, V> | undefined {
        if (values.length == 0)
            return undefined
        const v2c = this.value2coord
        const i = dimension % this.n
        values.sort((a, b) => v2c(a)[i] - v2c(b)[i])
        let middleIndex = Math.floor(values.length / 2)
        let middleValue = values[middleIndex]
        return {
            coord: v2c(middleValue),
            value: middleValue,
            left: this.constructTree(values.slice(0, middleIndex), i + 1),
            right: this.constructTree(values.slice(middleIndex + 1), i + 1),
        }
    }

    nearest(coord: Coord<N>, maxCount: number = 1, maxDistance = Infinity) {
        if (!this.root)
            return []
        const results: { value: V, d2: number }[] = []
        this.dig(results, coord, this.root, 0, maxCount, maxDistance)
        return results.map(r => r.value)
    }

    private dig(
        results: { value: V, d2: number }[],
        coord: Coord<N>, node: TreeNode<N, V>, dimension: number, maxCount: number, maxDistance: number
    ) {
        const i = dimension % this.n
        const v2c = this.value2coord

        let d2 = distance2(coord, node.coord)
        if (d2 <= maxDistance * maxDistance) {
            let j = 0
            for (j = 0; j < results.length; ++j) {
                if (d2 <= results[j].d2)
                    break
            }
            if (j < maxCount) {
                results.splice(j, 0, { d2, value: node.value })
                results.splice(maxCount)
                if (results.length == maxCount)
                    maxDistance = Math.sqrt(results[results.length - 1].d2)
            }
        }

        if (coord[i] < node.coord[i]) {
            if (node.left)
                this.dig(results, coord, node.left, i + 1, maxCount, maxDistance)
            if (node.right && node.coord[i] - coord[i] < maxDistance)
                this.dig(results, coord, node.right, i + 1, maxCount, maxDistance)
        }
        else {
            if (node.left && coord[i] - node.coord[i] <= maxDistance)
                this.dig(results, coord, node.left, i + 1, maxCount, maxDistance)
            if (node.right)
                this.dig(results, coord, node.right, i + 1, maxCount, maxDistance)
        }
    }
}


function distance<N>(a: Coord<N>, b: Coord<N>) {
    return Math.sqrt(distance2(a, b))
}


function distance2<N>(a: Coord<N>, b: Coord<N>) {
    let d2 = 0
    for (let i = 0; i < a.length; ++i) {
        let d = a[i] - b[i]
        d2 += d * d
    }
    return d2
}