from IPython.core.display import display, HTML, Javascript
import json
import cgi
import numpy
import base64
import time
from cStringIO import StringIO
import subprocess
import sys
import os


# HSC_MAP_WINDOW = 'https://hscdata.mtk.nao.ac.jp/hsc_ssp/dr2/s17a/hscMap3/jupyter.html'
# CLIENT_JS = 'https://hscdata.mtk.nao.ac.jp/hsc_ssp/dr2/s17a/hscMap3/jupyter-client.js'
HSC_MAP_WINDOW = 'http://hscmap.mtk.nao.ac.jp/bleeding-edge/jupyter.html'
CLIENT_JS = 'http://hscmap.mtk.nao.ac.jp/bleeding-edge/jupyter-client.js'


# if os.environ.get('JUPYTER_HSCMAP') == 'niu':
#     display(HTML('<div style="font-weight: bold; color: red;">development version(niu)</div>'))
#     HSC_MAP_WINDOW = 'http://niu.mtk.nao.ac.jp:10080/app/jupyter.html'
#     CLIENT_JS = 'http://niu.mtk.nao.ac.jp:10080/app/jupyter-client.js'
# elif os.environ.get('USER') == 'michitaro':
#     display(HTML('<div style="font-weight: bold; color: red;">development version.</div>'))
#     HSC_MAP_WINDOW = 'http://localhost:8080/jupyter.html'
#     CLIENT_JS = 'http://localhost:8080/jupyter-client.js'
# else:
#     HSC_MAP_WINDOW = 'http://hscmap.mtk.nao.ac.jp/bleeding-edge/jupyter.html'
#     CLIENT_JS = 'http://hscmap.mtk.nao.ac.jp/bleeding-edge/jupyter-client.js'

