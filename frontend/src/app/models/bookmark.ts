import { serializable } from "../utils/serialize"
import { CameraParams } from "stellar-globe"


export interface BookmarkNode {
    name: string
}


@serializable()
export class Bookmark {
    constructor(public name: string, public cameraParams: CameraParams) {
    }
}


@serializable()
export class BookmarkFolder {
    constructor(public name: string, public children: BookmarkNode[] = []) {
    }
}