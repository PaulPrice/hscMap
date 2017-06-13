<template lang="pug">
div
    template(v-for="node in folder.children")
        xMenuItem(v-if="node.children", :label="node.name", :hasChildren="true")
            myBookmarkFolder(:folder="node")
        xMenuItem(v-else, :label="node.name", @click="goto(node)")
</template>


<script>
export default {
    name: 'myBookmarkFolder',
    props: {
        folder: {
            required: true,
        },
    },
    methods: {
        goto(node) {
            this.$root.s.bookmarkManager.goto(node)
        }
    },
}
</script>