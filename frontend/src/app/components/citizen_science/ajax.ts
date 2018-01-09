export function postJSON(url: string, data: any) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.responseType = 'json'
        xhr.onload = () => {
            if (xhr.status != 200)
                reject({ xhr })
            else
                resolve(xhr.response)
        }
        xhr.onerror = e => reject({ e, xhr })
        xhr.send(JSON.stringify(data))
    })
}


export function getJSON(url: string) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'json'
        xhr.addEventListener('load', e => resolve(
            typeof xhr.response == 'string' ? JSON.parse(xhr.responseText) : xhr.response
        ))
        xhr.send()
    })
}