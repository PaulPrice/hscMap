// thanks to ESO/S. Brunier
// https://www.eso.org/public/images/eso0932a/

import { CubeMappingLayer } from '../../layers/cube_mapping_layer'
import { PathLayer } from '../../layers/path_layer'
import * as image from '../../image'
import { mat4 } from 'gl-matrix'


export class EsoMilkyWayLayer extends CubeMappingLayer {
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
            +0.0017373464070261, -0.4792437255382538, -0.8776800036430359, 0,
            +0.8911036849021912, +0.3990314602851868, -0.2161209583282471, 0,
            +0.4537965655326843, -0.7817283272743225, +0.4277492463588715, 0,
            0, 0, 0, 1
        ])
    })()

    mMatrix() {
        return this.m
    }

    protected alpha() {
        return PathLayer.alpha(this.globe.camera.effectiveFovy)
    }

    static attributions = [{
        which: 'The Milky Way Panorama',
        label: 'ESO/S. Brunier',
        link: 'https://www.eso.org/public/images/eso0932a/',
    }]

    /**
    scale = 0.001

    constructor(globe: Globe) {
        super(globe)
        document.addEventListener('keydown', (e)=> {
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

const urls1024 = ['px', 'py', 'pz', 'nx', 'ny', 'nz'].map(dir => `data/eso_milky_way_layer/images-1024/${dir}.png`)
const urls512 = ['px', 'py', 'pz', 'nx', 'ny', 'nz'].map(dir => `data/eso_milky_way_layer/images-512/${dir}.png`)
/*
import px1024 from 'file-loader!./images-1024/px.png'
import py1024 from 'file-loader!./images-1024/py.png'
import pz1024 from 'file-loader!./images-1024/pz.png'
import nx1024 from 'file-loader!./images-1024/nx.png'
import ny1024 from 'file-loader!./images-1024/ny.png'
import nz1024 from 'file-loader!./images-1024/nz.png'
import px512 from 'file-loader!./images-512/px.png'
import py512 from 'file-loader!./images-512/py.png'
import pz512 from 'file-loader!./images-512/pz.png'
import nx512 from 'file-loader!./images-512/nx.png'
import ny512 from 'file-loader!./images-512/ny.png'
import nz512 from 'file-loader!./images-512/nz.png'

const urls1024 = [
    px1024,
    py1024,
    pz1024,
    nx1024,
    ny1024,
    nz1024,
]

const urls512 = [
    px512,
    py512,
    pz512,
    nx512,
    ny512,
    nz512,
]
*/