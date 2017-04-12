<template lang="pug">
    xWindow(:title="cs.catalog.name", v-model="cs.tableWindow")
        .page-nav
            xFlatButton(@click="page = 0", :disabled="page == 0")
                .flip-x &rtrif;&rtrif;
            xFlatButton(@click="--page", :disabled="page == 0")
                .flip-x &rtrif;
            span {{page + 1}} / {{pageMax + 1}}
            xFlatButton(@click="++page", :disabled="page >= pageMax")
                div &rtrif;
            xFlatButton(@click="page = pageMax", :disabled="page >= pageMax")
                div &rtrif;&rtrif;
        table
            thead
                tr
                    th(v-for="(col, colIndex) in cs.catalog.header")
                        | {{col}}
                        .sort-button
                            xFlatButton(@click="sortCol = colIndex ; reverse = false", :checked="sortCol == colIndex && ! reverse")
                                div &utrif;
                            xFlatButton(@click="sortCol = colIndex ; reverse = true", :checked="sortCol == colIndex && reverse")
                                .flip-y &utrif;
        table(v-if="markedRow", style="position: absolute")
            tbody
                tr.marked
                    td(v-for="cell in markedRow", style="background-color: rgba(0, 127, 127, 1); opacity: 1") {{cell}}
        .wrapper(ref="tableWrapper")
            table
                tbody(:key="page")
                    tr(v-for="row in rows", @mouseenter="focusInFrame(row)")
                        td(v-for="cell in row") {{cell}}
</template>


<style lang="sass" scoped>
.wrapper
    overflow-y: auto
    max-height: 300px
.page-nav
    display: table
    margin: 0.5em auto
    span
        margin: 0 1em
.flip-x
	transform: rotateY(180deg)
.flip-y
	transform: rotateX(180deg)
tr.marked
    background-color: rgba(0, 255, 255, 0.5)
.sort-button
    margin: 0.25em 0
table
    max-width: 600px
    width: 100%
    border-collapse: collapse
    table-layout: fixed
td
    padding: 0 1em
    font-size: small
    font-family: monospace
    opacity: 0.5
    overflow: hidden
tbody tr
    &:hover
        background-color: rgba(255, 255, 255, 0.25)
</style>


<script src="./script.ts" lang="typescript" />