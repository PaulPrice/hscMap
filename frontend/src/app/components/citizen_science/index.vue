<template>
    <div>
        <x-panel title="銀河分類" v-model="$root.s.panelManager.citizenScience" :position="{ my: 'left ; top', at: '8 ; 40' }">
            <div>
                <div style="display: flex;">
                    <label style="margin-right: 1em;"><input v-model="filter.training" :value="null" type="radio" />すべて</label>
                    <label style="margin-right: 1em;"><input v-model="filter.training" :value="true" type="radio" />例題</label>
                    <label style="margin-right: 1em;"><input v-model="filter.training" :value="false" type="radio" />問題</label>
                    <label style="margin-right: 1em;"><input v-model="filter.onlyDone" type="checkbox" />未完了のみ</label>
                </div>
                <div style="height: 100px; overflow-y: scroll; box-shadow: 0 0 4pt rgba(255, 255, 255, 0.5);">
                    <table style="width: 100%;" ref="candTable">
                        <tr>
                            <th>specz</th>
                            <th>mag</th>
                            <th title="interacting">&sect;</th>
                            <th>id</th>
                        </tr>
                        <tr v-for="row in pageRows" :key="row.id" @click="() => { currentCandidate = row ; center(row) }" :class="{ done: row.done, current: row == cc, training: row.training }">
                            <td v-html="row.specz.toFixed(4)" style="font-size: small;" />
                            <td v-html="row.zcmodel_mag.toFixed(2)" style="font-size: small;" />
                            <td v-html="row.interacting  ? '&check;' : (row.interacting === false ? '&cross;' : '')" />
                            <td v-html="row.id" style="font-size: small;" />
                        </tr>
                    </table>
                </div>
            </div>
            <div>
                <div style="display: flex; margin: 0.25em 0;">
                    <table>
                        <tr>
                            <th>&alpha;</th>
                            <td v-html="cc.ra.toFixed(4)" />
                        </tr>
                        <tr>
                            <th>&delta;</th>
                            <td v-html="cc.dec.toFixed(4)" />
                        </tr>
                    </table>
                    <table>
                        <tr>
                            <th>specz</th>
                            <td v-html="cc.specz.toFixed(4)" />
                        </tr>
                        <tr>
                            <th>z-mag</th>
                            <td v-html="cc.zcmodel_mag.toFixed(2)" />
                        </tr>
                    </table>
                    <button @click="center(cc)">中心にする</button>
                    <button style="margin: 0 0.5em;" @click.prevent="go(-1)">前</button>
                    <button @click.prevent="go(1)">次</button>
                </div>
                <fieldset>
                    <legend v-html="cc.training ? 'これは例です' : 'このフォームを埋めてください'" />
                    <dl>
                        <dt>他の天体を相互作用をしていますか？</dt>
                        <dd>
                            <label> <input :disabled="cc.training" type="radio" :value="true" v-model="cc.interacting" />はい</label>
                            <label> <input :disabled="cc.training" type="radio" :value="false" v-model="cc.interacting" />いいえ</label>
                            <label> <input :disabled="cc.training" type="radio" :value="null" v-model="cc.interacting" />わかりません</label>
                        </dd>
                        <dt>円盤・腕構造がありますか？</dt>
                        <dd>
                            <label> <input :disabled="cc.training" type="radio" :value="true" v-model="cc.disk_arms" />はい</label>
                            <label> <input :disabled="cc.training" type="radio" :value="false" v-model="cc.disk_arms" />いいえ</label>
                        </dd>
                        <dt>リング構造がありますか？</dt>
                        <dd>
                            <label> <input :disabled="cc.training" type="radio" :value="true" v-model="cc.rings" />はい</label>
                            <label> <input :disabled="cc.training" type="radio" :value="false" v-model="cc.rings" />いいえ</label>
                        </dd>
                        <template v-if="cc.interacting === true">
                            <dt>何が見えますか？</dt>
                            <dd>
                                <ul>
                                    <li>
                                        <label> <input :disabled="cc.training" type="checkbox" v-model="cc.tidal_stream" />潮汐ストリーム</label>
                                    </li>
                                    <li>
                                        <label> <input :disabled="cc.training" type="checkbox" v-model="cc.shell_fan" />シェル/扇 構造</label>
                                    </li>
                                    <li>
                                        <label> <input :disabled="cc.training" type="checkbox" v-model="cc.perturbed_halo" />形の歪んだハロー</label>
                                    </li>
                                    <li>
                                        <label> <input :disabled="cc.training" type="checkbox" v-model="cc.multiple_nuclei" />複数のコア</label>
                                    </li>
                                    <li>
                                        <label> <input :disabled="cc.training" type="checkbox" v-model="cc.companion_galaxy" />近くの伴銀河</label>
                                        <dl v-if="cc.companion_galaxy || cc.multiple_nuclei">
                                            <dt>中心銀河より</dt>
                                            <dd>
                                                <label> <input :disabled="cc.training" type="radio" value="similar" v-model="cc.how_bright" />同じか少し暗い</label><br />
                                                <label> <input :disabled="cc.training" type="radio" value="faint" v-model="cc.how_bright" />ずっと暗い</label>
                                            </dd>

                                        </dl>
                                    </li>
                                </ul>
                            </dd>
                        </template>
                        <dt>コメント</dt>
                        <dd>
                            <textarea :style="{boxShadow: cc.training ? '' : '0 0 4pt rgba(255, 255, 255, 0.5)'}" v-model="cc.comments_ja" style="background: transparent; width: 100%; color: white; border-style: none; border-radius: 2pt;"></textarea>
                        </dd>
                    </dl>
                    <div style="display: flex;">
                        <label>
                            <input :disabled="cc.training" type="checkbox" v-model="cc.done" /> 完了
                        </label>
                        <button style="margin: 0 0 0 0.5em;" @click.prevent="go(-1)">前</button>
                        <button style="margin: 0 0.5em;" @click.prevent="go(1)">次</button>
                        <button style="flex-grow: 1;" @click.prevent="cc.training || (cc.done = true) ; go(1);">完了して次</button>
                    </div>
                </fieldset>
            </div>
            <div style="display:flex; justify-content: flex-end; margin: 0.25em 0;">
                <input style="flex-grow: 1; margin: 0 0.5em;" type="text" v-model="mail" placeholder="メールアドレス" />
                <button :disabled="doneCandidates.length == 0" @click="submit">完了項目({{doneCandidates.length}})の送信</button>
            </div>
        </x-panel>
    </div>
</template>

<script lang="ts">
import { PanelType } from "./script"
export default PanelType
</script>


<style lang="scss" scoped>
input,
button {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
  border: 0;
  border-radius: 4pt;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

button:active {
  background-color: rgba(255, 255, 255, 0.75);
  color: black;
}

table {
  border-collapse: collapse;
}

td {
  padding: 0 0.5em;
}

tr:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

tr {
  color: white;
}

tr.done {
  color: #77f;
}

tr.training {
  color: #7f7;
}

tr.current {
  background-color: rgba(255, 0, 0, 0.25);
}

fieldset {
  border-radius: 4pt;
  border: none;
  background-color: rgba(63, 63, 63, 0.75);
  margin: 1em;
}

dt,
dd,
dl {
  margin: 0;
}
dd {
  margin-left: 0.5em;
}

label {
  user-select: none;
}

ul {
  margin: 0;
  padding-left: 1em;
}

fieldset {
  margin: 0;
}
</style>
