<template lang="pug">
.wrapper(@mouseup.stop="mouseUp")
    xFlatButton(@click="opened = !opened")
        .color-box(:style="`background-color: ${rgba};`") &nbsp;
    .event-interceptor(v-show="opened", @mousedown.stop="opened = false", @click.stop="")
    transition(name="fade")
        .popup(v-show="opened", ref="popup")
            div(ref="pickerHolder")
            input(type="range", min="0", max="255", style={width: '150px'}, v-model="alpha")
</template>


<script>
import ColorPicker from 'simple-color-picker'
import * as zIndex from './z_index';
import 'style-loader!css-loader!simple-color-picker/src/simple-color-picker.css'


export default {
    props: {
        value: {
            default() {
                return [1, 1, 1, 1] // [R, G, B, a]
            }
        },
    },
    data() {
        const [r, g, b, a] = this.value
        return {
            rgb: [r, g, b].map(c => Math.floor(255 * c)),
            alpha: 255 * a, // [0, 256)
            opened: false,
        }
    },
    mounted() {
        zIndex.add(this, 'floating')

        this.colorPicker = new ColorPicker({
            el: this.$refs.pickerHolder
        })
        this.colorPicker.onChange(() => {
            const { r, g, b } = this.colorPicker.getRGB()
            this.rgb = [r, g, b]
        })
        this.$watch(() => [this.rgb, this.alpha], () => {
            const [r, g, b] = this.rgb
            this.$emit('input', [r / 255, g / 255, b / 255, this.alpha / 255])
        })
        this.$watch(() => this.value, (newValue, oldValue) => {
            if (oldValue) {
                if (newValue.reduce((p, v, i) => p + (v - oldValue[i]) ** 2, 0) < (1 / 256) ** 2)
                    return
            }
            const [r, g, b, a] = newValue
            const [rr, gg, bb, aa] = [r, g, b, a].map(c => Math.floor(255 * c))
            this.colorPicker.setColor(rr << 16 | gg << 8 | bb)
            this.rgb = [rr, gg, bb]
            this.alpha = 255 * a
        }, { immediate: true })
    },
    computed: {
        rgba() {
            const [r, g, b] = this.rgb
            return `rgba(${r}, ${g}, ${b}, ${this.alpha / 255})`
        },
    },
    watch: {
        opened(opened) {
            if (opened)
                zIndex.activate(this);
        }
    },
    beforeDestroy() {
        zIndex.remove(this);
        this.colorPicker.remove()
    },
    methods: {
        mouseUp() {
            window.dispatchEvent(new MouseEvent('mouseup'))
        },
    },
}
</script>


<style lang="sass" scoped>
.wrapper
    display: inline-block
.event-interceptor
    position: fixed
    width: 100%
    height: 100%
    top: 0
    left: 0
.popup
    position: fixed
    background-color: rgba(17, 17, 17, 0.5)
    box-shadow: 0 0 4pt rgba(255, 255, 255, 0.2)
    padding: 0.5em
    border-radius: 4px
.color-box
    display: inline-block
    border-radius: 6pt
    box-shadow: 0 0 4pt rgba(0, 0, 0, 0.5)
    width: 11pt
    height: 11pt
input
    margin: 1em auto 0.25em auto
    opacity: 0.75
.fade-leave-active
    transition: opacity .4s
.fade-leave-to
    opacity: 0
</style>