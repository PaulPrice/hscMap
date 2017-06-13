// Generated by CoffeeScript 2.0.0-alpha1
var KeybindRegsiter, getSingleton, singleton;

KeybindRegsiter = class KeybindRegsiter {
  constructor() {
    this.handler = {};
    this.keydown = (e) => {
      return this._execRegisteredHandler(e);
    };
    document.addEventListener('keydown', this.keydown);
  }

  destroy() {
    return document.removeEventListener('keydown', this.keydown);
  }

  add(keybind, handler) {
    if (this.handler[keybind] != null) {
      console.warn(`keybind (${keybind}) is already registered`);
    }
    return this.handler[keybind] = {
      matcher: this._parse(keybind),
      handler: handler
    };
  }

  remove(keybind) {
    if (this.handler[keybind] == null) {
      console.warn(`keybind (${keybind}) is not registered`);
    }
    return delete this.handler[keybind];
  }

  _execRegisteredHandler(e) {
    var handler, hit, keybind, matcher, ref, ref1;
    hit = 0;
    ref = this.handler;
    for (keybind in ref) {
      ref1 = ref[keybind], matcher = ref1.matcher, handler = ref1.handler;
      if (this._match(matcher, e)) {
        handler(e);
        hit++;
        e.preventDefault();
      }
    }
    if (hit > 1) {
      console.warn(`keybind (${keybind}) matched ${hit} times`);
      return console.warn(e);
    }
  }

  _parse(keybind) {
    var altKey, ctrlKey, i, k, keyCode, len, metaKey, ref, shiftKey;
    ctrlKey = metaKey = shiftKey = altKey = false;
    ref = keybind.split('+');
    for (i = 0, len = ref.length; i < len; i++) {
      k = ref[i];
      switch (k) {
        case 'ctrl':
          ctrlKey = true;
          break;
        case 'alt':
          altKey = true;
          break;
        case 'meta':
          metaKey = true;
          break;
        case 'shift':
          shiftKey = true;
          break;
        default:
          keyCode = k.charCodeAt(0);
      }
    }
    return {
      ctrlKey: ctrlKey,
      altKey: altKey,
      metaKey: metaKey,
      shiftKey: shiftKey,
      keyCode: keyCode
    };
  }

  _match(matcher, e) {
    return Object.keys(matcher).every((k) => {
      return matcher[k] === e[k];
    });
  }

};

singleton = void 0;

getSingleton = function() {
  return singleton != null ? singleton : singleton = new KeybindRegsiter();
};

export default getSingleton;