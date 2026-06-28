/* =======================================================================
   ダメージ計算ツール for ポケモンチャンピオンズ   script.js
   -----------------------------------------------------------------------
   データは下記の4つのテーブルにまとまっています。
     ① TYPE_CHART … タイプ相性
     ② MOVES      … 技
     ③ ITEMS      … もちもの
     ④ POKEMON    … ポケモン
   ポケモンや技を増やす手順は同梱の「追加方法.md」を参照してください。
   ======================================================================= */

/* ============================ ① タイプ相性 ============================ */
/* 18タイプの順番（チップ表示・色に使用） */
const TYPES = ["ノーマル","ほのお","みず","でんき","くさ","こおり","かくとう","どく",
  "じめん","ひこう","エスパー","むし","いわ","ゴースト","ドラゴン","あく","はがね","フェアリー"];

/* タイプ色（チップ表示用） */
const TYPE_COLOR = {
  "ノーマル":"#9FA19F","ほのお":"#E62829","みず":"#2980EF","でんき":"#E0B500",
  "くさ":"#3FA129","こおり":"#37BFD5","かくとう":"#FF8000","どく":"#9141CB",
  "じめん":"#A0712A","ひこう":"#6F9FE8","エスパー":"#EF4179","むし":"#8FA017",
  "いわ":"#A6A06A","ゴースト":"#704170","ドラゴン":"#5060E1","あく":"#4A3E3B",
  "はがね":"#5F94A8","フェアリー":"#E36FD0"
};

/* 相性表：攻撃タイプ → { 防御タイプ: 倍率 }（×1.0 は省略） */
const TYPE_CHART = {
  "ノーマル":{"いわ":.5,"ゴースト":0,"はがね":.5},
  "ほのお":{"ほのお":.5,"みず":.5,"くさ":2,"こおり":2,"むし":2,"いわ":.5,"ドラゴン":.5,"はがね":2},
  "みず":{"ほのお":2,"みず":.5,"くさ":.5,"じめん":2,"いわ":2,"ドラゴン":.5},
  "でんき":{"みず":2,"でんき":.5,"くさ":.5,"じめん":0,"ひこう":2,"ドラゴン":.5},
  "くさ":{"ほのお":.5,"みず":2,"くさ":.5,"どく":.5,"じめん":2,"ひこう":.5,"むし":.5,"いわ":2,"ドラゴン":.5,"はがね":.5},
  "こおり":{"ほのお":.5,"みず":.5,"くさ":2,"こおり":.5,"じめん":2,"ひこう":2,"ドラゴン":2,"はがね":.5},
  "かくとう":{"ノーマル":2,"こおり":2,"どく":.5,"ひこう":.5,"エスパー":.5,"むし":.5,"いわ":2,"ゴースト":0,"あく":2,"はがね":2,"フェアリー":.5},
  "どく":{"くさ":2,"どく":.5,"じめん":.5,"いわ":.5,"ゴースト":.5,"はがね":0,"フェアリー":2},
  "じめん":{"ほのお":2,"でんき":2,"くさ":.5,"どく":2,"ひこう":0,"むし":.5,"いわ":2,"はがね":2},
  "ひこう":{"でんき":.5,"くさ":2,"かくとう":2,"むし":2,"いわ":.5,"はがね":.5},
  "エスパー":{"かくとう":2,"どく":2,"エスパー":.5,"あく":0,"はがね":.5},
  "むし":{"ほのお":.5,"くさ":2,"かくとう":.5,"どく":.5,"ひこう":.5,"エスパー":2,"ゴースト":.5,"あく":2,"はがね":.5,"フェアリー":.5},
  "いわ":{"ほのお":2,"こおり":2,"かくとう":.5,"じめん":.5,"ひこう":2,"むし":2,"はがね":.5},
  "ゴースト":{"ノーマル":0,"エスパー":2,"ゴースト":2,"あく":.5},
  "ドラゴン":{"ドラゴン":2,"はがね":.5,"フェアリー":0},
  "あく":{"かくとう":.5,"エスパー":2,"ゴースト":2,"あく":.5,"フェアリー":.5},
  "はがね":{"ほのお":.5,"みず":.5,"でんき":.5,"こおり":2,"いわ":2,"はがね":.5,"フェアリー":2},
  "フェアリー":{"ほのお":.5,"かくとう":2,"どく":.5,"ドラゴン":2,"あく":2,"はがね":.5}
};
function typeEff(atk, def){
  const row = TYPE_CHART[atk] || {};
  return (def in row) ? row[def] : 1;
}

/* ================================ ② 技 ================================ */
/* type: タイプ / category: "物理"or"特殊" / power: 威力                    */
/* 特殊フラグ: weatherBall（天気で型と威力変化）, solarbeam（晴れ以外で威力半減）*/
/* contact:true … 接触技（ゴツゴツメットの反動対象）                          */
const MOVES = {
  // ノーマル
  "たいあたり":      {type:"ノーマル", category:"物理", power:40,  contact:true},
  "とっしん":        {type:"ノーマル", category:"物理", power:90,  contact:true},
  "すてみタックル":  {type:"ノーマル", category:"物理", power:120, contact:true},
  "からげんき":      {type:"ノーマル", category:"物理", power:70,  contact:true, note:"相手でなく自分が状態異常だと威力2倍（やけど以外）"},
  "ギガインパクト":  {type:"ノーマル", category:"物理", power:150, contact:true},
  "ウェザーボール":  {type:"ノーマル", category:"特殊", power:50,  weatherBall:true, note:"天気で威力100＆タイプ変化"},
  // くさ
  "すいとる":        {type:"くさ",     category:"特殊", power:20},
  "メガドレイン":    {type:"くさ",     category:"特殊", power:40},
  "ギガドレイン":    {type:"くさ",     category:"特殊", power:75},
  "つるのムチ":      {type:"くさ",     category:"物理", power:45,  contact:true},
  "はっぱカッター":  {type:"くさ",     category:"物理", power:55,  note:"急所に当たりやすい"},
  "タネばくだん":    {type:"くさ",     category:"物理", power:80},
  "パワーウィップ":  {type:"くさ",     category:"物理", power:120, contact:true},
  "はなびらのまい":  {type:"くさ",     category:"特殊", power:120, contact:true},
  "ソーラービーム":  {type:"くさ",     category:"特殊", power:120, solarbeam:true, note:"雨・砂・雪で威力半減"},
  "エナジーボール":  {type:"くさ",     category:"特殊", power:90},
  "リーフストーム":  {type:"くさ",     category:"特殊", power:130},
  // どく
  "ヘドロこうげき":  {type:"どく",     category:"特殊", power:65},
  "ヘドロばくだん":  {type:"どく",     category:"特殊", power:90},
  "ヘドロウェーブ":  {type:"どく",     category:"特殊", power:95},
  "どくづき":        {type:"どく",     category:"物理", power:80,  contact:true},
  "ベノムショック":  {type:"どく",     category:"特殊", power:65,  note:"相手が状態異常だと威力2倍"},
  // じめん
  "じならし":        {type:"じめん",   category:"物理", power:60},
  "じしん":          {type:"じめん",   category:"物理", power:100},
  "だいちのちから":  {type:"じめん",   category:"特殊", power:90}
};

