import { sprintf } from "sprintf-js"

export function angle2sexadcimal(deg: number, hour: 1 | 15) {
    const sign = deg < 0 ? -1 : 1
    deg = Math.abs(deg)
    const totalSec = deg / hour * 3600
    const s = totalSec % 60
    const m = Math.floor(totalSec / 60 % 60)
    const h = Math.floor(totalSec / 3600)
    return (hour == 1 ? (sign < 0 ? '-' : '+') : '') + sprintf('%02d:%02d:%07.4f', h, m, s)
}