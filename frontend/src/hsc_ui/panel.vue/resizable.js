// Generated by CoffeeScript 2.0.0-alpha1
var HandleBase, Resizable, clamp;

Resizable = class Resizable {
  constructor(el, options = {}) {
    this.el = el;
    this.handles = HandleBase.subclasses.map((c) => {
      return new c(this.el, options);
    });
  }

  destroy() {
    var h, i, len, ref, results;
    ref = this.handles;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      h = ref[i];
      results.push(h.destroy());
    }
    return results;
  }

};

clamp = function(a, min, max) {
  if (a < min) {
    return min;
  } else if (a > max) {
    return max;
  } else {
    return a;
  }
};

HandleBase = (function() {
  class HandleBase {
    constructor(el, arg) {
      var drag, minHeight, minWidth, start, stop, width1;
      width1 = arg.width, minWidth = arg.minWidth, minHeight = arg.minHeight, start = arg.start, stop = arg.stop, drag = arg.drag;
      this.el = el;
      this.width = width1;
      this.minWidth = minWidth;
      this.minHeight = minHeight;
      this.start = start;
      this.stop = stop;
      this.drag = drag;
      if (this.width == null) {
        this.width = 8;
      }
      if (this.minWidth == null) {
        this.minWidth = 200;
      }
      if (this.minHeight == null) {
        this.minHeight = 200;
      }
      this._buildHandle();
      this._buildHandlers();
      this.handle.addEventListener('mousedown', this.mousedown);
    }

    _buildHandle() {
      var k, ref, s, v;
      this.handle = document.createElement('div');
      s = this.handle.style;
      s.position = 'absolute';
      ref = this._handlePosition();
      for (k in ref) {
        v = ref[k];
        s[k] = v;
      }
      s.cursor = this._cursor();
      return this.el.appendChild(this.handle);
    }

    _buildHandlers() {
      this.mousedown = (e) => {
        e.stopPropagation();
        this.baseXY = {
          x: e.clientX,
          y: e.clientY
        };
        this.baseRect = this.el.getBoundingClientRect();
        document.addEventListener('mousemove', this.mousemove);
        document.addEventListener('mouseup', this.mouseup);
        return typeof this.start === "function" ? this.start() : void 0;
      };
      this.mousemove = (e) => {
        var dx, dy, k, ref, s, v;
        e.stopPropagation();
        e.preventDefault();
        s = this.el.style;
        dx = e.clientX - this.baseXY.x;
        dy = e.clientY - this.baseXY.y;
        ref = this._setRect(dx, dy);
        for (k in ref) {
          v = ref[k];
          s[k] = v;
        }
        this._check();
        this._check();
        return typeof this.drag === "function" ? this.drag() : void 0;
      };
      return this.mouseup = (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.removeEventListener('mousemove', this.mousemove);
        document.removeEventListener('mouseup', this.mouseup);
        return typeof this.stop === "function" ? this.stop() : void 0;
      };
    }

    destroy() {
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.handle.removeEventListener('mousedown', this.mousedown);
      return this.el.removeChild(this.handle);
    }

    _check(s) {
      var r;
      s = this.el.style;
      r = this.el.getBoundingClientRect();
      if (r.width < this.minWidth || r.width > window.innerWidth) {
        s.width = `${clamp(r.width, this.minWidth, window.innerWidth)}px`;
      }
      if (r.height < this.minHeight || r.height > window.innerHeight) {
        s.height = `${clamp(r.height, this.minHeight, window.innerHeight)}px`;
      }
      if (r.left < 0) {
        s.left = "0";
      }
      if (r.right > window.innerWidth) {
        s.left = `${window.innerWidth - r.width}px`;
      }
      if (r.top < 0) {
        s.top = "0";
      }
      if (r.bottom > window.innerHeight) {
        return s.top = `${window.innerHeight - r.height}px`;
      }
    }

  };

  HandleBase.subclasses = [];

  return HandleBase;

})();

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'n-resize';
  }

  _handlePosition() {
    return {
      top: `${-this.width}px`,
      left: `${this.width}px`,
      right: `${this.width}px`,
      height: `${2 * this.width}px`
    };
  }

  _setRect(dx, dy) {
    var top;
    top = this.baseRect.top + dy;
    return {
      top: `${top}px`,
      height: `${this.baseRect.bottom - top}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'ne-resize';
  }

  _handlePosition() {
    return {
      top: `${-this.width}px`,
      right: `${-this.width}px`,
      width: `${2 * this.width}px`,
      height: `${2 * this.width}px`
    };
  }

  _setRect(dx, dy) {
    var top, width;
    top = this.baseRect.top + dy;
    width = this.baseRect.width + dx;
    return {
      top: `${top}px`,
      height: `${this.baseRect.bottom - top}px`,
      width: `${width}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'e-resize';
  }

  _handlePosition() {
    return {
      top: `${this.width}px`,
      width: `${2 * this.width}px`,
      right: `${-this.width}px`,
      bottom: `${this.width}px`
    };
  }

  _setRect(dx, dy) {
    var width;
    width = this.baseRect.width + dx;
    return {
      height: `${this.baseRect.height}px`,
      width: `${width}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'se-resize';
  }

  _handlePosition() {
    return {
      width: `${2 * this.width}px`,
      height: `${2 * this.width}px`,
      right: `${-this.width}px`,
      bottom: `${-this.width}px`
    };
  }

  _setRect(dx, dy) {
    var height, width;
    height = this.baseRect.height + dy;
    width = this.baseRect.width + dx;
    return {
      height: `${height}px`,
      width: `${width}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 's-resize';
  }

  _handlePosition() {
    return {
      height: `${2 * this.width}px`,
      right: `${this.width}px`,
      left: `${this.width}px`,
      bottom: `${-this.width}px`
    };
  }

  _setRect(dx, dy) {
    var height;
    height = this.baseRect.height + dy;
    return {
      height: `${height}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'sw-resize';
  }

  _handlePosition() {
    return {
      height: `${2 * this.width}px`,
      width: `${2 * this.width}px`,
      left: `${-this.width}px`,
      bottom: `${-this.width}px`
    };
  }

  _setRect(dx, dy) {
    var height, left;
    left = this.baseRect.left + dx;
    height = this.baseRect.height + dy;
    return {
      left: `${left}px`,
      width: `${this.baseRect.right - left}px`,
      height: `${height}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'w-resize';
  }

  _handlePosition() {
    return {
      width: `${2 * this.width}px`,
      top: `${this.width}px`,
      bottom: `${this.width}px`,
      left: `${-this.width}px`
    };
  }

  _setRect(dx, dy) {
    var left;
    left = this.baseRect.left + dx;
    return {
      left: `${left}px`,
      height: `${this.baseRect.height}px`,
      width: `${this.baseRect.right - left}px`
    };
  }

});

HandleBase.subclasses.push(class extends HandleBase {
  _cursor() {
    return 'nw-resize';
  }

  _handlePosition() {
    return {
      top: `${-this.width}px`,
      left: `${-this.width}px`,
      width: `${2 * this.width}px`,
      height: `${2 * this.width}px`
    };
  }

  _setRect(dx, dy) {
    var left, top;
    left = this.baseRect.left + dx;
    top = this.baseRect.top + dy;
    return {
      left: `${left}px`,
      width: `${this.baseRect.right - left}px`,
      top: `${top}px`,
      height: `${this.baseRect.bottom - top}px`
    };
  }

});

export default Resizable;