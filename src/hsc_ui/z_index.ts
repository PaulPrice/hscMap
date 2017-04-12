const classNames = ['window', 'floating', 'menu']
const base = 1

type Entry = {
    componentInstance: any
    rank: number
}

const entries: Entry[] = []

export function add(componentInstance: any, className: string) {
    const rank = classRank[className]
    addWithRank(componentInstance, rank)
    sync()
}

export function remove(componentInstance: any) {
    const i = findIndex(componentInstance)
    removeByIndex(i)
    sync()
}

export function activate(componentInstance: any) {
    const i = findIndex(componentInstance)
    const rank = entries[i].rank
    removeByIndex(i)
    addWithRank(componentInstance, rank)
    sync()
}

function findIndex(componentInstance: any) {
    return entries.findIndex((e) => e.componentInstance == componentInstance)
}

const classRank = (() => {
    let o: { [className: string]: number } = {}
    for (let i = 0; i < classNames.length; i++) {
        o[classNames[i]] = i
    }
    return o
})()

function addWithRank(componentInstance: any, rank: number) {
    let i = entries.length
    while (--i >= 0) {
        const e = entries[i]
        if (e.rank <= rank)
            break
    }
    entries.splice(i + 1, 0, { rank, componentInstance })
}

function removeByIndex(index: number) {
    entries.splice(index, 1)
}

function getEntry(componentInstance: any) {
    const i = entries.indexOf(componentInstance)
    return entries[i]
}

function setZIndex(componentInstance: any, zIndex: number) {
    const s = componentInstance.$el.style
    s.zIndex = `${zIndex + base}`
}

function sync() {
    for (let i = 0; i < entries.length; ++i) {
        setZIndex(entries[i].componentInstance, i + base)
    }
}