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

__all__ = ["connect"]

import getpass
import os

import psycopg2
import numpy

import config
import catalog


def connect(release_name, password=None, server=None):
    """
    Connect to server.
    This is just a wrapper of HscDb's constructor.
    """
    return HscDb(release_name, password, server)


class HscDb(object):
    def __init__(self, release_name, password=None, server=None):
        """
        @param release_name: str
            's16a_wide', etc
        @param password: str, optional
            Password to login with. If None, it is obtained
            from $PGPASSWORD or user's input.
            If "server" argument contains "password" field,
            server["password"] is hidden by this argument.
        @param server: dict, optional
            SQL server's information, it may contain
            'host', 'port', 'database', 'user', 'password'
        """

        db_server = {}
        if server:
            db_server.update(server)
        else:
            db_server.update(config.db_server)

        if not db_server.get('database'):
            db_server["database"] = getpass.getuser()

        if password:
            db_server["password"] = password

        if db_server.get('password') == "required":
            password = os.environ.get("PGPASSWORD")
            if not password:
                password = getpass.getpass("Password for '{}'? ".format(db_server["database"]))
            db_server['password'] = password

        self.release_name = release_name
        self.conn = psycopg2.connect(**db_server)
        self.entered = False
        self.closed = False

    def close(self):
        if not self.closed:
            self.closed = True
            self.conn.close()

    def __enter__(self):
        if self.entered:
            raise StandardError("An HscDb object is __enter__()ed twice.")
        if self.closed:
            raise StandardError("An HscDb object is already closed.")
        self.entered = True
        return self

    def __exit__(self, *args):
        self.close()

    def cursor(self):
        """
        Get a cursor object. Users are discouraged to use the cursor directly
        though it is not prohibited.
        """
        cursor = self.conn.cursor()
        cursor.execute("SET extra_float_digits TO 3")
        cursor.execute("""SET search_path TO "$user", {}, public""".format(self.release_name))
        return cursor

    def is_valid_query(self, query, args=None):
        """
        Checks if the given query is valid or not.
        """
        cursor = self.cursor()
        try:
            query = cursor.mogrify(query, args).strip()
            if query.endswith(";"):
                query = query[:-1]

            cursor.execute(
                'SELECT 0 FROM ({}) "@check" WHERE False'.format(query)
            )
            return True

        except psycopg2.ProgrammingError:
            return False

        finally:
            self.conn.rollback()

    def query_select(self, query, args=None):
        """
        Execute the given query ('select' only) and
        returns the reply in a numpy recarray.
        """

        cursor = self.cursor()
        try:
            query = cursor.mogrify(query, args).strip()
            if query.endswith(";"):
                query = query[:-1]

            cursor.execute(
                'SELECT * FROM ({}) "@scout" WHERE False'.format(query)
            )

            def autoname(name, i):
                if name == '?column?':
                    return ("col-" + str(i),)
                else:
                    return (name,)

            dtype = [autoname(col.name, i) + typid_to_type[col.type_code]
                     for i, col in enumerate(cursor.description)]

            cursor.execute(query)
            return numpy.array(cursor.fetchall(), dtype=dtype)

        finally:
            self.conn.rollback()

    def forced(self, where=None, order=None, limit=None, offset=None):
        return catalog.ForcedCatalog(self, where, order, limit, offset)

    def unforced(self, where=None, order=None, limit=None, offset=None):
        return catalog.UnforcedCatalog(self, where, order, limit, offset)


