<template lang="pug">
xMenuBar(:fullscreen="$root.s.viewState.fullscreen")
    myHscMap3Menu
    myViewMenu
    myFrameMenu
    //- myBookmark
    myDatasetMenu
    myPanelMenu
</template>


<script>
import myHscMap3Menu from './hsc_map'
import myViewMenu from './view'
import myPanelMenu from './panel'
import myFrameMenu from './frame'
import myDatasetMenu from './dataset'
import myBookmark from './bookmark'

export default {
    components: {
        myHscMap3Menu,
        myViewMenu,
        myPanelMenu,
        myFrameMenu,
        myDatasetMenu,
        myBookmark,
    },
}
</script>


<style lang="sass" scoped>
.menu-bar
    position: fixed
    top: 0
    left: 0
</style>