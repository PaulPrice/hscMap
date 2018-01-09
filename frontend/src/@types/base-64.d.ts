declare module "base-64" {
    function encode(input: string): string
    function decode(input: string): string
    export { encode, decode }
}