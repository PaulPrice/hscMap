<template lang="pug">
.root
    myMenu
    myAboutPanel
    myFrames
    myCatalogManagerPanel
    myCatalogTablePanels
    myColorMixerPanel
    myAttributions
    myDevel
    myPreferencesPanel
    myCitizenSciencePanel
</template>


<script>

import myMenu from '../menu'
import myAboutPanel from '../about_panel'
import myFrames from '../frames'
import myCatalogManagerPanel from '../catalog_manager_panel'
import myColorMixerPanel from '../color_mixer_panel'
import myAttributions from '../attributions'
import myCatalogTablePanels from '../catalog_table_panels'
import myDevel from '../../devel'
import myPreferencesPanel from '../preferences'
import myCitizenSciencePanel from '../citizen_science'


export default {
    components: {
        myMenu,
        myAboutPanel,
        myFrames,
        myCatalogManagerPanel,
        myColorMixerPanel,
        myAttributions,
        myCatalogTablePanels,
        myDevel,
        myPreferencesPanel,
        myCitizenSciencePanel,
    },
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