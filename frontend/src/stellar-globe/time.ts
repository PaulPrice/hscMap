export let now: () => number


if (window.performance && window.performance.now) {
    now = window.performance.now.bind(window.performance)
}
else {
    let start = new Date()
    now = function () {
        return <any>(new Date()) - <any>start
    }
}


export function sleep(duration: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration)
    })
}