<template lang="pug">
.root
    myMenu
    template(v-if="$root.state.frame.mode == 'single'")
        myFrame.frame-single(
            v-model="$root.state.frame.current",
            :key="$root.state.frame.current",
            @move="e => $root.syncCamera(e)",
            @mouseHoverOnCatalogObject="$root.mouseHoverOnCatalogObject",
        )
    template(v-else)
        myFrameWindow(
            v-for="frameWindow in $root.state.frame.frameWindows", :key="frameWindow",
            :frame="frameWindow.frame", :window="frameWindow.window",
            :focused="frameWindow.frame == $root.state.frame.current",
            :emitMoveEventContinuously="$root.state.frame.frameWindows.length > 1",
            @move="e => $root.syncCamera(e)",
            @mouseHoverOnCatalogObject="$root.mouseHoverOnCatalogObject",
            @activate="$root.state.frame.current = frameWindow.frame",
            @close="$root.deleteFrameWindow(frameWindow)",
        )
    myAboutWindow
    myColorMixerWindow
    myCatalogManagerWindow
    myAttributions
    template(v-for="fw in $root.state.frame.frameWindows")
        template(v-for="c in fw.frame.catalogs")
            myCatalogTableWindow(:catalogState="c", :frame="fw.frame", :key="c")
</template>


<script>
export default {
    components: {
        myMenu: require('../menu'),
        myAboutWindow: require('../about_window'),
        myFrame: require('../frame'),
        myColorMixerWindow: require('../color_mixer_window'),
        myFrameWindow: require('../frame_window'),
        myCatalogManagerWindow: require('../catalog_manager_window'),
        myCatalogTableWindow: require('../catalog_table_window'),
        myAttributions: require('../attributions'),
    }
}
</script>


<style lang="sass">
.root
    background-color: #333
    position: fixed
    top: 0
    left: 0
    width: 100%
    height: 100%
</style>