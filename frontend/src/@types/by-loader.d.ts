declare module "worker-loader!*" {
    const workerFactory: {
        new (): Worker
    }
    export default workerFactory
}

declare module "raw-loader!*" {
    const content: string
    export default content
}

declare module "file-loader!*" {
    const filename: string
    export default filename
}

declare module 'style-loader!*' { }