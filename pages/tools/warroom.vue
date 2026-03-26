<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">War Room 作战结算工具</view>
        <view class="sub">空战 → 突袭（战略轰炸）→ 陆战/海战。每阶段每方最多30骰，每批最多10骰。</view>
      </view>

      <view class="card">
        <view class="section-title">战斗设置</view>
        <view class="setting-row">
          <text class="setting-label">战斗类型</text>
          <view class="btn-group two">
            <view class="switch-btn" :class="{ active: battleType === 'land' }" @tap="setBattleType('land')">陆战</view>
            <view class="switch-btn" :class="{ active: battleType === 'naval' }" @tap="setBattleType('naval')">海战</view>
          </view>
        </view>
        <view class="setting-row">
          <text class="setting-label">有无优势</text>
          <view class="btn-group three">
            <view class="switch-btn" :class="{ active: advantage === 'none' }" @tap="setAdvantage('none')">无优势</view>
            <view class="switch-btn" :class="{ active: advantage === 'attacker' }" @tap="setAdvantage('attacker')">进攻方优势</view>
            <view class="switch-btn" :class="{ active: advantage === 'defender' }" @tap="setAdvantage('defender')">防守方优势</view>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">兵种姿态</view>
        <view class="table-head">
          <text class="cell name">兵种</text>
          <text class="cell side align-center">进攻方</text>
          <text class="cell side align-center">防守方</text>
        </view>

        <view class="block-title">空战单位</view>
        <view class="row" v-for="row in airRows" :key="row.id">
          <text class="cell name">{{ row.label }}</text>
          <view class="ctrl-wrap">
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'attacker', 1)">+1</view>
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'attacker', -1)">-1</view>
            <view class="count-box">{{ qty(row, 'attacker') }}</view>
          </view>
          <view class="ctrl-wrap">
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'defender', 1)">+1</view>
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'defender', -1)">-1</view>
            <view class="count-box">{{ qty(row, 'defender') }}</view>
          </view>
        </view>

        <view class="divider"></view>
        <view class="block-title">{{ battleType === 'land' ? '陆战单位' : '海战单位' }}</view>
        <view class="row" v-for="row in surfaceRows" :key="row.id">
          <text class="cell name">{{ row.label }}</text>
          <view class="ctrl-wrap">
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'attacker', 1)">+1</view>
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'attacker', -1)">-1</view>
            <view class="count-box">{{ qty(row, 'attacker') }}</view>
          </view>
          <view class="ctrl-wrap">
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'defender', 1)">+1</view>
            <view class="unit-btn" :style="unitStyle(row.color)" @tap="adjust(row, 'defender', -1)">-1</view>
            <view class="count-box">{{ qty(row, 'defender') }}</view>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">结算控制</view>
        <view class="actions">
          <view class="action-btn green" @tap="resetAll">重置</view>
          <view class="action-btn blue" @tap="startCombat">开始结算</view>
        </view>
        <view class="tip">颜色顺序：黄→蓝→绿→红→黑→白。黑白骰需手动分配，白骰仅可分配给“差1次摧毁”的单位。</view>
      </view>

      <view class="card" v-if="pendingAlloc">
        <view class="section-title">手动分配 {{ pendingAlloc.color === 'black' ? '黑骰' : '白骰' }}</view>
        <view class="alloc-tip">
          {{ pendingAlloc.title }}，总数 {{ pendingAlloc.total }}，剩余 {{ remainingAlloc }}
          <text v-if="pendingAlloc.color === 'white'">（白骰不能分给潜水艇）</text>
        </view>
        <view class="alloc-damaged" v-if="batchDamagedHint">
          本批已受损未摧毁：{{ batchDamagedHint }}
        </view>
        <view class="pool-row" v-for="t in pendingAlloc.targets" :key="t.id">
          <text class="pool-name">{{ t.label }}</text>
          <view class="pool-ctrl">
            <view class="mini-btn" @tap="allocAdjust(t.id, 1)">+1</view>
            <view class="mini-btn" @tap="allocAdjust(t.id, -1)">-1</view>
            <view class="mini-box">{{ pendingAlloc.alloc[t.id] || 0 }}</view>
          </view>
        </view>
        <view class="actions">
          <view class="action-btn blue" @tap="confirmAlloc">确认分配并继续</view>
        </view>
      </view>

      <view class="card" v-if="lastSummary">
        <view class="section-title">本次结算摘要</view>
        <view class="line">{{ lastSummary }}</view>
        <view class="line warn" v-if="pendingHintDefender">防守方残余受损：{{ pendingHintDefender }}</view>
        <view class="line warn" v-if="pendingHintAttacker">进攻方残余受损：{{ pendingHintAttacker }}</view>
      </view>

      <view class="card">
        <view class="section-title">日志</view>
        <scroll-view scroll-y class="log-scroll">
          <view v-if="!logs.length" class="empty">暂无日志</view>
          <view v-for="(item, idx) in logs" :key="`log-${idx}`" class="log-line">
            <template v-if="item.type === 'dice'">
              <text>{{ item.prefix }}</text>
              <text v-for="(f, j) in item.faces" :key="`f-${idx}-${j}`" :class="['dice-char', faceClass(f)]">{{ FACE_TEXT[f] }}</text>
            </template>
            <template v-else>
              {{ item.text }}
            </template>
          </view>
          <view class="log-safe-space"></view>
        </scroll-view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const ORDER_COLORS = ['yellow', 'blue', 'green', 'red', 'black', 'white']
