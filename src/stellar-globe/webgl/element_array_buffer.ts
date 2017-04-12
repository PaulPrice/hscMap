import * as glUtils from '../webgl/utils'

interface DataOption {
    usage?: any,
    array: Int16Array,
}

export class ElementArrayBuffer {
    name: WebGLBuffer
    usage: number
    length: number

    constructor(private gl: WebGLRenderingContext, dataOption?: DataOption) {
        this.name =  glUtils.nonNull(this.gl.createBuffer())
        if (dataOption)
            this.setData(dataOption)
    }

    release() {
        this.gl.deleteBuffer(this.name)
    }

    bind() { 
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.name)
    }

    unbind() {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    }

    setData({usage, array}: DataOption) {
        this.usage = usage || this.gl.STATIC_DRAW
        this.length = array.length
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.name)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, array, this.usage)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    }
}