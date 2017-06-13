export function text2imageData(text: string, font = '48pt sans-serif', color = 'rgba(255, 255, 255, 1)', margin = 10) {
    let { width, height } = elementSize((el) => {
        el.style.font = font
        el.innerText = text
    })
    width += 2 * margin
    height += 2 * margin
    return getCtx(width, height, (ctx) => {
        ctx.font = font
        ctx.textBaseline = 'top'
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (const [o, w] of [[0.25, 15], [0.5, 10], [0.75, 5]]) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${o})`
            ctx.lineWidth = w
            ctx.strokeText(text, margin, margin)
        }

        ctx.fillStyle = color
        ctx.fillText(text, margin, margin)
        return ctx.getImageData(0, 0, width, height)
    })
}


function getCtx<T>(width: number, height: number, cb: (ctx: CanvasRenderingContext2D) => T) {
    const { canvas, ctx } = getCanvas()
    canvas.width = width
    canvas.height = height
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    const retval = cb(ctx)
    ctx.restore()
    return retval
}


const getCanvas = (() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    return () => ({ canvas, ctx })
})()


const elementSize = (function () {
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.visibility = 'hidden'
    return (cb: (el: HTMLElement) => void) => {
        cb(div)
        document.body.appendChild(div)
        const { clientWidth, clientHeight } = div
        document.body.removeChild(div)
        return { width: clientWidth, height: clientHeight }
    }
})()