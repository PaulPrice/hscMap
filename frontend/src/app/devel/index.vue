<template lang="pug">
div
    myDevelPanel
    myDevelObserver
</template>


<script>
import myDevelObserver from './observer.ts'
import myDevelPanel from './panel'

export default {
    components: {
        myDevelObserver,
        myDevelPanel,
    }
}
</script>