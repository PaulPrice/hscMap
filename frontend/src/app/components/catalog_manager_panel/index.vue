<template lang="pug">
xPanel(title="Catalog", v-model="$root.s.panelManager.catalogManager", :floating="true")
    table(v-if="frame.catalogs.length > 0")
        thead
            tr
                th Name
                th Count
                th
        tbody
            tr(v-for="(cs, index) in frame.catalogs")
                td {{cs.catalog.name}}
                td {{cs.catalog.payload.length}}
                td.table
                    xFlatButton(@click="goToFirstObject(cs.catalog)") Go
                    xFlatButton(@click="cs.show = !cs.show", :checked="cs.show") &odot;
                    xFlatButton(@click="cs.table.opened = !cs.table.opened", :checked="cs.table.opened") &plusb;
                    xColorPicker(v-model="cs.markerColor")
                    xSelect(v-model="cs.markerStyle", :options="markers")
                    xFlatButton(@click="frame.catalogs.splice(index, 1)") &times;
    form(ref="form")
        input(type="file", @change="e => loadCatalogFile(e).then(cats => cats.forEach(c => frame.pushCatalog(c)))", multiple)
</template>


<style lang="sass" scoped>
input[type="file"]
    opacity: 0.5
    margin: 1em 0 0 0
td, th
    padding: 0.2em 1em
    text-align: center
form
    margin: 0.25em 1em
</style>


<script src="./script.ts" lang="ts" />