/* =============================== ③ もちもの =============================== */
/* 使えるフラグ:
   typeBoost+mul … 該当タイプの技の威力（例 きせきのタネ:くさ×1.2）
   physBP        … 物理技の威力補正（ちからのはちまき ×1.1）
   specBP        … 特殊技の威力補正（ものしりめがね ×1.1）
   atkMul        … 物理技のこうげき補正（こだわりハチマキ ×1.5）
   spaMul        … 特殊技のとくこう補正（こだわりメガネ ×1.5）
   spdMul        … 特殊技に対する相手のとくぼう補正（とつげきチョッキ ×1.5）
   seBoost       … 効果ばつぐん時の最終補正（たつじんのおび ×1.2）
   finalMod      … 最終ダメージ補正（いのちのたま ×1.3）
   resistBerry   … 該当タイプの効果ばつぐんを半減する半減実（ノーマルは等倍でも半減）
   megaStone     … メガストーン                                              */
const ITEMS = {
  "なし":            {},
  // --- 攻撃側（ダメージに関係するもの） ---
  "たつじんのおび":  {seBoost:1.2},
  "ちからのはちまき":{physBP:1.1},
  "ものしりめがね":  {specBP:1.1},
  "いのちのたま":    {finalMod:1.3},
  "こだわりハチマキ":{atkMul:1.5},
  "こだわりメガネ":  {spaMul:1.5},
  "きせきのタネ":    {typeBoost:"くさ",   mul:1.2},
  "どくバリ":        {typeBoost:"どく",   mul:1.2},
  "やわらかいすな":  {typeBoost:"じめん", mul:1.2},
  "シルクのスカーフ":{typeBoost:"ノーマル", mul:1.2},
  // --- 防御側（半減・回復） ---
  "とつげきチョッキ":{spdMul:1.5},
  "たべのこし":      {},
  "オボンのみ":      {},
  // --- 半減実（タイプ別） ---
  "オッカのみ":      {resistBerry:"ほのお"},
  "イトケのみ":      {resistBerry:"みず"},
  "ソクノのみ":      {resistBerry:"でんき"},
  "リンドのみ":      {resistBerry:"くさ"},
  "ヤチェのみ":      {resistBerry:"こおり"},
  "ヨプのみ":        {resistBerry:"かくとう"},
  "ビアーのみ":      {resistBerry:"どく"},
  "シュカのみ":      {resistBerry:"じめん"},
  "バコウのみ":      {resistBerry:"ひこう"},
  "ウタンのみ":      {resistBerry:"エスパー"},
  "タンガのみ":      {resistBerry:"むし"},
  "ヨロギのみ":      {resistBerry:"いわ"},
  "カシブのみ":      {resistBerry:"ゴースト"},
  "ハバンのみ":      {resistBerry:"ドラゴン"},
  "ナモのみ":        {resistBerry:"あく"},
  "リリバのみ":      {resistBerry:"はがね"},
  "ロゼルのみ":      {resistBerry:"フェアリー"},
  "ホズのみ":        {resistBerry:"ノーマル"},
  // --- 両方 ---
  "フシギバナイト":  {megaStone:true}
};

/* 攻撃側に表示する持ち物（ダメージに関係するもののみ） */
const ATTACKER_ITEM_KEYS = [
  "なし","たつじんのおび","ちからのはちまき","ものしりめがね","いのちのたま",
  "こだわりハチマキ","こだわりメガネ","きせきのタネ","どくバリ","やわらかいすな",
  "シルクのスカーフ","フシギバナイト"
];
/* 防御側に表示する持ち物（半減・回復のみ。半減実は弱点タイプに応じて自動表示） */
const DEFENDER_ITEM_FIXED = ["なし","とつげきチョッキ","たべのこし","オボンのみ"];
const DEFENDER_ITEM_TAIL  = ["フシギバナイト"];
/* 半減実：タイプ → 道具名 */
const RESIST_BERRY = {
  "ほのお":"オッカのみ","みず":"イトケのみ","でんき":"ソクノのみ","くさ":"リンドのみ",
  "こおり":"ヤチェのみ","かくとう":"ヨプのみ","どく":"ビアーのみ","じめん":"シュカのみ",
  "ひこう":"バコウのみ","エスパー":"ウタンのみ","むし":"タンガのみ","いわ":"ヨロギのみ",
  "ゴースト":"カシブのみ","ドラゴン":"ハバンのみ","あく":"ナモのみ","はがね":"リリバのみ",
  "フェアリー":"ロゼルのみ","ノーマル":"ホズのみ"
};

