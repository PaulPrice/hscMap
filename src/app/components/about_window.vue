<template lang="pug">
xWindow(title="HSC SSP", :padding="[0, 0]", :initialWidth="800", :initialHeight="600", :lazy="true", v-model="$root.state.window.aboutWindow")
    iframe(src="http://hsc.mtk.nao.ac.jp/ssp/")
</template>


<style lang="sass" scoped>
iframe
    border-style: none
    width: 100%
    height: 100%
</style>