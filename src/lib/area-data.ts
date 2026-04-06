// エリアヒントページ用の型定義とデータ

export type BudgetTier = {
  id: string
  label: string
  perPerson: number
  total: number
  totalLabel: string
  color: string
  description: string
  areas: AreaRecommendation[]
}

export type AreaRecommendation = {
  id: string
  name: string
  station: string
  prefecture: string
  lines: string[]
  rentRange: string
  rentAvg: number
  access: {
    shibuya: { time: string; detail: string }
    tsujido: { time: string; detail: string }
    centerKita: { time: string; detail: string }
  }
  shopping: number
  safety: number
  walking: number
  highlights: string[]
  cautions: string[]
  description: string
  suumoUrl?: string
  overallRating: number
}

// 家賃帯データ（5段階）
export const BUDGET_TIERS: BudgetTier[] = [
  // ===== Tier1: 1人4万円 x 2 = 8万円 =====
  {
    id: 'tier1',
    label: '4万x2=8万',
    perPerson: 40000,
    total: 80000,
    totalLabel: '8万円',
    color: '#A8D8B9',
    description: '郊外中心。通勤1時間前後だが家賃を抑えられる価格帯。物件数は豊富。',
    areas: [
      {
        id: 'ebina',
        name: '海老名',
        station: '海老名駅',
        prefecture: '神奈川県',
        lines: ['小田急小田原線', '相鉄本線', '相鉄東急直通線'],
        rentRange: '7〜10万',
        rentAvg: 85000,
        access: {
          shibuya: { time: '55〜60分', detail: '相鉄東急直通で乗換なし' },
          tsujido: { time: '40〜45分', detail: '小田急線で相模大野乗換' },
          centerKita: { time: '60〜65分', detail: '相鉄→横浜市営地下鉄' },
        },
        shopping: 4,
        safety: 4,
        walking: 2,
        highlights: [
          '3路線利用可能',
          'ららぽーと海老名・ビナウォーク',
          '相鉄東急直通で渋谷直通',
          '辻堂へ40分台',
        ],
        cautions: [
          '渋谷まで約1時間',
          'センター北へ60分超',
          '散歩スポットは限定的',
        ],
        description:
          '駅前にららぽーと・ビナウォーク・マルイが集中し、買い物環境はこの価格帯で最も充実。相鉄東急直通で渋谷へ乗換なしも可能。',
        overallRating: 3,
      },
      {
        id: 'yamato',
        name: '大和',
        station: '大和駅',
        prefecture: '神奈川県',
        lines: ['小田急江ノ島線', '相鉄本線'],
        rentRange: '7〜10万',
        rentAvg: 85000,
        access: {
          shibuya: { time: '45〜55分', detail: '相鉄東急直通' },
          tsujido: { time: '30〜40分', detail: '小田急江ノ島線で藤沢経由' },
          centerKita: { time: '45〜55分', detail: '相鉄→横浜市営地下鉄' },
        },
        shopping: 2,
        safety: 3,
        walking: 2,
        highlights: [
          '辻堂へ30〜40分と近い',
          '2路線利用可',
          '渋谷直通あり',
        ],
        cautions: [
          '商店街・散歩スポットが乏しい',
          '駅前の雰囲気がやや雑然',
        ],
        description:
          '相鉄東急直通で渋谷アクセスが改善。辻堂へのアクセスが30〜40分と近く、しんご向き。',
        overallRating: 2,
      },
      {
        id: 'hon-atsugi',
        name: '本厚木',
        station: '本厚木駅',
        prefecture: '神奈川県',
        lines: ['小田急小田原線'],
        rentRange: '6〜9万',
        rentAvg: 75000,
        access: {
          shibuya: { time: '55〜65分', detail: '小田急急行→新宿→副都心線' },
          tsujido: { time: '50〜60分', detail: '小田急で相模大野乗換' },
          centerKita: { time: '70〜80分', detail: '小田急→相鉄→地下鉄' },
        },
        shopping: 3,
        safety: 3,
        walking: 2,
        highlights: [
          '8万円以下の2LDKが最も豊富',
          '約2,782件の物件数',
          '小田急急行停車',
        ],
        cautions: [
          '渋谷まで1時間超の可能性',
          'センター北へ70分超',
          '都心感が薄い',
        ],
        description:
          '物件数が圧倒的に多く、8万円以下の2LDKが最も見つかりやすい。ただし渋谷1時間超のリスクあり。',
        overallRating: 2,
      },
    ],
  },

  // ===== Tier2: 1人5万円 x 2 = 10万円 =====
  {
    id: 'tier2',
    label: '5万x2=10万',
    perPerson: 50000,
    total: 100000,
    totalLabel: '10万円',
    color: '#FFD4A0',
    description: '選択肢が広がる価格帯。辻堂・センター北へのアクセスが良いエリアも出てくる。',
    areas: [
      {
        id: 'sagami-ono',
        name: '相模大野',
        station: '相模大野駅',
        prefecture: '神奈川県',
        lines: ['小田急小田原線', '小田急江ノ島線'],
        rentRange: '8〜12万',
        rentAvg: 100000,
        access: {
          shibuya: { time: '45〜50分', detail: '小田急快速急行→新宿→副都心線' },
          tsujido: { time: '30〜35分', detail: '小田急江ノ島線で藤沢経由' },
          centerKita: { time: '40〜50分', detail: '小田急→相鉄→地下鉄' },
        },
        shopping: 4,
        safety: 4,
        walking: 3,
        highlights: [
          '辻堂へ30〜35分で全候補最短クラス',
          'ボーノ相模大野・伊勢丹',
          '快速急行停車',
          '飲食店豊富',
        ],
        cautions: [
          'センター北へ約50分',
          '10万以下は築古中心',
          'ラッシュ時の小田急混雑',
        ],
        description:
          '辻堂へのアクセスが全候補中最短クラス。小田急2路線の分岐点で、駅前の商業施設も海老名に匹敵する充実度。',
        overallRating: 3.5,
      },
      {
        id: 'hashimoto',
        name: '橋本',
        station: '橋本駅',
        prefecture: '神奈川県',
        lines: ['JR横浜線', 'JR相模線', '京王相模原線'],
        rentRange: '7〜11万',
        rentAvg: 90000,
        access: {
          shibuya: { time: '60〜65分', detail: '京王線→明大前→井の頭線' },
          tsujido: { time: '65〜75分', detail: 'JR相模線→茅ヶ崎→東海道線' },
          centerKita: { time: '35〜40分', detail: 'JR横浜線→町田→地下鉄' },
        },
        shopping: 3,
        safety: 3,
        walking: 2,
        highlights: [
          'リニア中央新幹線の新駅予定地',
          '物件数約3,220件で最多クラス',
          'センター北35分',
          '3路線利用可',
        ],
        cautions: [
          '渋谷まで1時間超の可能性',
          '辻堂へ非常に遠い',
          '街の雰囲気がやや殺風景',
        ],
        description:
          'リニア新駅で将来性◎。物件数が非常に多く選択肢が広い。センター北へ35分であいり向き。',
        overallRating: 3,
      },
      {
        id: 'ebina-new',
        name: '海老名（築浅狙い）',
        station: '海老名駅',
        prefecture: '神奈川県',
        lines: ['小田急小田原線', '相鉄本線', '相鉄東急直通線'],
        rentRange: '8〜10万',
        rentAvg: 90000,
        access: {
          shibuya: { time: '55〜60分', detail: '相鉄東急直通で乗換なし' },
          tsujido: { time: '40〜45分', detail: '小田急線で相模大野乗換' },
          centerKita: { time: '60〜65分', detail: '相鉄→横浜市営地下鉄' },
        },
        shopping: 4,
        safety: 4,
        walking: 2,
        highlights: [
          '3路線利用可能',
          'ららぽーと海老名・ビナウォーク',
          '相鉄東急直通で渋谷直通',
          '辻堂へ40分台',
        ],
        cautions: [
          '渋谷まで約1時間',
          'センター北へ60分超',
          '散歩スポットは限定的',
        ],
        description:
          'Tier1の海老名と同じエリアだが、予算アップで築浅物件が狙える。ららぽーと・ビナウォークの買い物環境はそのまま。',
        overallRating: 3,
      },
    ],
  },

  // ===== Tier3: 1人6万円 x 2 = 12万円 =====
  {
    id: 'tier3',
    label: '6万x2=12万',
    perPerson: 60000,
    total: 120000,
    totalLabel: '12万円',
    color: '#FFB5C2',
    description: '都心近郊の魅力的なエリアが登場。渋谷30分圏内や散歩が楽しいエリアが選べる。',
    areas: [
      {
        id: 'saginuma',
        name: '鷺沼',
        station: '鷺沼駅',
        prefecture: '神奈川県（川崎市宮前区）',
        lines: ['東急田園都市線'],
        rentRange: '10〜14万',
        rentAvg: 120000,
        access: {
          shibuya: { time: '22〜27分', detail: '田園都市線直通' },
          tsujido: { time: '65〜75分', detail: '渋谷→湘南新宿ラインまたは横浜経由' },
          centerKita: { time: '12〜16分', detail: 'あざみ野→地下鉄1駅' },
        },
        shopping: 2,
        safety: 5,
        walking: 3,
        highlights: [
          'センター北12分',
          '渋谷22分直通',
          '宮前区は犯罪件数最少クラス',
          '静かで在宅ワーク向き',
        ],
        cautions: [
          '辻堂へ65分超',
          '坂が非常に多い',
          '駅周辺以外は買い物不便',
        ],
        description:
          'センター北へ12分、渋谷へ22分直通。川崎市内で最も治安が良い宮前区に位置し、在宅ワークに最適な静かな環境。',
        overallRating: 3.5,
      },
      {
        id: 'narimasu',
        name: '成増',
        station: '成増駅',
        prefecture: '東京都（板橋区）',
        lines: ['東武東上線', '東京メトロ有楽町線', '東京メトロ副都心線'],
        rentRange: '10〜13万',
        rentAvg: 115000,
        access: {
          shibuya: { time: '25〜30分', detail: '副都心線直通' },
          tsujido: { time: '80〜90分', detail: '渋谷→湘南新宿ライン' },
          centerKita: { time: '55〜65分', detail: '副都心線→横浜→地下鉄' },
        },
        shopping: 4,
        safety: 3,
        walking: 3,
        highlights: [
          '副都心線で渋谷直通',
          '23区内で最も家賃が安いエリアの一つ',
          'スキップ村商店街100店舗',
          '3路線利用可',
        ],
        cautions: [
          '辻堂80分超',
          'センター北55分超',
          'おしゃれ感は薄い',
        ],
        description:
          '副都心線で渋谷へ乗換なし。板橋区の端で23区内最安水準ながらスキップ村商店街100店舗が充実。',
        overallRating: 3,
      },
      {
        id: 'nerima',
        name: '練馬',
        station: '練馬駅',
        prefecture: '東京都（練馬区）',
        lines: ['西武池袋線', '西武有楽町線', '都営大江戸線'],
        rentRange: '約12万',
        rentAvg: 120000,
        access: {
          shibuya: { time: '30〜35分', detail: '副都心線直通または大江戸線' },
          tsujido: { time: '75〜85分', detail: '渋谷→湘南新宿ライン' },
          centerKita: { time: '65〜75分', detail: '副都心線→横浜→地下鉄' },
        },
        shopping: 4,
        safety: 4,
        walking: 5,
        highlights: [
          '物件数7,701件で圧倒的',
          '3路線',
          '光が丘公園・石神井公園で緑豊か',
          '治安良好',
        ],
        cautions: [
          '辻堂・センター北ともに70分超',
          '渋谷30分超',
        ],
        description:
          '12万円以下の2LDKが最も見つけやすい。大規模公園が多い緑豊かな環境は散歩好きに最適。',
        overallRating: 3,
      },
      {
        id: 'noborito',
        name: '登戸',
        station: '登戸駅',
        prefecture: '神奈川県（川崎市多摩区）',
        lines: ['小田急小田原線', 'JR南武線'],
        rentRange: '10〜14万',
        rentAvg: 120000,
        access: {
          shibuya: { time: '25〜30分', detail: '小田急快速急行→下北沢→井の頭線' },
          tsujido: { time: '50〜55分', detail: '小田急で相模大野→藤沢経由' },
          centerKita: { time: '45〜55分', detail: '南武線→武蔵小杉→東横線→地下鉄' },
        },
        shopping: 3,
        safety: 3,
        walking: 4,
        highlights: [
          '3拠点バランスが最も良い',
          '渋谷25分',
          '多摩川の散歩コース',
          '藤子・F・不二雄ミュージアム近く',
        ],
        cautions: [
          '12万ジャストでは築古中心',
          '駅前の商業施設はやや弱い',
        ],
        description:
          '渋谷25分・辻堂50分・センター北45分と、3拠点へのアクセスが最もバランスの取れたエリア。多摩川散歩も◎。',
        overallRating: 3.5,
      },
      {
        id: 'chofu',
        name: '調布',
        station: '調布駅',
        prefecture: '東京都',
        lines: ['京王線', '京王相模原線'],
        rentRange: '10〜14万',
        rentAvg: 120000,
        access: {
          shibuya: { time: '25〜30分', detail: '京王線→明大前→井の頭線' },
          tsujido: { time: '75〜85分', detail: '渋谷→湘南新宿ライン' },
          centerKita: { time: '60〜70分', detail: '京王線→明大前→渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 4,
        walking: 5,
        highlights: [
          '天神通り商店街（鬼太郎モニュメント）',
          '商店街約300店舗',
          '深大寺・神代植物公園・多摩川',
          '渋谷25分',
        ],
        cautions: [
          '辻堂75分超',
          'センター北60分超',
          '京王線1路線のみ',
        ],
        description:
          '商店街300店舗と散歩スポット（深大寺・多摩川）が充実。街歩きの楽しさはこの価格帯でトップクラス。',
        overallRating: 3,
      },
    ],
  },

  // ===== Tier4: 1人7万円 x 2 = 14万円（おすすめ） =====
  {
    id: 'tier4',
    label: '7万x2=14万',
    perPerson: 70000,
    total: 140000,
    totalLabel: '14万円',
    color: '#B8A9E8',
    description: 'おすすめ帯。渋谷も実家もバランス良くアクセスでき、街の魅力も高いエリアが揃う。',
    areas: [
      {
        id: 'hiyoshi',
        name: '日吉',
        station: '日吉駅',
        prefecture: '神奈川県（横浜市港北区）',
        lines: ['東急東横線', '東急目黒線', '横浜市営地下鉄グリーンライン', '相鉄東急直通線'],
        rentRange: '12〜15万',
        rentAvg: 135000,
        access: {
          shibuya: { time: '22〜28分', detail: '東横線直通' },
          tsujido: { time: '40〜50分', detail: '横浜→東海道線' },
          centerKita: { time: '約9分', detail: 'グリーンライン直通' },
        },
        shopping: 4,
        safety: 4,
        walking: 3,
        highlights: [
          '3拠点アクセス総合力No.1',
          'センター北へたった9分',
          '4路線利用・目黒線始発',
          '商店街280店舗',
          '学生街で飲食店が安い',
        ],
        cautions: [
          '坂が多い',
          '14万以下は築古中心',
          '学生が多くやや騒がしい場所も',
        ],
        description:
          'センター北9分・辻堂40分・渋谷22分。すべての目的地に1時間以内で到達できる唯一のエリア。4路線利用可で利便性抜群。',
        overallRating: 4.5,
      },
      {
        id: 'tsunashima',
        name: '綱島',
        station: '綱島駅',
        prefecture: '神奈川県（横浜市港北区）',
        lines: ['東急東横線', '東急新横浜線'],
        rentRange: '11〜14万',
        rentAvg: 125000,
        access: {
          shibuya: { time: '25〜30分', detail: '東横線直通' },
          tsujido: { time: '40〜45分', detail: '横浜→東海道線' },
          centerKita: { time: '15〜20分', detail: '日吉→グリーンライン' },
        },
        shopping: 5,
        safety: 3,
        walking: 4,
        highlights: [
          '商店街400店舗（東横線沿線最大級）',
          '辻堂40分・センター北15分',
          '新綱島駅開業で新横浜3分',
          'ラーメン激戦区',
        ],
        cautions: [
          '鶴見川の水害リスク',
          '駅前にラブホテルあり',
          '坂が多いエリアも',
        ],
        description:
          '400店舗の商店街は買い物・散歩重視なら最高。日吉より家賃が安く、3拠点アクセスも◎。水害リスクはハザードマップで要確認。',
        overallRating: 4.5,
      },
      {
        id: 'chitose-karasuyama',
        name: '千歳烏山',
        station: '千歳烏山駅',
        prefecture: '東京都（世田谷区）',
        lines: ['京王線'],
        rentRange: '12〜16万',
        rentAvg: 140000,
        access: {
          shibuya: { time: '18〜22分', detail: '京王線→明大前→井の頭線' },
          tsujido: { time: '70〜80分', detail: '渋谷→湘南新宿ライン' },
          centerKita: { time: '55〜65分', detail: '渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 5,
        walking: 4,
        highlights: [
          '世田谷区で家賃12.5万平均の驚異的コスパ',
          'えるもーる烏山150店舗超',
          '犯罪発生率23区2番目に低い',
          '烏山寺町で小京都散歩',
        ],
        cautions: [
          '辻堂70分超',
          'センター北55分超',
          '京王線1路線のみ',
        ],
        description:
          '世田谷区アドレスで平均12.5万円という驚異的コスパ。150店舗超の商店街と23区2位の治安の良さ。',
        overallRating: 4,
      },
      {
        id: 'akabane',
        name: '赤羽',
        station: '赤羽駅',
        prefecture: '東京都（北区）',
        lines: ['JR京浜東北線', 'JR埼京線', 'JR湘南新宿ライン', 'JR上野東京ライン', '東京メトロ南北線'],
        rentRange: '10〜14万',
        rentAvg: 120000,
        access: {
          shibuya: { time: '20〜25分', detail: '埼京線直通' },
          tsujido: { time: '60〜65分', detail: '湘南新宿ライン直通' },
          centerKita: { time: '55〜65分', detail: '埼京線→渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 2,
        walking: 4,
        highlights: [
          '5路線以上で交通利便性No.1',
          '渋谷20分・辻堂60分ともに直通',
          '赤羽一番街・LaLaガーデン',
          '住みやすい街大賞1位',
        ],
        cautions: [
          '東口繁華街は治安にやや不安',
          '荒川近くは浸水リスク',
          'センター北55分超',
        ],
        description:
          '5路線以上利用可で交通利便性No.1。渋谷・辻堂ともに直通。赤羽一番街は東京最大級のアーケード商店街。',
        overallRating: 4,
      },
      {
        id: 'tama-plaza',
        name: 'たまプラーザ',
        station: 'たまプラーザ駅',
        prefecture: '神奈川県（横浜市青葉区）',
        lines: ['東急田園都市線'],
        rentRange: '12〜16万',
        rentAvg: 140000,
        access: {
          shibuya: { time: '25〜30分', detail: '田園都市線直通' },
          tsujido: { time: '70〜80分', detail: '渋谷→湘南新宿ラインまたは横浜経由' },
          centerKita: { time: '8〜12分', detail: 'あざみ野→地下鉄1駅' },
        },
        shopping: 4,
        safety: 5,
        walking: 5,
        highlights: [
          'センター北8〜12分で最短',
          '英国田園都市構想の美しい街並み',
          'たまプラーザテラス',
          'パチンコ・風俗店ゼロの治安◎◎',
        ],
        cautions: [
          '辻堂70分超',
          '14万以下は築古中心',
          '物価やや高い',
          '坂が多い',
        ],
        description:
          'センター北最短8分。東急が手がけた美しい計画都市で散歩◎。パチンコ・風俗店ゼロの極めて良い治安。',
        overallRating: 4,
      },
    ],
  },

  // ===== Tier5: 1人8万円 x 2 = 16万円 =====
  {
    id: 'tier5',
    label: '8万x2=16万',
    perPerson: 80000,
    total: 160000,
    totalLabel: '16万円',
    color: '#E8E0FF',
    description: '都心の人気エリアが選べる。渋谷30分以内は当たり前。街の個性と文化を楽しめる。',
    areas: [
      {
        id: 'nakano',
        name: '中野',
        station: '中野駅',
        prefecture: '東京都（中野区）',
        lines: ['JR中央線', 'JR総武線', '東京メトロ東西線'],
        rentRange: '15〜18万',
        rentAvg: 165000,
        access: {
          shibuya: { time: '15〜20分', detail: 'JR中央線→新宿→副都心線' },
          tsujido: { time: '65〜75分', detail: '新宿→湘南新宿ライン' },
          centerKita: { time: '60〜70分', detail: '新宿→渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 3,
        walking: 4,
        highlights: [
          '中野ブロードウェイ（サブカルの聖地）',
          '中野サンモール110店舗',
          '東西線始発で座って通勤',
          '新宿まで5分',
          '大規模再開発中',
        ],
        cautions: [
          '辻堂・センター北ともに60分超',
          '北口繁華街は治安注意',
          '16万以下はアパート中心',
        ],
        description:
          'ゲーマーカップルに最もフィットする文化エリア。ブロードウェイ240店舗のサブカルの聖地で、新宿5分。',
        overallRating: 4,
      },
      {
        id: 'shimokitazawa',
        name: '下北沢',
        station: '下北沢駅',
        prefecture: '東京都（世田谷区）',
        lines: ['小田急小田原線', '京王井の頭線'],
        rentRange: '15〜19万',
        rentAvg: 170000,
        access: {
          shibuya: { time: '5〜7分', detail: '京王井の頭線直通' },
          tsujido: { time: '55〜65分', detail: '小田急線で藤沢経由' },
          centerKita: { time: '50〜60分', detail: '渋谷→東横線→地下鉄' },
        },
        shopping: 4,
        safety: 3,
        walking: 5,
        highlights: [
          '渋谷まで最短5分',
          'ミカン下北・reload等の新商業施設',
          '古着屋・カフェ・劇場が混在する唯一無二の街',
          '2路線利用',
          '辻堂へ小田急経由で比較的近い',
        ],
        cautions: [
          '16万以下の2LDKは限られる',
          '週末の観光客混雑',
          '物価高め',
        ],
        description:
          '渋谷5分の圧倒的近さ。再開発で新しい魅力が次々と生まれる街歩きの楽しさNo.1。辻堂へ小田急経由でアクセスも。',
        overallRating: 4,
      },
      {
        id: 'kyodo',
        name: '経堂',
        station: '経堂駅',
        prefecture: '東京都（世田谷区）',
        lines: ['小田急小田原線'],
        rentRange: '14〜19万',
        rentAvg: 165000,
        access: {
          shibuya: { time: '15〜20分', detail: '小田急→下北沢→井の頭線' },
          tsujido: { time: '55〜65分', detail: '小田急で藤沢経由' },
          centerKita: { time: '50〜60分', detail: '渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 4,
        walking: 4,
        highlights: [
          'すずらん通り＋農大通りの2大商店街',
          '駅直結コルティ',
          'スーパー10軒以上',
          '烏山川緑道で散歩◎',
          '文教エリアで落ち着いた雰囲気',
        ],
        cautions: [
          '16万以下は築古中心',
          '小田急1路線',
          '辻堂・センター北やや遠い',
        ],
        description:
          '上品さと庶民感の絶妙なバランス。2大商店街＋コルティで買い物環境万全。緑道散歩と文教エリアの静けさが魅力。',
        overallRating: 4,
      },
      {
        id: 'ogikubo',
        name: '荻窪',
        station: '荻窪駅',
        prefecture: '東京都（杉並区）',
        lines: ['JR中央線', 'JR総武線', '東京メトロ丸ノ内線'],
        rentRange: '13〜18万',
        rentAvg: 155000,
        access: {
          shibuya: { time: '20〜25分', detail: '丸ノ内線→赤坂見附→銀座線' },
          tsujido: { time: '70〜80分', detail: '新宿→湘南新宿ライン' },
          centerKita: { time: '65〜75分', detail: '新宿→渋谷→東横線→地下鉄' },
        },
        shopping: 5,
        safety: 5,
        walking: 5,
        highlights: [
          '駅周辺に23超の商店街（全エリア最多）',
          '丸ノ内線始発で座れる',
          '犯罪発生率23区最低0.38%',
          'ラーメン・カレー激戦区',
          '吉祥寺まで5分',
        ],
        cautions: [
          '辻堂70分・センター北65分と実家アクセス悪い',
          '16万以下は築古が多い',
        ],
        description:
          '23を超える商店街が密集する全エリア中最多の商店街密度。丸ノ内線始発で座って通勤可。治安は23区最良クラス。',
        overallRating: 4,
      },
    ],
  },
]
