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

import itertools
import re

def expand(pattern, candidates, keep_nomatch=True):
    """
    Expand a wildcard "pattern" using "candidates".
    The pattern with no matching candidates will be kept
    if "keep_nomatch".

    @param pattern: string or WildCard
    @param candidates: list of string
    @param keep_nomatch: bool
    @return list of string

    The pattern may contain:
        * wildcards '?', '*'
        * character sets '[abc]', '[^abc]'
        * regular expressions '/regexp/'
        * brace expansions '{abc,def,ghi}'
        * range expansions '{00..10}'
        * special characters may be escaped by r'\'.

    Note that brace expansions and range expansions are 'expanded'
    before matching. For example:
        expand('*.{/a+/,bc,[0-9]}', ["x.aaa", "y.bc"])
    is equivalent to the sum of
        expand('*./a+/' , ["x.aaa", "y.bc"])
        expand('*.bc'   , ["x.aaa", "y.bc"])
        expand('*.[0-9]', ["x.aaa", "y.bc"])
    and results in
        ["x.aaa", "y.bc", "*.[0-9]"].
    The last pattern remains unchanged because no matching
    candidates exist.

    For a brace expansion, it shuld also be noted that its behavior
    is slightly different from bash's when it comes to null strings.
    The braces are more like javascript's array. For example:
        * 'x{a,b,c,}y' is permitted and equivalent to 'x{a,b,c}y'.
    The last comma is ignored. In other words, the null string after the
    last comma is ignored. However, a null string *before* a comma is
    meaningful. For example:
        * 'x{a,,}y' is expanded to 'xay', 'xy', while
        * 'x{a,}y' is expanded to 'xay' only.
        * 'x{,}y' is expanded to 'xy', while
        * 'x{}y' is expanded to the empty set.
    """
    return compile(pattern).expand(candidates, keep_nomatch)

def compile(pattern):
    """
    Compile a wildcard patten beforehand.
    The result can be passed to expand().

    @param pattern: string or WildCard
    @return WildCard
    """
    if isinstance(pattern, WildCard):
        return pattern
    else:
        return WildCard(pattern)


class WildCard(object):
    """
    Compiled wildcard pattern
    """
    def __init__(self, pattern):
        node, ptr = WildCardNode_outermost_pattern_seq.match(pattern, 0, len(pattern))
        if node is None:
            raise StandardError("Pattern not interpretable: " + pattern)
        if ptr != len(pattern):
            raise StandardError("Invalid character: {} <<{}>> {}".format(pattern[:ptr], pattern[ptr], pattern[ptr+1:]))
        self.regexps  = [re.compile("^(?:" + r + ")$") for r in node.compile()]
        self.patterns = node.patterns(pattern)

        assert len(self.regexps) == len(self.patterns)

    def expand(self, candidates, keep_nomatch=True):
        """
        Equivalent to expand() function in the module namespace.
        """
        erected = []
        for r, p in itertools.izip(self.regexps, self.patterns):
            found = False
            for c in candidates:
                if r.match(c):
                    found = True
                    if c not in erected:
                        erected.append(c)

            if keep_nomatch and (not found) and (p not in erected):
                erected.append(p)

        return erected


class WildCardNode(object):
    """
    This is the abstract base class of nodes of the language of wild card patterns.
    A concrete class:
        * must implement a classmethod match(cls, s, start, end) -> (wildCardNode, ptr).
            s is the string being parsed,
            start is the current position in s,
            end is the end position in s,
            wildCardNode is an instance of WildCardNode created from the matching part,
            ptr is the next position in s to parse.
            On match failure, it must return (None, start).
            On error, it must raise an exception.
            Failure and error differ in that on failure the parsing process will
            continue parsing, while on error the parsing process will abort.
        * may implement compile(self).
            This method must return list of regular expressions (as strings)
            that correspond to the given pattern.
            If not overridden, its default behavior is return [self.regexp].
            The concrete class must set self.regexp beforehand.
        * may implement patterns(self, s).
            This method returns a list of substrings of s.
            An implementation may assume s is equal to the pattern string.
            If not overridden, its default behavior is return a list the only element
            of which is s[self.start:self.end]. The concrete class must set
            self.start and self.end beforehand.
    """
    def __init__(self, regexp, start, end):
        """
        When a concrete class override the constructor,
        it is allowed that it doesn't call this base constructor.
        """
        self.regexp = regexp
        self.start  = start
        self.end    = end

    def compile(self):
        return [self.regexp]

    def patterns(self, s):
        """
        @param s: str
            The string which was used in constructing this node
        @return original patterns (that are not compiled to regexp)
        """
        return [s[self.start:self.end]]

