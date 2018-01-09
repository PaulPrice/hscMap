# Copyright 2016-2017 Yusuke Hayashi, The HSC Software Team
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

__all__ = ["stamp_options", "fetch_stamps", "fetch_one_stamp"]

import os
import urllib2
import ssl
import tarfile
import getpass
from io import BytesIO

import pandas

import config
import webaccount

class Stamp(object):
    url = "https://hscdata.mtk.nao.ac.jp/das_quarry/cgi-bin/quarryImage"
    boundary = "------------------------hscdatapythonlib"

    def __init__(self, catalog):
        """
        @param catalog: Catalog
        """
        self.catalog = catalog

        directory = "{}stamps/{}/".format(config.file_save_root, id(self.catalog))
        while os.path.exists(directory):
            directory += "_"
        os.makedirs(directory)
        self.directory_path = directory

        # Conditons corresponds to filelists.
        # When user request stamps with options which is never requested,
        # condition and filelist are added to condtions and filelists at the sametime.
        self.conditions = []
        self.filelists = []

        # In addition to conditon above, condtions_for_one have key of "object_number"
        self.conditions_for_one = []
        self.filepath_for_one = []

    def get_stamps(self, filter=None, sw=None, sh=None,
                   rerun=None, tract=None, image=None, mask=None, variance=None, type=None):
        rerun = rerun if rerun else self.catalog._release_name
        options = stamp_options(filter, sw, sh, rerun, tract, image, mask, variance, type)
        for i, condition in enumerate(self.conditions):
            if condition == options:
                return self.filelists[i]

        filelist = fetch_stamps(self.catalog.ra, self.catalog.dec, options, self.directory_path)
        self.conditions.append(options)
        self.filelists.append(filelist)
        return filelist

    def get_one_stamp(self, object_number, filter=None, sw=None, sh=None,
                      rerun=None, tract=None, image=None, mask=None, variance=None, type=None):
        options = stamp_options(filter, sw, sh, rerun, tract, image, mask, variance, type, for_url=True)
        options["object_number"] = object_number
        for i, condition in enumerate(self.conditions_for_one):
            if condition == options:
                return self.filepath_for_one[i]

        file_path = fetch_one_stamp(self.catalog.ra[object_number], self.catalog.dec[object_number], options
                                    , self.directory_path)
        self.conditions_for_one.append(options)
        self.filepath_for_one.append(file_path)
        return file_path


def stamp_options(filter=None, sw=None, sh=None, rerun=None, tract=None, image=None, mask=None, variance=None, type=None,
                  for_url=False):
    if for_url:
        options = {
            "sw": sw if sw else 0.01
            , "sh": sh if sh else 0.01
            , "filter": filter if filter else "HSC-I"
            , "rerun": rerun if rerun else "any"
            , "tract": tract if tract else ""
            , "image": "off" if image in [False, "false", "off"] else "on"
            , "mask": "on" if mask in [True, "true", "on"] else "off"
            , "variance": "on" if variance in [True, "true", "on"] else "off"
            , "type": "warp" if type == "warp" else "coadd"
        }
    else:
        options = {
            "sw": sw if sw else 0.01
            , "sh": sh if sh else 0.01
            , "filter": None if filter == "HSC-I" else filter
            , "rerun": None if rerun == "any" else rerun
            , "tract": None if tract == "any" else tract
            , "image": "false" if image in [False, "false", "off"] else None
            , "mask": "true" if mask in [True, "true", "on"] else None
            , "variance": "true" if variance in [True, "true", "on"] else None
            , "type": "warp" if type == "warp" else None
        }
    return options


def fetch_stamps(ra, dec, options=None, directory_path=None):
    if not options:
        options = stamp_options(0.002, 0.002)
    if not directory_path:
        directory_path = "{}stamps/{}/".format(config.file_save_root, "default")
        i = 1
        while os.path.exists(directory_path):
            directory_path = "{}stamps/{}({})/".format(config.file_save_root, "default", i)
            i += 1
        os.makedirs(directory_path)
    multipart_data = _create_multipart_data(ra, dec, options)
    print multipart_data
    handler = _urllib2_open(multipart_data)
    path_list = _extract_tar(handler.read(), directory_path)
    return path_list


