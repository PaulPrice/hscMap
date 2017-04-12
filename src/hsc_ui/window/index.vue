<template lang="pug">
transition(name="fade", @after-leave="$emit('close')")
    .window(ref="window" v-show="state.opened", @mousedown.stop="activate")
        .header(ref="header", @mousedown="activate")
            .left {{title}} <slot name="title" />
            .close.right(
                :style="{ visibility: hasCloseButton ? 'visible' : 'hidden' }",
                @click="emitChange({ opened: false })",
                @mousedown.stop="",
            ) &times;
            .clear
        .content(
            ref="content",
            :style="{ padding: `${padding[0]}px ${padding[1]}px` }"
        )
            template(v-if="slotInDocTree")
                slot
</template>


<script>
import Draggable from './draggable';

import Resizable from './resizable';

import Vue from 'vue';

import { setPosition, setRect, getRect } from './position';

import * as zIndex from '../z_index';

export default {
  data() {
    return {
      slotInDocTree: !this.lazy || this.state.opened,
    };
  },
  props: {
    title: {
      type: String
    },
    resizable: {
      type: Boolean,
      default: false
    },
    hasCloseButton: {
      type: Boolean,
      default: true
    },
    position: {
      type: Object,
      default: function () {
        return {
          my: 'center',
          at: 'center'
        };
      },
      validator(value) {
        if (typeof value === 'object') {
          if (value.my == null) {
            value.my = 'center';
          }
          return value.at != null ? value.at : value.at = 'center';
        }
      }
    },
    padding: {
      default: function () {
        return [4, 8];
      }
    },
    initialWidth: {
      type: Number
    },
    initialHeight: {
      type: Number
    },
    floating: {
      type: Boolean
    },
    lazy: {
      type: Boolean,
      default: false
    },
    state: {
      default() {
        return {
          opened: true,
          rect: null, // will be used for only mounted
        }
      }
    },
    changeModelSilently: {
      type: Boolean,
      default: true,
    }
  },
  model: {
    prop: 'state',
    event: 'change'
  },
  mounted() {
    this.dragger = new Draggable(this.$refs.window, {
      handle: this.$refs.header,
      drag: () => {
        this.onDrag()
      }
    });
    if (this.resizable) {
      this.resizer = new Resizable(this.$refs.window, {
        drag: () => {
          this.onResize();
          this.$emit('resize');
        }
      });
    }
    if (this.state.rect) {
      setRect(this.$refs.window, this.state.rect);
      this.onResize()
      this.$emit('resize');
    }
    else {
      if (this.initialWidth != null) {
        this.$refs.content.style.width = `${this.initialWidth}px`;
        this.$emit('resize');
      }
      if (this.initialHeight != null) {
        this.$refs.content.style.height = `${this.initialHeight}px`;
        this.$emit('resize');
      }
      this.setPosition();
    }
    zIndex.add(this, this.floating ? 'floating' : 'window');
  },
  beforeDestroy() {
    var ref, ref1;
    zIndex.remove(this);
    if ((ref = this.dragger) != null) {
      ref.destroy();
    }
    return (ref1 = this.resizer) != null ? ref1.destroy() : void 0;
  },
  watch: {
    'state.opened'() {
      this.slotInDocTree = this.slotInDocTree || this.state.opened
      this.state.opened && zIndex.activate(this)
    }
  },
  methods: {
    onDrag() {
      this.emitChange({
        ...this.state,
        rect: getRect(this.$refs.window),
      })
    },
    onResize() {
      var height;
      height = this.$refs.window.clientHeight - this.$refs.header.clientHeight;
      this.$refs.content.style.height = `${height}px`;
      this.$refs.content.style.width = `${this.$refs.window.clientWidth}px`;
      this.emitChange({
        ...this.state,
        rect: getRect(this.$refs.window),
      })
    },
    activate() {
      zIndex.activate(this);
      this.$emit('activate');
    },
    setPosition() {
      setPosition({
        target: [this.$refs.window, this.position.my],
        ref: [window, this.position.at]
      });
    },
    emitChange(value) {
      if (this.changeModelSilently)
        Object.assign(this.state, value)
      else
        this.$emit('change', {
          ...this.state,
          ...value
        })
    }
  }
};
</script>


<style lang="sass" scoped>
$border-radius: 4pt
.window
    // transform-origin: inherit; <= will be overwritten by setTransformOrigin
    color: white
    font-family: sans-serif
    font-size: 11pt
    box-shadow: 0 0 4pt rgba(255, 255, 255, 0.5)
    position: fixed
    border-radius: $border-radius $border-radius 0 0
    cursor: default
    display: inline-block
    background-color: rgba(17, 17, 17, 0.5)
.header
    font-weight: bold
    color: #eee
    background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(31, 31, 31, 0.25)), to(rgba(31, 31, 31, 0.5)))
    padding: 6pt 8pt
    border-radius: $border-radius $border-radius 0 0
    user-select: none
    cursor: move
.left
    float: left
    padding: 2pt 6pt
.right
    float: right
.clear
    clear: both
.close
    padding: 2pt 6pt
    border-radius: 2pt
    cursor: default
    &:hover
        background-color: rgba(255, 255, 255, 0.2)
    &:active
        background-color: rgba(255, 255, 255, 0.5)
// animation
.fade-enter,
    opacity: 0
    transform: scale(0.9)
.fade-leave-to
    opacity: 0
    transform: scale(0.9)
.fade-enter-active,.fade-leave-active
    transition: 0.2s
</style>