require('flot')
require('./jquery.flot.axislabels.js')
declare var IPython: any


const globe: { [id: string]: Window } = {}
const callback: { [id: string]: (e: MessageEvent) => void } = {}
window.addEventListener('message', onMessage)


!(() => {
    let cb: undefined | (() => void) = undefined
    let running = false
    let lastFocus: JQuery<HTMLElement> | undefined = undefined
    $(document).on('mouseenter.hscMap', '.focusTable tbody tr', function () {
        const tr = $(this)
        if (lastFocus)
            lastFocus.removeClass('focus')
        lastFocus = tr
        tr.addClass('focus')
        const table = tr.closest('table')
        const coordCol = table.data('coord-col')
        const globeId = table.data('globe-id')
        const hoverId = table.data('hover')
        const coord = coordCol.map(function (i: number) { return Number(tr.find('td').eq(i).text()); })
        const a = coord[0] / 180. * Math.PI
        const d = coord[1] / 180. * Math.PI
        sendMessage(globeId, { query: { type: 'setView', view: { a: a, d: d } } })
        if (hoverId && globe[globeId] && !globe[globeId].closed) {
            const action = () => {
                running = true
                const index = tr.data('index')
                executePython(
                    `import hscMap ; hscMap.Globe.instance[${JSON.stringify(globeId)}].callback[${JSON.stringify(hoverId)}](${index})`,
                    () => {
                        running = false
                        if (cb) {
                            cb()
                            cb = undefined
                        }
                    }
                )
            }
            if (running)
                cb = action
            else
                action()
        }
    })
})()


export function init() {
}


export function open(id: string, url: string, external: boolean) {
    console.log(arguments)
    globe[id] = external ? openExternalWindow(url) : openInternalWindow(url)
}


let lastError: undefined | number = undefined
export function executePython(pythonCode: string, done?: () => void) {
    var kernel = IPython.notebook.kernel
    kernel.execute(pythonCode,
        {
            iopub: {
                output: function (output: any) {
                    if (done)
                        done()
                    if (output.content.ename) {
                        const now = performance.now()
                        if (lastError == undefined || now - lastError > 5000)
                            alert(`${output.content.ename}: ${output.content.evalue}\n${pythonCode}`)
                        lastError = performance.now()
                    } else {
                        var js = output.content.data && output.content.data['application/javascript']
                        js && eval(js)
                    }
                }
            }
        }, {
            silent: false
        }
    )
}


function openExternalWindow(url: string) {
    return window.open(url)
}


function openInternalWindow(url: string) {
    const div = document.createElement('div')
    div.className = 'wrapper'
    document.body.appendChild(div)

    jQuery(div).dialog({
        width: 400,
        height: 400,
        closeOnEscape: false,
        dialogClass: 'hscMap',
        position: {
            of: window,
            at: 'right bottom',
            me: 'right bottom'
        },
        close() {
            iframe.contentWindow.close()
            $(div).closest('.ui-dialog').remove()
            $(div).remove()
        },
    })

    var iframe = document.createElement('iframe')
    iframe.src = url
    div.appendChild(iframe)
    return iframe.contentWindow
}


function submitRawInput(data: any) {
    const keydown = new jQuery.Event('keydown')
    keydown.which = jQuery.ui.keyCode.ENTER
    wait(() => $('.raw_input:last').get(0), inputElemenet => {
        const input = $(inputElemenet)
        input.val(JSON.stringify(data)).trigger(keydown); // FIX
    })
}


function onMessage(e: MessageEvent) {
    console.info(e)

    var data: MessageData = e.data
    var g = globe[data.globeId!]
    var resultJSON = JSON.stringify(data.result || null)
    resultJSON = resultJSON.replace(/\btrue\b/, 'True').replace(/\bfalse\b/, 'False')

    // TODO
    // if (e.origin != '{URL}')
    //     throw new Error('security error')

    if (data.sync) {
        submitRawInput(data.result)
    }
    if (g) {
        var cb
        if (cb = callback[data2callbackId(data)]) {
            cb(data.result)
        }
        const python = `import hscMap ; hscMap.Globe.instance[${JSON.stringify(data.globeId)}].onMessage(${JSON.stringify(data.messageId)}, ${resultJSON})`
        executePython(python)
    }
    else {
        console.warn('unknwon globe', e)
    }
}


function data2callbackId(data: MessageData) {
    return data.globeId + '-' + data.messageId
}


interface MessageData {
    globeId?: string
    messageId?: string
    sync?: boolean
    query: any
    result?: any
}


export function sendMessage(globeId: string, data: MessageData, cb?: (result: any) => void) {
    console.log(data)
    if (cb)
        callback[data2callbackId(data)] = cb
    var g = globe[globeId]
    if (g && !g.closed) {
        g.postMessage(data, '*')
    }
    else {
        // alert('Target window is already closed')
        if (data.sync) {
            submitRawInput(null)
        }
    }
}


export function wait<T>(condition: () => T, done: (result: T) => void) {
    var interval = 25
    function retry() {
        var val = condition()
        if (val)
            done(val)
        else
            setTimeout(retry, interval)
    }
    retry()
}


export function queryTablePostageStamps(tableId: string) {
    var table = $('#' + tableId)
    var coordCol = table.data('coord-col')
    var globeId = table.data('globe-id')
    var size = table.data('size')
    var fov = table.data('fov')

    function tr2coord(tr: JQuery<HTMLElement>) {
        return coordCol.map(function (i: number) { return Number(tr.find('td').eq(i).text()) / 180. * Math.PI; })
    }

    table.find('tbody').find('tr').each(function () {
        var tr = $(this)
        var coord = tr2coord(tr)
        var view = {
            a: coord[0],
            d: coord[1],
            fovy: (fov / 3600) / 180. * Math.PI,
        }
        const data: MessageData = {
            globeId: globeId,
            messageId: uid(),
            query: { type: 'queryImage', size: size, view: view },
            sync: false,
        }
        sendMessage(globeId, data, (pixelData: PixelData) => {
            var canvas = pixelData2canvas(pixelData)
            tr.find('td').eq(1).append(canvas)
        })
    })
}


const uid = (() => {
    let serial = 0
    return () => `js-${++serial}`
})()


interface PixelData {
    width: number
    height: number
    buffer: ArrayBuffer
}


export function pixelData2canvas(data: PixelData) {
    var array = new Uint8ClampedArray(data.buffer)
    var imageData = new ImageData(array, data.width, data.height)
    var canvas = document.createElement('canvas')
    canvas.width = data.width
    canvas.height = data.height
    var ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)
    return canvas
}


const makeFlot = (function () {
    let flotElement: HTMLElement | undefined

    return function () {
        if (flotElement)
            return flotElement

        const wrapper = fullsizeElement()
        document.body.appendChild(wrapper)
        flotElement = fullsizeElement()
        wrapper.appendChild(flotElement)

        $(wrapper).dialog({
            width: 400,
            height: 300,
            closeOnEscape: false,
            position: {
                of: window,
                at: 'right top',
                me: 'right top'
            },
            close() {
                $(wrapper).closest('.ui-dialog').remove()
                $(wrapper).remove()
                flotElement = undefined
            },
        })

        return flotElement
    }
})()


function fullsizeElement() {
    const div = document.createElement('div')
    const s = div.style
    s.width = '100%'
    s.height = '100%'
    return div
}


export function flotPlot(data: any) {
    const j = $ as any
    const div = makeFlot()
    j.plot($(div), ...data)
}