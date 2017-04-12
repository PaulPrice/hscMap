import Vue from 'vue'
import { Root } from './components/root'
import { components } from 'hsc_ui'


window.addEventListener('load', function () {
    const loader = document.querySelector('.loader')!
    loader.parentNode!.removeChild(loader)

    Vue.mixin({ components })
    new Root({ el: newEmptyElement() })
})


function newEmptyElement() {
    const el = document.createElement('div')
    el.style.height = '100%'
    document.body.appendChild(el)
    return el
}


require('file-loader?name=index.html!./index.html') // copy ./index.html to dist