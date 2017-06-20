export class Filter {
    constructor(
        readonly name: string,
        readonly shortName: string,
        readonly wavelength: number,
    ) { }
}

const filters = [
    new Filter('HSC-G', 'g', 473.021484385),
    new Filter('HSC-R', 'r', 620.621200501),
    new Filter('HSC-I', 'i', 771.13165993),
    new Filter('HSC-Z', 'z', 892.490879581),
    new Filter('HSC-Y', 'Y', 1002.8270929),
    new Filter('NB0816', '816', 816),
    new Filter('NB0921', '921', 921),
    // new Filter('CLAUDS-U', 'u', 365),
    // new Filter('J', 'j', 1220),
    // new Filter('K', 'k', 2190),
]

filters.sort((a, b) => a.wavelength - b.wavelength)

Object.freeze(filters)

export { filters }