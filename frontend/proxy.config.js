const pathToRegexp = require('path-to-regexp')
const override = (() => {
    const configFile = './proxy-override.config.js'
    let rules = []
    try {
        rules = require(configFile)
    } catch (e) {
        if (String(e) !== `Error: Cannot find module '${configFile}'`)
            throw e
    }
    return rules.map(rule => {
        rule.pathRewrite = pathRewriteFunc(rule.mapping)
        delete rule.mapping
        return rule
    })
})()


module.exports = {
    public: [
        ...override,
        {
            context: '/data',
            target: 'http://hscmap.mtk.nao.ac.jp',
        }
    ],
    internal_release: [
        ...override,
        {
            context: '/data',
            target: 'https://hscdata.mtk.nao.ac.jp',
            secure: false,
            pathRewrite: pathRewriteFunc({
                '/data/ssp_tiles/:depth/:filter/:tractNumber/:level/:j/:i.png':
                m => `/hsc_ssp/dr1/s16a/hscMap2/external/tileImages-png/${m.filter}/s16a_${m.depth}/${m.tractNumber}/${16 - Number(m.level)}/${m.j}/${m.i}.png`,

                '/data/m31/:level/:j/:i.png':
                m => `/hsc_ssp/dr1/s16a/hscMap2/external/m31/${m.level}/${m.j}/${m.i}.png`,

                '/data/ssp_tiles/tracts.json':
                m => '/hsc_ssp/dr1/s16a/hscMap2/tract-info.json',

                '/data/eso_milky_way_layer/images-:size/:dir.png':
                m => `/hsc_ssp/dr1/s16a/hscMap2/external/eso_milky_way_layer/images-${m.size}/${m.dir}.png`,

                '/data/ssp/survey_area.json':
                m => `/hsc_ssp/dr1/s16a/hscMap2/external/survey_area.json`,
            })
        }
    ],
}


function pathRewriteFunc(mappings) {
    const rules = []
    for (const pattern in mappings) {
        rules.push({
            pattern: pathPattern(pattern),
            mapping: mappings[pattern]
        })
    }
    return function (path, req) {
        for (const rule of rules) {
            const m = match(rule.pattern, path)
            if (m) {
                return rule.mapping(m)
            }
        }
        return ''
    }
}


function match({ re, keys }, path) {
    const m = re.exec(path)
    if (m) {
        return Object.assign({}, ...keys.map((k, i) => ({ [k.name]: m[i + 1] })))
    }
}


function pathPattern(path) {
    const keys = []
    const re = pathToRegexp(path, keys)
    return { re, keys }
}