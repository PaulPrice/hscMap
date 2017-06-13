declare module "csv-parse/lib/sync" {
    function parse(csv: string): string[][]
    export default parse
}

declare module "csv-stringify" {
    function stringify(records: any[][], cb: (err: any, csv: string) => void): void
    export default stringify
}