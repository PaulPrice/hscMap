declare module "gzip-js" {
    export function unzip(compressed: Uint8Array): string | number[]
}