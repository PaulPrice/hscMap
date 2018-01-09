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

__all__ = ["ForcedCatalog", "UnforcedCatalog"]
import os
import datetime
import copy

import numpy
import pandas

import wildcard
import datafile
import stamp
import config


class Catalog(object):
    def __init__(self, database, table_names, object_id):
        """
        @param database: HscDb
        @param table_names: list of str
            ["forced", "afterburner"], etc.
        @param object_id: numpy array or scalar
        """
        self._database = database
        self._release_name = database.release_name
        self._table_names = list(table_names)
        self._objlist = None
        self._keys = None

        self._datafile = None
        self._stamp = None

        if object_id:
            self.object_id = numpy.asarray(object_id, dtype=numpy.int64)

    def __getattr__(self, name):
        """
        catalog.name is equivalent to catalog["name"]
        """
        if name in self._keys_as_set():
            return self.fetch(name)
        else:
            msg = "'{self.__class__.__name__}' object has no attribute '{name}'".format(**locals())
            raise AttributeError(msg)

    def __getitem__(self, name):
        """
        Get the column "name" from the catalog table.
        """
        if name in self._keys_as_set():
            return self.fetch(name)
        else:
            raise KeyError(name)

    def __contains__(self, name):
        return self.has_key(name)

    def __iter__(self):
        return self.iterkeys()

    def keys(self, *patterns):
        if patterns:
            return self._check_and_expand(patterns)
        else:
            return list(self._keys_as_set())

    def iterkeys(self, *patterns):
        if patterns:
            return iter(self._check_and_expand(patterns))
        else:
            return iter(self._keys_as_set())

    def has_key(self, name):
        return name in self._keys_as_set()

    def _keys_as_set(self):
        if self._keys is None:
            names = set()

            with self._database.cursor() as cursor:
                for table in self._table_names:
                    cursor.execute("""
                        SELECT * FROM {table} WHERE FALSE
                    """.format(**locals()))

                    names.update(cols[0] for cols in cursor.description)

            self._keys = names

        return self._keys

    def _check_and_expand(self, patterns):
        """
        check if absent columns are generate from patterns or not.
        if are, this raises LookupError.
        @param patterns: list of str
        @return: list of str
        """
        result = []
        for pattern in patterns:
            result.extend(wildcard.expand(pattern, self._keys_as_set(), keep_nomatch=False))
        absent_cols = set(result) - self._keys_as_set()
        if absent_cols:
            raise LookupError("Column(s) not found: " + ", ".join(absent_cols))
        return result

    def fetch(self, *patterns):
        """
        It is more efficient to fetch multiple columns at once.

        @return None or numpy.array or tuple of numpy.array.
            If # of arguments is 0, None is returned.
            If # of arguments is 1, numpy.array is returned.
            If # of arguments >= 2, tuple of numpy.array is returned.
        """
        if not patterns:
            return None
        keys = self._check_and_expand(patterns)
        cols_to_fetch = set(keys).difference(self.__dict__.keys())
        if cols_to_fetch:
            self._fetch_value(cols_to_fetch)
        if len(keys) == 1:
            return getattr(self, keys[0])
        else:
            return [getattr(self, key) for key in keys]

    def _fetch_value(self, cols):
        """
        Fetch values of @cols from server and cash them as attr.
        @param cols: list of string
        """
        keylist = ",".join(cols)
        objlist = self._get_objlist()
        fromclause = self._get_fromclause()
        value = self._database.query_select("""
            WITH "@objlist"(object_id) AS ({objlist})
            SELECT
                {keylist}
            FROM
                "@objlist" LEFT JOIN ({fromclause}) USING(object_id)
            """.format(**locals()))
        for key in cols:
            object.__setattr__(self, key, value[key])

    def _get_objlist(self):
        """
        Return the object list that fits in form of sql in self._fetch_value()
        this objlist is cashed as self._objlist
        @return: str
        """
        if self._objlist is None:
            if not self.object_id.shape:
                objlist = "SELECT %ld::Bigint" % int(self.object_id)
            elif len(self.object_id) == 0:
                objlist = "SELECT 0::Bigint WHERE FALSE"
            elif len(self.object_id) == 1:
                objlist = "SELECT %ld::Bigint" % int(self.object_id[0])
            else:
                objlist = "VALUES (%ld::Bigint)" + ",(%ld)" * (len(self.object_id) - 1)
                objlist %= tuple(int(i) for i in self.object_id)
            self._objlist = objlist
        else:
            objlist = self._objlist
        return objlist

    def _get_fromclause(self):
        """
        @return: str
        """
        clause_format = "{}" + " LEFT JOIN {} USING (object_id)" * (len(self._table_names) - 1)
        return clause_format.format(*self._table_names)

    def comment(self, *patterns):
        """

        @param patterns:
        @return:
        """
        if not patterns:
            return None
        keys = self._check_and_expand(patterns)
        table_names = "'" + "', '".join(self._table_names) + "'"
        collist = "'" + "', '".join(keys) + "'"
        with self._database.cursor() as cursor:
            cursor.execute(
                """
                SELECT a.attname as column, d.description as comment
                FROM pg_namespace n
                JOIN pg_class c ON n.oid = c.relnamespace
                JOIN pg_attribute a ON c.oid = a.attrelid
                LEFT JOIN pg_description d
                    ON (d.objoid, d.objsubid) = (c.oid, a.attnum)
                WHERE a.attnum > 0 AND a.attisdropped IS FALSE
                    AND n.nspname = '{}'
                    AND c.relname in ({})
                    AND a.attname in ({});
                """.format(self._release_name, table_names, collist)
            )
            value = cursor.fetchall()
        if len(keys) == 1:
            return value[0][1]
        return list(set(value))

    def dataframe(self, *patterns):
        """
        @param patterns:
        @return:
        """
        columuns = self._check_and_expand(patterns)
        data = self.fetch(*patterns)
        datadic = {columun: data[i] for i, columun in enumerate(columuns)}
        return pandas.DataFrame(datadic, columns=columuns)

    def save_csv(self, *patterns, **dict_for_name):
        """
        dict_for_name is to have key named "name"; {"name"="some str for name of csv file"}
        @param patterns: list
        @param dict_for_name: dict
        @return: str
        """
        pddata = self.dataframe(*patterns)
        path = self._get_save_path("csv", dict_for_name.get("name"))
        pddata.to_csv(path)
        return path

    def _get_save_path(self, type, name=None):
        root = config.file_save_root
        if not os.path.exists("{root}{type}/".format(**locals())):
            os.makedirs("{root}{type}/".format(**locals()))
        if not name:
            name = "{}-".format(self._release_name) + datetime.datetime.now().strftime('%s')
        path = "{root}{type}/{name}.{type}".format(**locals())
        i = 1
        while os.path.exists(path):
            path = "{root}{type}/{name}({i}).{type}".format(**locals())
            i += 1
        return path

    def datafile(self, file_type, filter_name=None, without_fetch=False):
        """
        @param file_type: str
        @param filter_name: None or str
        @return: list of str or dic
        """
        return self.datafile_object().get_file(file_type, filter_name, without_fetch)

    def datafile_object(self):
        """
        @return: DataFile
        """
        if self._datafile is None:
            self._datafile = datafile.DataFile(self, self._database)
        return self._datafile

    def stamp(self, filter="HSC-I", sw=0.002, sh=0.002,
              rerun="any", tract="any", image=True, mask=False, variance=False, type="coadd"):
        """
        @param filter: None or str
        @param sw: float
        @param sh: float
        @param rerun: None or str
        @param tract: None or int
        @param image: None or bool
        @param mask: None or bool
        @param variance: None or bool
        @param type: None or str
        @return: list of str
        """
        if self._stamp is None:
            self._stamp = stamp.Stamp(self)
        return self._stamp.get_stamps(filter, sw, sh, rerun, tract, image, mask, variance, type)

    def stamp_one(self, number, filter="HSC-I", sw=0.002, sh=0.002,
                  rerun=None, tract="", image="on", mask="off", variance="off", type="coadd"):
        """
        @param number: int
        @return: list of str
        """
        if self._stamp is None:
            self._stamp = stamp.Stamp(self)
        if not rerun:
            rerun = self._release_name
        return self._stamp.get_one_stamp(number, filter, sw, sh, rerun, tract, image, mask, variance, type)


