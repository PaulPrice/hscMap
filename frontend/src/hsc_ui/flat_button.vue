<template lang="pug">
.flat-button(@click.stop="enabled && $emit('click')", @mousedown.stop="", @dblclick.stop="", :class="{ disabled, enabled, checked }")
    slot
</template>


<style lang="sass" scoped>
.flat-button
    display: inline-block
    margin: 0.1em
    border-radius: 4pt
    background-color: rgba(191, 191, 191, 0.25)
    padding: 0.2em 1em
    cursor: default
    &, & *
        user-select: none
    transition: background-color 0.4s
    &:hover.enabled
        transition: background-color 0.1s
        background-color: rgba(255, 255, 255, 0.25)
    &:active.enabled
        background-color: rgba(255, 255, 255, 0.5)
    &.checked
        background-color: rgba(0, 255, 255, 0.5)
        &:hover
            background-color: rgba(191, 255, 255, 0.5)
.disabled
    opacity: 0.5
</style>


<script>
export default {
    computed: {
        enabled() {
            return !this.disabled
        }
    },
    props: {
        disabled: { type: Boolean, default: false },
        checked: { type: Boolean, default: false },
    }
}
</script>