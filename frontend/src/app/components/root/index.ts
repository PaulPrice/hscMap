import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import * as persistent from './persistent_state'

import Template from './template.vue'

@Component({
    provide(this: RootComponent) {
        return { root: this }
    }
})
export class RootComponent extends Vue {
    state = persistent.load()
    get s() { return this.state }

    mounted() {
        this.state.onMount()
    }

    beforeDestroy() {
        this.state.onUnmount()
    }

    render(h: Vue.CreateElement) {
        return h(Template)
    }
}