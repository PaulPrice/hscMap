<template lang="pug">
xPanel(title="Preferences", v-model="$root.s.panelManager.preferences")
    xFieldset
        legend Tile Images
        dl
            dt Texture LOD in Motion ({{$root.s.viewState.motionLod | format('%.1f')}})
            dd
                input(
                    type="range",
                    min=0, max=8, step=0.1,
                    v-model.number="$root.s.viewState.motionLod", 
                    @mousedown="motionMode(true)", @mouseup="motionMode(false)",
                )
</template>


<script lang="ts" src="./script.ts" />