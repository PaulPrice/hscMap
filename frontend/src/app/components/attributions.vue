<template lang="pug">
.attributions
    .attribution(v-for="a in $root.s.frameManager.attributions")
        | {{a.which}}: <a :href="a.link" target="_blank">{{a.label}}</a>
</template>


<style lang="sass">
.attributions
    user-select: none
    position: absolute
    right: 0
    bottom: 0
    z-index: 100
.attribution
    opacity: 0.75
    font-size: small
    font-family: sans-serif
    float: right
    display: inline-block
    color: white
    a
        color: white
    background-color: rgba(31, 31, 31, 1.0)
    border-radius: 4pt
    padding: 0.2em 0.5em
    margin: 0.25em
</style>