class Globe(object):
    instance = {}

    def __init__(self, external=False):
        self.id = serialNumber()
        self.external = external
        self.instance[self.id] = self
        self.callback = {}
        self.markers = []
        self.contours = []

        runJS(fmt(
            '''
            var dialog = require('base/js/dialog');
            dialog.modal({
                title: 'Click "OK"',
                body: '(This dialog is needed for bypassing pop-up window blocker)',
                buttons: {OK: {click: function() {
                    hscMap.open({id}, {url}, {external})
                }}},
                default_button: 'OK',
                keyboard_manager: IPython.keyboard_manager
            })
            ''',
            external=json.dumps(external),
            url=json.dumps(HSC_MAP_WINDOW), 
            id=json.dumps(self.id)))

    @property
    def view(self):
        return self.sendMessage({'type': 'getView'}, sync=True)

    @view.setter
    def view(self, newView):
        self.sendMessage({'type': 'setView', 'view': newView})

    def jumpTo(self, newView, duration=300):
        self.sendMessage({'type': 'jumpTo', 'view': newView, 'duration': duration})

    @property
    def wheelSensitivity(self):
        return self.sendMessage({'type': 'getWheelSensitivity'}, sync=True)['k']

    @wheelSensitivity.setter
    def wheelSensitivity(self, k):
        self.sendMessage({'type': 'setWheelSensitivity', 'k': k})

    @property
    def udeep(self):
        return self.sendMessage({'type': 'getVisibleDepth', 'which': 'udeep'}, sync=True)
    @udeep.setter
    def udeep(self, visibility):
        self.sendMessage({'type': 'setVisibleDepth', 'which': 'udeep', 'visibility': visibility})

    @property
    def deep(self):
        return self.sendMessage({'type': 'getVisibleDepth', 'which': 'deep'}, sync=True)
    @deep.setter
    def deep(self, visibility):
        self.sendMessage({'type': 'setVisibleDepth', 'which': 'deep', 'visibility': visibility})

    @property
    def wide(self):
        return self.sendMessage({'type': 'getVisibleDepth', 'which': 'wide'}, sync=True)
    @wide.setter
    def wide(self, visibility):
        self.sendMessage({'type': 'setVisibleDepth', 'which': 'wide', 'visibility': visibility})

    @property
    def dud(self):
        return self.sendMessage({'type': 'getVisibleDepth', 'which': 'dud'}, sync=True)
    @wide.setter
    def dud(self, visibility):
        self.sendMessage({'type': 'setVisibleDepth', 'which': 'dud', 'visibility': visibility})

    @property
    def filters(self):
        return self.sendMessage({'type': 'getFilters'}, sync=True)['filters']

    @filters.setter
    def filters(self, filters):
        self.sendMessage({'type': 'setFilters', 'filters': filters})
        return filters

    def queryImage(self, fileName, view={}, size=128):
        tagId = serialNumber()
        jscb = fmt('''
            function(data) {
                var canvas = hscMap.pixelData2canvas(data);
                hscMap.wait(function() { return document.querySelector('#{tagId}'); }, function(container) {
                    container.appendChild(canvas);
                    var fileName = {fileName};
                    if (fileName) {
                        var dataUrl = canvas.toDataURL();
                        hscMap.executePython('import hscMap ; hscMap.Globe.saveURL(' + JSON.stringify(fileName) + ', ' + JSON.stringify(dataUrl) +')');
                    }
                });
            }
        ''', tagId=tagId, fileName=json.dumps(fileName))
        self.sendMessage({'type': 'queryImage', 'view': view, 'size': size}, jsCallback=jscb)
        html = '''<div id="{}"></div>'''.format(tagId)
        display(HTML(html))


    def saveImage(self, fileName=None):
        tagId = serialNumber()
        jscb = fmt('''
            function(data) {
                var canvas = hscMap.pixelData2canvas(data);
                hscMap.wait(function() { return document.querySelector('#{tagId}'); }, function(container) {
                    container.appendChild(canvas);
                    var fileName = {fileName};
                    if (fileName) {
                        var dataUrl = canvas.toDataURL();
                        hscMap.executePython('import hscMap ; hscMap.Globe.saveURL(' + JSON.stringify(fileName) + ', ' + JSON.stringify(dataUrl) +')');
                    }
                });
            }
        ''', tagId=tagId, fileName=json.dumps(fileName))
        self.sendMessage({'type': 'saveImage'}, jsCallback=jscb)
        html = '''<div id="{}"></div>'''.format(tagId)
        display(HTML(html))

    def focusTable(self, header, data, postageStamp=False, size=64, fov=10, onHover=None):
        html = StringIO()
        tableId = serialNumber()
        assert 'ra' in header and 'dec' in header
        coordCol = [header.index('ra') + 1, header.index('dec') + 1]
        if postageStamp:
            coordCol[0] += 1
            coordCol[1] += 1
        hoverId = serialNumber() if onHover else 0
        print >> html, '<table id="{}" class="focusTable" data-coord-col="{}" data-globe-id="{}" data-size="{}" data-fov="{}" data-hover="{}"><thead><tr>'.format(
            tableId, coordCol, self.id, size, fov, hoverId
        )
        print >> html, '<th>No.</th>'
        if postageStamp:
            print >> html, '<th style="font-size: 150%;">&#x1F600;</th>'
        for th in header:
            print >> html, '<th>', th, '</th>'
        print >> html, '</tr></thead><tbody>'
        for i, row in enumerate(data):
            print >> html, '<tr data-index="{}">'.format(i)
            print >> html, '<td>{}</td>'.format(i)
            if postageStamp:
                print >> html, '<td></td>'
            for td in row:
                print >> html, '<td>', td, '</td>'
            print >> html, '</tr>'
        print >> html, '</tbody></table>'
        display(HTML(html.getvalue()))
        if postageStamp:
            runJS('hscMap.queryTablePostageStamps({})'.format(json.dumps(tableId)))
        if onHover:
            self.callback[hoverId] = onHover

    def catalogTable(self, cat, keys='object_id ra dec gcmodel_mag rcmodel_mag icmodel_mag zcmodel_mag ycmodel_mag'.split(), postageStamp=False, size=64, fov=10, onHover=None):
        byKey = {}
        for k in keys:
            byKey[k] = cat[k]
        data = [
            [byKey[k][i] for k in keys]
            for i in range(len(cat.object_id))
        ]
        self.focusTable(keys, data, postageStamp, size, fov, onHover)

    @classmethod
    def saveURL(cls, fileName, dataUrl):
        with open(fileName, 'wb') as f:
            data = dataUrl.split(',', 2)[1]
            f.write(base64.b64decode(data))

    def addCatalog(self, cat, onClick=None):
        radecs = numpy.array([cat.ra, cat.dec]).T.tolist()
        return self.addMarker(radecs, onClick)

    def addMarker(self, radecs, onClick=None):
        catalog = Catalog(self, radecs)
        self.sendMessage({'type': 'addCatalog', 'catalogId': catalog.id, 'radecs': radecs, 'onClick': onClick is not None}, onClick)
        self.markers.append(catalog)
        return catalog

    def removeMarker(self, catalog):
        self.sendMessage({'type': 'removeCatalog', 'catalogId': catalog.id})

    def removeContour(self, catalog):
        self.sendMessage({'type': 'removeCatalog', 'catalogId': catalog.id})

    def clearMarkers(self):
        for m in self.markers:
            m.remove()
        self.markers = []

    def clearContours(self):
        for c in self.contours:
            c.remove()
        self.contours = []
        
    def addContour(self, hdu, levels=numpy.arange(-10, 10, 0.25)):
        import matplotlib.pyplot
        from astropy import wcs as awcs
        wcs = awcs.WCS(hdu.header)
        data = hdu.data
        contours = matplotlib.pyplot.contour(data,
                                             levels=levels,
                                             extent=(1, data.shape[1], 1, data.shape[0]))
        polygons = []
        for level, cc in zip(contours.levels, contours.collections):
            for section in cc.get_paths():
                pix = []
                for vertex in section.iter_segments():
                    pix.append(vertex[0])
                pix = numpy.array(pix)
                sky = wcs.wcs_pix2world(pix, 1)
                polygons.append({
                    'level': level,
                    'vertices': sky.tolist()
                })
        contour = Contour(self)
        self.contours.append(contour)
        self.sendMessage({'type': 'addContour', 'contourId': contour.id, 'contour': polygons})
        return contour


    def sendMessage(self, query, callback=None, jsCallback=None, sync=False):
        globeId = self.id
        messageId = serialNumber()
        data = dict(
            globeId=self.id,
            messageId=messageId,
            sync=sync,
            query=query,
        )
        if jsCallback is None:
            jsCallback = 'undefined'
        runJS(fmt(''' hscMap.sendMessage({globeId}, {dataJSON}, {jsCallback}); ''', **dict(globeId=json.dumps(globeId), dataJSON=json.dumps(data), jsCallback=jsCallback)))
        if callback:
            self.callback[messageId] = callback
        if sync:
            return json.loads(raw_input())

    def onMessage(self, messageId, result):
        if messageId in self.callback:
            return self.callback[messageId](result)


