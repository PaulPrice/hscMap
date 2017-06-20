module.exports = [{
    context: '/data/ssp_tiles/deep/CLAUDS-*',
    target: 'http://your-hscmap-data.com',
    secure: false,
    mapping: {
        '/data/ssp_tiles/deep/CLAUDS-:filter/:tractNumber/:level/:j/:i.png':
        m => `/tile_data/CLAUDS-${m.filter}/:tractNumber/${m.level}/${m.j}/${m.i}.png`
    }
}]