import json
import numpy
import sys
import math


precision = numpy.deg2rad(0.001 / 3600.)
nZones = 36


def main():
    with open('./hipparcos_catalog.json') as f:
        data = json.load(f)

    zones = {}
    for star in data.values():
        [ra, dec, mag, color] = star
        zone = dec2zone(dec)
        if not zone in zones:
            zones[zone] = []
        zones[zone].append(star) 

    json.dump(dict(
        nZones=nZones,
        precision=precision,
        zones=[packZone(zone, stars) for zone, stars in zones.items()]
    ), sys.stdout)



def packZone(zone, stars):
    [minDec, maxDec] = zone2dec(zone)

    ringRadius = 2 * numpy.pi * max(math.cos(minDec), math.cos(maxDec))
    nRaDiv = int(ringRadius / precision) + 1

    ringHeight = maxDec - minDec
    nDecDiv = int(ringHeight / precision) + 1

    payload = []
    for [ra, dec, mag, color] in stars:
        raIndex = int(nRaDiv * ra / (2. * numpy.pi))
        decIndex = int(nDecDiv * (dec - minDec) / ringHeight)
        payload.append([raIndex, decIndex, mag])

    return dict(
        nRaDiv=nRaDiv,
        nDecDiv=nDecDiv,
        minDec=minDec,
        maxDec=maxDec,
        payload=payload,
    )


def dec2zone(dec):
    return int((dec + numpy.pi / 2) / numpy.pi * nZones)


def zone2dec(zone):
    return [numpy.pi * (zone / nZones - 0.5), numpy.pi * ((zone + 1) / nZones - 0.5)]


main()