Window = Globe


class Catalog(object):
    def __init__(self, globe, coords = []):
        self.globe = globe
        self._coords = coords
        self.id = serialNumber()

    @property
    def color(self):
        return self.globe.sendMessage({'type': 'getCatalogColor', 'catalogId': self.id}, sync=True)

    @color.setter
    def color(self, newColor):
        self.globe.sendMessage({'type': 'setCatalogColor', 'catalogId': self.id, 'color': newColor})

    @property
    def coords(self):
        return self._coords

    @coords.setter
    def coords(self, coords):
        self._coords = coords
        self.globe.sendMessage({'type': 'setCatalogCoords', 'catalogId': self.id, 'radecs': numpy.array(coords).tolist()})

    def remove(self):
        self.globe.removeMarker(self)


class Contour(object):
    def __init__(self, globe):
        self.id = serialNumber()
        self.globe = globe

    def remove(self):
        self.globe.removeContour(self)


def fmt(template, **args):
    for k, v in args.iteritems():
        template = template.replace('{%s}' % k, str(v))
    return template



def runJS(code):
    runJS.history.append(code)
    display(Javascript(fmt('''
        (function() {
            var code = function() { {code} };
            if (window.hscMap)
                code();
            else {
                if (! window.hscMapLoaded) {
                    window.hscMapLoaded = [];
                    (function() {
                        var script = document.createElement('script');
                        script.src = {CLIENT_JS};
                        document.body.appendChild(script);
                        var interval = 50;
                        function retry() {
                            if (window.hscMap) {
                                var cbs = window.hscMapLoaded;
                                for (var i = 0;  i < cbs.length;  ++i)
                                    cbs[i]();
                                delete window.hscMapLoaded;
                            }
                            else {
                                setTimeout(retry, interval)
                            }
                        }
                        retry()
                    })();
                }
                window.hscMapLoaded.push(code);
            }
        })()
    ''', code=code, CLIENT_JS=json.dumps(CLIENT_JS))))
runJS.history = []


def serialNumber():
    serialNumber.serial += 1
    return '{}{}'.format(serialNumber.base, serialNumber.serial)
serialNumber.base = 'hscmap_{}_'.format(int(time.time()))
serialNumber.serial = 0


def quickPlot(xy, options={}):
    args = [[numpy.array(xy).tolist()], options]
    runJS(fmt('''
        hscMap.flotPlot({args})
    ''', args=json.dumps(args)))