const DIE_FACES = ['yellow', 'yellow', 'yellow', 'yellow', 'blue', 'blue', 'blue', 'green', 'green', 'red', 'black', 'white']
const FACE_TEXT = { yellow: '黄', blue: '蓝', green: '绿', red: '红', black: '黑', white: '白' }

const battleType = ref('land')
const advantage = ref('none')
const logs = ref([])
const lastSummary = ref('')
const pendingHintAttacker = ref('')
const pendingHintDefender = ref('')

const pendingAlloc = ref(null)
const pendingCtx = ref(null)

const state = reactive({ attacker: {}, defender: {} })
const escapeFlags = reactive({ attacker: {}, defender: {} })

function unitRow(id, label, group, color, hp, airDice, surfaceDice, strategicDice = 0) {
  return { id, label, group, color, hp, airDice, surfaceDice, strategicDice }
}

// 陆战：战略姿态轰战机的4骰归入“突袭阶段”，不计入陆战阶段
const landRows = [
  unitRow('land-bomber-strategic', '战略姿态 轰战机', 'air', 'red', 2, 1, 0, 4),
  unitRow('land-bomber-ground', '对陆姿态 轰战机', 'air', 'red', 2, 1, 4, 0),
  unitRow('land-fighter-air', '对空姿态 战斗机', 'air', 'green', 2, 3, 0, 0),
  unitRow('land-fighter-ground', '对陆姿态 战斗机', 'air', 'green', 2, 0, 3, 0),

  unitRow('land-armor-defense', '防御姿态 装甲', 'surface', 'green', 3, 1, 2, 0),
  unitRow('land-armor-attack', '进攻姿态 装甲', 'surface', 'green', 2, 0, 4, 0),
  unitRow('land-artillery-defense', '防御姿态 炮兵', 'surface', 'blue', 2, 2, 1, 0),
  unitRow('land-artillery-attack', '进攻姿态 炮兵', 'surface', 'blue', 2, 0, 2, 0),
  unitRow('land-infantry-defense', '防御姿态 步兵', 'surface', 'yellow', 2, 0, 1, 0),
  unitRow('land-infantry-attack', '进攻姿态 步兵', 'surface', 'yellow', 1, 0, 2, 0)
]

const navalRows = [
  unitRow('naval-bomber', '轰战机', 'air', 'red', 2, 1, 3, 0),
  unitRow('naval-fighter-air', '对空姿态 战斗机', 'air', 'green', 2, 3, 0, 0),
  unitRow('naval-fighter-sea', '对海姿态 战斗机', 'air', 'green', 2, 0, 3, 0),

  unitRow('naval-battleship-defense', '防空姿态 战列舰', 'surface', 'red', 3, 2, 3, 0),
  unitRow('naval-battleship-attack', '进攻姿态 战列舰', 'surface', 'red', 3, 1, 4, 0),
  unitRow('naval-carrier-defense', '防空姿态 航母', 'surface', 'green', 3, 2, 1, 0),
  unitRow('naval-carrier-attack', '进攻姿态 航母', 'surface', 'green', 3, 1, 2, 0),
  unitRow('naval-destroyer-defense', '护卫姿态 护卫舰', 'surface', 'blue', 2, 2, 2, 0),
  unitRow('naval-destroyer-attack', '进攻姿态 护卫舰', 'surface', 'blue', 2, 1, 3, 0),
  unitRow('naval-submarine', '潜水艇', 'surface', 'yellow', 2, 0, 2, 0)
]