/* =============================== ④ ポケモン =============================== */
/* types / base(種族値) / abilities(選べる特性) / moves(覚える攻撃技)         */
/* mega(任意): stone と一致するメガストーンを持つとメガシンカ                  */
const POKEMON = {
  "フシギバナ":{
    types:["くさ","どく"],
    base:{H:80,A:82,B:83,C:100,D:100,S:80},
    abilities:["しんりょく","ようりょくそ"],
    moves:[
      "つるのムチ","はっぱカッター","すいとる","メガドレイン","ギガドレイン",
      "タネばくだん","パワーウィップ","はなびらのまい","ソーラービーム","エナジーボール",
      "リーフストーム","ヘドロこうげき","ヘドロばくだん","ヘドロウェーブ","どくづき",
      "ベノムショック","じならし","じしん","だいちのちから","たいあたり","とっしん",
      "すてみタックル","からげんき","ギガインパクト","ウェザーボール"
    ],
    mega:{
      stone:"フシギバナイト", name:"メガフシギバナ",
      types:["くさ","どく"],
      base:{H:80,A:100,B:123,C:122,D:120,S:80},
      ability:"あついしぼう"
    }
  }
};

/* 特性メモ（ダメージに関わるもの）:
   しんりょく   … HP1/3以下でくさ技 ×1.5（攻撃側トグルで指定）
   ようりょくそ … 晴れで素早さ2倍（ダメージには影響なし）
   あついしぼう … 受けるほのお・こおり技 ×0.5（メガフシギバナの特性）        */

/* ============================ 天気・フィールド ============================ */
const WEATHERS = ["なし","にほんばれ","あめ","すなあらし","ゆき"];
const TERRAINS = ["なし","エレキフィールド","グラスフィールド","サイコフィールド","ミストフィールド"];

/* =========================================================================
   かな正規化（ひらがなでもカタカナ名を予測変換できるように）
   ========================================================================= */
function toKatakana(str){
  return (str||"").replace(/[\u3041-\u3096]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60));
}
function normKana(str){ return toKatakana(str).replace(/[ー・\s]/g,""); }

/* =========================================================================
   ステータス計算（レベル50固定）
   ========================================================================= */
const LEVEL = 50;
function calcHP(base, iv, ev){
  return Math.floor((2*base + iv + Math.floor(ev/4)) * LEVEL/100) + LEVEL + 10;
}
function calcStat(base, iv, ev, nature){
  return Math.floor((Math.floor((2*base + iv + Math.floor(ev/4)) * LEVEL/100) + 5) * nature);
}
function statStageMul(stage){
  return stage >= 0 ? (2+stage)/2 : 2/(2-stage);
}

/* =========================================================================
   ダメージ計算エンジン（第8世代以降の仕様に準拠）
   ========================================================================= */
const M = x => Math.round(x*4096);                       // 倍率→4096固定小数
const pokeRound = n => (n % 1 > 0.5) ? Math.ceil(n) : Math.floor(n); // 五捨五超入
function chainMods(mods){
  let m = 4096;
  for(const mod of mods) m = pokeRound(m*mod/4096);
  return m;
}
const applyChain = (v, m) => pokeRound(v*m/4096);

