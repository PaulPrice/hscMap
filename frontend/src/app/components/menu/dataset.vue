<template lang="pug">
xMenuBarItem(label="Dataset")
    -
        const dataset = [
            { label: 'UH & SSP', depth: 'uh_ssp' },
            { label: 'Ultra Deep', depth: 'udeep' },
            { label: 'Deep', depth: 'deep' },
            { label: 'Wide', depth: 'wide' },
            { label: 'Deep & Ultra Deep', depth: 'dud' },
        ]
    each d in dataset
        xMenuItem(
            label=d.label,
            :closeOnClick="false",
            :checked=`currentFrame.dataset.${d.depth}`,
            @click=`toggle(currentFrame.dataset, '${d.depth}')`)
</template>


<script>
export default {
    computed: {
        currentFrame() {
            return this.$root.s.frameManager.currentFrame
        }
    },
    methods: {
        toggle(obj, prop) {
            obj[prop] = !obj[prop]
        }
    }
}
</script>