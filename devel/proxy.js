const pathToRegexp = require('path-to-regexp')
const _ = require('underscore')


const settings = {
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
}


const setting = settings[process.env.HSCMAP_IMAGE_SERVER || 'internal_release']
if (!setting) {
    throw new Error(`HSCMAP_IMAGE_SERVER must be one of ${Object.keys(settings).join(', ')}`)
}


function rewrite(path, rules) {
    for (const rule of rules) {
        const m = rule.pattern(path)
        if (m) {
            return rule.map(m)
        }
    }
    console.warn(`no mapping role for path "${path}"`)
    return path
}


function match(re, path) {
    const m = re.exec(path)
    if (m) {
        return _.object(_.pluck(re.keys, 'name'), m.slice(1))
    }
}


const sspImagePattern = (() => {
    const pattern = pathToRegexp('/images/ssp/:tract_id/:filter/:level/:j/:i.png')
    return (path) => {
        const m = match(pattern, path)
        if (m) {
            // m.tract_id => wide-9620
            const [depth, tractNumber] = m.tract_id.split('-')
            return _.extend(m, { depth, tractNumber })
        }
    }
})()


const m31ImagePattern = (() => {
    const pattern = pathToRegexp('/images/m31/:level/:j/:i.png')
    return (path) => match(pattern, path)
})()


const tractInfoPattern = (() => {
    const pattern = pathToRegexp('/images/tract-info.json')
    return (path) => match(pattern, path)
})()


!(function spec() {
    console.assert(
        settings.internal_release['/images'].pathRewrite('/images/ssp/wide-9560/HSC-G/2/17/7.png') ==
        '/hsc_ssp/dr1/s16a/hscMap2/external/tileImages-png/HSC-G/s16a_wide/9560/14/17/7.png'
    )
    console.assert(
        settings.public_release['/images'].pathRewrite('/images/ssp/wide-9560/HSC-G/2/17/7.png') ==
        '/hscMap2/external/tiles/pdr1_wide/tileImages-png/HSC-G/9560/14/17/7.png'
    )
})()


module.exports = setting