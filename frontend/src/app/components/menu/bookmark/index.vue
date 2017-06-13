<template lang="pug">
xMenuBarItem(label="Bookmarks")
    xMenuItem(label="Add Bookmark", @click="addBookmark()", accessKey="ctrl+D")
    xDivider
    myBookmarkFolder(:folder="bookmarkManager.rootFolder")
    xDivider
    xMenuItem(label="Import / Export", :hasChildren="true")
        xMenuItem(label="Export As CSV", @click="bookmarkManager.exportAsCsv()")
        xMenuItem(label="Import From CSV", @click="bookmarkManager.importFromCsv()", :immediate="true")
        xMenuItem(label="Import From hscMap2", @click="bookmarkManager.importFromHscMap2()")
        xMenuItem(label="Restore To Default", @click="bookmarkManager.restoreToDefault()")
</template>


<script>
import myBookmarkFolder from './bookmark_folder'

export default {
    computed: {
        bookmarkManager() {
            return this.$root.s.bookmarkManager
        },
    },
    methods: {
        addBookmark() {
            this.bookmarkManager.addBookmark()
        },
    },
    components: {
        myBookmarkFolder
    },
}
</script>