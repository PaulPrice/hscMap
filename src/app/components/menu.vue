<template lang="pug">
xMenuBar
    xMenuBarItem(label="hscMap3")
        xMenuItem(label="About HSC SSP...", :checked="state.window.aboutWindow.opened", @click="invert(state.window.aboutWindow, 'opened')")
    xMenuBarItem(label="View")
        xMenuItem(label="Projection", :hasChildren="true")
            -
                const projections = [
                    { accessKey: 'G', label: 'Gnomonic Projection', mode: 'GNOMONIC' },
                    { accessKey: 'S', label: 'Stereographic Projection', mode: 'STEREOGRAPHIC' },
                    { accessKey: 'T', label: 'Tilt', mode: 'TILT' },
                    { accessKey: 'O', label: 'Stellar Globe', mode: 'GLOBE' },
                ].map((p)=> ({
                    accessKey: p.accessKey,
                    label: p.label,
                    '@click': `currentFrame.setCameraMode(CameraMode.${p.mode})`,
                    ':checked': `currentFrame.cameraParams.mode == CameraMode.${p.mode}`,
                    ':closeOnClick': 'false',
                }))
            each projection in projections
                xMenuItem&attributes(projection)
            xDivider
            xMenuItem(:closeOnClick="false", accessKey="Z", label="Toggle", @click="currentFrame.setCameraMode()")
        xMenuItem(label="Layers", :hasChildren="true")
            -
                const layers = [
                    { klass: 'GridLayer', name: 'Grid', accessKey: 'shift+alt+G' },
                    { klass: 'DynamicGridLayer', name: 'Small Grid', accessKey: 'shift+alt+D' },
                    { klass: 'ConstellationsLayer', name: 'Constellations', accessKey: 'shift+alt+C' },
                    { klass: 'SspSurveyAreaLayer', name: 'SSP Suvey Area' },
                    { klass: 'SspImageLayer', name: 'SSP Image' },
                    { klass: 'HipparcosCatalogLayer', name: 'Hipparcos Catalog', accessKey: 'shift+alt+H' },
                    { klass: 'EsoMilkyWayLayer', name: 'ESO Milky Way' },
                ].map(l => ({
                    label: l.name,
                    accessKey: l.accessKey,
                    ':closeOnClick': "false",
                    ':checked': `currentFrame.layers.${l.klass}`,
                    '@click': `invert(currentFrame.layers, '${l.klass}')`,
                }))
            each l in layers
                xMenuItem&attributes(l)
        xMenuItem(label="Grid", :hasChildren="true")
            xMenuItem(label="Sexagesimal", :checked="currentFrame.grid.mode == GridMode.SEXAGESIMAL", @click="currentFrame.grid.mode = GridMode.SEXAGESIMAL")
            xMenuItem(label="Degree", :checked="currentFrame.grid.mode == GridMode.DEGREE", @click="currentFrame.grid.mode = GridMode.DEGREE")
            xDivider
            xMenuItem(label="Live", :checked="currentFrame.grid.live", @click="invert(currentFrame.grid, 'live')")
        xDivider
        -
            const scales = [
                { label: '1&prime;', fovy: 'math.arcmin2rad(1)', accessKey: "1" },
                { label: '5&prime;', fovy: 'math.arcmin2rad(5)', accessKey: "2" },
                { label: '2&deg;', fovy: 'math.deg2rad(2)', accessKey: "3" },
                { label: '30&deg;', fovy: 'math.deg2rad(30)', accessKey: "4" },
                { label: '90&deg;', fovy: 'math.deg2rad(90)', accessKey: "5" },
            ].map(s => ({
                label: s.label,
                accessKey: s.accessKey,
                '@click': `currentFrame.jumpTo({ fovy: ${s.fovy} })`,
            }))
        xMenuItem(label="Zoom", :hasChildren="true")
            each s in scales
                xMenuItem&attributes(s)
        xMenuItem(label="North Up", accessKey="N", @click="currentFrame.jumpTo({ roll: 0 })")
        xDivider
        xMenuItem(label="Lock", :hasChildren="true")
            xMenuItem(label="WCS", :checked="state.frame.lock.wcs", @click="invert(state.frame.lock, 'wcs')")
        xDivider
        xMenuItem(
            label="Retina", accessKey="ctrl+R",
            @click="invert(state.view, 'retina')",
            :checked="state.view.retina",
            :disabled="!$root.inRetinaDisplay()")
        xMenuItem(label="Fullscreen", accessKey="F", @click="$root.toggleFullscreen()", :checked="state.view.fullscreen")
    xMenuBarItem(label="Frame")
        xMenuItem(label="New Frame", accessKey="alt+N", @click="$root.newFrame()")
        xDivider
        xMenuItem(label="Single", :checked="state.frame.mode == 'single'", @click="state.frame.mode = 'single'")
        xMenuItem(label="Window", :checked="state.frame.mode == 'window'", @click="state.frame.mode = 'window'")
        xDivider
        template(v-for="frameWindow in state.frame.frameWindows")
            xMenuItem(:label="frameWindow.frame.name", :checked="currentFrame == frameWindow.frame", @click="$root.state.frame.current = frameWindow.frame")
    xMenuBarItem(label="Develop")
        xMenuItem(label="Refresh Tiles", @click="$root.refreshTileLayers()", accessKey="shift+meta+ctrl+R")
    xMenuBarItem(label="Window")
        -
            const windows = [
                {key: 'colorMixerWindow', label: 'Color Mixer', accessKey: 'C'},
                {key: 'catalogManagerWindow', label: 'Catalogs', accessKey: 'K'},
            ].map(w => ({
                label: w.label,
                accessKey: w.accessKey,
                ':checked': `state.window.${w.key}.opened`,
                '@click': `invert(state.window.${w.key}, 'opened')`,
            }))
        each w in windows
            xMenuItem&attributes(w)
</template>


<script>
import { CameraMode, GridMode, math } from 'stellar-globe'

export default {
    created() {
        Object.assign(this, { CameraMode, GridMode, math })
    },
    computed: {
        state() { return this.$root.state },
        currentFrame() { return this.$root.state.frame.current }
    },
    methods: {
        invert(obj, prop) {
            obj[prop] = !obj[prop]
        }
    }
}
</script>


<style lang="sass" scoped>
.menu-bar
    position: fixed
    top: 0
    left: 0
</style>