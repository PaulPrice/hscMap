import Vue from 'vue'
import { RootComponent } from './components/root'
import { components } from 'hsc_ui'
import { filters } from "./filters";


window.addEventListener('load', function () {
    const loader = document.querySelector('.loader')!
    loader.parentNode!.removeChild(loader)

    Vue.mixin({ components, filters })
    new RootComponent({ el: newEmptyElement() })
})


function newEmptyElement() {
    const el = document.createElement('div')
    el.style.height = '100%'
    document.body.appendChild(el)
    return el
}