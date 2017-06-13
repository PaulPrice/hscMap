<template lang="pug">
xMenuBarItem(label="hscMap3")
    xMenuItem(label="About hscMap...", @click="goToGithub", :immediate="true")
    xMenuItem(label="About HSC SSP...", :checked="$root.s.panelManager.about.opened", @click="$root.s.panelManager.toggle('about')")
    xDivider
    xMenuItem(label="Preferences...", @click="$root.s.panelManager.toggle('preferences')", accessKey="P")
    xDivider
    xMenuItem(label="Save", @click="saveState()")
    xMenuItem(label="Clear", @click="clearState()")
</template>


<script>
import * as persistent from '../root/persistent_state'

export default {
    methods: {
        goToGithub(){
            window.open('https://github.com/michitaro/hscMap/')
        },
        saveState() {
            persistent.save(this.$root.s)
        },
        clearState() {
            persistent.clear()
        },
    },
}
</script>