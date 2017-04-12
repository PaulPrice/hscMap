<template lang="pug">
    xWindow(
        ref="window",
        v-model="window",
        :padding="[0, 0]",
        :initialWidth="600",
        :initialHeight="400",
        :resizable="true",
        @resize="resize",
        @activate="activate",
        @close="$emit('close')",
    )
        myFrame(
            ref="frame",
            style="height: 100%;",
            v-model="frame",
            @move="move",
            @mouseHoverOnCatalogObject="mouseHoverOnCatalogObject",
            :emitMoveEventContinuously="emitMoveEventContinuously"
        )
        template(slot="title")
            span(:style="focused ? { textDecoration: 'underline' } : { color: '#777' }") {{frame.name}}
</template>


<script>
export default {
    props: {
        window: { required: true },
        frame: { required: true },
        focused: { required: true },
        emitMoveEventContinuously: { type: Boolean, default: false }
    },
    mounted() {
        this.$watch('focused', focused => {
            focused && this.$refs.window.activate()
        })
    },
    methods: {
        resize() {
            this.$refs.frame.globe.onResize()
        },
        move(e) {
            this.$emit('move', e)
        },
        activate(e) {
            this.$emit('activate', e)
        },
        mouseHoverOnCatalogObject(e) {
            this.$emit('mouseHoverOnCatalogObject', e)
        }
    },
    components: {
        myFrame: require('./frame')
    }
}
</script>