const w : number = window.innerWidth 
const h : number = window.innerHeight 
const parts : number = 5 
const scGap : number = 0.02 / parts 
const delay : number = 20 
const backColor : string = "#bdbdbd"
const colors : Array<string> = [
    "#f44336",
    "#3F51B5",
    "#006064",
    "#9C27B0",
    "#FF9800"
] 

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }
    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawSquareInLine(context : CanvasRenderingContext2D, scale : number) {
        const size : number = w / (2 * parts + 1)
        const sf : number = ScaleUtil.sinify(scale)
        for (let j = 0; j < parts; j++) {
            const sfj : number = ScaleUtil.divideScale(sf, j, parts)
            context.save()
            context.translate(size * (2 * j + 1), 0)
            context.fillRect(-size * 0.5 * sfj, -size * 0.5 * sfj, size * sfj, size * sfj)
            context.restore()
        }
    }

    static drawSILNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.fillStyle = colors[i]
        context.save()
        context.translate(0, (2 * i + 1) * (h / (2 * parts + 1)))
        DrawingUtil.drawSquareInLine(context, scale)
        context.restore()
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0 
    prevScale : number = 0 
    dir : number = 0 

    update(cb : Function) {
        this.scale += this.dir * scGap 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0 
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number 

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class SILNode {

    prev : SILNode 
    next : SILNode 
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new SILNode(this.i + 1)
            this.next.prev = this 
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawSILNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : SILNode {
        var curr : SILNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class SquareInLine {

    curr : SILNode = new SILNode(0)
    dir : number = 1 

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    sil : SquareInLine = new SquareInLine()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.sil.draw(context)
    }
    
    handleTap(cb : Function) {
        this.sil.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.sil.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}