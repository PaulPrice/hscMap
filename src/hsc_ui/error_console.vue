<template lang="pug">
xWindow(
    title="Console", :initialWidth="600", :initialHeight="400", :resizable="true", :padding="[0, 0]",
    v-model="$root.window.errorConsole",
    :position="{my: 'right ; bottom', at: 'right -20 ; bottom - 20'}",
)
    .body(ref="body")
        div(v-for="line in logs", :class="line.type")
            span.line-num {{ line.num }}
            span {{ line.body }}
</template>

<script>
import Vue from 'vue'
import { sprintf } from 'sprintf-js'
import * as _ from 'underscore'

export default {
    data() {
        return {
            logs: [],
            max: 1000,
        }
    },
    created() {
        subscribers.push(this)
    },
    beforeDestroy() {
        subscribers.splice(subscribers.indexOf(this), 1)
    },
    methods: {
        push(args) {
            this.logs.push(args)
            while (this.logs.length > this.max)
                this.logs.shift()
            Vue.nextTick(() => gotoBottom(this.$refs.body))
        }
    }
}

const subscribers = []

const methods = ['log', 'info', 'warn', 'error', 'assert']
const originalMethod = _.object(methods.map(name => [
    name,
    window.console[name].bind(window.console)
]))

let num = 1

for (const name of methods) {
    window.console[name] = (...args) => {
        originalMethod[name](...args)
        for (const line of args.map(inspect).join('; ').split('\n')) {
            for (const s of subscribers)
                s.push({
                    num: sprintf('%4d | ', num),
                    type: name,
                    body: line,
                })
        }
        num++
    }
}

function inspect(o) {
    try {
        return _.isObject(o) ? JSON.stringify(o, undefined, 2) : o
    }
    catch(e) {
        return '?'
    }
}

function gotoBottom(element) {
    element.scrollTop = element.scrollHeight - element.clientHeight;
}
</script>


<style lang="sass" scoped>
.body
    width: 100%
    height: 100%
    background: rgba(15, 15, 15, 0.5)
    border: none 0 black
    margin: 0
    font-family: monospace
    overflow: auto
    white-space: pre
    font-size: small
.log
    color: #777
.info
    color: #779
    background-color: rgba(0, 0, 255, 0.125)
.error
    color: #977
    background-color: rgba(255, 0, 0, 0.125)
.warn
    color: #997
    background-color: rgba(255, 255, 0, 0.05)
</style>