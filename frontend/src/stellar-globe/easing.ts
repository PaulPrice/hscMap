export function linear(r: number) {
    return r
}

export function fastStart2(r: number) {
    return 1 - (1 - r) ** 2
}

export function fastStart4(r: number) {
    return 1 - (1 - r) ** 4
}

export function slowStart2(r: number) {
    return r ** 2
}

export function slowStart4(r: number) {
    return r ** 4
}

export function swing4(r: number) {
    r *= 2
    if (r <= 1) {
        return slowStart4(r) / 2
    } else {
        return 0.5 + fastStart4(r - 1) / 2
    }
}

export function sine(r: number) {
    return (Math.cos(Math.PI * (1 - r)) + 1) / 2
}

export function clamp(x: number, a: number, b: number) {
    return x < a ? a : (x > b ? b : x)
}