const rows = computed(() => (battleType.value === 'land' ? landRows : navalRows))
const airRows = computed(() => rows.value.filter((r) => r.group === 'air'))
const surfaceRows = computed(() => rows.value.filter((r) => r.group === 'surface'))

const remainingAlloc = computed(() => {
  if (!pendingAlloc.value) return 0
  const used = Object.values(pendingAlloc.value.alloc).reduce((s, n) => s + Number(n || 0), 0)
  return Math.max(0, pendingAlloc.value.total - used)
})

const batchDamagedHint = computed(() => {
  if (!pendingAlloc.value) return ''
  const targetSide = pendingAlloc.value.batch.side === 'attacker' ? 'defender' : 'attacker'
  const lane = targetLaneOfPhase(pendingAlloc.value.batch.phase)
  const arr = rows.value
    .filter((r) => r.group === lane)
    .map((r) => {
      const s = ensureState(targetSide, r)
      if (s.count <= 0 || s.damage <= 0) return null
      return `${r.label}(受损${s.damage}/${r.hp})`
    })
    .filter(Boolean)
  return arr.join('，')
})

function nowText() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getHours()}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function log(msg) {
  logs.value.unshift({ type: 'plain', text: `[${nowText()}] ${msg}` })
  if (logs.value.length > 1000) logs.value = logs.value.slice(0, 1000)
}

function logDiceBatch(batch) {
  const sideText = batch.side === 'attacker' ? '进攻方' : '防守方'
  const phaseText =
    batch.phase === 'air' ? '空战' :
      batch.phase === 'strategic' ? '突袭' :
        (battleType.value === 'land' ? '陆战' : '海战')
  logs.value.unshift({
    type: 'dice',
    prefix: `[${nowText()}] ${sideText} ${phaseText} 第${batch.batchNo}批，骰数${batch.faces.length}，骰子结果：`,
    faces: batch.faces.slice()
  })
  if (logs.value.length > 1000) logs.value = logs.value.slice(0, 1000)
}

function faceClass(face) {
  if (face === 'yellow') return 'face-yellow'
  if (face === 'blue') return 'face-blue'
  if (face === 'green') return 'face-green'
  if (face === 'red') return 'face-red'
  return 'face-black'
}

function ensureState(side, row) {
  if (!state[side][row.id]) state[side][row.id] = { count: 0, damage: 0 }
  if (typeof escapeFlags[side][row.id] !== 'boolean') escapeFlags[side][row.id] = false
  return state[side][row.id]
}

function qty(row, side) {
  return ensureState(side, row).count
}

function adjust(row, side, delta) {
  const s = ensureState(side, row)
  s.count = Math.max(0, Math.min(60, s.count + delta))
  if (s.count === 0) s.damage = 0
}

function setBattleType(v) {
  if (battleType.value === v) return
  battleType.value = v
  pendingAlloc.value = null
  pendingCtx.value = null
  lastSummary.value = ''
  pendingHintAttacker.value = ''
  pendingHintDefender.value = ''
  log(`切换战斗类型：${v === 'land' ? '陆战' : '海战'}`)
}

function setAdvantage(v) {
  advantage.value = v
}

function unitStyle(color) {
  const m = {
    red: { bg: '#ef4444', fg: '#ffffff' },
    green: { bg: '#16a34a', fg: '#ffffff' },
    blue: { bg: '#2563eb', fg: '#ffffff' },
    yellow: { bg: '#eab308', fg: '#ffffff' }
  }
  const c = m[color] || { bg: '#374151', fg: '#ffffff' }
  return `background:${c.bg};color:${c.fg};`
}

function sideHasAdv(side) {
  return (advantage.value === 'attacker' && side === 'attacker') || (advantage.value === 'defender' && side === 'defender')
}

function rollFace() {
  return DIE_FACES[Math.floor(Math.random() * DIE_FACES.length)]
}

