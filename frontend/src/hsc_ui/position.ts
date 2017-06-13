type PositionElement = HTMLElement | Window
type PositionDescriptor = [PositionElement, string]


export var setPosition = function ({ target, ref }: { target: [HTMLElement, string], ref: PositionDescriptor }) {
    const el = target[0]
    const display = el.style.display
    el.style.display = 'inline-block'
    const targetCoord = clientCoord(target)
    const refCoord = clientCoord(ref);
    const dx = targetCoord.x - refCoord.x;
    const dy = targetCoord.y - refCoord.y;
    const { left, top } = getRect(el)
    el.style.left = `${left - dx}px`;
    el.style.top = `${top - dy}px`;
    return el.style.display = display;
};


interface Env {
    [name: string]: any
}


function clientCoord([el, text]: [PositionElement, string]) {
    let [xText, yText] = text.split(';')
    if (yText == undefined)
        yText = xText
    const javascript = (expr: string, scope: Env) => {
        return `
            (function() {
                ${ Object.keys(scope).map(k => `var ${k} = ${JSON.stringify(scope[k])}`).join('; ')};
                return ${expr};
            })()
        `
    }
    let rect = getRect(el)
    const x = eval(javascript(xText, { ...rect, center: (rect.left + rect.right) / 2 }))
    const y = eval(javascript(yText, { ...rect, center: (rect.top + rect.bottom) / 2 }))
    return { x, y }
}


export function getRect(el: PositionElement): Rect {
    if (el instanceof Window) {
        return {
            top: 0,
            left: 0,
            right: el.innerWidth,
            bottom: el.innerHeight,
            width: el.innerWidth,
            height: el.innerHeight
        };
    } else {
        const { left, right, top, bottom, width, height } = el.getBoundingClientRect();
        return { left, right, top, bottom, width, height }
    }
}


export function getLoc(el: HTMLElement) {
    const { left, top } = el.getBoundingClientRect();
    return { left, top }
}


export function setRect(el: HTMLElement, rect: Rect) {
    const s = el.style
    s.top = `${rect.top}px`
    s.left = `${rect.left}px`
    s.width = `${rect.width}px`
    s.height = `${rect.height}px`
}


export function setLoc(el: HTMLElement, loc: { left: number, top: number }) {
    const s = el.style
    s.top = `${loc.top}px`
    s.left = `${loc.left}px`
}


interface Rect {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
}