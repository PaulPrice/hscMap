import { ResourceHolder } from './resource_holder'
import { Layer } from './layer'
import { Camera, CameraMode, CameraParams, MIN_FOVY, MAX_FOVY } from './camera'
import { Animation, MotionAnimation } from './animation'
import { MouseFuncSelector } from './mouse/mouse_func_selector'
import { WheelFuncSelector } from './wheel/wheel_func_selector'
import * as event from './event'
import * as easing from './easing'
import * as math from './math'
import { vec3 } from 'gl-matrix'
import * as status from './devel/status'



export class Globe extends ResourceHolder {
    gl: WebGLRenderingContext
    cameraParams: CameraParams = {
        mode: CameraMode.GNOMONIC,
        a: 0, // alpha
        d: 0, // delta
        fovy: 1, // field of view along screen Y axis
        roll: 0,
        tilt: 0,
    }
    camera: Camera
    readonly canvas: HTMLCanvasElement

    constructor(public element: HTMLElement, private offscreen = false) {
        super()
        this.canvas = this.setupElement(offscreen)
        this.onResize()
        this.setupMouse()
        this.setupWheel()
        this.requestRedraw()
        this.refreshCamera()
    }

    release() {
        while (this.layers.length > 0)
            this.layers[0].release()
        super.release()
    }

    private layers: Layer[] = []

    _addLayer(layer: Layer) {
        this.layers.push(layer)
        this.layers.sort((a, b) => a.pane() - b.pane())
        this.requestRedraw()
        status.update({ layers: this.layers.length })
    }

    _removeLayer(layer: Layer) {
        const index = this.layers.indexOf(layer)
        this.layers.splice(index, 1)
        this.requestRedraw()
        status.update({ layers: this.layers.length })
    }

    layerOf<T extends Layer>(klass: { new (...args: any[]): T }, callback: (layer: T) => void, exact = false) {
        let n = 0
        for (const l of this.layers) {
            if (exact ? l.constructor.name == klass.name : l instanceof klass) {
                callback(l as T)
                n++
            }
        }
        return n
    }

    eachLayer(callback: (layer: Layer) => void) {
        for (const l of this.layers)
            callback(l)
    }

    private requestRedrawId: number | undefined
    requestRedraw() {
        if (this.requestRedrawId == null) {
            this.requestRedrawId = requestAnimationFrame(() => {
                this.requestRedrawId = undefined
                this.draw()
            })
        }
    }

    private draw() {
        this.refreshCamera()
        const gl = this.gl
        gl.clearColor(0, 0, 0, 0.5)
        gl.clear(gl.COLOR_BUFFER_BIT)
        for (const layer of this.layers) {
            if (layer.enabled)
                layer.draw()
        }
        gl.flush()
    }

    private cameraModeAnimation: CameraModeAnimation | undefined

    setCameraMode(mode: CameraMode | undefined, duration = 350) {
        if (mode == undefined) { // toggle cyclic
            mode = this.cameraParams.mode + 1
            if (CameraMode[mode] == undefined)
                mode = 0
        }
        if (this.cameraModeAnimation) {
            this.cameraModeAnimation.abort()
        }
        const oldMode = this.cameraParams.mode
        this.cameraParams.mode = mode
        this.cameraModeAnimation = new CameraModeAnimation(this, oldMode, duration)
        return this.cameraModeAnimation.then(() => {
            this.cameraModeAnimation = undefined
            this.trigger(new event.CameraModeChangeEvent(this))
        })
    }

    refreshCamera() {
        const aspectRatio = this.element.clientWidth / this.element.clientHeight
        if (this.cameraModeAnimation) {
            const a = this.cameraModeAnimation
            const camera1 = Camera.fromEquatorialCoord(aspectRatio, this.cameraParams)
            const camera2 = Camera.fromEquatorialCoord(aspectRatio, { ...this.cameraParams, mode: a.oldMode })
            this.camera = Camera.composite([
                { matrix: camera1.pv, scale: a.ratio, },
                { matrix: camera2.pv, scale: 1 - a.ratio, },
            ])
        }
        else {
            this.camera = Camera.fromEquatorialCoord(aspectRatio, this.cameraParams)
        }
    }

    private animations: Animation[] = []
    private animationId: number | undefined

    _addAnimation(a: Animation) {
        if (a instanceof MotionAnimation && this.animations.filter(a => a instanceof MotionAnimation).length == 0) {
            this.trigger(new event.MoveStartEvent(this))
        }
        this.animations.push(a)
        this.startAnimation()
        status.update({ animations: this.animations.length })
    }