function colorLaneTargetColor(phase, color) {
  if (phase === 'air') {
    if (color === 'red') return 'red'
    if (color === 'green') return 'green'
    return null
  }
  // strategic 与 land surface 同映射
  if (phase === 'strategic' || (phase === 'surface' && battleType.value === 'land')) {
    if (color === 'yellow') return 'yellow'
    if (color === 'blue') return 'blue'
    if (color === 'green') return 'green'
    return null
  }
  // naval surface
  if (color === 'yellow') return 'yellow'
  if (color === 'blue') return 'blue'
  if (color === 'green') return 'green'
  if (color === 'red') return 'red'
  return null
}

function targetLaneOfPhase(phase) {
  return phase === 'air' ? 'air' : 'surface'
}

function rowsBy(side, lane) {
  return rows.value.filter((r) => r.group === lane && qty(r, side) > 0)
}

function isSubmarineRow(row) {
  return row.id.includes('submarine')
}

function sortAirPriority(rowsList) {
  // 对陆/对海姿态优先吃空战命中
  return rowsList.slice().sort((a, b) => {
    const ap = (a.id.includes('ground') || a.id.includes('sea')) ? 0 : 1
    const bp = (b.id.includes('ground') || b.id.includes('sea')) ? 0 : 1
    if (ap !== bp) return ap - bp
    return 0
  })
}

function maybeRedirectToDestroyer(targetSide, phase, color, targetRow) {
  if (!(battleType.value === 'naval' && phase === 'surface')) return targetRow
  if (!(color === 'green' || color === 'red')) return targetRow
  if (!(targetRow.id.includes('carrier') || targetRow.id.includes('battleship'))) return targetRow
  const tState = ensureState(targetSide, targetRow)
  const willDestroy = (targetRow.hp - tState.damage) <= 1
  if (!willDestroy) return targetRow
  const escort = rows.value.find((r) => r.id === 'naval-destroyer-defense')
  if (!escort) return targetRow
  const eState = ensureState(targetSide, escort)
  if (eState.count <= 0) return targetRow
  return escort
}

function applyHit(targetSide, row) {
  const s = ensureState(targetSide, row)
  if (s.count <= 0) return false
  s.damage += 1
  if (s.damage >= row.hp) {
    s.count -= 1
    s.damage = 0
    if (s.count <= 0) s.count = 0
  }
  return true
}

function maybeMarkSubEscape(side, touchedSubIds) {
  if (battleType.value !== 'naval') return
  touchedSubIds.forEach((rowId) => {
    const row = rows.value.find((r) => r.id === rowId)
    if (!row) return
    const s = ensureState(side, row)
    if (s.count > 0 && s.damage > 0) {
      escapeFlags[side][rowId] = true
      log(`${side === 'attacker' ? '进攻方' : '防守方'}潜水艇受损后逃离后续批次命中`)
    }
  })
}

function getCandidates(targetSide, phase, color) {
  const lane = targetLaneOfPhase(phase)
  const tc = colorLaneTargetColor(phase, color)
  if (!tc) return []
  let list = rowsBy(targetSide, lane).filter((r) => r.color === tc)
  if (battleType.value === 'naval' && lane === 'surface' && tc === 'yellow') {
    list = list.filter((r) => !escapeFlags[targetSide][r.id])
  }
  list = list.slice().sort((a, b) => {
    const da = ensureState(targetSide, a).damage > 0 ? 0 : 1
    const db = ensureState(targetSide, b).damage > 0 ? 0 : 1
    if (da !== db) return da - db
    if (lane === 'air') {
      const ap = (a.id.includes('ground') || a.id.includes('sea')) ? 0 : 1
      const bp = (b.id.includes('ground') || b.id.includes('sea')) ? 0 : 1
      if (ap !== bp) return ap - bp
    }
    return 0
  })
  return list
}

function buildBatchesForSide(side, phase) {
  let total = 0
  rows.value.forEach((r) => {
    const c = qty(r, side)
    if (c <= 0) return
    let dicePer = 0
    if (phase === 'air') dicePer = r.airDice
    else if (phase === 'surface') dicePer = r.surfaceDice
    else if (phase === 'strategic') dicePer = r.strategicDice || 0
    total += c * dicePer
  })
  total = Math.min(30, total)
  const faces = []
  for (let i = 0; i < total; i += 1) faces.push(rollFace())
  const out = []
  for (let i = 0; i < faces.length; i += 10) out.push(faces.slice(i, i + 10))
  return out
}

