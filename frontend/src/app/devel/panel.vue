<template lang="pug">
div
    xPanel(title="Devel", v-model="$root.s.panelManager.devel")
        xFieldset
            legend SSP Image Layer
            label
                input(type="checkbox", v-model="$root.s.develState.checkBoard")
                | CheckBoard
            label
                input(type="checkbox", v-model="$root.s.develState.flashOnLoad")
                | Flash On Load
</template>

<style lang="sass" scoped>
label
    padding: 0 1em
</style>