/* att/def は resolveSide() の戻り値。move は MOVES の1件＋name。opts に場・状態 */
function calcDamage(att, def, move, opts){
  let bp = move.power;
  let mType = move.type;
  let category = move.category;

  // ウェザーボール：天気で威力100＆タイプ変化
  if(move.weatherBall && opts.weather !== "なし"){
    bp = 100;
    mType = {"にほんばれ":"ほのお","あめ":"みず","すなあらし":"いわ","ゆき":"こおり"}[opts.weather];
  }

  const isPhys = category === "物理";
  const aItem = ITEMS[att.item] || {};
  const dItem = ITEMS[def.item] || {};

  /* --- 威力補正 (base power mods) --- */
  const bpMods = [];
  if(aItem.typeBoost === mType) bpMods.push(M(aItem.mul));            // タイプ強化アイテム ×1.2
  if(isPhys && aItem.physBP) bpMods.push(M(aItem.physBP));           // ちからのはちまき ×1.1
  if(!isPhys && aItem.specBP) bpMods.push(M(aItem.specBP));          // ものしりめがね ×1.1
  if(att.grounded){                                                   // フィールド（攻撃側が地面）
    if(opts.terrain==="エレキフィールド" && mType==="でんき") bpMods.push(M(1.3));
    if(opts.terrain==="グラスフィールド" && mType==="くさ")   bpMods.push(M(1.3));
    if(opts.terrain==="サイコフィールド" && mType==="エスパー") bpMods.push(M(1.3));
  }
  if(opts.terrain==="グラスフィールド" && def.grounded && (move.name==="じしん"||move.name==="じならし"))
    bpMods.push(M(0.5));                                              // グラスで地震/地ならし半減
  if(opts.terrain==="ミストフィールド" && def.grounded && mType==="ドラゴン")
    bpMods.push(M(0.5));                                              // ミストでドラゴン半減
  if(move.solarbeam && (opts.weather==="あめ"||opts.weather==="すなあらし"||opts.weather==="ゆき"))
    bpMods.push(M(0.5));                                              // ソーラービーム悪天候半減
  bp = Math.max(1, applyChain(bp, chainMods(bpMods)));

  /* --- こうげき側ステータス --- */
  let aBase = isPhys ? att.stats.A : att.stats.C;
  let aStage = isPhys ? att.ranks.A : att.ranks.C;
  if(opts.crit && aStage < 0) aStage = 0;                            // 急所は自分の下降を無視
  let atk = Math.floor(aBase * statStageMul(aStage));
  const atMods = [];
  if(isPhys && aItem.atkMul) atMods.push(M(aItem.atkMul));           // こだわりハチマキ
  if(!isPhys && aItem.spaMul) atMods.push(M(aItem.spaMul));          // こだわりメガネ
  if(att.ability==="しんりょく" && mType==="くさ" && opts.overgrow) atMods.push(M(1.5));
  atk = applyChain(atk, chainMods(atMods));

  /* --- ぼうぎょ側ステータス --- */
  let dBase = isPhys ? def.stats.B : def.stats.D;
  let dStage = isPhys ? def.ranks.B : def.ranks.D;
  if(opts.crit && dStage > 0) dStage = 0;                            // 急所は相手の上昇を無視
  let dfn = Math.floor(dBase * statStageMul(dStage));
  const dfMods = [];
  if(!isPhys && dItem.spdMul) dfMods.push(M(dItem.spdMul));          // とつげきチョッキ
  dfn = applyChain(dfn, chainMods(dfMods));

  /* --- 基礎ダメージ --- */
  let baseDamage = Math.floor(
    Math.floor(Math.floor((Math.floor(2*LEVEL/5)+2) * bp * atk / dfn) / 50) + 2
  );

  /* --- 天気（タイプ）補正 --- */
  let wMul = 1;
  if(opts.weather==="にほんばれ"){ if(mType==="ほのお") wMul=1.5; else if(mType==="みず") wMul=0.5; }
  if(opts.weather==="あめ"){ if(mType==="みず") wMul=1.5; else if(mType==="ほのお") wMul=0.5; }
  if(wMul !== 1) baseDamage = pokeRound(baseDamage * wMul);

  /* --- 急所 --- */
  if(opts.crit) baseDamage = Math.floor(baseDamage * 1.5);

  /* --- タイプ一致・相性・やけど・最終補正 --- */
  const stab = att.types.includes(mType) ? 1.5 : 1;
  let eff = 1;
  for(const dt of def.types) eff *= typeEff(mType, dt);
  const burn = (opts.burn && isPhys && att.ability!=="こんじょう") ? 0.5 : 1;

  const finalMods = [];
  if(aItem.finalMod) finalMods.push(M(aItem.finalMod));              // いのちのたま ×1.3
  if(aItem.seBoost && eff > 1) finalMods.push(M(aItem.seBoost));     // たつじんのおび（ばつぐん時 ×1.2）
  if(!opts.crit){                                                    // 壁（急所では無効）
    if(isPhys && def.reflect)     finalMods.push(M(0.5));
    if(!isPhys && def.lightscreen) finalMods.push(M(0.5));
  }
  if(def.ability==="あついしぼう" && (mType==="ほのお"||mType==="こおり")) finalMods.push(M(0.5));
  if(dItem.resistBerry && mType===dItem.resistBerry && (eff>1 || dItem.resistBerry==="ノーマル"))
    finalMods.push(M(0.5));                                          // 半減実（ばつぐんを半減／ノーマルは常時）
  const finalM = chainMods(finalMods);

  /* --- 乱数16通り --- */
  const rolls = [];
  for(let r=85; r<=100; r++){
    let d = Math.floor(baseDamage * r / 100);
    d = pokeRound(d * M(stab) / 4096);
    d = Math.floor(d * eff);
    d = Math.floor(d * burn);
    d = applyChain(d, finalM);
    if(eff > 0) d = Math.max(1, d);
    rolls.push(d);
  }
  return {rolls, eff, mType, bp, category, stab};
}

/* KO判定テキスト
   addl: { srDmg(ステロ削り), disguise(ばけのかわ), maxHP } */
function koSummary(rolls, maxHP, curHP, addl){
  const minD = rolls[0], maxD = rolls[rolls.length-1];
  if(maxD === 0) return {text:"効果がない", cls:"ko-survive"};

  const srDmg = addl.srDmg || 0;
  let baseHP = curHP - srDmg;                       // ステルスロック後のHP
  let extraHits = 0;
  if(addl.disguise){                                // ばけのかわが初撃を無効化
    extraHits = 1;
    baseHP -= Math.floor(maxHP / 8);                // ばけのかわ解除の削り(1/8)
  }
  if(baseHP < 1) baseHP = 1;

  let guaranteed = Math.ceil(baseHP / minD) + extraHits;
  let fastest    = Math.ceil(baseHP / maxD) + extraHits;

  if(guaranteed === fastest) return {text:`確定${guaranteed}発`, cls:"ko-guaranteed"};
  if(fastest === 1 && extraHits === 0){
    const cnt = rolls.filter(d => d >= baseHP).length;
    const p = (cnt/rolls.length*100).toFixed(1);
    return {text:`乱数1発 (${p}%)`, cls:"ko-random"};
  }
  return {text:`乱数${fastest}発`, cls:"ko-random"};
}

/* =========================================================================
   状態（State）
   ========================================================================= */
function freshStatCfg(){
  return {
    H:{ev:0,iv:31,nat:1.0,ov:null},
    A:{ev:0,iv:31,nat:1.0,ov:null},
    B:{ev:0,iv:31,nat:1.0,ov:null},
    C:{ev:0,iv:31,nat:1.0,ov:null},
    D:{ev:0,iv:31,nat:1.0,ov:null},
    S:{ev:0,iv:31,nat:1.0,ov:null}
  };
}
const state = {
  weather:"なし", terrain:"なし",
  attacker:{
    species:"フシギバナ", item:"なし", ability:"しんりょく",
    grounded:true, crit:false, burn:false, overgrowActive:false,
    moves:["ヘドロばくだん","ギガドレイン","だいちのちから","ソーラービーム"],
    cfg:freshStatCfg(), ranks:{A:0,B:0,C:0,D:0,S:0}
  },
  defender:{
    species:"フシギバナ", item:"なし", ability:"しんりょく",
    grounded:true, reflect:false, lightscreen:false, curHPpct:100,
    srOn:false, disguiseOn:false, rockyHelmet:false, lifeOrbRecoil:false,
    cfg:freshStatCfg(), ranks:{A:0,B:0,C:0,D:0,S:0}
  }
};