    _removeAnimation(a: Animation) {
        const index = this.animations.indexOf(a)
        this.animations.splice(index, 1)
        if (a instanceof MotionAnimation && this.animations.filter(a => a instanceof MotionAnimation).length == 0) {
            this.trigger(new event.MoveEvent(this))
            this.trigger(new event.MoveEndEvent(this))
        }
        status.update({ animations: this.animations.length })
    }

    inMotion() {
        return this.animations.filter(a => a instanceof MotionAnimation).length > 0
    }

    private walkAnimation() {
        if (this.animations.length == 0) {
            this.animationId = undefined
        }
        else {
            this.animationId = requestAnimationFrame(this.walkAnimation.bind(this))
        }
        for (const a of this.animations.slice()) {
            a.update()
        }
        this.draw()
        if (this.animations.some(a => a instanceof MotionAnimation)) {
            this.trigger(new event.MoveEvent(this))
        }
    }

    private startAnimation() {
        if (this.animationId == null) {
            this.animationId = requestAnimationFrame(this.walkAnimation.bind(this))
        }
    }

    stopMotionAnimations() {
        for (const a of this.animations) {
            if (a instanceof MotionAnimation)
                a.quit()
        }
    }

    jumpTo(params2: Partial<CameraParams>, duration = 1000, easingFunc = easing.swing4) {
        this.stopMotionAnimations()
        const p1 = { ...this.cameraParams }
        const p2 = { ...p1, ...params2 }
        if (params2.mode == undefined && p1.mode == CameraMode.GLOBE)
            this.setCameraMode(CameraMode.STEREOGRAPHIC, duration)
        p1.a = math.wrapTo2Pi(p1.a)
        if (Math.abs(p1.a - p2.a) > Math.PI) {
            if (p1.a > p2.a)
                p2.a += 2 * Math.PI
            else
                p1.a += 2 * Math.PI
        }
        const distance = vec3.distance(math.radec2xyz(p1.a, p1.d), math.radec2xyz(p2.a, p2.d))
        return new MotionAnimation(this, {
            duration,
            callback: ({ ratio }) => {
                const r = easingFunc(ratio)
                const f = 1 - (2 * (r - 0.5)) ** 2
                this.cameraParams.a = r * p2.a + (1 - r) * p1.a
                this.cameraParams.d = r * p2.d + (1 - r) * p1.d
                this.cameraParams.fovy = f * Math.max(distance - 2 * p1.fovy, 0) + (1 - r) * p1.fovy + r * p2.fovy
                this.cameraParams.roll = (1 - r) * p1.roll + r * p2.roll
            }
        })
    }

    private setupElement(offscreen: boolean) {
        const canvas = canvasPool.get()
        this.element.appendChild(canvas)
        canvas.style.cursor = 'default'
        canvas.style.backgroundColor = '#000'
        if (BUILD_SETTINGS.DEBUG) {
            canvas.style.backgroundColor = '#003'
        }
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        const glOptions = {
            antialias: false,
            stencil: true,
            alpha: false,
            preserveDrawingBuffer: offscreen,
        }
        this.gl = (canvas.getContext('webgl', glOptions) || canvas.getContext('experimental-webgl', glOptions)) as WebGLRenderingContext
        if (this.gl == null) {
            alert('This browser seem not to support WebGL.')
            throw new Error('webgl not supported')
        }
        window.addEventListener('resize', this.onResize)
        this.onRelease(() => {
            window.removeEventListener('resize', this.onResize)
            this.element.removeChild(canvas)
            canvasPool.retrunBack(canvas)
        })
        return canvas
    }

    setRetina(value: boolean) {
        (this as any).retina = value
        this.onResize()
        this.requestRedraw()
    }

    readonly retina = false
    onResize = () => {
        const ratio = this.retina ? window.devicePixelRatio : 1
        const canvas = this.canvas
        canvas.width = canvas.clientWidth * ratio
        canvas.height = canvas.clientHeight * ratio
        this.resetViewport()
    }

    resize(width: number, height: number) {
        const canvas = this.canvas
        canvas.width = width
        canvas.height = height
        this.resetViewport()
    }

    private resetViewport() {
        const canvas = this.canvas
        this.gl.viewport(0, 0, canvas.width, canvas.height)
        this.trigger(new event.ResizeEvent())
        this.requestRedraw()
    }

    mouseFuncSelector = new MouseFuncSelector(this)

