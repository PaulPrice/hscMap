import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import * as state from "../../store"


@Component({
    mixins: state.mixins,
    provide(this: Root) {
        return {
            root: this,
            state: this.state,
        }
    }
})
export class Root extends Vue {
    state = state.initialState()

    render(h: Vue.CreateElement) {
        return h(require('./template'))
    }
}