class WildCardNode_Sequence(WildCardNode):
    """
    Abstract sequence.
    Sequence: Element+
    Sequence_opt: Element*
    """

    Element  = None # must be overridden
    optional = False

    @classmethod
    def match(cls, s, start, end):
        elems = []
        ptr = start
        while True:
            elem, ptr = cls.Element.match(s, ptr, end)
            if elem is None:
                break
            elems.append(elem)

        if elems or cls.optional:
            return cls(elems, start, ptr), ptr
        else:
            return None, start

    def __init__(self, patterns, start, end):
        self._patterns = patterns
        self.start = start
        self.end = end

    def compile(self):
        return [''.join(combination) for combination in
            itertools.product(*(pattern.compile() for pattern in self._patterns))]

    def patterns(self, s):
        """
        @param s: str
            The string  which was used in constructing this node
        @return original patterns (that are not compiled to regexp)
        """
        return [''.join(combination) for combination in
            itertools.product(*(pattern.patterns(s) for pattern in self._patterns))]

class WildCardNode_Select(WildCardNode):
    """
    Abstract selection.
    Select: Option0 | Option1 | ...
    """

    Options  = [] # must be overloaded

    @classmethod
    def match(cls, s, start, end):
        for Option in cls.Options:
            opt, ptr = Option.match(s, start, end)
            if opt is not None:
                return cls(opt, start, ptr), ptr
        return None, start

    def __init__(self, option, start, end):
        self.option = option
        self.start = start
        self.end = end

    def compile(self):
        return self.option.compile()

    def patterns(self, s):
        """
        @param s: str
            The string  which was used in constructing this node
        @return original patterns (that are not compiled to regexp)
        """
        return self.option.patterns(s)

class WildCardNode_anychar(WildCardNode):
    """
    anychar: '?'
    """
    @classmethod
    def match(cls, s, start, end):
        if s.startswith('?', start, end):
            return cls(".", start, start+1), start+1
        else:
            return None, start

class WildCardNode_anystr(WildCardNode):
    """
    anystr: '*'
    """
    @classmethod
    def match(cls, s, start, end):
        if s.startswith('*', start, end):
            return cls(".*", start, start+1), start+1
        else:
            return None, start

class WildCardNode_charclass(WildCardNode):
    """
    charclass: '[' chars ']'
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'\[\^?\]?(?:\\.|[^]\\]+)*').match(s, start, end)
        if m is None:
            return None, start

        ptr = m.end(0)
        if s.startswith(']', ptr, end):
            ptr += 1
        else:
            raise StandardError("No closing ']'")

        charclass = m.group(0) + "]"
        if charclass in ("[]", "[^]"):
            raise StandardError("char-class is empty")

        return cls(charclass, start, ptr), ptr

class WildCardNode_range(WildCardNode):
    """
    range:
        '{' start '..' end '}'
        '{' start '..' end .. stride '}'
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'\{([0-9]+)\.\.([0-9]+)\.\.([-+]?[0-9]+)').match(s, start, end)
        if m:
            s_range_start  = m.group(1)
            s_range_end    = m.group(2)
            range_stride = int(m.group(3))
        else:
            m = re.compile(r'\{([0-9]+)\.\.([0-9]+)').match(s, start, end)
            if m:
                s_range_start  = m.group(1)
                s_range_end    = m.group(2)
                range_stride = 0
            else:
                return None, start

        ptr = m.end(0)
        if s.startswith('}', ptr, end):
            ptr += 1
        else:
            raise StandardError("No closing '}'")

        range_start = int(s_range_start)
        range_end   = int(s_range_end  )
        ndigits = len(s_range_start) if range_start <= range_end else int(s_range_end)

        if range_stride == 0:
            range_stride = 1 if range_start <= range_end else -1

        if range_stride > 0:
            range_end += 1
        else:
            range_end -= 1

        options = ["{0:0{1}d}".format(i, ndigits) for i in xrange(range_start, range_end, range_stride)]
        return cls(options, start, ptr), ptr

    def __init__(self, options, start, end):
        self.options  = options
        self.start = start
        self.end = end

    def compile(self):
        return self.options

    def patterns(self, s):
        """
        @param s: str
            The string  which was used in constructing this node
        @return original patterns (that are not compiled to regexp)
        """
        return self.options