/* 種族・メガを解決して { name, types, base, ability, abilityOptions, isMega } を返す */
function resolveSide(side){
  const sp = POKEMON[side.species];
  const item = ITEMS[side.item] || {};
  if(sp.mega && item.megaStone && side.species && sp.mega.stone === side.item){
    return {name:sp.mega.name, types:sp.mega.types, base:sp.mega.base,
            ability:sp.mega.ability, abilityOptions:[sp.mega.ability], isMega:true};
  }
  return {name:side.species, types:sp.types, base:sp.base,
          ability:side.ability, abilityOptions:sp.abilities, isMega:false};
}
/* 実数値（ランク補正前）を取得 */
function actualStat(base, statKey, cfg){
  const c = cfg[statKey];
  if(c.ov !== null && c.ov !== "" && !Number.isNaN(c.ov)) return c.ov;
  if(statKey === "H") return calcHP(base.H, c.iv, c.ev);
  const baseVal = base[statKey];
  return calcStat(baseVal, c.iv, c.ev, c.nat);
}
/* 計算用のサイド情報を組み立て */
function buildCalcSide(side){
  const r = resolveSide(side);
  const stats = {
    H: actualStat(r.base,"H",side.cfg),
    A: actualStat(r.base,"A",side.cfg),
    B: actualStat(r.base,"B",side.cfg),
    C: actualStat(r.base,"C",side.cfg),
    D: actualStat(r.base,"D",side.cfg),
    S: actualStat(r.base,"S",side.cfg)
  };
  return {
    types:r.types, ability:r.ability, item:side.item, stats,
    ranks:side.ranks, grounded:side.grounded,
    reflect:side.reflect, lightscreen:side.lightscreen
  };
}

/* =========================================================================
   UI構築
   ========================================================================= */
const STAT_LABEL = {H:"HP",A:"こうげき",B:"ぼうぎょ",C:"とくこう",D:"とくぼう",S:"すばやさ"};
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ---- 予測変換（オートコンプリート） ---- */
function attachAutocomplete(input, getCandidates, onSelect){
  const wrap = document.createElement("div");
  wrap.className = "ac-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const list = document.createElement("div");
  list.className = "ac-list"; list.hidden = true;
  wrap.appendChild(list);
  let cursor = -1, items = [];

  function render(){
    const q = normKana(input.value.trim());
    let cands = getCandidates();
    if(q){
      cands = cands.filter(c => normKana(c).includes(q))
        .sort((a,b)=>{
          const an=normKana(a).startsWith(q)?0:1, bn=normKana(b).startsWith(q)?0:1;
          return an-bn || a.localeCompare(b,"ja");
        });
    }
    items = cands.slice(0,40);
    cursor = -1;
    if(items.length===0){ list.innerHTML = `<div class="ac-empty">候補がありません</div>`; list.hidden=false; return; }
    list.innerHTML = items.map((c,i)=>{
      const mv = MOVES[c];
      const meta = mv ? `<small>${mv.type}・${mv.category}・威力${mv.power}</small>` : "";
      return `<div class="ac-item" data-i="${i}">${c}${meta}</div>`;
    }).join("");
    list.hidden = false;
  }
  function close(){ list.hidden = true; cursor = -1; }
  function choose(i){
    if(i<0 || i>=items.length) return;
    input.value = items[i];
    onSelect(items[i]);
    close();
  }
  input.addEventListener("focus", render);
  input.addEventListener("input", render);
  input.addEventListener("keydown", e=>{
    if(list.hidden) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); cursor=Math.min(cursor+1,items.length-1); paint(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); cursor=Math.max(cursor-1,0); paint(); }
    else if(e.key==="Enter"){ e.preventDefault(); choose(cursor<0?0:cursor); }
    else if(e.key==="Escape"){ close(); }
  });
  function paint(){
    $$(".ac-item",list).forEach((el,i)=>el.classList.toggle("is-cursor",i===cursor));
    const cur = $(".ac-item.is-cursor",list); if(cur) cur.scrollIntoView({block:"nearest"});
  }
  list.addEventListener("mousedown", e=>{
    const it = e.target.closest(".ac-item"); if(!it) return;
    e.preventDefault(); choose(Number(it.dataset.i));
  });
  document.addEventListener("click", e=>{ if(!wrap.contains(e.target)) close(); });
}

/* ---- 技スロット ---- */
function buildMoveSlots(card, side){
  const host = $('[data-bind="moveSlots"]', card);
  if(!host || !side.moves) return;                 // 防御側には技スロットが無い
  host.innerHTML = "";
  for(let i=0;i<4;i++){
    const slot = document.createElement("div");
    slot.className = "move-slot";
    const input = document.createElement("input");
    input.className = "ac-input";
    input.placeholder = `攻撃技${i+1}`;
    input.value = side.moves[i] || "";
    const meta = document.createElement("div");
    meta.className = "move-meta";
    slot.appendChild(input);
    slot.appendChild(meta);
    host.appendChild(slot);

    const refreshMeta = ()=>{
      const mv = MOVES[input.value];
      meta.innerHTML = mv
        ? `<span class="mm-cat ${mv.category==="物理"?"phys":"spec"}">${mv.category==="物理"?"物":"特"}</span>${mv.power}`
        : "";
    };
    attachAutocomplete(input, ()=>POKEMON[side.species].moves, (val)=>{
      side.moves[i] = val; refreshMeta(); update();
    });
    input.addEventListener("input", ()=>{ side.moves[i] = MOVES[input.value]?input.value:""; refreshMeta(); update(); });
    input.addEventListener("blur", ()=>{ if(!MOVES[input.value]){ input.value=""; side.moves[i]=""; refreshMeta(); update(); } });
    refreshMeta();
  }
}

