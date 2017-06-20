# How to combine your image of your own filter

1. Convert your stacked data into "tile" format.
    1. We need your data in "tile" format that can be delt with hscMap.
    To convert your data into the format, follow [this page](./how_to_make_tiles.md).
    1. Place tile data (you made above) in some location avaliable on http(s). (e.g. http://your-hscmap-data.com/tile_data/). It is OK that the location is protected by BASIC/DIGEST authentication.

1. Tell the place of your tile data to your local hscMap.
    1. Edit the configuration files...
        ```sh:copy-config-file.js
        cd frontend
        cp proxy-override.config{.sample,}.js
        vi proxy-override.config.js
        ```
        `proxy-override.confi.js` will be like this after your tuning:
        ```JavaScript:frontend/proxy-override.config.js
        module.exports = [{
            context: '/data/ssp_tiles/deep/CLAUDS-*', // <= "CLAUDS-*" must match the filter name that was specified in step "making tile".
            target: 'http://your-hscmap-data.com', // <= # change here
            secure: false,
            mapping: {
                '/data/ssp_tiles/deep/CLAUDS-:filter/:tractNumber/:level/:j/:i.png':
                m => `/tile_data/CLAUDS-${m.filter}/:tractNumber/${m.level}/${m.j}/${m.i}.png` // change here
            }
        }]
        ```

1. Add the filter to hscMap
    ```sh:edit-filter.sh
    vi frontend/filter.ts
    ```
    ```JavaScript:filter.ts
    // ...
    const filters = [
        new Filter('HSC-G', 'g', 473.021484385),
        new Filter('HSC-R', 'r', 620.621200501),
        new Filter('HSC-I', 'i', 771.13165993),
        new Filter('HSC-Z', 'z', 892.490879581),
        new Filter('HSC-Y', 'Y', 1002.8270929),
        new Filter('NB0816', '816', 816),
        new Filter('NB0921', '921', 921),
        new Filter('CLAUDS-U', 'u', 365), // <= added. "CLAUDS-U" will be used for file path.
                                          // "u" will be used for display in small space such as color mixer.
    ]
    // ...
    ```

1. Rebuild
    1. Run local dev-server
        ```sh:rebuild.sh
        npm run dev-server
        ```
    1. Open [http://localhost:8080/](http://localhost:8080)