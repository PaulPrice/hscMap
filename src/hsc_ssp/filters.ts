export class Filter {
    constructor(readonly name: string, readonly shortName: string) { }
}

const filters = [
    new Filter('HSC-G', 'g'),
    new Filter('HSC-R', 'r'),
    new Filter('HSC-I', 'i'),
    new Filter('HSC-Z', 'z'),
    new Filter('HSC-Y', 'y'),
    new Filter('NB0816', '816'),
    new Filter('NB0921', '921'),
    new Filter('J', 'j'),
    new Filter('K', 'k'),
]

Object.freeze(filters)

export { filters }