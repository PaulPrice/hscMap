<template lang="pug">
    .menu-bar
        slot
</template>


<script>

import { findChildren } from './utils'
import * as zIndex from '../z_index'

export default {
  data() {
    return {
      active: false
    };
  },
  mounted() {
    return zIndex.add(this, 'menu');
  },
  beforeDestroy() {
    return zIndex.remove(this);
  },
  methods: {
    isMenuBar() {
      return true;
    },
    isMenuRoot() {
      return true;
    },
    closeChildren(arg) {
      var except, fade, i, len, menu, ref, results;
      except = arg.except, fade = arg.fade;
      ref = findChildren(this, 'isMenu');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        menu = ref[i];
        if (menu !== except) {
          results.push(menu.close(fade));
        }
      }
      return results;
    },
    shutdown() {
      var i, len, menuBarItem, ref;
      this.closeChildren({
        fade: true
      });
      ref = this.$children;
      for (i = 0, len = ref.length; i < len; i++) {
        menuBarItem = ref[i];
        if (typeof menuBarItem.isMenuBarItem === "function" ? menuBarItem.isMenuBarItem() : void 0) {
          menuBarItem.unbind();
        }
      }
      return this.active = false;
    }
  },
  components: {
    MenuBarItem: require('./menu_bar_item.vue')
  }
};
</script>


<style lang="sass" scoped>
    .menu-bar
        color: white
        font-family: sans-serif
        font-size: 11pt
        border-bottom-right-radius: 4px
        background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(31, 31, 31, 0 )), to(rgba(0, 0, 0, 0.25)))
        background-color: rgba(17, 17, 17, 0.5)
        user-select: none
        box-shadow: 0 0 4pt rgba(255, 255, 255, 0.2)
        padding: 0
        margin: 0
        cursor: default
</style>