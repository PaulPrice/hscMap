import pyfits
import pywcs
import numpy


def crop(hdu, x, y, w, h, ltv):
    header = hdu.header
    if ltv:
        imageX = x - header['LTV1']
        imageY = y - header['LTV2']
    else:
        imageX = x
        imageY = y
    if 'CRPIX1' in header:
        header['CRPIX1'] -= imageX
        header['CRPIX2'] -= imageY
    if 'LTV1' in header:
        header['LTV1'] -= imageX
        header['LTV2'] -= imageY
    hdu.data = hdu.data[int(imageY):int(imageY + h), int(imageX):int(imageX + w)]
    return hdu


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--out',       '-o', required=True)
    parser.add_argument('--hdu-index', '-i', type=int, default=1)
    parser.add_argument('--alpha',     '-a', type=float, required=True, help='(deg)')
    parser.add_argument('--delta',     '-d', type=float, required=True, help='(deg)')
    parser.add_argument('--fov',       '-f', type=float, required=True, help='(arcmin)')
    parser.add_argument('--ltv',       action='store_true')
    parser.add_argument('source')
    args = parser.parse_args()

    with pyfits.open(args.source) as hdul:
        hdu = hdul[args.hdu_index]
        wcs = pywcs.WCS(hdu.header)

        [[x, y]] = wcs.wcs_sky2pix([[args.alpha, args.delta]], 0)
        [[_, y2]] = wcs.wcs_sky2pix([[args.alpha, args.delta + 0.5 * args.fov / 60.]], 0)

        hHeight = abs(y2 - y)
        crop(hdu, int(x - hHeight), int(y - hHeight), 2 * hHeight, 2 * hHeight, args.ltv)

        pyfits.HDUList([hdu]).writeto(args.out, clobber=True, output_verify='fix')
