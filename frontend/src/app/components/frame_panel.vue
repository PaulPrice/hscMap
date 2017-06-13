<template lang="pug">
xPanel(
    ref="panel",
    v-model="panel",
    :padding="[0, 0]",
    :initialWidth="600",
    :initialHeight="400",
    :resizable="true",
    @resize="$refs.frame.globe.onResize()",
    @activate="e => $emit('activate', e)",
    @close="$emit('close')",
)
    myFrame(
        ref="frame",
        style="height: 100%;",
        v-model="frame",
        @move="e => $emit('move', e)",
        :retina="retina",
        :emitMoveEventContinuously="emitMoveEventContinuously",
        :dissolveEffect="dissolveEffect",
        :motionLod="motionLod",
    )
    template(slot="title")
        span(:style="focused ? { textDecoration: 'underline' } : { color: '#777' }") {{frame.name}}
</template>


<script>
import myFrame from './frame'

export default {
    props: {
        panel: { required: true },
        frame: { required: true },
        focused: { required: true },
        retina: { required: true },
        motionLod: { require: true },
        emitMoveEventContinuously: { type: Boolean, default: false },
        dissolveEffect: { type: Boolean, default: true },
    },
    mounted() {
        this.$watch('focused', focused => {
            focused && this.$refs.panel.activate()
        })
    },
    components: {
        myFrame
    }
}
</script>