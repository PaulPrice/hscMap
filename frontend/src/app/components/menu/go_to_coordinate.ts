import { FrameBind } from "../../state/frame_bind"
import { math, easing } from "stellar-globe"

export function goToCoordinates(frame: FrameBind) {
    console.log('click')
    const help =
        'format:\n' +
        '\n' +
        '  $ra $dec\n' +
        '    150.0903 2.2103\n' +
        '      OR\n' +
        '    10:00:21.67 +02:12:37.19';

    const { a, d } = frame.camera.p
    const dec = math.rad2deg(d)
    let ra = math.rad2deg(a)
    if (ra < 0)
        ra = 360 - (-ra % 360)
    ra %= 360
    const text = prompt(help, `${ra} ${dec}`)
    if (!text || text.length == 0)
        return
    try {
        const [a, d] = parseCoords(text)
        frame.jumpTo({ a, d }, { duration: 2000, easingFunc: easing.swing4 })
    }
    catch (e) {
        alert(e)
    }
}


function parse1Coord(s: string, hour: number) {
    s = s.replace(new RegExp("\u2212", "g"), '-')
    const m = s.match(/^([+-]?)(\d+):(\d+):(\d+(?:\.\d*)?)$/)
    if (m) {
        let deg = hour * (safeFloat(m[2]) + safeFloat(m[3]) / 60 + safeFloat(m[4]) / 3600)
        if (m[1] == '-')
            deg *= -1
        return math.deg2rad(deg)
    }
    else {
        return math.deg2rad(safeFloat(s))
    }
}


function safeFloat(s: string) {
    return (/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(s)) ? Number(s) : NaN
}


function parseCoords(text: string) {
    const m = text.match(/^\s*(.*?)(?:\s+|\s*,\s*)(.*)$/)
    if (m) {
        const ra = parse1Coord(m[1], 15)
        const dec = parse1Coord(m[2], 1)
        if (isFinite(ra) && isFinite(dec))
            return [ra, dec]
    }
    throw 'invalid format'
}