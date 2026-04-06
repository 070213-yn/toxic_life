// 駅名 → 2LDK家賃相場データ
// 各駅の家賃相場（万円）、路線、渋谷までのアクセス時間をまとめたデータベース

export type RentInfo = {
  rent: string    // 家賃相場（万円表記）
  line: string    // 主要路線
  toShibuya: string // 渋谷までの所要時間
}

export const RENT_DATA: Record<string, RentInfo> = {
  // === JR埼京線 ===
  '渋谷': { rent: '36.7万円', line: 'JR各線', toShibuya: '—' },
  '新宿': { rent: '33.0万円', line: 'JR各線', toShibuya: '約7分' },
  '十条': { rent: '22.7万円', line: 'JR埼京線', toShibuya: '約20分' },
  '東十条': { rent: '22.4万円', line: 'JR京浜東北線', toShibuya: '約35分' },
  '赤羽': { rent: '23.0万円', line: 'JR埼京線/京浜東北線', toShibuya: '約25分' },
  '北赤羽': { rent: '21.9万円', line: 'JR埼京線', toShibuya: '約25分' },
  '浮間舟渡': { rent: '19.7万円', line: 'JR埼京線', toShibuya: '約30分' },
  '戸田公園': { rent: '14.7万円', line: 'JR埼京線', toShibuya: '約35分' },
  '戸田': { rent: '13.6万円', line: 'JR埼京線', toShibuya: '約37分' },
  '北戸田': { rent: '12.8万円', line: 'JR埼京線', toShibuya: '約40分' },
  '武蔵浦和': { rent: '14.3万円', line: 'JR埼京線/武蔵野線', toShibuya: '約40分' },
  '中浦和': { rent: '14.5万円', line: 'JR埼京線', toShibuya: '約42分' },
  '南与野': { rent: '10.0万円', line: 'JR埼京線', toShibuya: '約45分' },
  '与野本町': { rent: '13.9万円', line: 'JR埼京線', toShibuya: '約47分' },
  '北与野': { rent: '13.0万円', line: 'JR埼京線', toShibuya: '約48分' },
  '大宮': { rent: '11.2万円', line: 'JR各線', toShibuya: '約50分' },

  // === JR川越線 ===
  '日進': { rent: '10.6万円', line: 'JR川越線', toShibuya: '約55分' },
  '西大宮': { rent: '10.6万円', line: 'JR川越線', toShibuya: '約60分' },
  '指扇': { rent: '9.3万円', line: 'JR川越線', toShibuya: '約65分' },
  '南古谷': { rent: '9.4万円', line: 'JR川越線', toShibuya: '約65分' },
  '川越': { rent: '8.0万円', line: 'JR川越線/東武東上線', toShibuya: '約55分' },
  '西川越': { rent: '7.0万円', line: 'JR川越線', toShibuya: '約70分' },
  '的場': { rent: '6.5万円', line: 'JR川越線', toShibuya: '約70分' },

  // === JR京浜東北線（さいたま方面） ===
  'さいたま新都心': { rent: '14.0万円', line: 'JR京浜東北線', toShibuya: '約45分' },
  '与野': { rent: '14.7万円', line: 'JR京浜東北線', toShibuya: '約47分' },
  '北浦和': { rent: '15.0万円', line: 'JR京浜東北線', toShibuya: '約43分' },
  '浦和': { rent: '13.5万円', line: 'JR京浜東北線/宇都宮線', toShibuya: '約40分' },
  '南浦和': { rent: '12.9万円', line: 'JR京浜東北線/武蔵野線', toShibuya: '約42分' },
  '蕨': { rent: '13.0万円', line: 'JR京浜東北線', toShibuya: '約37分' },
  '西川口': { rent: '14.5万円', line: 'JR京浜東北線', toShibuya: '約35分' },
  '川口': { rent: '15.5万円', line: 'JR京浜東北線', toShibuya: '約33分' },

  // === JR京浜東北線（北区） ===
  '王子': { rent: '21.3万円', line: 'JR京浜東北線/南北線', toShibuya: '約35分' },
  '上中里': { rent: '21.3万円', line: 'JR京浜東北線', toShibuya: '約35分' },
  '田端': { rent: '24.6万円', line: 'JR京浜東北線/山手線', toShibuya: '約25分' },

  // === JR京浜東北線（横浜方面） ===
  '鶴見': { rent: '14.0万円', line: 'JR京浜東北線', toShibuya: '約35分' },
  '新子安': { rent: '13.5万円', line: 'JR京浜東北線', toShibuya: '約38分' },
  '東神奈川': { rent: '14.5万円', line: 'JR京浜東北線', toShibuya: '約35分' },
  '横浜': { rent: '17.0万円', line: 'JR各線', toShibuya: '約30分' },

  // === JR根岸線 ===
  '桜木町': { rent: '16.0万円', line: 'JR根岸線', toShibuya: '約35分' },
  '関内': { rent: '14.0万円', line: 'JR根岸線', toShibuya: '約37分' },
  '石川町': { rent: '14.5万円', line: 'JR根岸線', toShibuya: '約38分' },
  '山手': { rent: '12.0万円', line: 'JR根岸線', toShibuya: '約40分' },
  '根岸': { rent: '11.0万円', line: 'JR根岸線', toShibuya: '約42分' },
  '磯子': { rent: '10.5万円', line: 'JR根岸線', toShibuya: '約45分' },
  '新杉田': { rent: '11.0万円', line: 'JR根岸線', toShibuya: '約45分' },
  '洋光台': { rent: '9.5万円', line: 'JR根岸線', toShibuya: '約50分' },
  '港南台': { rent: '10.5万円', line: 'JR根岸線', toShibuya: '約50分' },
  '本郷台': { rent: '10.0万円', line: 'JR根岸線', toShibuya: '約55分' },
  '大船': { rent: '12.0万円', line: 'JR根岸線/東海道線', toShibuya: '約50分' },

  // === 東武東上線 ===
  '大山': { rent: '15.8万円', line: '東武東上線', toShibuya: '約30分' },
  '中板橋': { rent: '15.0万円', line: '東武東上線', toShibuya: '約30分' },
  'ときわ台': { rent: '17.0万円', line: '東武東上線', toShibuya: '約30分' },
  '上板橋': { rent: '14.0万円', line: '東武東上線', toShibuya: '約35分' },
  '東武練馬': { rent: '13.5万円', line: '東武東上線', toShibuya: '約35分' },
  '下赤塚': { rent: '13.0万円', line: '東武東上線', toShibuya: '約35分' },
  '成増': { rent: '12.5万円', line: '東武東上線', toShibuya: '約35分' },
  '和光市': { rent: '12.0万円', line: '東武東上線/副都心線', toShibuya: '約35分' },
  '朝霞': { rent: '10.5万円', line: '東武東上線', toShibuya: '約40分' },
  '朝霞台': { rent: '11.0万円', line: '東武東上線', toShibuya: '約40分' },
  '志木': { rent: '10.5万円', line: '東武東上線', toShibuya: '約40分' },
  '柳瀬川': { rent: '9.0万円', line: '東武東上線', toShibuya: '約45分' },
  'みずほ台': { rent: '9.0万円', line: '東武東上線', toShibuya: '約45分' },
  '鶴瀬': { rent: '8.5万円', line: '東武東上線', toShibuya: '約45分' },
  'ふじみ野': { rent: '9.5万円', line: '東武東上線', toShibuya: '約45分' },
  '上福岡': { rent: '8.5万円', line: '東武東上線', toShibuya: '約50分' },
  '新河岸': { rent: '7.5万円', line: '東武東上線', toShibuya: '約50分' },
  '川越市': { rent: '7.5万円', line: '東武東上線', toShibuya: '約55分' },
  '霞ヶ関': { rent: '7.0万円', line: '東武東上線', toShibuya: '約60分' },
  '鶴ヶ島': { rent: '6.5万円', line: '東武東上線', toShibuya: '約60分' },
  '若葉': { rent: '6.5万円', line: '東武東上線', toShibuya: '約60分' },
  '坂戸': { rent: '7.0万円', line: '東武東上線', toShibuya: '約60分' },
  '東松山': { rent: '6.5万円', line: '東武東上線', toShibuya: '約70分' },

  // === 京急本線 ===
  '弘明寺': { rent: '9.5万円', line: '京急本線', toShibuya: '約40分' },
  '上大岡': { rent: '12.0万円', line: '京急本線', toShibuya: '約40分' },
  '屏風浦': { rent: '9.0万円', line: '京急本線', toShibuya: '約45分' },
  '杉田': { rent: '9.5万円', line: '京急本線', toShibuya: '約45分' },
  '金沢文庫': { rent: '9.0万円', line: '京急本線', toShibuya: '約50分' },
  '金沢八景': { rent: '9.0万円', line: '京急本線', toShibuya: '約50分' },
  '追浜': { rent: '8.5万円', line: '京急本線', toShibuya: '約55分' },
  '汐入': { rent: '8.0万円', line: '京急本線', toShibuya: '約55分' },
  '横須賀中央': { rent: '8.5万円', line: '京急本線', toShibuya: '約60分' },

  // === JR横須賀線 ===
  '保土ケ谷': { rent: '11.5万円', line: 'JR横須賀線', toShibuya: '約35分' },
  '東戸塚': { rent: '11.0万円', line: 'JR横須賀線', toShibuya: '約40分' },
  '戸塚': { rent: '11.0万円', line: 'JR横須賀線/東海道線', toShibuya: '約40分' },
  '逗子': { rent: '10.0万円', line: 'JR横須賀線', toShibuya: '約55分' },
  '北鎌倉': { rent: '11.5万円', line: 'JR横須賀線', toShibuya: '約55分' },
  '鎌倉': { rent: '12.0万円', line: 'JR横須賀線', toShibuya: '約55分' },

  // === 京成線 ===
  '京成立石': { rent: '11.5万円', line: '京成押上線', toShibuya: '約40分' },
  '青砥': { rent: '12.0万円', line: '京成本線', toShibuya: '約40分' },
  '京成高砂': { rent: '10.5万円', line: '京成本線', toShibuya: '約45分' },

  // === JR中央線 ===
  '中野': { rent: '20.0万円', line: 'JR中央線', toShibuya: '約20分' },
  '高円寺': { rent: '18.0万円', line: 'JR中央線', toShibuya: '約20分' },
  '荻窪': { rent: '17.0万円', line: 'JR中央線/丸ノ内線', toShibuya: '約25分' },
  '吉祥寺': { rent: '17.0万円', line: 'JR中央線/井の頭線', toShibuya: '約20分' },
  '三鷹': { rent: '15.0万円', line: 'JR中央線', toShibuya: '約30分' },
  '武蔵境': { rent: '14.0万円', line: 'JR中央線', toShibuya: '約35分' },
  '東小金井': { rent: '13.0万円', line: 'JR中央線', toShibuya: '約35分' },
  '武蔵小金井': { rent: '13.5万円', line: 'JR中央線', toShibuya: '約35分' },
  '国分寺': { rent: '12.5万円', line: 'JR中央線', toShibuya: '約40分' },
  '立川': { rent: '11.5万円', line: 'JR中央線', toShibuya: '約40分' },
  '八王子': { rent: '9.5万円', line: 'JR中央線', toShibuya: '約55分' },

  // === 東急田園都市線 ===
  '溝の口': { rent: '15.5万円', line: '東急田園都市線', toShibuya: '約20分' },
  'あざみ野': { rent: '13.0万円', line: '東急田園都市線', toShibuya: '約25分' },
  '青葉台': { rent: '12.0万円', line: '東急田園都市線', toShibuya: '約30分' },
  '田奈': { rent: '9.5万円', line: '東急田園都市線', toShibuya: '約35分' },
  '長津田': { rent: '10.0万円', line: '東急田園都市線/JR横浜線', toShibuya: '約35分' },
  'つくし野': { rent: '9.5万円', line: '東急田園都市線', toShibuya: '約35分' },
  'すずかけ台': { rent: '9.5万円', line: '東急田園都市線', toShibuya: '約40分' },
  'つきみ野': { rent: '9.0万円', line: '東急田園都市線', toShibuya: '約40分' },
  '中央林間': { rent: '9.5万円', line: '東急田園都市線/小田急江ノ島線', toShibuya: '約40分' },

  // === 東急東横線 ===
  '元住吉': { rent: '16.0万円', line: '東急東横線', toShibuya: '約20分' },
  '日吉': { rent: '15.5万円', line: '東急東横線', toShibuya: '約20分' },
  '綱島': { rent: '14.0万円', line: '東急東横線', toShibuya: '約25分' },
  '大倉山': { rent: '13.5万円', line: '東急東横線', toShibuya: '約25分' },
  '菊名': { rent: '14.0万円', line: '東急東横線/JR横浜線', toShibuya: '約25分' },
  '白楽': { rent: '12.5万円', line: '東急東横線', toShibuya: '約30分' },

  // === 西武池袋線 ===
  '所沢': { rent: '9.5万円', line: '西武池袋線', toShibuya: '約45分' },
  '清瀬': { rent: '9.0万円', line: '西武池袋線', toShibuya: '約45分' },
  '小手指': { rent: '8.5万円', line: '西武池袋線', toShibuya: '約50分' },
  '入間市': { rent: '7.5万円', line: '西武池袋線', toShibuya: '約55分' },
  '飯能': { rent: '7.0万円', line: '西武池袋線', toShibuya: '約65分' },

  // === 小田急線 ===
  '登戸': { rent: '13.0万円', line: '小田急線', toShibuya: '約25分' },
  '新百合ヶ丘': { rent: '11.0万円', line: '小田急線', toShibuya: '約30分' },
  '町田': { rent: '10.5万円', line: '小田急線/JR横浜線', toShibuya: '約40分' },
  '海老名': { rent: '9.0万円', line: '小田急線/相鉄線', toShibuya: '約50分' },
  '本厚木': { rent: '8.5万円', line: '小田急線', toShibuya: '約55分' },

  // === 横浜市営地下鉄ブルーライン ===
  'センター北': { rent: '14.5万円', line: '横浜市営地下鉄', toShibuya: '約45分' },
  'センター南': { rent: '14.0万円', line: '横浜市営地下鉄', toShibuya: '約45分' },
  '仲町台': { rent: '12.0万円', line: '横浜市営地下鉄', toShibuya: '約45分' },
  '新羽': { rent: '11.0万円', line: '横浜市営地下鉄', toShibuya: '約50分' },
  '北新横浜': { rent: '11.0万円', line: '横浜市営地下鉄', toShibuya: '約50分' },
  '上永谷': { rent: '9.5万円', line: '横浜市営地下鉄', toShibuya: '約50分' },
  '下永谷': { rent: '9.0万円', line: '横浜市営地下鉄', toShibuya: '約55分' },
  '舞岡': { rent: '9.0万円', line: '横浜市営地下鉄', toShibuya: '約55分' },
  '湘南台': { rent: '9.0万円', line: '横浜市営地下鉄/小田急江ノ島線', toShibuya: '約55分' },
}

// 駅名から家賃データを検索する
// 「駅」や「Station」が末尾に付いていても対応
export function findRentData(stationName: string): { station: string; data: RentInfo } | null {
  if (!stationName) return null

  // そのまま一致
  const trimmed = stationName.trim()
  if (RENT_DATA[trimmed]) {
    return { station: trimmed, data: RENT_DATA[trimmed] }
  }

  // 末尾の「駅」を除去して再検索
  const withoutEki = trimmed.replace(/駅$/, '')
  if (withoutEki !== trimmed && RENT_DATA[withoutEki]) {
    return { station: withoutEki, data: RENT_DATA[withoutEki] }
  }

  // 部分一致検索（入力に含まれる駅名を探す）
  for (const key of Object.keys(RENT_DATA)) {
    if (trimmed.includes(key)) {
      return { station: key, data: RENT_DATA[key] }
    }
  }

  return null
}