    private setupMouse() {
        this.element.oncontextmenu = () => false

        const mousedown = (ev: MouseEvent) => {
            const mouseFunc = this.mouseFuncSelector.select(ev)
            mouseFunc.start(ev)
        }
        this.element.addEventListener('mousedown', mousedown)
        this.onRelease(() => {
            this.element.removeEventListener('mousedown', mousedown)
        })

        const onDblcick = (ev: MouseEvent) => {
            ev.stopPropagation()
            const { x, y } = this.elementCoord(ev)
            const [a, d] = this.screen2radec(x, y)
            this.jumpTo({ a, d }, 350, easing.fastStart4)
        }
        this.element.addEventListener('dblclick', onDblcick, true)
        this.onRelease(() => this.element.removeEventListener('dblclick', onDblcick))

        const onClick = (ev: MouseEvent) => this.trigger(new event.ClickEvent(this, ev))
        this.element.addEventListener('click', onClick)
        this.onRelease(() => this.element.removeEventListener('click', onClick))

        const onMouseMove = (ev: MouseEvent) => this.trigger(new event.MouseMoveEvent(this, ev))
        this.element.addEventListener('mousemove', onMouseMove)
        this.onRelease(() => this.element.removeEventListener('mousemove', onMouseMove))
    }

    wheelFuncSelector = new WheelFuncSelector(this)

    private setupWheel() {
        const wheel = (ev: WheelEvent) => {
            ev.preventDefault()
            const wheelFunc = this.wheelFuncSelector.select(ev)
            wheelFunc.start(ev)
        }
        this.element.addEventListener('wheel', wheel)
        this.onRelease(() => {
            this.element.removeEventListener('wheel', wheel)
        })
    }

    screen2ndc(x: number, y: number) {
        const { width, height } = this.element.getBoundingClientRect()
        return [
            2 * x / width - 1,
            1 - 2 * y / height,
        ]
    }

    screen2radec(x: number, y: number) {
        const [ndcx, ndcy] = this.screen2ndc(x, y)
        return this.camera.ndc2sphereRadec(ndcx, ndcy, true)
    }

    screen2xyz(x: number, y: number) {
        const [ndcx, ndcy] = this.screen2ndc(x, y)
        return this.camera.ndc2sphereXyz(ndcx, ndcy, true)
    }

    elementCoord(ev: MouseEvent) {
        let offset = this.element.getBoundingClientRect()
        return {
            x: ev.clientX - offset.left,
            y: ev.clientY - offset.top,
        }
    }

    private bounceAnimation: MotionAnimation | undefined
    checkCameraParams() {
        const k = 1.e-2
        if (!this.bounceAnimation && (this.cameraParams.fovy < MIN_FOVY || this.cameraParams.fovy > MAX_FOVY)) {
            (this.bounceAnimation = new MotionAnimation(this, {
                callback: ({ dt }) => {
                    if (MIN_FOVY <= this.cameraParams.fovy && this.cameraParams.fovy <= MAX_FOVY) {
                        this.bounceAnimation!.quit()
                        return
                    }
                    const base = this.cameraParams.fovy > MAX_FOVY ? MAX_FOVY : MIN_FOVY
                    const d = Math.log(this.cameraParams.fovy / base)
                    this.cameraParams.fovy *= Math.exp(-k * dt * d)
                    if (Math.abs(d) < 1.e-2) {
                        this.bounceAnimation!.quit()
                    }
                }
            })).then(() => {
                this.bounceAnimation = undefined
            })
        }
    }


    private eventHandlers = {} as { [name: string]: event.Handler<event.Event>[] | undefined }

    on<T>(klass: event.Class<T>, handler: event.Handler<T>) {
        if (!this.eventHandlers[klass.name]) {
            this.eventHandlers[klass.name] = []
        }
        this.eventHandlers[klass.name]!.push(handler)
        const off = () => this.off(klass, handler)
        this.onRelease(off)
        return off
    }

    off<T>(klass: event.Class<T>, handler: event.Handler<T>) {
        const a = this.eventHandlers[klass.name] || []
        const i = a.indexOf(handler)
        if (i >= 0)
            a.splice(i, 1)
    }

    trigger(e: event.Event) {
        const name = e.constructor.name
        for (const h of this.eventHandlers[name] || [])
            h(e)
    }

    pixelArray() {
        const gl = this.gl
        const w = gl.drawingBufferWidth
        const h = gl.drawingBufferHeight
        const array = new Uint8Array(w * h * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, array)
        return {
            width: w,
            height: h,
            buffer: array.buffer,
        }
    }
}


class CameraModeAnimation extends MotionAnimation {
    ratio = 0
    constructor(globe: Globe, public oldMode: CameraMode, duration: number) {
        super(globe, {
            duration,
            callback: ({ ratio }) => {
                this.ratio = easing.fastStart4(ratio)
            }
        })
    }
}


class CanvasPool {
    // We keep canvases for reusing them
    // because there is no method for explictly releasing a WebGL context.

    private pool: HTMLCanvasElement[] = []
    get() {
        if (this.pool.length > 0)
            return this.pool.pop()!
        else
            return document.createElement('canvas')
    }
    retrunBack(canvas: HTMLCanvasElement) {
        this.pool.push(canvas)
    }
}

const canvasPool = new CanvasPool()