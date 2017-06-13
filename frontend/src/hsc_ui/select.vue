<template lang="pug">
select(v-model="myValue")
    option(v-for="option in options", :value="option.value", v-html="option.text")
</template>


<script>
export default {
    data() {
        return {
            myValue: this.value,
        }
    },
    props: {
        value: {
            required: true,
        },
        optionValues: {
            type: Array,
        },
        optionTexts: {
            type: Array,
        },
        options: {
            type: Array,
        },
    },
    // beforeCreate() {
    // },
    watch: {
        myValue() {
            this.$emit('input', this.myValue)
        }
    }
}
</script>


<style lang="sass" scoped>
select
    margin: 0 0.1em
    border-style: none
    background-color: rgba(191, 191, 191, 0.25)
    color: white
    font-size: large
    user-select: none
</style>