def _extract_tar(data, directory_path):
    pathlist = []
    tar_on_memory = BytesIO(data)
    with tarfile.open(fileobj=tar_on_memory) as tar:
        tar.extractall(directory_path)
        for tarinfo in tar:
            pathlist.append(directory_path + tarinfo.name)
    tar_on_memory.close()
    return pathlist


def _create_multipart_data(ra, dec, options):
    # sample of list data
    # """#? filter    ra       dec       sw     sh   # column descriptor
    #    HSC-G  -1:36:00  00:00:00  0.1asec  0.1asec #
    #    HSC-R  -1:36:00  00:00:00  0.1asec  0.1asec #
    #    HSC-I  -1:36:00  00:00:00  0.1asec  0.1asec # list of coordinates
    #    HSC-Z  -1:36:00  00:00:00  0.1asec  0.1asec #
    #    HSC-Y  -1:36:00  00:00:00  0.1asec  0.1asec #
    # """
    count = len(ra)
    datadic = {"ra": ra, "dec": dec}
    columns = ["ra", "dec"]
    for k, v in options.items():
        if v is not None:
            datadic[k] = [v] * count
            columns.append(k)
    coordlist = pandas.DataFrame(datadic, columns=columns).to_csv(index=False, sep='\t')
    lines = []
    lines.append('--' + Stamp.boundary)
    lines.append('Content-Disposition: form-data; name="list"')
    lines.append("")
    lines.append("#? " + coordlist)
    data = "\r\n".join(lines)
    return data


def _urllib2_open(data):
    account = webaccount.get_website_account()
    ssl._create_default_https_context = ssl._create_unverified_context
    req = urllib2.Request(Stamp.url)
    req.add_header("Content-Type", "multipart/form-data; boundary={}".format(Stamp.boundary))
    password_manager = urllib2.HTTPPasswordMgrWithDefaultRealm()
    password_manager.add_password(None, Stamp.url, account["user"], account["password"])
    auth_manager = urllib2.HTTPBasicAuthHandler(password_manager)
    opener = urllib2.build_opener(auth_manager)
    urllib2.install_opener(opener)
    print "getting stamps..."
    return urllib2.urlopen(req, data)


# get from one stamp with using url options
def fetch_one_stamp(ra, dec, options, directory_path):
    if not options:
        options = stamp_options(0.002, 0.002, for_url=True)
    if not directory_path:
        directory_path = "{}stamps/{}/".format(config.file_save_root, "default")
        i = 1
        while os.path.exists(directory_path):
            directory_path = "{}stamps/{}({})/".format(config.file_save_root, "default", i)

    url = _generate_url_for_one(ra, dec, options)
    handler = _urllib2_open_for_one(url)
    # handler.info().getheader("content-disposition") is such as 'attachment; filename="cutout-HSC-I-8523-s16a_wide-160928-024503.fits"'
    filename = handler.info().getheader("content-disposition")[22:-1]
    filepath = directory_path + filename
    with open(filepath, mode='w') as f:
        os.makedirs(directory_path)
        f.write(handler.read())
    print "get {}".format(filename)
    return filepath


def _generate_url_for_one(ra, dec, options):
    option = "&".join("{}={}".format(k, v) for k, v in options.items() if k != "object_number")
    foot = "?ra=%20{}&dec=%20{}&{}".format(ra, dec, option)
    return Stamp.url + foot


def _urllib2_open_for_one(url):
    account = webaccount.get_website_account()
    ssl._create_default_https_context = ssl._create_unverified_context
    req = urllib2.Request(url)
    password_manager = urllib2.HTTPPasswordMgrWithDefaultRealm()
    password_manager.add_password(None, url, account["user"], account["password"])
    auth_manager = urllib2.HTTPBasicAuthHandler(password_manager)
    opener = urllib2.build_opener(auth_manager)

    urllib2.install_opener(opener)
    try:
        handler = urllib2.urlopen(req)
        print "getting from " + url
        return handler
    except urllib2.HTTPError as e:
        raise e
