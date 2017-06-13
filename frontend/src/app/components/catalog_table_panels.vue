<template lang="pug">
div
    template(v-for="fp in $root.s.frameManager.framePanels")
        template(v-for="cs in fp.frame.catalogs")
            myCatalogTablePanel(:catalogState="cs", :frame="fp.frame")
</template>


<script>
import myCatalogTablePanel from './catalog_table_panel'

export default {
    components: {
        myCatalogTablePanel
    }
}
</script>