<template lang="pug">
    div(style="display: inline-block;")
        .menu-bar-item(
            @mouseenter="mouseenter",
            @mouseleave="mouseleave",
            @mousedown="mousedown",
            :class="{ fullscreen, hover : hover || ($refs.menu && $refs.menu.isOpen) }",
        ) {{label}}
        xMenu(ref="menu")
            slot
</template>


<script>
var stop;

import { isClick, once, findParent } from './utils';
import xMenu from './menu'


export default {
  props: {
    label: {
      type: String
    }
  },
  data() {
    return {
      hover: false
    };
  },
  computed: {
    fullscreen() {
      return findParent(this, 'isMenuBar').fullscreen;
    }
  },
  methods: {
    isMenuBarItem() {
      return true;
    },
    open() {
      var base, bottom, left, ref1;
      this.parent().closeChildren({
        except: this,
        fade: false
      });
      ref1 = this.$el.getBoundingClientRect(), left = ref1.left, bottom = ref1.bottom;
      return typeof (base = this.$refs.menu).open === "function" ? base.open({
        x: left,
        y: bottom
      }) : void 0;
    },
    mouseenter() {
      this.hover = true;
      if (this.parent().active) {
        return this.open();
      }
    },
    mouseleave() {
      return this.hover = false;
    },
    mousedown(e1) {
      stop(e1);
      if (this.parent().active) {
        this.parent().shutdown();
        return;
      }
      this.parent().active = true;
      if (typeof this.unbind1 === "function") {
        this.unbind1();
      }
      this.unbind1 = once(document, 'mouseup', (e2) => {
        stop(e2);
        if (isClick(e1, e2)) {
          if (typeof this.unbind2 === "function") {
            this.unbind2();
          }
          return this.unbind2 = once(document, 'mousedown', (e) => {
            stop(e);
            return this.parent().shutdown();
          });
        } else {
          return this.parent().shutdown();
        }
      });
      return this.open();
    },
    unbind() {
      if (typeof this.unbind1 === "function") {
        this.unbind1();
      }
      return typeof this.unbind2 === "function" ? this.unbind2() : void 0;
    },
    parent() {
      return findParent(this, 'isMenuBar');
    }
  },
  components: {
    xMenu
  }
};

stop = function (event) {
  event.stopPropagation();
  return event.preventDefault();
};
</script>


<style lang="sass" scoped>
    .menu-bar-item
        display: inline-block
        padding: 0.6em 1em 0.5em 1em
        &.fullscreen
          padding-top: 2em
        &.hover
            background-color: rgba(255, 255, 255, 0.1)
</style>