typid_to_type = {
    16: (numpy.bool,),  # bool
    #   17 : , # bytea
    18: (str, 32),  # char
    19: (str, 32),  # name
    20: (numpy.int64,),  # int8
    21: (numpy.int16,),  # int2
    #   22 : , # int2vector
    23: (numpy.int32,),  # int4
    #   24 : , # regproc
    25: (str, 32),  # text
    #   26 : , # oid
    #   27 : , # tid
    #   28 : , # xid
    #   29 : , # cid
    #   30 : , # oidvector
    #  114 : , # json
    #  142 : , # xml
    #  143 : , # _xml
    #  199 : , # _json
    #  194 : , # pg_node_tree
    #  210 : , # smgr
    #  600 : , # point
    #  601 : , # lseg
    #  602 : , # path
    #  603 : , # box
    #  604 : , # polygon
    #  628 : , # line
    #  629 : , # _line
    700: (numpy.float32,),  # float4
    701: (numpy.float64,),  # float8
    #  702 : , # abstime
    #  703 : , # reltime
    #  704 : , # tinterval
    705: (str, 32),  # unknown
    #  718 : , # circle
    #  719 : , # _circle
    #  790 : , # money
    #  791 : , # _money
    #  829 : , # macaddr
    #  869 : , # inet
    #  650 : , # cidr
    # 1000 : , # _bool
    # 1001 : , # _bytea
    # 1002 : , # _char
    # 1003 : , # _name
    # 1005 : , # _int2
    # 1006 : , # _int2vector
    # 1007 : , # _int4
    # 1008 : , # _regproc
    # 1009 : , # _text
    # 1028 : , # _oid
    # 1010 : , # _tid
    # 1011 : , # _xid
    # 1012 : , # _cid
    # 1013 : , # _oidvector
    # 1014 : , # _bpchar
    # 1015 : , # _varchar
    # 1016 : , # _int8
    # 1017 : , # _point
    # 1018 : , # _lseg
    # 1019 : , # _path
    # 1020 : , # _box
    # 1021 : , # _float4
    # 1022 : , # _float8
    # 1023 : , # _abstime
    # 1024 : , # _reltime
    # 1025 : , # _tinterval
    # 1027 : , # _polygon
    # 1033 : , # aclitem
    # 1034 : , # _aclitem
    # 1040 : , # _macaddr
    # 1041 : , # _inet
    #  651 : , # _cidr
    # 1263 : , # _cstring
    # 1042 : , # bpchar
    1043: (str, 32),  # varchar
    # 1082 : , # date
    # 1083 : , # time
    # 1114 : , # timestamp
    # 1115 : , # _timestamp
    # 1182 : , # _date
    # 1183 : , # _time
    # 1184 : , # timestamptz
    # 1185 : , # _timestamptz
    # 1186 : , # interval
    # 1187 : , # _interval
    # 1231 : , # _numeric
    # 1266 : , # timetz
    # 1270 : , # _timetz
    # 1560 : , # bit
    # 1561 : , # _bit
    # 1562 : , # varbit
    # 1563 : , # _varbit
    1700: (numpy.float64,),  # numeric
    # 1790 : , # refcursor
    # 2201 : , # _refcursor
    # 2202 : , # regprocedure
    # 2203 : , # regoper
    # 2204 : , # regoperator
    # 2205 : , # regclass
    # 2206 : , # regtype
    # 2207 : , # _regprocedure
    # 2208 : , # _regoper
    # 2209 : , # _regoperator
    # 2210 : , # _regclass
    # 2211 : , # _regtype
    # 2950 : , # uuid
    # 2951 : , # _uuid
    # 3614 : , # tsvector
    # 3642 : , # gtsvector
    # 3615 : , # tsquery
    # 3734 : , # regconfig
    # 3769 : , # regdictionary
    # 3643 : , # _tsvector
    # 3644 : , # _gtsvector
    # 3645 : , # _tsquery
    # 3735 : , # _regconfig
    # 3770 : , # _regdictionary
    # 2970 : , # txid_snapshot
    # 2949 : , # _txid_snapshot
    # 3905 : , # _int4range
    # 3907 : , # _numrange
    # 3909 : , # _tsrange
    # 3911 : , # _tstzrange
    # 3913 : , # _daterange
    # 3927 : , # _int8range
}
