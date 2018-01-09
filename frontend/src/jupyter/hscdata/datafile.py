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

__all__ = []
import os
import ssl
import urllib2

import wildcard
import config
import webaccount


class DataFile(object):
    """Represents a dict of datafile files which corresponds to catalog object.

    Datafile object is to be contained in catalog object
    """
    file_groups = {
        "group1": ["calexp"],
        "group2": ["warp"],
        "group3": ["bkgd", "forced_src", "det", "meas", "measMatch", "measMatchFull"],
        "group4": ["mergeDet", "ref"],
        "group5": ["BrightObjectMask"],
        # "group6": ["CALEXP", "wcs", "fcr"],
        # "group7": ["corr", "BKGD"],
        # "group8": ["CALSRC"],
        # "group9": ["ICSRC", "ML", "SRC", "SRCMATCH", "SRCML"],
        # "group10": ["qa"],
        # "group11": ["flattend", "oss"],
        # "group12": ["boost"],
    }
    eachband_types = []
    for group in ["group1", "group2", "group3"]:
        eachband_types.extend(file_groups[group])

    def __init__(self, catalog, database):
        self.catalog = catalog
        self.database = database
        self._keys = None
        if catalog._release_name[:4] == "s16a":
            self.urlhead = "https://133.40.210.103/hsc_ssp/dr1/s16a/data/"
        elif catalog._release_name[:4] == "s15b":
            self.urlhead = "https://133.40.210.103/hsc_ssp/dr1/s15b/data/"
        else:
            raise Exception("{} files are not offered".format(catalog._release_name))
        if catalog._release_name[5:] == "wide":
            self.fil_names = {"HSC-G": "g", "HSC-I": "i", "HSC-R": "r", "HSC-Z": "z", "HSC-Y": "y"}
        elif catalog._release_name[5:] in ["deep", "udeep"]:
            self.fil_names = {"HSC-G": "g", "HSC-I": "i", "HSC-R": "r", "HSC-Z": "z", "HSC-Y": "y",
                              "NB921": "n921", "NB816": "n816"}
        else:
            raise Exception("{} files are not offered".format(catalog._release_name))

    def __getattr__(self, name):
        """
        datafile.name is equivalent to datafile["name"]
        """
        if name in self._keys_as_set():
            return self.fetch(name)
        else:
            msg = "'{self.__class__.__name__}' object has no attribute '{name}'".format(**locals())
            raise AttributeError(msg)

    def __getitem__(self, name):
        """
        Get the files "name" from the catalog data.
        """
        if name in self._keys_as_set():
            return self.fetch(name)
        else:
            raise KeyError(name)

    def __contains__(self, name):
        return name in self

    def __iter__(self):
        return self.iterkeys()

    def iterkeys(self, pattern=None):
        if pattern:
            keys = wildcard.expand(pattern, self._keys_as_set(), keep_nomatch=False)
            return iter(keys)
        else:
            return iter(self._keys_as_set())

    def has_key(self, name):
        return name in self._keys_as_set()

    def _keys_as_set(self):
        if self._keys is None:
            keys = self.file_groups["group4"][:]
            for file_type in self.eachband_types:
                for fil in self.fil_names.values():
                    keys.append("{}_{}".format(fil, file_type))
            self._keys = keys
        return self._keys

    def keys(self, pattern=None):
        if pattern:
            keys = wildcard.expand(pattern, self._keys_as_set(), keep_nomatch=False)
            return keys
        else:
            return list(self._keys_as_set())

    def get_file(self, file_type, filter_name, without_fetch=False):
        """
        Save file to local disk and return the path of the files.
        @param file_type: str
        @param filter_name: None or srt
        @return: list of str
        """
        if not filter_name and file_type in self.eachband_types:
            return self.get_all_filter_file(file_type)
        key = self._arrenge_key_name(file_type, filter_name)
        self.check_key(key)
        if key not in self.__dict__.keys():
            long_fil = self._arrange_filter_name(filter_name, to_full=True)
            manager = self._get_downloader(file_type)
            if not without_fetch:
                manager.fetch_files(long_fil)
            object.__setattr__(self, key, manager.get_localpaths(long_fil))
        return getattr(self, key)

    def get_all_filter_file(self, file_type, without_fetch=False):
        result = {}
        for full_filter_name in self.fil_names:
            result[full_filter_name] = self.get_file(file_type, full_filter_name, without_fetch)
        return result

    def check_key(self, key):
        if key not in self.keys():
            raise LookupError("""FileType not found:
        Please choose in the list below (option:with filter).
        ex) catalog.get_file("calexp"), catalog.get_file("calexp", "HSC-G"),
         catalog.get_file("calexp", "g"), catalog.get_file("g_calexp")
        {}""".format(self.eachband_types + self.file_groups["group4"]))

    def _arrenge_key_name(self, file_type, filter_name):
        short_fil = self._arrange_filter_name(filter_name)
        if filter_name:
            key = "{}_{}".format(short_fil, file_type)
        else:
            key = file_type
        return key

    def _arrange_filter_name(self, filter_name, to_full=False):
        if to_full:
            if filter_name in self.fil_names.values():
                return {v: k for k, v in self.fil_names.items()}[filter_name]
            elif filter_name in self.fil_names:
                return filter_name
            else:
                return None
        else:
            if filter_name in self.fil_names:
                return self.fil_names[filter_name]
            elif filter_name in self.fil_names.values():
                return filter_name
            else:
                return None

    def _get_downloader(self, file_type):
        if file_type in self.file_groups["group1"]:
            return self.Group1Manager(self, file_type)
        elif file_type in self.file_groups["group2"]:
            return self.Group2Manager(self, file_type)
        elif file_type in self.file_groups["group3"]:
            return self.Group3Manager(self, file_type)
        elif file_type in self.file_groups["group4"]:
            return self.Group4Manager(self, file_type)
        else:
            raise Exception()

    class Group1Manager(object):
        """
        "calexp"
        """

        def __init__(self, datafile, file_type):
            self.urlhead = datafile.urlhead
            self.file_type = file_type
            self.database = datafile.database
            self.rerun = datafile.catalog._release_name
            self.tract = datafile.catalog.tract
            self.patch = datafile.catalog.patch
            self.unique_patch = set(zip(self.tract, self.patch))

        def fetch_files(self, filter_name):
            filedir_format, filename_format = self._get_pathformat(filter_name)
            for tract, patch in self.unique_patch:
                patch_s = self.patch2str(patch)
                filedir = filedir_format.format(**locals())
                filename = filename_format.format(**locals())
                filepath = filedir + filename
                self._download_if_no_local(filedir, filename)

        def _download_if_no_local(self, filedir, filename):
            filepath = config.file_save_root + filedir + filename
            dirpath = config.file_save_root + filedir
            if os.path.exists(filepath) or os.path.exists(filepath + ".gz"):
                return
            if not os.path.exists(dirpath):
                os.makedirs(dirpath)
            url = self.urlhead + filedir + filename
            try:
                handler = self.urllib2_open(url)
                with open(filepath, mode='w') as f:
                    f.write(handler.read())
            except urllib2.HTTPError:
                try:
                    handler = self.urllib2_open(self.urlhead + filedir + filename + ".gz")
                    with open(filepath + ".gz", mode='w') as f:
                        f.write(handler.read())
                except urllib2.HTTPError:
                    pass

        def _get_pathformat(self, filter_name):
            filedir_format = "{}/deepCoadd/{}/".format(self.rerun, filter_name) + "{tract}/{patch_s}/"
            filename_format = self.file_type + "-" + filter_name + "-{tract}-{patch_s}.fits"
            return filedir_format, filename_format

        def get_localpaths(self, filter_name):
            filedir_format, filename_format = self._get_pathformat(filter_name)
            filepaths = []
            for i, _ in enumerate(self.tract):
                tract = self.tract[i]
                patch_s = self.patch2str(self.patch[i])
                localpath = config.file_save_root + filedir_format.format(**locals()) + filename_format.format(
                    **locals())
                if os.path.exists(localpath):
                    filepaths.append(localpath)
                elif os.path.exists(localpath + ".gz"):
                    filepaths.append(localpath + ".gz")
                else:
                    filepaths.append(None)
            return filepaths

        def urllib2_open(self, url):
            account = webaccount.get_website_account()

            ssl._create_default_https_context = ssl._create_unverified_context
            req = urllib2.Request(url)
            password_manager = urllib2.HTTPPasswordMgrWithDefaultRealm()
            password_manager.add_password(None, url, account["user"],
                                          account["password"])

            auth_manager = urllib2.HTTPBasicAuthHandler(password_manager)
            opener = urllib2.build_opener(auth_manager)

            urllib2.install_opener(opener)
            try:
                handler = urllib2.urlopen(req)
                print "getting from " + url
                return handler
            except urllib2.HTTPError as e:
                raise e

        @staticmethod
        def patch2str(patch):
            return "{},{}".format(patch / 100, patch % 100)

    class Group2Manager(Group1Manager):
        """
        "warp"
        """

        def __init__(self, datafile, file_type):
            """
            visitlist key = filter_name + str(tract) + str(patch)
                      value = list of visit
            @param datafile:
            @param file_type:
            """
            self.visitlist = {}
            super(DataFile.Group2Manager, self).__init__(datafile, file_type)

        def fetch_files(self, filter_name):
            filedir_format, filename_format = self._get_pathformat(filter_name)
            for tract, patch in self.unique_patch:
                visitlist = self.get_visitlist(filter_name, tract, patch)
                patch_s = "{},{}".format(patch / 100, patch % 100)
                for visit in visitlist:
                    filedir = filedir_format.format(**locals())
                    filename = filename_format.format(**locals())
                    filepath = filedir + filename
                    self._download_if_no_local(filedir, filename)

        def _get_pathformat(self, filter_name):
            filedir_format = "{}/deepCoadd/{}/".format(self.rerun, filter_name) + "{tract}/{patch_s}/"
            filename_format = self.file_type + "-" + filter_name + "-{tract}-{patch_s}-{visit}.fits"
            return filedir_format, filename_format

        def get_localpaths(self, filter_name):
            filedir_format, filename_format = self._get_pathformat(filter_name)
            filepaths = []
            for i in range(len(self.tract)):
                tract = self.tract[i]
                patch_s = self.patch2str(self.patch[i])
                visitlist = self.get_visitlist(filter_name, tract, self.patch[i])
                paths_in_a_patch = []
                for visit in visitlist:
                    localpath = config.file_save_root + filedir_format.format(**locals()) + filename_format.format(
                        **locals())
                    if os.path.exists(localpath):
                        paths_in_a_patch.append(localpath)
                    elif os.path.exists(localpath + ".gz"):
                        paths_in_a_patch.append(localpath + ".gz")
                    else:
                        paths_in_a_patch.append(None)
                filepaths.append(paths_in_a_patch)
            return filepaths

        def get_visitlist(self, filter_name, tract, patch):
            key = filter_name + str(tract) + str(patch)
            if key not in self.visitlist:
                patch_s = self.patch2str(patch)
                quary = """
                SELECT visit FROM {self.rerun}.warped__deepcoadd
                WHERE tract = {tract} AND patch = '{patch_s}' AND filter01 = '{filter_name}';
                """.format(**locals())
                with self.database.cursor() as cur:
                    cur.execute(quary)
                    visitlist = [fetch[0] for fetch in cur.fetchall()]
                self.visitlist[key] = visitlist
            return self.visitlist[key]

    class Group3Manager(Group1Manager):
        """
        "bkgd", "forced-src", "det", "meas", "measMatch", "measMatchFull"
        """

        def __init__(self, datafile, file_type):
            super(DataFile.Group3Manager, self).__init__(datafile, file_type)

        def _get_pathformat(self, filter_name):
            filedir_format = "{}/deepCoadd-results/{}/".format(self.rerun, filter_name) + "{tract}/{patch_s}/"
            filename_format = self.file_type + "-" + filter_name + "-{tract}-{patch_s}.fits"
            return filedir_format, filename_format

    class Group4Manager(Group1Manager):
        """
        "mergeDet", "ref"
        """

        def __init__(self, datafile, file_type):
            super(DataFile.Group4Manager, self).__init__(datafile, file_type)

        def _get_pathformat(self, filter_name):
            filedir_format = "{}/deepCoadd-results/merged/".format(self.rerun) + "{tract}/{patch_s}/"
            filename_format = self.file_type + "-{tract}-{patch_s}.fits"
            return filedir_format, filename_format

    class Group5Manager(Group1Manager):
        """
        "BrightObjectMask"
        """

        def __init__(self, datafie, file_type):
            super(DataFile.Group5Manager, self).__init__(datafie, file_type)

        def _get_pathformat(self, filter_name):
            filedir_format = "{}/deepCoadd/BrightObjectMask/".format(self.rerun) + "{tract}/"
            filename_format = self.file_type + "-{tract}-{patch_s}-{filter_name}.fits"
            return filedir_format, filename_format
