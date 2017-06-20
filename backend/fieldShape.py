import pyfits
import argparse
import sys
import pywcs
import numpy
import logging ; logging.basicConfig(level=logging.INFO)
from shapely.geometry import Polygon
from shapely.ops import cascaded_union
import json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inDir', nargs='+', required=True)
    args = parser.parse_args()

    patchPolygons = []

    for inDir in args.inDir:
        for fname in findFile(inDir, 'calexp-*'):
            logging.info(fname)
            header = fastHeader(fname, 1)
            patchPolygons.append(header2patchPolygon(header))

    union = cascaded_union(patchPolygons)
    union = union.simplify(numpy.deg2rad(0.05))

    boundaries = []
    for b in union.boundary:
        t, u = numpy.array(b.coords[:-1]).T
        x, y, z = tu2xyz(t, u)
        boundaries.append(numpy.vstack((x, y, z)).T.tolist())
    json.dump(boundaries, sys.stdout, indent=2)


def header2patchPolygon(header):
    h = header
    naxis1 = h['NAXIS1']
    naxis2 = h['NAXIS2']
    corners = [(0, 0), (naxis1, 0), (naxis1, naxis2), (0, naxis2)]
    wcs = pywcs.WCS(h)
    a, d = numpy.deg2rad(wcs.all_pix2sky(corners, 0).T)
    x, y, z = ad2xyz(a, d)
    r = 2. / (1. + z)
    t = x*r
    u = y*r
    return Polygon([(t[i], u[i]) for i in range(4)])


def stereographic(a, d):
    x, y, z = ad2xyz(x, y, z)
    

def ad2xyz(a, d):
    cos_d = numpy.cos(d)
    x = cos_d * numpy.cos(a)
    y = cos_d * numpy.sin(a)
    z = numpy.sin(d)
    return [x, y, z]


def tu2xyz(t, u):
    tan_t = numpy.sqrt(t*t + u*u) / 2
    r = 1. / (1 + tan_t*tan_t)
    x = t * r
    y = u * r
    z = (1. - tan_t*tan_t) / (1. + tan_t*tan_t)
    return x, y, z


def findFile(root, pattern):
    import subprocess
    pipe = subprocess.Popen(['find', '-L', root, '-name', pattern], stdout=subprocess.PIPE)
    for fname in pipe.stdout:
        yield fname.rstrip()
    pipe.wait()


def mkdir_p(path):
    import os
    import errno
    try:
        os.makedirs(path)
    except OSError as exc:
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise


def fastHeader(fname, hduIndex):
    from cStringIO import StringIO
    def processIo(io):
        for i in range(hduIndex + 1):
            header = StringIO()
            cardIndex = 0
            exitHeader = False
            while True:
                cardIndex += 1
                card = io.read(80)
                header.write(card)
                if card.startswith('END '):
                    exitHeader = True
                if cardIndex % 36 == 0 and exitHeader:
                    break
        io = StringIO(header.getvalue())
        return pyfits.Header.fromfile(io)

    if fname.endswith('gz'):
        import subprocess
        stderr = StringIO()
        with open('/dev/null') as devnull:
            pipe = subprocess.Popen(['gzip', '-dc', fname], stdout=subprocess.PIPE, stderr=devnull)
        headerObj = processIo(pipe.stdout)
        pipe.stdout.close()
        pipe.wait()
        return headerObj
    else:
        with open(fname) as f:
            return processIo(f)


if __name__ == '__main__':
    main()
