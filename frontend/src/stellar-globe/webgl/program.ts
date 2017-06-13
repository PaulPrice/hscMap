import { AttribList } from '../webgl/attrib_list'
import { mat4 } from 'gl-matrix'
import * as glUtils from '../webgl/utils'
import * as statue from '../devel/status'
import { TupleKeyMap } from "../tuple_key_map"


const memoize = true
let count = 0


export class Program {
    vertShader: WebGLShader
    fragShader: WebGLShader
    name: WebGLProgram
    attribLocationMemo: { [id: string]: number | undefined } = {}
    uniformLocationMemo: { [id: string]: WebGLUniformLocation | undefined } = {}

    constructor(private gl: WebGLRenderingContext, vertSource: string, fragSource: string) {
        this.vertShader = this.createShader(vertSource, this.gl.VERTEX_SHADER)
        this.fragShader = this.createShader(fragSource, this.gl.FRAGMENT_SHADER)
        this.name = glUtils.nonNull(this.gl.createProgram())
        this.gl.attachShader(this.name, this.vertShader)
        this.gl.attachShader(this.name, this.fragShader)
        this.gl.linkProgram(this.name)
        if (!this.gl.getProgramParameter(this.name, this.gl.LINK_STATUS)) {
            throw `WebGL link error: ${this.gl.getProgramInfoLog(this.name)}`
        }
        statue.update({ program: ++count })
    }

    release() {
        if (!memoize) {
            this.gl.deleteShader(this.fragShader)
            this.gl.deleteShader(this.vertShader)
            this.gl.deleteProgram(this.name)
            statue.update({ program: --count })
        }
    }

    use() {
        this.gl.useProgram(this.name)
    }

    attribLocation(varName: string) {
        let location = this.attribLocationMemo[varName]
        if (location == undefined)
            location = this.gl.getAttribLocation(this.name, varName)
        if (location == -1)
            throw `unknown attribute: ${varName}`
        this.attribLocationMemo[varName] = location
        return location
    }

    uniformLocation(varName: string) {
        let location = this.uniformLocationMemo[varName]
        if (location == undefined)
            location = this.gl.getUniformLocation(this.name, varName) as WebGLUniformLocation; // non-null check
        if (location == null)
            throw `unknown uniform: ${varName}`
        this.uniformLocationMemo[varName] = location
        return location
    }

    enableAttribList(attribList: AttribList, callback: { (): void }) {
        attribList.enable(this, callback)
    }

    uniformMatrix4fv(matrices: { [name: string]: mat4; }, transpose: boolean = false) {
        for (let name in matrices) {
            let matrix = matrices[name]
            this.gl.uniformMatrix4fv(this.uniformLocation(name), transpose, matrix)
        }
    }

    uniform1f(vars: { [name: string]: number; }) {
        for (let name in vars) {
            this.gl.uniform1f(this.uniformLocation(name), vars[name])
        }
    }

    uniform1i(vars: { [name: string]: number; }) {
        for (let name in vars) {
            this.gl.uniform1i(this.uniformLocation(name), vars[name])
        }
    }

    uniform3fv(vars: { [name: string]: number[]; }) {
        for (let name in vars) {
            this.gl.uniform3fv(this.uniformLocation(name), vars[name])
        }
    }

    uniform4fv(vars: { [name: string]: number[]; }) {
        for (let name in vars) {
            this.gl.uniform4fv(this.uniformLocation(name), vars[name])
        }
    }

    private createShader(source: string, type: number): WebGLShader {
        let shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        if (!　this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw `WebGL shader compile error: ${this.gl.getShaderInfoLog(shader)}\nsource:\n${glUtils.addLineNumber(source)}`
        }
        return glUtils.nonNull(shader)
    }

    static make(gl: WebGLRenderingContext, vertSource: string, fragSource: string) {
        return memoize ?
            programPool.fetch([vertSource, fragSource, gl], () => new Program(gl, vertSource, fragSource)) :
            new Program(gl, vertSource, fragSource)
    }
}


const programPool = new TupleKeyMap<[string, string, WebGLRenderingContext], Program>()