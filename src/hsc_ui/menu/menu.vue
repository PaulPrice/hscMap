<template lang="pug">
    transition(:name="fade")
        .menu(ref="menu" v-show="isOpen", @mousedown.stop.prevent="", @mouseup.stop.prevent="")
            slot
</template>


<script>
import { findChildren } from './utils'

export default {
  props: {
    label: {
      type: String
    }
  },
  data() {
    return {
      isOpen: false,
      fade: "none",
      flashing: false
    };
  },
  methods: {
    isMenu() {
      return true;
    },
    open(position) {
      this.fade = "none";
      this.closeChildren({
        fade: false
      });
      this.$refs.menu.style.top = `${position.y}px`;
      this.$refs.menu.style.left = `${position.x}px`;
      return this.isOpen = true;
    },
    close(fade = false) {
      this.fade = fade ? "fade" : "none";
      return this.isOpen = false;
    },
    closeChildren(arg) {
      var except, fade, i, len, menuItem, ref, results;
      except = arg.except, fade = arg.fade;
      ref = findChildren(this);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        menuItem = ref[i];
        if (menuItem !== except) {
          results.push(menuItem.close(fade));
        }
      }
      return results;
    }
  }
};
</script>


<style lang="sass" scoped>
    .menu
        display: inline-block
        position: fixed
        background-color: rgba(17, 17, 17, 0.5)
        box-shadow: 0 0 4pt rgba(255, 255, 255, 0.2)
        border-radius: 4px
        padding: 2px 0
        color: white
        font-family: sans-serif
        font-size: 11pt
        cursor: default
    .none-enter
        opacity: 0
    .fade-leave-active
        transition: opacity .4s
    .fade-leave-to
        opacity: 0
</style>