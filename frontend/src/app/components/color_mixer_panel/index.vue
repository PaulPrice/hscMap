<template lang="pug">
xPanel(
    title="Color Mixer",
    :initialWidth="350",
    :floating="true",
    v-model="$root.s.panelManager.colorMixer",
    :position="{my: 'right ; bottom', at: 'right - 20 ; bottom - 30'}"
)
    xSelect(v-model="value.current", :options="options")
    xFlatButton(@click="reset") &orarr;
    template(v-if="value.current == 'simpleRgb'")
        table(style={tableLayout: 'fixed', width: '100%'})
            tbody
                tr
                    th
                    th(v-for="(f, i) in filters")
                        xFlatButton(@click="simpleRgbSingleBand(i)", style={paddingLeft: '0', paddingRight: '0', display: 'block'}, :title="f.wavelength") {{f.shortName}}
                tr(v-for="(color, ch) in ['R', 'G', 'B']")
                    th(:class="`color-${color}`") {{color}}
                    th(v-for="f in filters")
                        input(type="radio", :value="f.name", v-model="value.simpleRgb.filters[ch]")
        dl
            dt &beta;
            dd
                input(
                    type="range", min="0", max="15", v-model="value.simpleRgb.logA", step="0.2",
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
            dt min
            dd
                input(
                    type="range", min="-0.1", max="1.1", v-model="value.simpleRgb.min", step="0.001",
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
            dt max
            dd
                input(
                    type="range", min="-0.1", max="1.1", v-model="value.simpleRgb.max", step="0.001",
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
    template(v-if="value.current == 'sdssTrueColor'")
        table(style={tableLayout: 'fixed', width: '100%'})
            tbody
                tr
                    th
                    th(v-for="(f, i) in filters")
                        xFlatButton(@click="sdssTrueColorSingleBand(i)", style={paddingLeft: '0', paddingRight: '0', display: 'block'}, :title="f.wavelength") {{f.shortName}}
                tr(v-for="(color, ch) in ['R', 'G', 'B']")
                    th(:class="`color-${color}`") {{color}}
                    th(v-for="f in filters")
                        input(type="radio", :value="f.name", v-model="value.sdssTrueColor.filters[ch]")
        dl
            dt &beta;
            dd
                input(
                    type="range", min="5", max="15", v-model="value.sdssTrueColor.logA", step="0.01",
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
            dt bias
            dd
                input(
                    type="range", min="-0.1", max="0.1", v-model="value.sdssTrueColor.b", step="0.001",
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
</template>


<style lang="sass" scoped>
select
    border-style: none
    background-color: rgba(191, 191, 191, 0.25)
    margin: 0.5em
    color: white
    font-size: large
    user-select: none
input[type="radio"]
    opacity: 0.5
input[type="range"]
    opacity: 0.75
    width: 100%
    display: block
    margin: 0
    padding: 0
dl
    border-radius: 2pt
    transition: background-color 0.4s
    padding: 4pt 2pt
    &:hover
        background-color: rgba(255, 255, 255, 0.1)
dd
    margin: 0 0 0.5em 0
    padding: 1pt 0
dt
    margin: 0
    padding: 0
.color-R
    color: #f00
.color-G
    color: #0f0
.color-B
    color: #00f
</style>


<script lang="ts" src="./script.ts" />