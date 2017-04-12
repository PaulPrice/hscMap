<template lang="pug">
.globe(ref="globe")
    transition(name="fade")
        .grid-info(v-if="gridTic && gridTic.name")
            xFlatButton(@click="toggleGridMode") &LeftTeeArrow; <span v-html="gridTic.name"/> &RightTeeArrow;
</template>


<style lang="sass" scoped>
.globe
    position: relative
    width: 100%
    height: 100%
.grid-info
    font-size: 10pt
    font-family: monospace
    margin: 1em
    position: absolute
    top: 0
    right: 0
    color: #9cf
.fade-enter-active, .fade-leave-active
    transition: opacity .4s
.fade-enter, .fade-leave-to
    opacity: 0
</style>


<script src="./script.ts" lang="typescript" />