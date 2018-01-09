import { Vue, Component, Inject, Watch } from "vue-property-decorator"
import { RootComponent } from '../root'
import { Globe, UserCatalogLayer, math, MarkerStyle } from 'stellar-globe'
import * as _ from 'lodash'
import { Candidate, candidates } from "./candidate"
import { KdTree } from "../../utils/kd_tree"
import * as base64 from 'base-64'
import * as ajax from './ajax'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'



@Component
export class PanelType extends Vue {
    private candidates = candidates

    @Inject() root: RootComponent

    perPage = 100
    page = 0
    mail = ''
    filter = {
        training: null as boolean | null,
        onlyDone: false,
    }

    get pageRows() {
        let rows = this.candidates
        if (this.filter.training !== null)
            rows = rows.filter(c => c.training === this.filter.training)
        if (this.filter.onlyDone)
            rows = rows.filter(c => c.done === false)
        return rows
    }

    get doneCandidates() {
        return this.candidates.filter(c => c.done)
    }

    private globe: Globe
    private candLayer: UserCatalogLayer
    private doneCandLayer: UserCatalogLayer

    currentCandidate = this.candidates[0]
    get cc() { return this.currentCandidate }

    onlyDone = false

    mounted() {
        const globe = this.root.state.frameManager.currentFrame.vm!.globe!
        this.globe = globe
        this.candLayer = _.tap(new UserCatalogLayer(globe), l => {
            l.color = [0, 1, 0, 0.5]
            l.setMarkerStyle(MarkerStyle.CROSS3)
        })
        this.doneCandLayer = _.tap(new UserCatalogLayer(globe), l => {
            l.color = [0, 0, 1, 0.5]
            // l.setMarkerStyle(MarkerStyle.CROSS3)
        })
        this.watchData()
        return this.candidates.filter(c => c.done)
    }

    private activate() {
        this.refreshLayer()
        this.doneCandLayer.enabled = true
        this.candLayer.enabled = true
    }

    private deactivate() {
        this.doneCandLayer.enabled = false
        this.candLayer.enabled = false
        this.globe.requestRedraw()
    }

    private watchData() {
        this.$watch(() => this.root.state.panelManager.citizenScience.opened, (active) => {
            active ? this.activate() : this.deactivate()
        }, { immediate: true })
        this.$watch(() => this.doneCandidates, () => {
            this.refreshLayer()
        }, { immediate: true })
    }

    private refreshLayer() {
        // this.candLayer.setRows([])
        this.candLayer.setRows(this.candidates.filter(c => !c.done).map(c => ({ coord: c.xyz() })))
        this.doneCandLayer.setRows(this.candidates.filter(c => c.done).map(c => ({ coord: c.xyz() })))
        this.globe.requestRedraw()
    }

    private center(c: Candidate) {
        this.globe.jumpTo({
            a: math.deg2rad(c.ra),
            d: math.deg2rad(c.dec),
            fovy: math.arcmin2rad(1),
        })
    }

    private go(step: number) {
        let i = this.candidates.indexOf(this.currentCandidate)
        console.assert(i >= 0)
        i = (i + step + this.candidates.length) % this.candidates.length
        this.currentCandidate = this.candidates[i]
        this.center(this.currentCandidate)
        const j = this.pageRows.indexOf(this.currentCandidate)
        if (j >= 0) {
            scrollIntoViewIfNeeded((this.$refs.candTable as HTMLTableElement).getElementsByTagName('TR').item(j + 1), { duration: 200 })
        }
    }

    private async submit() {
        const mail = this.mail.trim()
        if (mail.length == 0) {
            alert('メールアドレスを設定してください')
            return
        }

        const tests = this.doneCandidates.map(c => ({
            galaxy_name: c.id,
            interacting: c.interacting,
            disk_arms: c.disk_arms,
            tidal_stream: c.tidal_stream,
            shell_fan: c.shell_fan,
            perturbed_halo: c.perturbed_halo,
            multiple_nuclei: c.multiple_nuclei,
            companion_galaxy: c.companion_galaxy,
            how_bright: c.how_bright,
            comment: c.comments_ja,
        }))
        const res = await ajax.postJSON('http://hscmap.mtk.nao.ac.jp/37b9945e5300ea3a/tests/batch', {
            tests,
            mail,
        })

        alert((res as any).message)
        if (confirm('送信済みのデータをリストから削除しますか？')) {
            this.candidates = this.candidates.filter(c => !c.done)
        }
    }
}