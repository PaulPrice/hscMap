import { Program, ResourceHolder, Texture, TextureLoader, ImageLike, ImageFilter, TextureTileBase as Tile } from 'stellar-globe'


abstract class BaseMixer extends ResourceHolder {
    protected gl: WebGLRenderingContext
    protected program: Program
    textureLoader: TextureLoader

    constructor(protected imageFilter: ImageFilter) {
        super()
        this.gl = imageFilter.gl
        this.program = this.makeProgram()
        this.textureLoader = this.track(new TextureLoader(this.gl))
    }

    async loadOneTile(tile: Tile) {
        await this.textureLoader.load(this.tileImageUrls(tile), (textures) => {
            const tileSize = tile.tract.tileSize
            this.program.use()
            this.bindParams()
            this.imageFilter.applyFilter(this.program, tile.texture, tileSize, tileSize, textures)
        })
    }

    protected abstract tileImageUrls(tile: Tile): string[]
    protected abstract makeProgram(): Program
    protected abstract bindParams(): void
}

export default BaseMixer