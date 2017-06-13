<template lang="pug">
.menu-item(
    :class="{ highlight }",
    @mouseenter="mouseenter",
    @mouseleave="mouseleave",
    @mouseup="mouseup",
)
    .left(:style="{ visibility: (checked ? 'visible' : 'hidden') }") &check;&nbsp;&nbsp;
    .left(v-if="label", :class="{ persistent: ! closeOnClick, disabled }", v-html="label")
    .left(v-else, :class="{ disabled }")
      slot(name="label")
    .left !{"&nbsp;".repeat(8)}
    .right(v-if="accessKey", :class="{ disabled }" style="font-family: monospace", v-html="accessKeyDisplay")
    .right(v-else, :style="{ float: 'right', visibility: (hasChildren ? 'visible' : 'hidden') }") &rtrif;
    .clear
    template(v-if="hasChildren")
        xMenu(ref="menu")
            slot
</template>


<script>
import keybindRegisterFactory from './keybind_register'
import * as zIndex from '../z_index.ts'
import xMenu from './menu'
import { findChildren, findParent } from './utils'

const keybindRegister = keybindRegisterFactory()

export default {
  data() {
    return {
      hover: false,
      flash: false
    };
  },
  mounted() {
    if (this.accessKey) {
      keybindRegister.add(this.accessKey, () => {
        if (!this.disabled)
          this.$emit('click');
      });
      this.$watch((() => {
        this.accessKey;
      }), (() => {
        console.warn("dynamic accessKey is not supported");
      }));
    }
    return zIndex.add(this, 'menu');
  },
  beforeDestroy() {
    if (this.accessKey) {
      keybindRegister.remove(this.accessKey);
    }
    return zIndex.remove(this);
  },
  computed: {
    highlight() {
      if (this.disabled) {
        return false;
      }
      if (this.parent().flashing) {
        return this.flash;
      } else {
        return this.hover || this.$refs.menu && this.$refs.menu.isOpen;
      }
    },
    accessKeyDisplay() {
      var modifiers;
      modifiers = {
        meta: '&#8984;',
        alt: '&#8997;',
        ctrl: '&#8963;',
        shift: '&#8679;'
      };
      return this.accessKey.split('+').map(function (k) {
        switch (k) {
          case '+':
            return '';
          case 'meta':
          case 'alt':
          case 'ctrl':
          case 'shift':
            return modifiers[k];
          default:
            return k;
        }
      }).join(' ');
    }
  },
  props: {
    label: {
      type: String
    },
    disabled: {
      type: Boolean,
      "default": false
    },
    checked: {
      type: Boolean,
      "default": false
    },
    hasChildren: {
      type: Boolean,
      "default": false
    },
    closeOnClick: {
      type: Boolean,
      "default": true
    },
    accessKey: {
      type: String
    },
    immediate: {
      type: Boolean,
      default: false,
    }
  },
  methods: {
    isMenuItem() {
      return true;
    },
    mouseenter() {
      this.hover = true;
      if (!this.parent().flashing) {
        return this.open();
      }
    },
    mouseleave() {
      return this.hover = false;
    },
    close(fade) {
      this.hover = false;
      if (this.hasChildren) {
        return this.$refs.menu.close(fade);
      }
    },
    open() {
      var ref1, right, top;
      this.parent().closeChildren({
        except: this
      });
      if (this.hasChildren) {
        ref1 = this.$el.getBoundingClientRect(), right = ref1.right, top = ref1.top;
        return this.$refs.menu.open({
          x: right,
          y: top - 2
        });
      }
    },
    mouseup(e) {
      if (!this.disabled && !this.parent().flashing && !this.hasChildren) {
        const exec = () => {
          this.$emit('click');
          if (this.closeOnClick && !e.shiftKey) {
            this.closeRoot();
          }
        }
        if (this.immediate) {
          exec()
        }
        else {
          this.startFlash(exec)
        }
      }
    },
    startFlash(done, n = 3) {
      var i, timer;
      i = 0;
      this.parent().flashing = true;
      return timer = setInterval((() => {
        this.flash = i % 2 === 1;
        if (i++ === n) {
          clearInterval(timer);
          done();
          this.flash = true;
          return setTimeout((() => {
            this.parent().flashing = false;
            return this.flash = false;
          }), 400);
        }
      }), 50);
    },
    parent() {
      return findParent(this);
    },
    closeRoot() {
      return findParent(this, 'isMenuRoot').shutdown();
    }
  },
  components: {
    xMenu
  }
};
</script>


<style lang="sass" scoped>
.menu-item
    padding: 5px 10px
    white-space: nowrap
.highlight
    background-color: rgba(255, 255, 255, 0.1)
.persistent
    font-style: italic
    // text-decoration: underline
.disabled
    color: #777
.left
    float: left
.right
    float: right
.clear
    clear: both
</style>