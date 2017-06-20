import { PathLayer } from '../../layers/path_layer'
import { SpriteLayer } from '../../layers/sprite_layer'
import { text2imageData } from "../../text2image_data";
import { Globe } from '../../globe'
import * as math from '../../math'
import constellationsDataFile from 'file-loader!./constellations.json'


interface Star {
    ra: number,
    dec: number,
    b: string,
    hip: number,
    name: string,
    id: string,
}

interface Constellation {
    ecliptical: boolean,
    stars: Star[],
    lines: string[],
}


export class ConstellationsLayer extends PathLayer {
    constructor(globe: Globe, load = true) {
        super(globe)
        if (load)
            this.load()
    }

    async load() {
        const constellations = await (await fetch(constellationsDataFile)).json() as { [name: string]: Constellation }
        this.stroke(pen => {
            pen.width = 0.005
            for (let name of Object.keys(constellations)) {
                const c = constellations[name]
                const name2star = Object.assign({}, ...c.stars.map(s => ({ [s.name]: s })))
                pen.color = c.ecliptical ? [1, 0.75, 0, 0.5] : [1, 1, 1, 0.5]
                for (const line of c.lines) {
                    const stars = line.split('-').map(name => name2star[name])
                    for (let i = 0; i < stars.length - 1; ++i) {
                        pen.lineTo(star2xyz(stars[i]))
                        pen.lineTo(star2xyz(stars[i + 1]))
                        pen.up()
                    }
                }
            }
        })
    }
}


export class ConstellationNamesLayer extends SpriteLayer {
    constructor(globe: Globe) {
        super(globe)
        this.startLoading()
    }

    async startLoading() {
        const constellations = await (await fetch(constellationsDataFile)).json() as { [name: string]: Constellation }
        const textures: { [name: string]: { imageData: ImageData } } = {}
        const sprites: { name: string, position: math.Vector3 }[] = []
        for (const name in constellations) {
            const c = constellations[name]
            textures[name] = {
                imageData: text2imageData(this.translate(name), '24pt fantasy', 'rgba(239, 225, 196, 1)')
            }
            sprites.push({
                name,
                position: centroid(c.stars),
            })
        }
        this.setData(textures, sprites)
        this.globe.requestRedraw()
    }

    protected alpha() {
        return 0.5 * PathLayer.alpha(this.globe.camera.effectiveFovy)
    }

    protected translate(name: string) {
        return name
    }
}


export class ConstellationJapaneseNamesLayer extends ConstellationNamesLayer {
    protected translate(name: string) {
        return japaneseHiragana[name]
    }
}


export class ConstellationKanjiJapaneseNamesLayer extends ConstellationNamesLayer {
    protected translate(name: string) {
        return japaneseKanji[name]
    }
}


function star2xyz(star: Star) {
    return math.radec2xyz(
        math.deg2rad(star.ra),
        math.deg2rad(star.dec)
    )
}


function centroid(stars: Star[]) {
    let g: math.Vector3 = [0, 0, 0]
    for (const s of stars)
        star2xyz(s).forEach((c, i) => g[i] += c)
    g = g.map(c => c / stars.length)
    const r = Math.sqrt(g.reduce((sum, c) => sum + c * c, 0))
    return g.map(c => c / r)
}


const japaneseKanji: { [name: string]: string } = {
    "Andromeda": "アンドロメダ",
    "Antlia": "ポンプ",
    "Apus": "風鳥",
    "Aquarius": "水瓶",
    "Aquila": "鷲",
    "Ara": "祭壇",
    "Aries": "牡羊",
    "Auriga": "御者",
    "Boötes": "牛飼い",
    "Caelum": "彫刻具",
    "Camelopardalis": "キリン",
    "Cancer": "蟹",
    "CanesVenatici": "猟犬",
    "CanisMajor": "大犬",
    "CanisMinor": "小犬",
    "Capricornus": "山羊",
    "Carina": "竜骨",
    "Cassiopeia": "カシオペヤ",
    "Centaurus": "ケンタウルス",
    "Cepheus": "ケフェウス",
    "Cetus": "鯨",
    "Chamaeleon": "カメレオン",
    "Circinus": "コンパス",
    "Columba": "鳩",
    "ComaBerenices": "髪",
    "CoronaAustralis": "南の冠",
    "CoronaBorealis": "冠",
    "Corvus": "烏",
    "Crater": "コップ",
    "Crux": "南十字",
    "Cygnus": "白鳥",
    "Delphinus": "海豚",
    "Dorado": "旗魚",
    "Draco": "竜",
    "Equuleus": "小馬",
    "Eridanus": "エリダヌス",
    "Fornax": "炉",
    "Gemini": "双子",
    "Grus": "鶴",
    "Hercules": "ヘルクレス",
    "Horologium": "時計",
    "Hydra": "海蛇",
    "Hydrus": "水蛇",
    "Indus": "インディアン",
    "Lacerta": "蜥蜴",
    "Leo": "獅子",
    "LeoMinor": "小獅子",
    "Lepus": "兎",
    "Libra": "天秤",
    "Lupus": "狼",
    "Lynx": "山猫",
    "Lyra": "琴",
    "Mensa": "テーブル山",
    "Microscopium": "顕微鏡",
    "Monoceros": "一角獣",
    "Musca": "蝿",
    "Norma": "定規",
    "Octans": "八分儀",
    "Ophiuchus": "蛇遣",
    "Orion": "オリオン",
    "Pavo": "孔雀",
    "Pegasus": "ペガスス",
    "Perseus": "ペルセウス",
    "Phoenix": "鳳凰",
    "Pictor": "画架",
    "Pisces": "魚",
    "PiscisAustrinus": "南の魚",
    "Puppis": "艫",
    "Pyxis": "羅針盤",
    "Reticulum": "レチクル",
    "Sagitta": "矢",
    "Sagittarius": "射手",
    "Scorpius": "蠍",
    "Sculptor": "彫刻室",
    "Scutum": "楯",
    "Serpens": "蛇",
    "Sextans": "六分儀",
    "Taurus": "牡牛",
    "Telescopium": "望遠鏡",
    "Triangulum": "三角",
    "TriangulumAustrale": "南の三角",
    "Tucana": "巨嘴鳥",
    "UrsaMajor": "大熊",
    "UrsaMinor": "小熊",
    "Vela": "帆",
    "Virgo": "乙女",
    "Volans": "飛魚",
    "Vulpecula": "小狐"
}


