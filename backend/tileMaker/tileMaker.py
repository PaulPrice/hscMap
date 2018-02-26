import argparse
import glob
import os
import os.path
import errno
import re
import stitch
import traceback
import itertools
import subprocess
import pyfits
import pywcs
import json
import fnmatch
import sys
import logging
logging.basicConfig(level=logging.INFO)
import contextlib


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--outDir', '-o', required=True)
    parser.add_argument('--inDir', '-i', required=True)
    parser.add_argument('--tracts', '-t', nargs='+')
    parser.add_argument('--filters', '-f', nargs='+')
    parser.add_argument('--info-only', action='store_true')
    args = parser.parse_args()
#    args.tracts = getTracts(args)
#    args.filters = getFilters(args)

    for tract in args.tracts:
        if not args.info_only:
            makeTractData(args, tract)
        makeTractInfo(args, tract)

    mergeTractInfo(args.outDir)


def getTracts(args):
    if args.tracts is not None:
        return args.tracts
    else:
        return list(set([path.split('/')[-1] for path in glob.glob('%s/deepCoadd-results/*/*' % args.inDir)]))


def getFilters(args):
    if args.filters is not None:
        return args.filters
    else:
        return 'HSC-G HSC-R HSC-I HSC-Z HSC-Y NB0816 NB0921'.split()


def makeTractData(args, tract):
    boundary = ((-18000, -18000), (18000, 18000))
    rawAllPatchFiles = glob.glob(
        '%s/deepCoadd-results/*/%s/*,*/calexp-*.fits*' % (args.inDir, tract))

    for filterName in args.filters:
        logging.info('makeTractData (%s:%s)...' % (tract, filterName))
        stitchedFits = '%s/tmp/stitched/%s/%s.fits' % (
            args.outDir, tract, filterName)
        patchFiles = glob.glob('%s/deepCoadd-results/%s/%s/*,*/calexp-%s-*.fits*' %
                               (args.inDir, filterName, tract, filterName))

        if len(patchFiles) > 0:
            with rule(stitchedFits, rawAllPatchFiles) as update:
                if update:
                    hdu = stitch.stitchedHdu(patchFiles, boundary)
                    stitch.scaleForPreview(hdu)
                    mkdir_p(os.path.dirname(stitchedFits))
                    pyfits.HDUList([hdu]).writeto(
                        stitchedFits, output_verify='fix', clobber=True)
            pngDir = '%s/tiles-png/%s/%s' % (args.outDir, filterName, tract)
            with rule(pngDir, [stitchedFits]) as update:
                if update:
                    fits2png = '%s/fits2png/fits2png' % os.path.dirname(os.path.realpath(__file__))
                    subprocess.check_call(
                        [fits2png, '-o', pngDir] + [stitchedFits])


def makeTractInfo(args, tract):
    logging.info('gathering tract info: %s...' % tract)
    wcsCards = '''
        NAXIS
        NAXIS1 CRPIX1 CD1_1 CD1_2 CRVAL1 CUNIT1 CTYPE1
        NAXIS2 CRPIX2 CD2_1 CD2_2 CRVAL2 CUNIT2 CTYPE2
    '''.split()

    fits = glob.glob('%s/tmp/stitched/%s/*.fits' % (args.outDir, tract))
    filters = [os.path.basename(fname).split('.')[0] for fname in fits]

    with pyfits.open(fits[0]) as hdul:
        header = hdul[1].header
        wcs = pywcs.WCS(header)
        wcsInfo = {}
        for k in header.keys():
            if k in wcsCards:
                wcsInfo[k] = header[k]

    tractInfo = dict(filters=filters, wcsInfo=wcsInfo)
    mkdir_p(os.path.dirname('%s/tmp/info/tracts/%s.json' % (args.outDir, tract)))
    with open('%s/tmp/info/tracts/%s.json' % (args.outDir, tract), 'wb') as f:
        json.dump(tractInfo, f)


def fname2tracdId(fname):
    return '/'.join(fname.split('/')[-2:]).split('.')[0]


def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise


@contextlib.contextmanager
def rule(target, sources):
    doneFile = target + '/.done'
    if os.path.exists(target):
        if os.path.isdir(target):
            with rule(doneFile, sources) as _update:
                update = _update
        else:
            update = os.path.getmtime(target) <= max(
                max(os.path.getmtime(f), os.path.getctime(f)) for f in sources)
    else:
        update = True

    if update:
        if os.path.isdir(target):
            try:
                os.unlink(doneFile)
            except:
                pass
    else:
        logging.info('dependencies for %s (%s files) skipped' %
                     (target, len(sources)))

    yield update

    if os.path.isdir(target):
        with open(doneFile, 'wb') as f:
            pass


def mergeTractInfo(outDir):
    tracts = {}
    for fname in glob.glob('{}/tmp/info/tracts/*.json'.format(outDir)):
        tractId = fname2tractId(fname)
        with open(fname) as f:
            tracts[tractId] = json.load(f)
    mkdir_p(outDir)
    with open('%s/tracts.json' % outDir, 'wb') as f:
        json.dump(tracts, f, indent=2)


def fname2tractId(fname):
    path = fname.split('/')
    return '{}/{}'.format(path[-5], path[-1].split('.')[0])


if __name__ == '__main__':
    main()
