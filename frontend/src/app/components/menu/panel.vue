<template lang="pug">
xMenuBarItem(label="Window")
    xMenuItem(label="Color Mixer", :checked="$root.s.panelManager.colorMixer.opened", @click="$root.s.panelManager.toggle('colorMixer')", accessKey="C")
    xMenuItem(label="Catalogs", :checked="$root.s.panelManager.catalogManager.opened", @click="$root.s.panelManager.toggle('catalogManager')", accessKey="K")
    xDivider
    xMenuItem(label="About hscMap...", @click="goToGithub", :immediate="true")
    xMenuItem(label="About HSC SSP...", :checked="$root.s.panelManager.about.opened", @click="$root.s.panelManager.toggle('about')")
    xDivider
    xMenuItem(label="Devel", :checked="$root.s.panelManager.devel.opened", @click="$root.s.panelManager.toggle('devel')", accessKey="shift+ctrl+D")
    xMenuItem(label="Citizen Science", :checked="$root.s.panelManager.citizenScience.opened", @click="$root.s.panelManager.toggle('citizenScience')", accessKey="shift+ctrl+C")
</template>


<script>
export default {
    methods: {
        goToGithub() {
            location.href = 'https://github.com/michitaro/hscMap'
        }
    }
}
</script>