/* ---- ステータスエディタ（1ステータス分） ---- */
function buildStatRow(side, statKey){
  const row = document.createElement("div");
  row.className = "stat-row";
  const c = side.cfg[statKey];
  row.innerHTML = `
    <div class="stat-row__top">
      <span class="stat-row__label">${STAT_LABEL[statKey]}</span>
      <span class="stat-row__value">
        <input type="number" class="num-input js-real" inputmode="numeric">
        <span class="vlabel">実数値</span>
      </span>
      <span class="rank-stepper" style="margin-left:auto;">
        <button type="button" class="js-rank-dn">−</button>
        <output class="js-rank">±0</output>
        <button type="button" class="js-rank-up">＋</button>
        <span class="vlabel">ランク</span>
      </span>
    </div>
    <div class="stat-row__detail">
      <span class="mini">努力<input type="range" class="ev-range js-ev-range" min="0" max="252" step="4">
        <input type="number" class="js-ev" min="0" max="252" step="4"></span>
      <span class="mini">個体<input type="number" class="js-iv" min="0" max="31"></span>
      <span class="mini">性格
        <span class="nat-btns">
          <button type="button" data-nat="0.9" title="↓0.9">▽</button>
          <button type="button" data-nat="1.0" title="±1.0">−</button>
          <button type="button" data-nat="1.1" title="↑1.1">△</button>
        </span>
      </span>
    </div>`;

  const real = $(".js-real",row);
  const evR  = $(".js-ev-range",row);
  const evN  = $(".js-ev",row);
  const ivN  = $(".js-iv",row);
  const rankO= $(".js-rank",row);
  const base = ()=>resolveSide(side).base;

  function refreshReal(){
    if(c.ov===null) real.value = actualStat(base(), statKey, side.cfg);
  }
  function syncNat(){ $$(".nat-btns button",row).forEach(b=>b.classList.toggle("is-active",Number(b.dataset.nat)===c.nat)); }
  function syncRank(){ rankO.textContent = (side.ranks[statKey]>0?"+":side.ranks[statKey]<0?"":"±")+side.ranks[statKey]; }

  evR.value=c.ev; evN.value=c.ev; ivN.value=c.iv; syncNat(); syncRank(); refreshReal();
  if(statKey==="H"){ $$(".nat-btns",row).forEach(e=>e.parentElement.style.visibility="hidden"); }

  const setEV = v=>{ v=Math.max(0,Math.min(252,Math.round(v/4)*4||0)); c.ev=v; c.ov=null; evR.value=v; evN.value=v; refreshReal(); update(); };
  evR.addEventListener("input",()=>setEV(Number(evR.value)));
  evN.addEventListener("input",()=>setEV(Number(evN.value)));
  ivN.addEventListener("input",()=>{ let v=Math.max(0,Math.min(31,Number(ivN.value)||0)); c.iv=v; c.ov=null; refreshReal(); update(); });
  $$(".nat-btns button",row).forEach(b=>b.addEventListener("click",()=>{ c.nat=Number(b.dataset.nat); c.ov=null; syncNat(); refreshReal(); update(); }));
  real.addEventListener("input",()=>{ const v=Number(real.value); c.ov=Number.isNaN(v)||real.value===""?null:v; if(c.ov===null) refreshReal(); update(); });
  $(".js-rank-up",row).addEventListener("click",()=>{ side.ranks[statKey]=Math.min(6,side.ranks[statKey]+1); syncRank(); update(); });
  $(".js-rank-dn",row).addEventListener("click",()=>{ side.ranks[statKey]=Math.max(-6,side.ranks[statKey]-1); syncRank(); update(); });

  row._refreshReal = refreshReal;
  return row;
}

function buildStatEditors(card, side, keys){
  const host = $('[data-bind="statEditors"]', card);
  host.innerHTML = "";
  host._rows = {};
  keys.forEach(k=>{ const row=buildStatRow(side,k); host.appendChild(row); host._rows[k]=row; });
}

/* ---- HPエディタ（防御側） ---- */
function buildHPEditor(card, side){
  const host = $('[data-bind="hpEditor"]', card);
  const c = side.cfg.H;
  host.innerHTML = `
    <div class="hp-line">
      <span class="mini" style="font-size:12px;">最大HP</span>
      <input type="number" class="num-input js-real" inputmode="numeric">
      <span class="hp-cur">
        <span class="mini" style="font-size:12px;">残り</span>
        <input type="number" class="num-input js-cur-pct" min="0" max="100"><span class="vlabel">%</span>
      </span>
    </div>
    <div class="hp-detail">
      <span class="mini">努力<input type="range" class="ev-range js-ev-range" min="0" max="252" step="4">
        <input type="number" class="js-ev" min="0" max="252" step="4"></span>
      <span class="mini">個体<input type="number" class="js-iv" min="0" max="31"></span>
    </div>`;
  const real=$(".js-real",host), evR=$(".js-ev-range",host), evN=$(".js-ev",host),
        ivN=$(".js-iv",host), curP=$(".js-cur-pct",host);
  const base = ()=>resolveSide(side).base;
  function refreshReal(){ if(c.ov===null) real.value=actualStat(base(),"H",side.cfg); }
  evR.value=c.ev; evN.value=c.ev; ivN.value=c.iv; curP.value=side.curHPpct; refreshReal();
  const setEV=v=>{ v=Math.max(0,Math.min(252,Math.round(v/4)*4||0)); c.ev=v; c.ov=null; evR.value=v; evN.value=v; refreshReal(); update(); };
  evR.addEventListener("input",()=>setEV(Number(evR.value)));
  evN.addEventListener("input",()=>setEV(Number(evN.value)));
  ivN.addEventListener("input",()=>{ c.iv=Math.max(0,Math.min(31,Number(ivN.value)||0)); c.ov=null; refreshReal(); update(); });
  real.addEventListener("input",()=>{ const v=Number(real.value); c.ov=(Number.isNaN(v)||real.value==="")?null:v; if(c.ov===null) refreshReal(); update(); });
  curP.addEventListener("input",()=>{ side.curHPpct=Math.max(0,Math.min(100,Number(curP.value)||0)); update(); });
  host._refreshReal = refreshReal;
}

