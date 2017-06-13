<template lang="pug">
.full
    .full(v-if="$root.s.frameManager.mode == 'single'")
        myFrame(
            :key="currentFrame",
            v-model="currentFrame",
            :retina="$root.s.viewState.retina",
            :dissolveEffect="$root.s.viewState.dissolveEffect",
            :motionLod="$root.s.viewState.motionLod",
            @move="e => $root.s.viewState.frameOnMove(e)",
        )
    div(v-else)
        myFramePanel(
            v-for="fp in $root.s.frameManager.framePanels", :key="fp",
            :frame="fp.frame", :panel="fp.panel",
            :retina="$root.s.viewState.retina",
            :dissolveEffect="$root.s.viewState.dissolveEffect",
            :focused="fp.frame == currentFrame",
            :emitMoveEventContinuously="$root.s.frameManager.framePanels.length > 1",
            :motionLod="$root.s.viewState.motionLod",
            @close="$root.s.frameManager.deleteFrame(fp.frame)",
            @activate="$root.s.frameManager.currentFrame = fp.frame",
            @move="e => $root.s.viewState.frameOnMove(e)",
        )
</template>


<script>
import myFrame from './frame'
import myFramePanel from './frame_panel'

export default {
    components: {
        myFrame,
        myFramePanel,
    },
    computed: {
        currentFrame() {
            return this.$root.s.frameManager.currentFrame
        }
    }
}
</script>


<style lang="sass">
.full
    height: 100%
</style>