<template lang="pug">
.globe(ref="globe")
    myCatalogObserver(v-for="catalog in value.catalogs", :key="catalog", :value="catalog", :frameComponent="frameComponent")
    .top-right
        xFlatButton.position(v-html="position", @click="toggleFormat")
        transition(name="fade")
            .grid-info(v-if="gridTic && gridTic.name")
                xFlatButton(@click="value.dynamicGrid.toggle()") &LeftTeeArrow; <span v-html="gridTic.name"/> &RightTeeArrow;
</template>


<style lang="sass" scoped>
.globe
    position: relative
    width: 100%
    height: 100%
.top-right
    font-size: 10pt
    font-family: monospace
    margin: 1em
    position: absolute
    top: 0
    right: 0
    text-align: right
.position
    color: #ccc
.grid-info
    color: #9cf
.fade-enter-active, .fade-leave-active
    transition: opacity .4s
.fade-enter, .fade-leave-to
    opacity: 0
</style>


<script>
import { FrameComponent } from './frame_component'
export default FrameComponent
</script>