/* ---- セグメント（天気・フィールド） ---- */
function buildSegments(){
  const wSeg = $('#weatherGroup .seg');
  const tSeg = $('#terrainGroup .seg');
  wSeg.innerHTML = WEATHERS.map(w=>`<button type="button" data-v="${w}" class="${w===state.weather?"is-active":""}">${w}</button>`).join("");
  tSeg.innerHTML = TERRAINS.map(t=>`<button type="button" data-v="${t}" class="${t===state.terrain?"is-active":""}">${t}</button>`).join("");
  wSeg.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b)return; state.weather=b.dataset.v; paintSeg(wSeg,state.weather); update(); });
  tSeg.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b)return; state.terrain=b.dataset.v; paintSeg(tSeg,state.terrain); update(); });
}
function paintSeg(seg,val){ $$("button",seg).forEach(b=>b.classList.toggle("is-active",b.dataset.v===val)); }

/* ---- チップ（特性・もちもの） ---- */
function buildAbilityChips(card, side){
  const host = $('[data-bind="abilityChips"]', card);
  const r = resolveSide(side);
  host.innerHTML = r.abilityOptions.map(a=>{
    const active = (r.isMega ? a===r.ability : a===side.ability);
    return `<button type="button" class="chip ${active?"is-active":""}" data-v="${a}" ${r.isMega?"disabled":""}>${a}</button>`;
  }).join("");
  if(!r.isMega){
    host.onclick = e=>{ const b=e.target.closest(".chip"); if(!b)return; side.ability=b.dataset.v;
      $$(".chip",host).forEach(x=>x.classList.toggle("is-active",x===b)); update(); };
  } else host.onclick = null;
}
/* 防御側の持ち物リスト（弱点タイプの半減実を自動で差し込む） */
function defenderItemKeys(side){
  const r = resolveSide(side);
  const berries = [];
  for(const t of TYPES){                       // 効果ばつぐん(>1)になるタイプの半減実のみ表示
    let eff = 1; for(const dt of r.types) eff *= typeEff(t, dt);
    if(eff > 1 && RESIST_BERRY[t]) berries.push(RESIST_BERRY[t]);
  }
  berries.push(RESIST_BERRY["ノーマル"]);       // ホズのみ（ノーマルは等倍でも半減）
  return [...DEFENDER_ITEM_FIXED, ...berries, ...DEFENDER_ITEM_TAIL];
}
function buildItemChips(card, side, isAttacker){
  const host = $('[data-bind="itemChips"]', card);
  const keys = isAttacker ? ATTACKER_ITEM_KEYS : defenderItemKeys(side);
  if(!keys.includes(side.item)) side.item = "なし";   // 一覧外の道具は解除
  host.innerHTML = keys.map(it=>
    `<button type="button" class="chip ${it===side.item?"is-active":""}" data-v="${it}">${it}</button>`).join("");
  host.onclick = e=>{ const b=e.target.closest(".chip"); if(!b)return; side.item=b.dataset.v;
    $$(".chip",host).forEach(x=>x.classList.toggle("is-active",x===b)); update(); };
}

/* ---- 種族名・タイプ・種族値の表示更新 ---- */
function refreshHeader(card, side){
  const r = resolveSide(side);
  const nameEl = $('[data-bind="displayName"]', card);     // 初回のみ存在（後で入力欄に差替え）
  if(nameEl) nameEl.textContent = r.name;
  const badge = $('[data-bind="megaBadge"]', card);
  if(badge){ badge.hidden = !r.isMega; badge.textContent = r.isMega ? "メガ" : ""; }
  $('[data-bind="typeChips"]', card).innerHTML = r.types.map(t=>
    `<span class="tchip" style="background:${TYPE_COLOR[t]}">${t}</span>`).join("");
  $('[data-bind="baseStats"]', card).innerHTML =
    ["H","A","B","C","D","S"].map(k=>`<span class="bs"><b>${k}</b><span>${r.base[k]}</span></span>`).join("");
}

/* ---- 状態チェックボックス ---- */
function bindStateToggles(card, side){
  $$('input[data-state]', card).forEach(inp=>{
    const key = inp.dataset.state;
    if(key in side) inp.checked = !!side[key];
    inp.addEventListener("change",()=>{ side[key]=inp.checked; update(); });
  });
}

/* =========================================================================
   結果描画
   ========================================================================= */
function effClass(eff){
  if(eff===0) return ["eff-immune","効果なし"];
  if(eff>1)  return ["eff-super",`効果ばつぐん ×${eff}`];
  if(eff<1)  return ["eff-weak",`いまひとつ ×${eff}`];
  return ["eff-neutral","等倍"];
}