function startCombat() {
  if (pendingAlloc.value) {
    uni.showToast({ title: '请先完成当前分配', icon: 'none' })
    return
  }
  lastSummary.value = ''
  pendingHintAttacker.value = ''
  pendingHintDefender.value = ''
  Object.keys(escapeFlags.attacker).forEach((k) => { escapeFlags.attacker[k] = false })
  Object.keys(escapeFlags.defender).forEach((k) => { escapeFlags.defender[k] = false })

  const phases = ['air']
  if (battleType.value === 'land') phases.push('strategic')
  phases.push('surface')

  pendingCtx.value = {
    phases,
    phaseIdx: 0,
    side: 'attacker',
    batchesBySide: { attacker: [], defender: [] },
    batchIdx: 0,
    hits: { attacker: { air: 0, strategic: 0, surface: 0 }, defender: { air: 0, strategic: 0, surface: 0 } },
    losses: { attacker: {}, defender: {} },
    touchedSubs: []
  }
  preparePhaseBatches()
  processNextBatch()
}

function phaseText(phase) {
  if (phase === 'air') return '空战'
  if (phase === 'strategic') return '突袭'
  return battleType.value === 'land' ? '陆战' : '海战'
}

function preparePhaseBatches() {
  const ctx = pendingCtx.value
  if (!ctx) return
  const phase = ctx.phases[ctx.phaseIdx]
  ctx.batchesBySide.attacker = buildBatchesForSide('attacker', phase).map((faces, i) => ({ side: 'attacker', phase, batchNo: i + 1, faces }))
  ctx.batchesBySide.defender = buildBatchesForSide('defender', phase).map((faces, i) => ({ side: 'defender', phase, batchNo: i + 1, faces }))
  ctx.side = 'attacker'
  ctx.batchIdx = 0
}

function addLoss(targetSide, row) {
  const label = row.label
  pendingCtx.value.losses[targetSide][label] = Number(pendingCtx.value.losses[targetSide][label] || 0) + 1
}

function resolveAutoColor(batch, color) {
  const targetSide = batch.side === 'attacker' ? 'defender' : 'attacker'
  const n = batch.faces.filter((f) => f === color).length
  if (!n) return { wild: 0 }
  if (color === 'black' || color === 'white') {
    return { wild: sideHasAdv(batch.side) ? n : 0 }
  }
  const touchedSubs = []
  for (let i = 0; i < n; i += 1) {
    const cands = getCandidates(targetSide, batch.phase, color)
    if (!cands.length) continue
    let t = cands[0]
    t = maybeRedirectToDestroyer(targetSide, batch.phase, color, t)
    const before = ensureState(targetSide, t).count
    applyHit(targetSide, t)
    pendingCtx.value.hits[batch.side][batch.phase] += 1
    if (isSubmarineRow(t)) touchedSubs.push(t.id)
    const after = ensureState(targetSide, t).count
    if (after < before) addLoss(targetSide, t)
  }
  maybeMarkSubEscape(targetSide, touchedSubs)
  return { wild: 0 }
}

function createAllocPool(batch, color, total) {
  if (total <= 0) return null
  const targetSide = batch.side === 'attacker' ? 'defender' : 'attacker'
  const lane = targetLaneOfPhase(batch.phase)
  let targets = rowsBy(targetSide, lane)
  if (color === 'white') {
    targets = targets.filter((r) => {
      if (isSubmarineRow(r)) return false
      const s = ensureState(targetSide, r)
      return (r.hp - s.damage) === 1
    })
  }
  if (!targets.length) return null
  const alloc = {}
  targets.forEach((t) => { alloc[t.id] = 0 })
  return {
    color,
    total,
    title: `${batch.side === 'attacker' ? '进攻方' : '防守方'} ${phaseText(batch.phase)} 第${batch.batchNo}批`,
    batch,
    targets,
    alloc
  }
}

function allocAdjust(rowId, delta) {
  if (!pendingAlloc.value) return
  const cur = Number(pendingAlloc.value.alloc[rowId] || 0)
  if (delta > 0) {
    if (remainingAlloc.value <= 0) return
    if (pendingAlloc.value.color === 'white' && cur >= 1) return
    pendingAlloc.value.alloc[rowId] = cur + 1
    return
  }
  pendingAlloc.value.alloc[rowId] = Math.max(0, cur - 1)
}

