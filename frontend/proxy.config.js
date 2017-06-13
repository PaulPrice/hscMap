const pathToRegexp = require('path-to-regexp')


module.exports = {
    internal_release: {
        '/images': {
            target: 'https://hscdata.mtk.nao.ac.jp',
            secure: false,
            pathRewrite(path, req) {
                return rewrite(path, [{
                    pattern: tractInfoPattern,
                    map: (m) => '/hsc_ssp/dr1/s16a/hscMap2/tract-info.json'
                },
                {
                    pattern: sspImagePattern,
                    map: (m) => `/hsc_ssp/dr1/s16a/hscMap2/external/tileImages-png/${m.filter}/s16a_${m.depth}/${m.tractNumber}/${16 - Number(m.level)}/${m.j}/${m.i}.png`
                }, {
                    pattern: m31ImagePattern,
                    map: (m) => `/hsc_ssp/dr1/s16a/hscMap2/external/m31/${m.level}/${m.j}/${m.i}.png`
                }])
            }
        }
    },
    public_release: {
        '/images': {
            target: 'https://hsc-release.mtk.nao.ac.jp',
            secure: false,
            pathRewrite(path, req) {
                return rewrite(path, [{
                    pattern: sspImagePattern,
                    map: (m) => `/hscMap2/external/tiles/pdr1_${m.depth}/tileImages-png/${m.filter}/${m.tractNumber}/${16 - Number(m.level)}/${m.j}/${m.i}.png`
                }, {
                    pattern: m31ImagePattern,
                    map: (m) => `/hscMap2/external/color16/m31/${m.level}/${m.j}/${m.i}.png`
                }])
            }
        }
    },
    hscmap_dedicated: {
        '/data': {
            target: 'http://hscmap.mtk.nao.ac.jp',
            pathRewrite(path, req) {
                return rewrite(path, [])
            }
        }
    },
    local: {
        '/images': {
            target: 'http://localhost:8080',
            secure: false,
            pathRewrite(path, req) {
                return rewrite(path, [{
                    pattern: tractInfoPattern,
                    map: (m) => '/local/tract-info.json'
                },
                {
                    pattern: sspImagePattern,
                    map: (m) => `/local/${m.depth}/tileImages-png/${m.filter}/${m.tractNumber}/${16 - Number(m.level)}/${m.j}/${m.i}.png`
                }, {
                    pattern: m31ImagePattern,
                    map: (m) => `/local/m31/${m.level}/${m.j}/${m.i}.png`
                }])
            }
        }
    },
}


function rewrite(path, rules) {
    for (const rule of rules) {
        const m = rule.pattern(path)
        if (m) {
            return rule.map(m)
        }
    }
    console.warn(`no mapping rule for "${path}"`)
    return path
}


function match({ re, keys }, path) {
    const m = re.exec(path)
    if (m) {
        return Object.assign({}, ...keys.map((k, i) => ({ [k.name]: m[i + 1] })))
    }
}


const sspImagePattern = (() => {
    const pattern = pathPattern('/images/ssp/:tract_id/:filter/:level/:j/:i.png')
    return (path) => {
        const m = match(pattern, path)
        if (m) {
            // m.tract_id => wide-9620
            const [depth, tractNumber] = m.tract_id.split('-')
            return Object.assign(m, { depth, tractNumber })
        }
    }
})()


const m31ImagePattern = (() => {
    const pattern = pathPattern('/images/m31/:level/:j/:i.png')
    return (path) => match(pattern, path)
})()


const tractInfoPattern = (() => {
    const pattern = pathPattern('/data/ssp_tiles/tracts.json')
    return (path) => match(pattern, path)
})()


!(function spec() {
    const settings = module.exports
    console.assert(
        settings.internal_release['/images'].pathRewrite('/images/ssp/wide-9560/HSC-G/2/17/7.png') ==
        '/hsc_ssp/dr1/s16a/hscMap2/external/tileImages-png/HSC-G/s16a_wide/9560/14/17/7.png'
    )
    console.assert(
        settings.public_release['/images'].pathRewrite('/images/ssp/wide-9560/HSC-G/2/17/7.png') ==
        '/hscMap2/external/tiles/pdr1_wide/tileImages-png/HSC-G/9560/14/17/7.png'
    )
})()


function pathPattern(path) {
    const keys = []
    const re = pathToRegexp(path, keys)
    return { re, keys }
}