const japaneseHiragana: { [name: string]: string } = {
    "Andromeda": "アンドロメダ",
    "Antlia": "ポンプ",
    "Apus": "ふうちょう",
    "Aquarius": "みずがめ",
    "Aquila": "わし",
    "Ara": "さいだん",
    "Aries": "おひつじ",
    "Auriga": "ぎょしゃ",
    "Boötes": "うしかいい",
    "Caelum": "ちょうこくぐ",
    "Camelopardalis": "キリン",
    "Cancer": "かに",
    "CanesVenatici": "りょうけん",
    "CanisMajor": "おおいぬ",
    "CanisMinor": "こいぬ",
    "Capricornus": "やぎ",
    "Carina": "りゅうこつ",
    "Cassiopeia": "カシオペヤ",
    "Centaurus": "ケンタウルス",
    "Cepheus": "ケフェウス",
    "Cetus": "くじら",
    "Chamaeleon": "カメレオン",
    "Circinus": "コンパス",
    "Columba": "はと",
    "ComaBerenices": "かみのけ",
    "CoronaAustralis": "みなみのかんむり",
    "CoronaBorealis": "かんむり",
    "Corvus": "からす",
    "Crater": "コップ",
    "Crux": "みなみじゅうじ",
    "Cygnus": "はくちょう",
    "Delphinus": "いるか",
    "Dorado": "かじき",
    "Draco": "りゅう",
    "Equuleus": "こうま",
    "Eridanus": "エリダヌス",
    "Fornax": "ろ",
    "Gemini": "ふたご",
    "Grus": "つる",
    "Hercules": "ヘルクレス",
    "Horologium": "とけい",
    "Hydra": "うみへび",
    "Hydrus": "みずへび",
    "Indus": "インディアン",
    "Lacerta": "とかげ",
    "Leo": "しし",
    "LeoMinor": "こじし",
    "Lepus": "うさぎ",
    "Libra": "てんびん",
    "Lupus": "おおかみ",
    "Lynx": "やまねこ",
    "Lyra": "こと",
    "Mensa": "テーブルさん",
    "Microscopium": "けんびきょう",
    "Monoceros": "いっかくじゅう",
    "Musca": "はえ",
    "Norma": "じょうぎ",
    "Octans": "はちぶんぎ",
    "Ophiuchus": "へびつかい",
    "Orion": "オリオン",
    "Pavo": "くじゃく",
    "Pegasus": "ペガスス",
    "Perseus": "ペルセウス",
    "Phoenix": "ほうおう",
    "Pictor": "がか",
    "Pisces": "うお",
    "PiscisAustrinus": "みなみのうお",
    "Puppis": "とも",
    "Pyxis": "らしんばん",
    "Reticulum": "レチクル",
    "Sagitta": "や",
    "Sagittarius": "いて",
    "Scorpius": "さそり",
    "Sculptor": "ちょうこくしつ",
    "Scutum": "たて",
    "Serpens": "へび",
    "Sextans": "ろくぶんぎ",
    "Taurus": "おうし",
    "Telescopium": "ぼうえんきょう",
    "Triangulum": "さんかく",
    "TriangulumAustrale": "みなみのさんかく",
    "Tucana": "きょしちょう",
    "UrsaMajor": "おおぐま",
    "UrsaMinor": "こぐま",
    "Vela": "ほ",
    "Virgo": "おとめ",
    "Volans": "とびうお",
    "Vulpecula": "こぎつね"
}