function update(){
  const aCard=$("#attackerCard"), dCard=$("#defenderCard");
  // 攻撃側：メガなら特性チップを差し替え／しんりょくトグルの表示
  buildAbilityChips(aCard, state.attacker);
  buildAbilityChips(dCard, state.defender);
  refreshHeader(aCard, state.attacker);
  refreshHeader(dCard, state.defender);
  // メガ切替で種族値が変わるので実数値表示を更新
  const aRows=$('[data-bind="statEditors"]',aCard)._rows||{};
  Object.values(aRows).forEach(r=>r._refreshReal&&r._refreshReal());
  const dRows=$('[data-bind="statEditors"]',dCard)._rows||{};
  Object.values(dRows).forEach(r=>r._refreshReal&&r._refreshReal());
  const hpHost=$('[data-bind="hpEditor"]',dCard); if(hpHost._refreshReal) hpHost._refreshReal();

  // しんりょくトグル表示
  const og=$('[data-bind="overgrowToggle"]',aCard);
  const aResolved=resolveSide(state.attacker);
  if(aResolved.ability==="しんりょく"){ og.hidden=false; $('input[data-state="overgrowActive"]',og).checked=state.attacker.overgrowActive; }
  else og.hidden=true;

  // 計算
  const att=buildCalcSide(state.attacker);
  const def=buildCalcSide(state.defender);
  const maxHP=def.stats.H;
  const curHP=Math.max(1,Math.round(maxHP*state.defender.curHPpct/100));
  $("#resultMaxHP").textContent = `${maxHP}（残り ${curHP} / ${state.defender.curHPpct}%）`;

  const opts={ weather:state.weather, terrain:state.terrain,
    crit:state.attacker.crit, burn:state.attacker.burn,
    overgrow:(aResolved.ability==="しんりょく" && state.attacker.overgrowActive) };

  // 追加ダメージ（防御側トグル）
  const D=state.defender;
  const attMaxHP=att.stats.H;
  // ステルスロック：いわタイプ相性で削り
  let rockEff=1; for(const dt of def.types) rockEff*=typeEff("いわ",dt);
  const srDmg = D.srOn ? Math.floor(maxHP*rockEff/8) : 0;
  const addlKO = { srDmg, disguise:D.disguiseOn, maxHP };

  // 場の追加ダメージ表示（技に依存しないもの）
  const fieldNotes=[];
  if(D.srOn) fieldNotes.push(`ステルスロック：防御側 −${srDmg}（${(srDmg/maxHP*100).toFixed(1)}%・いわ×${rockEff}）`);
  if(D.disguiseOn) fieldNotes.push(`ばけのかわ：初撃を無効化（解除時 −${Math.floor(maxHP/8)}）`);
  const fieldBox=$("#fieldAddl");
  fieldBox.innerHTML = fieldNotes.length ? fieldNotes.map(t=>`<span>${t}</span>`).join("") : "";
  fieldBox.hidden = fieldNotes.length===0;

  const listHost=$("#resultList");
  const moves=state.attacker.moves.filter(m=>m&&MOVES[m]);
  if(moves.length===0){ listHost.innerHTML=`<div class="res res--empty">攻撃技を入力すると、ここに計算結果が表示されます。</div>`; return; }

  listHost.innerHTML="";
  moves.forEach(name=>{
    const mv={...MOVES[name], name};
    const res=calcDamage(att,def,mv,opts);
    const minD=res.rolls[0], maxD=res.rolls[res.rolls.length-1];
    const minP=(minD/maxHP*100), maxP=(maxD/maxHP*100);
    const [ecls,etext]=effClass(res.eff);
    const ko=koSummary(res.rolls,maxHP,curHP,addlKO);
    const note=mv.note?`<div class="res__note">※${mv.note}</div>`:"";

    // 攻撃側が受ける追加ダメージ（ゴツメ・いのちのたま反動）
    const recoil=[];
    if(D.rockyHelmet && mv.contact && res.eff>0){
      const r=Math.floor(attMaxHP/6);
      recoil.push(`ゴツゴツメット：攻撃側 −${r}（${(r/attMaxHP*100).toFixed(1)}%）`);
    }
    if(D.lifeOrbRecoil && res.eff>0){
      const r=Math.floor(attMaxHP/10);
      recoil.push(`いのちのたま反動：攻撃側 −${r}（${(r/attMaxHP*100).toFixed(1)}%）`);
    }
    const recoilBox = recoil.length ? `<div class="res__addl">${recoil.map(t=>`<span>${t}</span>`).join("")}</div>` : "";

    const div=document.createElement("div");
    div.className="res";
    div.innerHTML=`
      <div class="res__head">
        <span class="tchip" style="background:${TYPE_COLOR[res.mType]}">${res.mType}</span>
        <span class="res__name">${name}</span>
        <span class="mm-cat ${res.category==="物理"?"phys":"spec"}" style="font-size:11px;padding:1px 7px;border-radius:5px;">${res.category}・威力${res.bp}</span>
        <span class="res__eff ${ecls}">${etext}</span>
      </div>
      <div class="res__numbers">
        <span class="res__dmg">${minD} 〜 ${maxD}</span>
        <span class="res__pct">(${minP.toFixed(1)} 〜 ${maxP.toFixed(1)}%)</span>
        <span class="res__ko ${ko.cls}">${ko.text}</span>
      </div>
      <div class="bar"><i style="width:${Math.min(100,maxP)}%"></i></div>
      ${recoilBox}${note}
      <details class="res__detail"><summary>ダメージ内訳（16通り）</summary>
        <div class="rolls">${res.rolls.map(d=>`<span>${d}</span>`).join("")}</div>
      </details>`;
    listHost.appendChild(div);
  });
}

/* =========================================================================
   初期化
   ========================================================================= */
function initSide(card, side, statKeys, withHP, isAttacker){
  refreshHeader(card, side);
  // 種族名入力（ヘッダーの名前部分を入力に差し替え）
  const nameEl=$('[data-bind="displayName"]',card);
  const input=document.createElement("input");
  input.className="ac-input"; input.style.maxWidth="200px"; input.style.fontWeight="800";
  input.value=side.species;
  nameEl.replaceWith(input);
  const badge=document.createElement("span");      // メガシンカ表示
  badge.className="mega-badge"; badge.dataset.bind="megaBadge"; badge.hidden=true;
  input.after(badge);
  attachAutocomplete(input, ()=>Object.keys(POKEMON), (val)=>{
    side.species=val;
    if(side.moves) side.moves=side.moves.map(m=>POKEMON[val].moves.includes(m)?m:""); // 覚えない技を消去
    if(!POKEMON[val].abilities.includes(side.ability)) side.ability=POKEMON[val].abilities[0];
    buildMoveSlots(card, side);
    buildItemChips(card, side, isAttacker);        // 弱点が変われば半減実の表示も更新
    update();
  });
  card._isAttacker=isAttacker;

  buildMoveSlots(card, side);
  buildStatEditors(card, side, statKeys);
  if(withHP) buildHPEditor(card, side);
  buildAbilityChips(card, side);
  buildItemChips(card, side, isAttacker);
  bindStateToggles(card, side);
}

document.addEventListener("DOMContentLoaded",()=>{
  buildSegments();
  initSide($("#attackerCard"), state.attacker, ["A","C"], false, true);
  initSide($("#defenderCard"), state.defender, ["B","D"], true, false);
  update();
});