function confirmAlloc() {
  if (!pendingAlloc.value || !pendingCtx.value) return
  if (pendingAlloc.value.color === 'black' && remainingAlloc.value !== 0) {
    uni.showToast({ title: '请分配完全部命中', icon: 'none' })
    return
  }
  if (pendingAlloc.value.color === 'white' && remainingAlloc.value > 0) {
    log(`白骰有${remainingAlloc.value}枚未分配，按无效处理`)
  }
  const pool = pendingAlloc.value
  const targetSide = pool.batch.side === 'attacker' ? 'defender' : 'attacker'
  Object.entries(pool.alloc).forEach(([rowId, n]) => {
    const row = rows.value.find((r) => r.id === rowId)
    if (!row) return
    for (let i = 0; i < Number(n || 0); i += 1) {
      const before = ensureState(targetSide, row).count
      applyHit(targetSide, row)
      pendingCtx.value.hits[pool.batch.side][pool.batch.phase] += 1
      const after = ensureState(targetSide, row).count
      if (after < before) addLoss(targetSide, row)
    }
  })
  log(`${pool.color === 'black' ? '黑骰' : '白骰'}分配完成：${pool.title}`)

  if (pool.color === 'black') {
    const whiteInfo = resolveAutoColor(pool.batch, 'white')
    const whitePool = createAllocPool(pool.batch, 'white', whiteInfo.wild)
    pendingAlloc.value = whitePool
    if (whitePool) return
    advanceBatch()
    processNextBatch()
    return
  }

  pendingAlloc.value = null
  advanceBatch()
  processNextBatch()
}

function advanceBatch() {
  const ctx = pendingCtx.value
  ctx.batchIdx += 1
}

function switchSideOrPhaseIfNeeded() {
  const ctx = pendingCtx.value
  if (!ctx) return false
  const currentSideBatches = ctx.batchesBySide[ctx.side]
  if (ctx.batchIdx < currentSideBatches.length) return true

  if (ctx.side === 'attacker') {
    ctx.side = 'defender'
    ctx.batchIdx = 0
    return true
  }

  ctx.phaseIdx += 1
  if (ctx.phaseIdx >= ctx.phases.length) return false
  preparePhaseBatches()
  return true
}

function processNextBatch() {
  if (!pendingCtx.value) return
  if (pendingAlloc.value) return

  while (true) {
    if (!switchSideOrPhaseIfNeeded()) {
      finishCombat()
      return
    }
    const ctx = pendingCtx.value
    const list = ctx.batchesBySide[ctx.side]
    if (ctx.batchIdx >= list.length) continue
    const batch = list[ctx.batchIdx]

    logDiceBatch(batch)
    ORDER_COLORS.forEach((c) => {
      if (c === 'black' || c === 'white') return
      resolveAutoColor(batch, c)
    })
    const black = resolveAutoColor(batch, 'black')
    const blackPool = createAllocPool(batch, 'black', black.wild)
    if (blackPool) {
      pendingAlloc.value = blackPool
      return
    }
    const white = resolveAutoColor(batch, 'white')
    const whitePool = createAllocPool(batch, 'white', white.wild)
    if (whitePool) {
      pendingAlloc.value = whitePool
      return
    }
    advanceBatch()
  }
}

function lossText(obj) {
  const ent = Object.entries(obj)
  if (!ent.length) return '无'
  return ent.map(([k, n]) => `${k}×${n}`).join('，')
}

function sidePendingText(side) {
  const arr = rows.value
    .map((r) => {
      const s = ensureState(side, r)
      if (s.count <= 0 || s.damage <= 0) return null
      return `${r.label}还差${r.hp - s.damage}次`
    })
    .filter(Boolean)
  return arr.join('，')
}

function finishCombat() {
  const h = pendingCtx.value.hits
  const l = pendingCtx.value.losses
  const surfaceName = battleType.value === 'land' ? '陆战' : '海战'
  lastSummary.value = `进攻方命中：空战${h.attacker.air}，突袭${h.attacker.strategic}，${surfaceName}${h.attacker.surface}；防守方命中：空战${h.defender.air}，突袭${h.defender.strategic}，${surfaceName}${h.defender.surface}`
  pendingHintDefender.value = sidePendingText('defender')
  pendingHintAttacker.value = sidePendingText('attacker')
  log(`防守方损失：${lossText(l.defender)}`)
  log(`进攻方损失：${lossText(l.attacker)}`)
  if (pendingHintDefender.value) log(`防守方残余受损：${pendingHintDefender.value}`)
  if (pendingHintAttacker.value) log(`进攻方残余受损：${pendingHintAttacker.value}`)
  pendingCtx.value = null
  pendingAlloc.value = null
}

