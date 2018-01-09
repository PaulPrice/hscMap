import json
import os.path
import numpy


pkgDir = os.path.dirname(__file__)

with open('{}/index.json'.format(pkgDir)) as f:
    objects = json.load(f)

coords = [[o['ra'], o['dec']] for o in objects]


def fetchData(specId):
    with open('{}/data/{}.json'.format(pkgDir, objects[specId]['id'])) as j:
        data = json.load(j)
    return Spec(data)


class Spec(object):
    def __init__(self, raw):
        self.raw = raw
        self.wavelength = numpy.power(10, raw['loglam'])
        self.flux = numpy.array(raw['flux'])
        self.sky  = numpy.array(raw['sky'])
        self.ivar = numpy.array(raw['ivar'])


def updateSpectrumViewer(index):
    import hscMap

    spec = fetchData(index)
    hscMap.quickPlot(numpy.array([spec.wavelength, spec.flux]).T, dict(
        axisLabels=dict(show=True),
        xaxes=[dict(axisLabel='wavelength (&Aring;)')],
        yaxes=[dict(position='left', axisLabel='flux (10<sup>-17</sup> ergs/s/cm<sup>2</sup>/&Aring;)')],
    ))