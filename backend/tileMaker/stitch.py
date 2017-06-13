import argparse
import numpy
import pyfits
import logging
import math
import logging ; logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')


def scaleForPreview(hdu, mag0=19):
    logging.info('scaling...')
    scale = 10 ** (0.4 * mag0) / hdu.header['FLUXMAG0']
    hdu.data *= scale
    hdu.header['FLUXMAG0'] *= scale 


def stitchedHdu(files, boundary, nodata=float('nan'), meta_index=0, image_index=1, dtype='float32'):
    #        ^
    #        |
    #        |
    #   +----+----------------+
    #   |    |             (maxx, maxy)
    #   | +--+-------+        |
    #   | |  |    (naxis1-crpix1, naxis2-crpix2)
    #   | |  |       |        |
    #---|-+--O-------+--------+--->
    #   | |  |       |        |
    #   | +--+-------+        |
    #   |(-crpix1, -crpix2)   |
    #   +----+----------------+
    # (minx, miny)
    #

    ((minx, miny), (maxx, maxy)) = boundary

    width = maxx - minx
    height = maxy - miny

    logging.info('allocating image buffer %(width)d x %(height)d' % locals())
    pool = numpy.empty((height, width), dtype=dtype)
    pool.fill(nodata)

    fluxMag0 = None
    for fname in decompressFiles(files):
        logging.info('pasting %(fname)s...' % locals())
        with pyfits.open(fname) as hdul:
            if fluxMag0 is None and 'FLUXMAG0' in hdul[meta_index].header:
                fluxMag0 = hdul[0].header['FLUXMAG0']
            header = hdul[image_index].header
            try:
                data = hdul[image_index].data
            except:
                logging.warning('failed to read %s' % fname)
                continue
            crpix1 = header['CRPIX1']
            crpix2 = header['CRPIX2']
            naxis1 = header['NAXIS1']
            naxis2 = header['NAXIS2']
            pool[int(-crpix2 - miny) : int(naxis2 - crpix2 - miny),
                 int(-crpix1 - minx) : int(naxis1 - crpix1 - minx)] = data
    ref_point_phys1 = crpix1 - header['LTV1']
    ref_point_phys2 = crpix2 - header['LTV2']
    logging.info('reference point in physics coordinate: %d %d' % (ref_point_phys1, ref_point_phys2))

    hdu = pyfits.ImageHDU(pool)
    header['CRPIX1'] = -minx
    header['CRPIX2'] = -miny
    header['LTV1'] = header['CRPIX1'] - ref_point_phys1
    header['LTV2'] = header['CRPIX2'] - ref_point_phys2
    if fluxMag0 is not None:
        header['FLUXMAG0'] = fluxMag0
    hdu.header = header

    return hdu


# def boundary(files, image_index=1):
#     #    ^
#     #    |    +---------+
#     #    |    |        (X,Y)
#     #    |    |         |
#     #    |    +---------+
#     #    |   (x,y)
#     #----O------------------->
#     #    |

#     logging.info('setting stitched image boundary.')

#     def getInfo(fname):
#         logging.info('reading header of %(fname)s...' % locals())
#         with pyfits.open(fname) as hdul:
#             header = hdul[image_index].header
#             return (
#                 int(-header['CRPIX1']),
#                 int(-header['CRPIX2']),
#                 int(-header['CRPIX1'] + header['NAXIS1']),
#                 int(-header['CRPIX2'] + header['NAXIS2']),
#             )

#     minxs = []
#     minys = []
#     maxxs = []
#     maxys = []

#     for minx, miny, maxx, maxy in parallel(getInfo, files):
#         minxs.append(minx)
#         minys.append(miny)
#         maxxs.append(maxx)
#         maxys.append(maxy)
#     return (min(minxs), min(minys)), (max(maxxs), max(maxys))


def decompressFiles(files):
    import shutil
    import threading
    import os, os.path
    import subprocess

    outDir = '/dev/shm/hscMapTileMaker'
    nThreads = 8

    done = {}
    ev = threading.Event()

    def decompress(srcFile):
        key = srcFile
        srcFile = os.path.realpath(srcFile)
        if srcFile.endswith('.gz'):
            outFile = '{}{}'.format(outDir, srcFile)
            outFile = outFile[:-3]
            mkdir_p(os.path.dirname(outFile))
            subprocess.check_call('gzip -d < "{}" > "{}"'.format(srcFile, outFile), shell=True)
        else:
            outFile = '{}{}'.format(outDir, srcFile)
            mkdir_p(os.path.dirname(outFile))
            os.symlink(srcFile, outFile)
        done[key] = outFile
        ev.set()


    q = files[:]
    runningThreads = []
    for fname in files:
        while True:
            while len(runningThreads) < nThreads and len(q) > 0:
                srcFile = q.pop(0)
                th = threading.Thread(target=decompress, args=(srcFile, ))
                th.start()
                runningThreads.append(th)

            if len(done) < len(files):
                ev.wait()
                ev.clear()

            for th in runningThreads:
                if not th.is_alive():
                    th.join()
                    
            runningThreads = [th for th in runningThreads if th.is_alive()]

            if fname in done:
                yield done[fname]
                os.unlink(done[fname])
                break


def mkdir_p(path):
    import os
    import errno
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise