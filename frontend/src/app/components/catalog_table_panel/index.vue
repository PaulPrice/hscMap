<template lang="pug">
    xPanel(:title="cs.catalog.name", v-model="cs.table")
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
        
        xFlatButton(@click="focus = !focus", :checked="focus", style="float: right;") &rarrw;
        div(style="clear: both;")
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
        .wrapper(ref="tableWrapper")
            table
                tbody(:key="page")
                    tr(v-for="row in paginatedRows", @mouseenter="focusInFrame(row)")
                        td(v-for="cell in row") {{cell}}
</template>


<style lang="sass" scoped>
.wrapper
    overflow-y: auto
    max-height: 300px
.page-nav
    float: left
    margin: 0.5em
    span
        margin: 0 1em
.flip-x
	transform: rotateY(180deg)
.flip-y
	transform: rotateX(180deg)
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


<script src="./script.ts" lang="ts" />