class WildCardNode_braces(WildCardNode):
    """
    braces:
        '{}'
        '{' pattern_seq_opt (',' pattern_seq_opt)* ','_opt '}'
    """
    @classmethod
    def match(cls, s, start, end):
        if not s.startswith('{', start, end):
            return None, start

        ptr = start + 1
        patterns = []

        while True:
            pattern, ptr = WildCardNode_pattern_seq.match(s, ptr, end)

            if s.startswith(",", ptr, end):
                if pattern is not None:
                    patterns.append(pattern)
                else:
                    patterns.append(WildCardNode("", ptr, ptr))
                ptr += 1
            else:
                if pattern is not None:
                    patterns.append(pattern)
                break

        if s.startswith('}', ptr, end):
            ptr += 1
        else:
            raise StandardError("No closing '}'")

        return cls(patterns, start, ptr), ptr

    def __init__(self, patterns, start, end):
        self._patterns  = patterns
        self.start = start
        self.end = end

    def compile(self):
        return list(itertools.chain(*(pattern.compile() for pattern in self._patterns)))

    def patterns(self, s):
        """
        @param s: str
            The string which was used in constructing this node
        @return original patterns (that are not compiled to regexp)
        """
        return list(itertools.chain(*(pattern.patterns(s) for pattern in self._patterns)))

class WildCardNode_regexp(WildCardNode):
    """
    regexp: '/' regexp '/'
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'/[^/]*').match(s, start, end)
        if m is None:
            return None, start

        ptr = m.end(0)
        if s.startswith('/', ptr, end):
            ptr += 1
        else:
            raise StandardError("No closing '/'")

        return cls("(?:" + m.group(0)[1:] + ")", start, ptr), ptr

class WildCardNode_escape(WildCardNode):
    """
    escape: '\\' character
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'\\(?:.|\n)').match(s, start, end)
        if not m:
            return None, start

        ptr = m.end(0)
        escaped = m.group(0)
        c = escaped[1]

        if c in "afnrtv":
            # If the escape sequence has the normal meaning, leave it as it is.
            # e.g. r'\n' => r'\n'
            pass
        elif c == "b":
            # If the escape sequence has special meaning in regexp, hack it.
            # e.g. r'\b' => r'[\b]'
            escaped = "[" + escaped + "]"
        elif c in "][(){}\\^$.*+|?":
            # If the escape sequence is actually escaping special chars,
            # leave it as it is.
            # e.g. r'\^' => r'\^'
            pass
        elif re.match("[a-zA-Z0-9]", c):
            # If the escape sequence is not escaping a letter,
            # separate it into r'\' and the letter.
            # e.g. r'\k' => r'\\k'
            escaped = "\\\\" + c
        else:
            # If the escape sequence is not escaping a punctuation,
            # remove 'r\'.
            # e.g. r'\,' => r','
            escaped = c

        return cls(escaped, start, ptr), ptr

class WildCardNode_terminal(WildCardNode):
    """
    terminal: character-with-no-special-meanings+
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'[^][?*{}/\\,]+').match(s, start, end)
        if m:
            ptr = m.end(0)
            terminal = m.group(0)
            return cls(terminal, start, ptr), ptr
        else:
            return None, start

    def __init__(self, terminal, start, end):
        def escape(m):
            return "\\"+m.group(0)

        regexp = re.sub(r"[][(){}\\^$.*+|?]", escape, terminal)
        WildCardNode.__init__(self, regexp, start, end)

class WildCardNode_special_terminal(WildCardNode_terminal):
    """
    special_terminal:
        ']', '}', ',' (characters that don't have meaning in the outermost scope)
        '\\' at the end
    """
    @classmethod
    def match(cls, s, start, end):
        m = re.compile(r'[]},]+|\\$').match(s, start, end)
        if m:
            ptr = m.end(0)
            terminal = m.group(0)
            return cls(terminal, start, ptr), ptr
        else:
            return None, start

class WildCardNode_pattern(WildCardNode_Select):
    """
    pattern: anychar | anystr | charclass | range | braces | regexp | escape | terminal
    """
    Options = [
        WildCardNode_anychar,
        WildCardNode_anystr,
        WildCardNode_charclass,
        WildCardNode_range,
        WildCardNode_braces,
        WildCardNode_regexp,
        WildCardNode_escape,
        WildCardNode_terminal,
    ]

class WildCardNode_pattern_seq(WildCardNode_Sequence):
    """
    pattern_seq: pattern+
    """
    Element = WildCardNode_pattern
    optional = False

class WildCardNode_outermost_pattern(WildCardNode_pattern):
    """
    outermost_pattern: pattern | special_terminal
    """
    Options = WildCardNode_pattern.Options + [WildCardNode_special_terminal]

class WildCardNode_outermost_pattern_seq(WildCardNode_pattern_seq):
    """
    outermost_pattern_seq: outermost_pattern+
    """
    Element = WildCardNode_outermost_pattern
