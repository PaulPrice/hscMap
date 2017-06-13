<template lang="pug">
xMenuBarItem(label="View")
    xMenuItem(label="Projection", :hasChildren="true")
        -
            const projections = [
                { accessKey: 'E', label: 'Floating Eye', mode: 'FLOATING_EYE' },
                { accessKey: 'G', label: 'Gnomonic Projection', mode: 'GNOMONIC' },
                { accessKey: 'S', label: 'Stereographic Projection', mode: 'STEREOGRAPHIC' },
                { accessKey: 'O', label: 'Stellar Globe', mode: 'GLOBE' },
                { accessKey: 'T', label: 'Tilt', mode: 'TILT' },
            ].map((p)=> ({
                accessKey: p.accessKey,
                label: p.label,
                '@click': `currentFrame.camera.setMode(CameraMode.${p.mode})`,
                ':checked': `currentFrame.camera.p.mode == CameraMode.${p.mode}`,
                ':closeOnClick': 'false',
            }))
        each projection in projections
            xMenuItem&attributes(projection)
        xDivider
        xMenuItem(:closeOnClick="false", accessKey="Z", label="Toggle", @click="currentFrame.camera.setMode()")
    xMenuItem(label="Layers", :hasChildren="true")
        -
            const layers = [
                { klass: 'GridLayer', name: 'Grid', accessKey: 'alt+G' },
                { klass: 'DynamicGridLayer', name: 'Small Grid', accessKey: 'alt+D' },
                { klass: 'ConstellationsLayer', name: 'Constellations', accessKey: 'alt+C' },
                { klass: 'ConstellationNamesLayer', name: 'Constellation Names', accessKey: 'shift+alt+C' },
                { klass: 'ConstellationJapaneseNamesLayer', name: '星座名', accessKey: 'shift+ctrl+J' },
                { klass: 'SspSurveyAreaLayer', name: 'SSP Suvey Area', accessKey: "shift+alt+F" },
                { klass: 'SspFieldNameLayer', name: 'SSP Field Names', accessKey: "alt+F" },
                { klass: 'SspImageLayer', name: 'SSP Image' },
                { klass: 'HipparcosCatalogLayer', name: 'Hipparcos Catalog', accessKey: 'alt+H' },
                { klass: 'EsoMilkyWayLayer', name: 'ESO Milky Way' },
                // { klass: 'JamiesonCelestialAtlasLayer', name: "Celestial Atlas by Alexander Jamieson" },
                { klass: 'ViewFrustumLayer', name: "View Frustum" },
            ].map(l => ({
                label: l.name,
                accessKey: l.accessKey,
                ':closeOnClick': "false",
                ':checked': `currentFrame.layers.${l.klass}`,
                '@click': `toggle(currentFrame.layers, '${l.klass}')`,
            }))
        each l in layers
            xMenuItem&attributes(l)
    xMenuItem(label="Grid", :hasChildren="true")
        xMenuItem(label="Sexagesimal", :checked="currentFrame.dynamicGrid.mode == GridMode.SEXAGESIMAL", @click="currentFrame.dynamicGrid.mode = GridMode.SEXAGESIMAL")
        xMenuItem(label="Degree", :checked="currentFrame.dynamicGrid.mode == GridMode.DEGREE", @click="currentFrame.dynamicGrid.mode = GridMode.DEGREE")
        xDivider
        xMenuItem(label="Live", :checked="currentFrame.dynamicGrid.live", @click="toggle(currentFrame.dynamicGrid, 'live')")
        xMenuItem(:closeOnClick="false")
            template(slot="label")
                | Color <xColorPicker v-model="currentFrame.dynamicGrid.color"/>
    xDivider
    -
        const scales = [
            { label: 'tan(&ang;) = 1&prime;', fovy: 'math.arcmin2rad(1)', accessKey: "1" },
            { label: 'tan(&ang;) = 5&prime;', fovy: 'math.arcmin2rad(5)', accessKey: "2" },
            { label: 'tan(&ang;) = 1&deg;', fovy: 'math.deg2rad(1)', accessKey: "3" },
            { label: 'tan(&ang;) = 5&deg;', fovy: 'math.deg2rad(5)', accessKey: "4" },
            { label: 'tan(&ang;) = 1', fovy: '1', accessKey: "5" },
            { label: 'tan(&ang;) = 4', fovy: '4', accessKey: "6" },
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
        xMenuItem(label="WCS", :checked="$root.s.viewState.lock.wcs", @click="toggle($root.s.viewState.lock, 'wcs')")
        xMenuItem(
            label="&nbsp;&nbsp;Only Center",
            :checked="$root.s.viewState.lock.wcsOnlyCenter",
            :disabled="! $root.s.viewState.lock.wcs",
            @click="toggle($root.s.viewState.lock, 'wcsOnlyCenter')")
    xDivider
    xMenuItem(
        label="Retina", accessKey="ctrl+R",
        @click="toggle($root.s.viewState, 'retina')",
        :checked="$root.s.viewState.retina",
        :disabled="!$root.s.viewState.inRetinaDisplay()")
    xMenuItem(
        label="Dissolve Effect",
        @click="toggle($root.s.viewState, 'dissolveEffect')",
        :checked="$root.s.viewState.dissolveEffect")
    xMenuItem(
        label="Fullscreen", accessKey="F",
        @click="$root.s.viewState.toggleFullscreen()",
        :checked="$root.s.viewState.fullscreen")
    xDivider
    //- xMenuItem(:label="`Jump Duration: ${jumpDurationDisplay}s`", :disabled="true")
    //- xMenuItem(:disabled="true")
    //-     template(slot="label")
    //-         input(type="range", v-model="$root.s.viewState.jumpDuration", :min=1, :max=5000)
</template>


<script>
import { CameraMode, math, GridMode } from 'stellar-globe'
import { sprintf } from 'sprintf-js'


export default {
    created() {
        Object.assign(this, { CameraMode, math, GridMode, window })
    },
    computed: {
        currentFrame() {
            return this.$root.s.frameManager.currentFrame
        },
        jumpDurationDisplay() {
            return sprintf('%5.2f', this.$root.s.viewState.jumpDuration / 1000)
        }
    },
    methods: {
        toggle(o, p) {
            o[p] = !o[p]
        },
    },
}
</script>