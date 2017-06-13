// from http://www.usno.navy.mil/USNO/library/historical/images-of-historical-objects-artwork-in-library/rare-books/images/jamieson

import { CubeMappingLayer } from '../../layers/cube_mapping_layer'
import { PathLayer } from '../../layers/path_layer'
import * as image from '../../image'
import { mat4 } from 'gl-matrix'


export class JamiesonCelestialAtlasLayer extends CubeMappingLayer {
    async loadImages() {
        let urls: string[]
        const isFirefox = window.navigator.userAgent.match(/firefox/i)
        if (isFirefox) {
            urls = urls512
            console.warn('using small version of ESO Milky Way images')
        }
        else {
            urls = urls1024
        }
        let promise = Promise.all(urls.map(url => image.load(url))) as Promise<HTMLImageElement[]>
        promise.catch((error) => {
            console.error(error)
        })
        return promise
    }

    m = (() => {
        return mat4.copy(mat4.create(), <any>[
            0.04322255775332451, 0.9976122379302979, -0.05387109890580177, 0, -0.9990606307983398, 0.042994026094675064, -0.00538833299651742, 0, -0.003059281734749675, 0.05405346304178238, 0.9985331296920776, 0, 0, 0, 0, 1
        ])
    })()

    mMatrix() {
        return this.m
    }

    protected alpha() {
        return 0.75 * PathLayer.alpha(this.globe.camera.effectiveFovy)
    }

    static attributions = [{
        which: 'Constellation Illusts',
        label: 'Celestial Atlas by Alexander Jamieson @ U.S. Navy',
        link: 'http://www.usno.navy.mil/USNO/library/historical/images-of-historical-objects-artwork-in-library/rare-books/images/jamieson',
    }]

    /**
    scale = 0.001

    constructor(globe: Globe) {
        super(globe)
        document.addEventListener('keydown', (e) => {
            switch (String.fromCharCode(e.keyCode)) {
                case 'A':
                    this.scale *= e.shiftKey ? 0.5 : 2
                    break
                case 'R':
                    mat4.rotate(this.m, this.m, (e.shiftKey ? +1 : -1) * this.scale, globe.camera.dir)
                    globe.requestRedraw()
                    break
                case 'X':
                    mat4.rotate(this.m, this.m, (e.shiftKey ? +1 : -1) * this.scale, globe.camera.up)
                    globe.requestRedraw()
                    break
                case 'Y':
                    let axis = vec3.cross(vec3.create(), globe.camera.up, globe.camera.dir)
                    mat4.rotate(this.m, this.m, (e.shiftKey ? +1 : -1) * this.scale, axis)
                    globe.requestRedraw()
                    break
            }
            console.log(this.m)
        })
    }
    /**/
}

import px1024 from 'file-loader!./images-1024/px.png'
import py1024 from 'file-loader!./images-1024/py.png'
import pz1024 from 'file-loader!./images-1024/pz.png'
import nx1024 from 'file-loader!./images-1024/nx.png'
import ny1024 from 'file-loader!./images-1024/ny.png'
import nz1024 from 'file-loader!./images-1024/nz.png'

const urls1024 = [
    px1024,
    py1024,
    pz1024,
    nx1024,
    ny1024,
    nz1024,
]

import px512 from 'file-loader!./images-512/px.png'
import py512 from 'file-loader!./images-512/py.png'
import pz512 from 'file-loader!./images-512/pz.png'
import nx512 from 'file-loader!./images-512/nx.png'
import ny512 from 'file-loader!./images-512/ny.png'
import nz512 from 'file-loader!./images-512/nz.png'

const urls512 = [
    '',
    // px512,
    // py512,
    // pz512,
    // nx512,
    // ny512,
    // nz512,
]