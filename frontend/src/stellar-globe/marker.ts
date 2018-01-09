export enum MarkerStyle {
    CIRCLE,
    CROSS1,
    CROSS2,
    CROSS3,
}


export function markerImageData(style: MarkerStyle) {
    switch (style) {
        case MarkerStyle.CIRCLE:
            return circle()
        case MarkerStyle.CROSS1:
            return cross1()
        case MarkerStyle.CROSS2:
            return cross2()
        case MarkerStyle.CROSS3:
            return cross3()
    }
}


const markerSize = 64


function circle(): ImageData {
    const { canvas, ctx } = getCanvas()
    canvas.width = markerSize
    canvas.height = markerSize
    ctx.clearRect(0, 0, markerSize, markerSize)
    ctx.setTransform(markerSize / 2, 0, 0, markerSize / 2, markerSize / 2, markerSize / 2)
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.lineWidth = 0.2
    ctx.arc(0, 0, 1 - ctx.lineWidth, 0, 2 * Math.PI, false)
    ctx.stroke()
    return ctx.getImageData(0, 0, markerSize, markerSize)
}


function cross1(): ImageData {
    const { canvas, ctx } = getCanvas()
    canvas.width = markerSize
    canvas.height = markerSize
    ctx.clearRect(0, 0, markerSize, markerSize)
    ctx.setTransform(markerSize / 2, 0, 0, markerSize / 2, markerSize / 2, markerSize / 2)
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.lineWidth = 0.2
    ctx.moveTo(-1, 0)
    ctx.lineTo(+1, 0)
    ctx.moveTo(0, -1)
    ctx.lineTo(0, 1)
    ctx.stroke()
    return ctx.getImageData(0, 0, markerSize, markerSize)
}


function cross2(): ImageData {
    const { canvas, ctx } = getCanvas()
    canvas.width = markerSize
    canvas.height = markerSize
    ctx.clearRect(0, 0, markerSize, markerSize)
    ctx.setTransform(markerSize / 2, 0, 0, markerSize / 2, markerSize / 2, markerSize / 2)
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.lineWidth = 0.2
    ctx.moveTo(-1, -1)
    ctx.lineTo(+1, +1)
    ctx.moveTo(+1, -1)
    ctx.lineTo(-1, +1)
    ctx.stroke()
    return ctx.getImageData(0, 0, markerSize, markerSize)
}


function cross3(): ImageData {
    const { canvas, ctx } = getCanvas()
    canvas.width = markerSize
    canvas.height = markerSize
    ctx.clearRect(0, 0, markerSize, markerSize)
    ctx.setTransform(markerSize / 2, 0, 0, markerSize / 2, markerSize / 2, markerSize / 2)
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.lineWidth = 0.2
    ctx.moveTo(-1, 0)
    ctx.lineTo(+1, 0)
    ctx.moveTo(0, -1)
    ctx.lineTo(0, 1)
    ctx.stroke()
    ctx.clearRect(-0.5, -0.5, 1, 1)
    return ctx.getImageData(0, 0, markerSize, markerSize)
}


const getCanvas = (() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    return () => ({ canvas, ctx })
})()