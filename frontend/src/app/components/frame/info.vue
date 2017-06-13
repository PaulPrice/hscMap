<template lang="pug">
table.info(v-if="focusedRow")
        tr(v-for="(header, index) in headers")
            th {{ header }}
            td {{ focusedRow[index] }}
</template>


<script>
export default {
    props: {
        headers: {
            required: true,
            type: Array,
        },
        focusedRow: {
            required: true,
        }
    }
}
</script>


<style lang="sass" scoped>
.info
    font-family: monospace
    background-color: rgba(17, 17, 17, 0.75)
    color: #ffffff
    position: fixed
    bottom: 0
    left: 0
    th
        text-align: right
    td, th
        padding: 0.1em 0.5em
    border-radius: 4pt
</style>