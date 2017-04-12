<template lang="pug">
xWindow(title="Catalog", v-model="$root.state.window.catalogManagerWindow")
    table(v-if="$root.state.frame.current.catalogs.length > 0")
        thead
            tr
                th Name
                th FileSize
                th Count
                th
        tbody
            tr(v-for="(cs, index) in $root.state.frame.current.catalogs")
                td {{cs.catalog.name}}
                td {{(cs.catalog.fileSize / 1000).toFixed(1)}}KB
                td {{cs.catalog.payload.length}}
                td
                    xFlatButton(@click="goToFirstObject(cs.catalog)") Go
                    xFlatButton(@click="cs.tableWindow.opened = !cs.tableWindow.opened", :checked="cs.tableWindow.opened") &plusb;
                    xFlatButton(@click="$root.state.frame.current.catalogs.splice(index, 1)") &times;
    form(ref="form")
        input(type="file", @change="e => loadCatalogFile(e).then(cats => cats.forEach(c => $root.pushCatalog(c)))", multiple)
</template>


<style lang="sass" scoped>
input[type="file"]
    opacity: 0.5
    margin: 1em 0 0 0
td, th
    padding: 0.2em 1em
    text-align: center
</style>


<script src="./script.ts" lang="typescript" />