function resetAll() {
  Object.keys(state.attacker).forEach((k) => { state.attacker[k] = { count: 0, damage: 0 } })
  Object.keys(state.defender).forEach((k) => { state.defender[k] = { count: 0, damage: 0 } })
  Object.keys(escapeFlags.attacker).forEach((k) => { escapeFlags.attacker[k] = false })
  Object.keys(escapeFlags.defender).forEach((k) => { escapeFlags.defender[k] = false })
  pendingAlloc.value = null
  pendingCtx.value = null
  lastSummary.value = ''
  pendingHintAttacker.value = ''
  pendingHintDefender.value = ''
  logs.value = []
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.title { font-size: 30rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 8rpx; font-size: 22rpx; color: #6b7280; line-height: 1.5; }
.section-title { font-size: 26rpx; font-weight: 700; color: #111827; margin-bottom: 10rpx; }

.setting-row { margin-top: 10rpx; display: grid; grid-template-columns: 130rpx 1fr; gap: 12rpx; align-items: center; }
.setting-label { font-size: 23rpx; color: #374151; }
.btn-group { display: grid; gap: 8rpx; }
.btn-group.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.btn-group.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.switch-btn {
  height: 56rpx;
  border: 2rpx solid #111827;
  border-radius: 8rpx;
  background: #fff;
  color: #111827;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.switch-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }

.table-head { display: grid; grid-template-columns: 1.25fr 1.6fr 1.6fr; gap: 8rpx; margin-bottom: 8rpx; }
.cell { font-size: 22rpx; color: #6b7280; }
.cell.name { color: #111827; }
.align-center { text-align: center; }
.block-title { margin-top: 10rpx; font-size: 22rpx; color: #111827; font-weight: 700; }
.divider { height: 2rpx; background: #d1d5db; margin: 14rpx 0 10rpx; }
.row { display: grid; grid-template-columns: 1.25fr 1.6fr 1.6fr; gap: 8rpx; align-items: center; margin-top: 8rpx; }
.ctrl-wrap { display: grid; grid-template-columns: 1fr 1fr 56rpx; gap: 6rpx; align-items: center; }
.unit-btn {
  height: 52rpx;
  border: 2rpx solid #111827;
  border-radius: 8rpx;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.count-box {
  height: 52rpx;
  border: 2rpx solid #111827;
  border-radius: 8rpx;
  background: #fff;
  color: #111827;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10rpx; }
.action-btn {
  height: 60rpx;
  border-radius: 10rpx;
  color: #fff;
  font-size: 23rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-btn.green { background: #16a34a; }
.action-btn.blue { background: #2563eb; }
.tip { margin-top: 8rpx; font-size: 21rpx; color: #6b7280; line-height: 1.45; }

.alloc-tip { font-size: 21rpx; color: #6b7280; margin-bottom: 8rpx; line-height: 1.5; }
.alloc-damaged {
  margin-bottom: 8rpx;
  font-size: 21rpx;
  color: #b45309;
  line-height: 1.45;
}
.pool-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.pool-name { font-size: 22rpx; color: #374151; max-width: 58%; }
.pool-ctrl { display: grid; grid-template-columns: 56rpx 56rpx 56rpx; gap: 6rpx; align-items: center; }
.mini-btn, .mini-box {
  height: 42rpx;
  border: 2rpx solid #111827;
  border-radius: 8rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-btn { background: #2563eb; border-color: #2563eb; color: #fff; }
.mini-box { background: #fff; color: #111827; }

.line { margin-top: 8rpx; font-size: 22rpx; color: #374151; line-height: 1.45; }
.line.warn { color: #b45309; }

.log-scroll { max-height: 420rpx; padding-bottom: 120rpx; box-sizing: border-box; }
.log-line { margin-top: 6rpx; font-size: 22rpx; color: #374151; line-height: 1.45; }
.dice-char { margin-left: 2rpx; font-weight: 700; }
.face-yellow { color: #ca8a04; }
.face-blue { color: #2563eb; }
.face-green { color: #16a34a; }
.face-red { color: #dc2626; }
.face-black { color: #111827; }
.log-safe-space { height: 60rpx; }
.empty { color: #9ca3af; font-size: 22rpx; }
</style>
