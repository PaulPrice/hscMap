import { Program, ResourceHolder, Texture, ImageFilter, TextureTileBase as Tile } from 'stellar-globe'


abstract class BaseMixer extends ResourceHolder {
    protected gl: WebGLRenderingContext
    protected program: Program

    constructor(protected imageFilter: ImageFilter) {
        super()
        this.gl = imageFilter.gl
        this.program = this.makeProgram()
    }

    protected applyFilter(tile: Tile, images: HTMLImageElement[]) {
        const tileSize = tile.tract.tileSize
        this.program.use()
        this.bindParams()
        this.imageFilter.applyFilter(this.program, tile.texture, tileSize, tileSize, images)
    }
    
    abstract async loadOneTile(tile: Tile): Promise<any>
    abstract makeProgram(): Program
    abstract bindParams(): void
}

export default BaseMixer