class CatalogWithMapper(Catalog):
    def __init__(self, database, table_names, where=None, order=None, limit=None, offset=None):
        """
        @param database: HscDb
        @param object_id: numpy array or scalar
        """
        if where is None:
            self._where = []
        elif isinstance(where, str):
            self._where = [where]
        else:
            self._where = where

        self._order = [] if order is None else order
        self._limit = limit
        self._offset = offset
        Catalog.__init__(self, database, table_names, object_id=None)

    def __deepcopy__(self, memodict={}):
        return CatalogWithMapper(self._database, self._table_names, copy.deepcopy(self._where),
                                 copy.deepcopy(self._order), self._limit, self._offset)

    def fetch(self, *patterns):
        """
        Supporse object_id is None for the first time.
        Fetch values of @cols from server and cash them as attr.
        @param cols: list of string
        """
        if "object_id" not in self.__dict__.keys():
            setattr(self, "object_id", numpy.asarray(self._database.query_select(self.sql()), dtype=numpy.int64))
        return Catalog.fetch(self, *patterns)

    def where(self, where):
        dc = copy.deepcopy(self)
        # result = []
        # for pattern in patterns:
        #     result.extend(wildcard.expand(pattern, []))
        # dc._where.extend(result)
        dc._where.extend(where)
        return dc

    def order(self, order):
        dc = copy.deepcopy(self)
        dc._order.append(order)
        return dc

    def limit(self, limit):
        dc = copy.deepcopy(self)
        dc._limit = limit
        return dc

    def offset(self, offset):
        dc = copy.deepcopy(self)
        dc._offset = offset
        return dc

    def boxSearch(self, ra1, ra2, dec1, dec2):
        dc = copy.deepcopy(self)
        dc._where.append("boxSearch(coord, {ra1}, {ra2}, {dec1}, {dec2})".format(**locals()))
        return dc

    def coneSearch(self, ra, dec, radius):
        dc = copy.deepcopy(self)
        dc._where.append("coneSearch(coord, {ra}, {dec}, {radius})".format(**locals()))
        return dc

    def tractSearch(self, *tracts):
        dc = copy.deepcopy(self)
        dc._where.append(" OR ".join(["tractSearch(coord, {})".format(tract) for tract in tracts]))
        return dc

    def within_id(self, catalog):
        dc = copy.deepcopy(self)
        objlist = catalog._get_objlist()
        return dc._where.append(
            "object_id IN ({})".format(objlist)
        )

    def within_where(self, catalog):
        dc = copy.deepcopy(self)
        dc._where.extend(catalog._where)
        return dc

    def sql(self):
        where = "WHERE {} \n".format(" \n AND ".join("({})".format(x) for x in self._where)) if self._where else ""
        fromclause = "FROM {} \n".format(self._get_fromclause())
        limit = "LIMIT {} \n".format(self._limit) if self._limit else ""
        offset = "OFFSET {} \n".format(self._offset) if self._offset else ""
        query = "SELECT object_id \n{fromclause}{where}{limit}{offset}".format(**locals())
        return query

    def count(self):
        return len(getattr(self, "object_id"))


class ForcedCatalog(CatalogWithMapper):
    """
    Forced measurement catalog & afterburner
    """

    def __init__(self, database, where=None, order=None, limit=None, offset=None):
        """
        @param database: HscDb
        @param object_id: numpy array or scalar
        """
        CatalogWithMapper.__init__(self, database, ["forced", "afterburner"], where, order, limit, offset)


class UnforcedCatalog(CatalogWithMapper):
    """
    Non-forced measurement catalog.
    """

    def __init__(self, database, where=None, order=None, limit=None, offset=None):
        """
        @param database: HscDb
        @param object_id: numpy array or scalar
        """
        CatalogWithMapper.__init__(self, database, ["meas", "meas2"], where, order, limit, offset)
