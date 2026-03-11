// ── All-In-One Calculator ──────────────────────────────────────────────────

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  current: '0',
  previous: '',
  operator: null,
  waitingForOperand: false,
  memory: 0,
  mode: 'basic',
  base: 'DEC',
  angleUnit: 'DEG',
  statsData: [],
  history: [],
  financeType: 'loan',
};

// ── DOM Refs ───────────────────────────────────────────────────────────────
const currentEl    = document.getElementById('current');
const previousEl   = document.getElementById('previous');
const buttonsEl    = document.getElementById('buttons');
const modeSelectEl = document.getElementById('modeSelect');

// ── Inject extra UI ────────────────────────────────────────────────────────
const calcEl = document.querySelector('.calculator');

// Mode tabs
const modeSwitch = document.querySelector('.mode-switch');
modeSwitch.innerHTML = `
  <div class="mode-tabs" id="modeTabs">
    <div class="mode-tab active" data-mode="basic">Basic</div>
    <div class="mode-tab" data-mode="scientific">Sci</div>
    <div class="mode-tab" data-mode="programmer">Prog</div>
    <div class="mode-tab" data-mode="finance">Fin</div>
    <div class="mode-tab" data-mode="stats">Stats</div>
  </div>`;

// Base display (programmer)
const baseDisplayEl = document.createElement('div');
baseDisplayEl.className = 'base-display';
baseDisplayEl.innerHTML = `
  <div class="base-item"><span>HEX</span><span id="bd-hex">0</span></div>
  <div class="base-item"><span>DEC</span><span id="bd-dec">0</span></div>
  <div class="base-item"><span>OCT</span><span id="bd-oct">0</span></div>
  <div class="base-item"><span>BIN</span><span id="bd-bin">0</span></div>`;

// Base selector
const baseSelectorEl = document.createElement('div');
baseSelectorEl.className = 'base-selector';
baseSelectorEl.innerHTML = `
  <div class="base-btn active" data-base="DEC">DEC</div>
  <div class="base-btn" data-base="HEX">HEX</div>
  <div class="base-btn" data-base="OCT">OCT</div>
  <div class="base-btn" data-base="BIN">BIN</div>`;

// Finance form
const financeFormEl = document.createElement('div');
financeFormEl.className = 'finance-form';
financeFormEl.innerHTML = `
  <div class="fin-row">
    <label>Type</label>
    <select id="finType">
      <option value="loan">Loan / EMI</option>
      <option value="compound">Compound Int.</option>
      <option value="tip">Tip Calculator</option>
      <option value="discount">Discount</option>
    </select>
  </div>
  <div id="finFields"></div>`;

const financeResultEl = document.createElement('div');
financeResultEl.className = 'finance-result';

// Stats input
const statsInputEl = document.createElement('div');
statsInputEl.className = 'stats-input';
statsInputEl.innerHTML = `
  <textarea id="statsData" placeholder="Enter numbers: 1, 2, 3, 4, 5"></textarea>
  <div class="stats-hint">Comma or space separated values</div>`;

const statsDisplayEl = document.createElement('div');
statsDisplayEl.className = 'stats-display';

// Add display label
document.querySelector('.display').insertAdjacentHTML('afterbegin', '<div class="display-label" id="dispLabel">DISPLAY</div>');

// Insert extras after display
const displayEl = document.querySelector('.display');
displayEl.after(baseDisplayEl, baseSelectorEl, financeFormEl, financeResultEl, statsInputEl, statsDisplayEl);

// Notification
const notifEl = document.createElement('div');
notifEl.className = 'notif';
document.body.appendChild(notifEl);

// ── Notifications ──────────────────────────────────────────────────────────
let notifTimer;
function notify(msg) {
  notifEl.textContent = msg;
  notifEl.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => notifEl.classList.remove('show'), 1800);
}

// ── Ripple Effect ──────────────────────────────────────────────────────────
function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.left = (e.clientX - rect.left) + 'px';
  r.style.top  = (e.clientY - rect.top) + 'px';
  btn.appendChild(r);
  setTimeout(() => r.remove(), 500);
}

// ── Display ────────────────────────────────────────────────────────────────
function updateDisplay() {
  const len = state.current.length;
  currentEl.className = len > 14 ? 'very-long' : len > 9 ? 'long' : '';
  currentEl.textContent = state.current;
  previousEl.textContent = state.previous;

  if (state.mode === 'programmer') updateBaseDisplay();
  if (state.mode === 'stats') updateStatsDisplay();
}

function updateBaseDisplay() {
  const n = parseInt(state.current, getBaseRadix(state.base)) || 0;
  document.getElementById('bd-dec').textContent = n.toString(10);
  document.getElementById('bd-hex').textContent = n.toString(16).toUpperCase();
  document.getElementById('bd-oct').textContent = n.toString(8);
  document.getElementById('bd-bin').textContent = n.toString(2);
}

function getBaseRadix(base) {
  return { DEC: 10, HEX: 16, OCT: 8, BIN: 2 }[base] || 10;
}

function convertToDisplay(n) {
  return Math.floor(n).toString(getBaseRadix(state.base)).toUpperCase();
}

// ── Input Handling ─────────────────────────────────────────────────────────
function inputDigit(d) {
  if (state.waitingForOperand) {
    state.current = d;
    state.waitingForOperand = false;
  } else {
    state.current = state.current === '0' ? d : state.current + d;
  }
  updateDisplay();
}

function inputDecimal() {
  if (state.waitingForOperand) { state.current = '0.'; state.waitingForOperand = false; return; }
  if (!state.current.includes('.')) state.current += '.';
  updateDisplay();
}

function setOperator(op) {
  const val = parseFloat(state.current);
  if (state.operator && !state.waitingForOperand) calculate();

  state.previous = `${state.current} ${op}`;
  state.operator = op;
  state.waitingForOperand = true;
  updateDisplay();
}

function calculate() {
  if (!state.operator || state.waitingForOperand) return;
  const prev = parseFloat(state.previous);
  const curr = parseFloat(state.current);
  let result;
  switch (state.operator) {
    case '+': result = prev + curr; break;
    case '−': result = prev - curr; break;
    case '×': result = prev * curr; break;
    case '÷': result = curr !== 0 ? prev / curr : 'Error'; break;
    case '%': result = (prev * curr) / 100; break;
    case 'xʸ': result = Math.pow(prev, curr); break;
    case 'ʸ√x': result = Math.pow(curr, 1/prev); break;
    case 'EE': result = prev * Math.pow(10, curr); break;
    default: result = curr;
  }
  const expr = state.previous + ' ' + state.current + ' =';
  state.history.push(expr + ' ' + formatResult(result));
  state.previous = '';
  state.current = formatResult(result);
  state.operator = null;
  state.waitingForOperand = true;
  updateDisplay();
}

function formatResult(n) {
  if (typeof n === 'string') return n;
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-9 && n !== 0)) return n.toExponential(6).replace('+', '');
  const s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

function clearAll() {
  state.current = '0';
  state.previous = '';
  state.operator = null;
  state.waitingForOperand = false;
  updateDisplay();
}

function clearEntry() {
  state.current = '0';
  updateDisplay();
}

function backspace() {
  if (state.waitingForOperand) return;
  state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  updateDisplay();
}

function negate() {
  state.current = (parseFloat(state.current) * -1).toString();
  updateDisplay();
}

function percent() {
  state.current = (parseFloat(state.current) / 100).toString();
  updateDisplay();
}

// ── Scientific Functions ───────────────────────────────────────────────────
function applySciFn(fn) {
  let n = parseFloat(state.current);
  const toRad = x => state.angleUnit === 'DEG' ? x * Math.PI / 180 : x;
  const toDeg = x => state.angleUnit === 'DEG' ? x * 180 / Math.PI : x;
  let result;
  switch (fn) {
    case 'sin':   result = Math.sin(toRad(n)); break;
    case 'cos':   result = Math.cos(toRad(n)); break;
    case 'tan':   result = Math.tan(toRad(n)); break;
    case 'asin':  result = toDeg(Math.asin(n)); break;
    case 'acos':  result = toDeg(Math.acos(n)); break;
    case 'atan':  result = toDeg(Math.atan(n)); break;
    case 'sinh':  result = Math.sinh(n); break;
    case 'cosh':  result = Math.cosh(n); break;
    case 'tanh':  result = Math.tanh(n); break;
    case 'log':   result = Math.log10(n); break;
    case 'ln':    result = Math.log(n); break;
    case 'log2':  result = Math.log2(n); break;
    case '10^x':  result = Math.pow(10, n); break;
    case 'e^x':   result = Math.exp(n); break;
    case '2^x':   result = Math.pow(2, n); break;
    case 'sqrt':  result = Math.sqrt(n); break;
    case 'cbrt':  result = Math.cbrt(n); break;
    case 'x^2':   result = n * n; break;
    case 'x^3':   result = n * n * n; break;
    case '1/x':   result = 1 / n; break;
    case 'abs':   result = Math.abs(n); break;
    case 'n!':    result = factorial(n); break;
    case 'π':     state.current = Math.PI.toString(); updateDisplay(); return;
    case 'e':     state.current = Math.E.toString(); updateDisplay(); return;
    case 'rand':  state.current = Math.random().toString(); updateDisplay(); return;
    default: return;
  }
  state.current = formatResult(result);
  state.previous = `${fn}(${n}) =`;
  state.waitingForOperand = true;
  updateDisplay();
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ── Memory ─────────────────────────────────────────────────────────────────
function memOp(op) {
  const n = parseFloat(state.current);
  switch (op) {
    case 'MC': state.memory = 0; notify('Memory cleared'); break;
    case 'MR': state.current = state.memory.toString(); state.waitingForOperand = false; updateDisplay(); break;
    case 'M+': state.memory += n; notify('Added to memory'); break;
    case 'M−': state.memory -= n; notify('Subtracted from memory'); break;
    case 'MS': state.memory = n; notify('Stored in memory'); break;
  }
}

// ── Programmer Mode ────────────────────────────────────────────────────────
function progOp(op) {
  const a = parseInt(state.current, getBaseRadix(state.base)) || 0;
  const b = state.previous ? parseInt(state.previous.split(' ')[0], getBaseRadix(state.base)) || 0 : 0;
  let result;
  switch (op) {
    case 'AND': result = b & a; break;
    case 'OR':  result = b | a; break;
    case 'XOR': result = b ^ a; break;
    case 'NOT': result = ~a; break;
    case 'LSH': result = b << a; break;
    case 'RSH': result = b >> a; break;
    case 'MOD': result = a !== 0 ? b % a : 0; break;
    default: return;
  }
  state.current = Math.abs(result).toString(getBaseRadix(state.base)).toUpperCase();
  state.waitingForOperand = true;
  updateDisplay();
}

function progSetOperator(op) {
  const val = parseInt(state.current, getBaseRadix(state.base));
  state.previous = `${state.current} ${op}`;
  state.operator = op;
  state.waitingForOperand = true;
  updateDisplay();
}

function switchBase(base) {
  // Convert current value to decimal first, then to new base
  const dec = parseInt(state.current, getBaseRadix(state.base)) || 0;
  state.base = base;
  state.current = dec.toString(getBaseRadix(state.base)).toUpperCase();
  document.querySelectorAll('.base-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.base === base);
  });
  renderButtons();
  updateDisplay();
}

// ── Statistics ─────────────────────────────────────────────────────────────
function parseStatsData() {
  const raw = document.getElementById('statsData')?.value || '';
  return raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && raw.trim() !== '');
}

function updateStatsDisplay() {
  const data = parseStatsData();
  if (!data.length) { statsDisplayEl.innerHTML = ''; return; }

  const n = data.length;
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...data].sort((a, b) => a - b);
  const median = n % 2 ? sorted[Math.floor(n/2)] : (sorted[n/2-1] + sorted[n/2]) / 2;
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const min = sorted[0], max = sorted[n-1];

  // Mode
  const freq = {};
  data.forEach(v => freq[v] = (freq[v]||0) + 1);
  const maxFreq = Math.max(...Object.values(freq));
  const modes = Object.keys(freq).filter(k => freq[k] === maxFreq);
  const modeStr = maxFreq === 1 ? 'N/A' : modes.join(', ');

  statsDisplayEl.innerHTML = `
    <div class="stat-item"><strong>n</strong>${n}</div>
    <div class="stat-item"><strong>Σ</strong>${formatResult(sum)}</div>
    <div class="stat-item"><strong>x̄</strong>${formatResult(mean)}</div>
    <div class="stat-item"><strong>Med</strong>${formatResult(median)}</div>
    <div class="stat-item"><strong>σ</strong>${formatResult(stddev)}</div>
    <div class="stat-item"><strong>Min</strong>${formatResult(min)}</div>
    <div class="stat-item"><strong>Max</strong>${formatResult(max)}</div>
    <div class="stat-item"><strong>Mode</strong>${modeStr}</div>`;
  statsDisplayEl.classList.add('visible');
}

function statFn(fn) {
  const data = parseStatsData();
  if (!data.length) { notify('No data entered'); return; }
  const n = data.length;
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  let result;
  switch (fn) {
    case 'n':    result = n; break;
    case 'sum':  result = sum; break;
    case 'mean': result = mean; break;
    case 'σ':    result = Math.sqrt(variance); break;
    case 's':    result = Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)); break;
    case 'var':  result = variance; break;
    case 'min':  result = Math.min(...data); break;
    case 'max':  result = Math.max(...data); break;
    case 'range':result = Math.max(...data) - Math.min(...data); break;
  }
  state.current = formatResult(result);
  state.previous = `stat:${fn} =`;
  state.waitingForOperand = true;
  updateDisplay();
}

// ── Finance ────────────────────────────────────────────────────────────────
const financeFields = {
  loan: `
    <div class="fin-row"><label>Principal</label><input id="fin-p" type="number" value="10000" placeholder="Amount"></div>
    <div class="fin-row"><label>Rate %/yr</label><input id="fin-r" type="number" value="8" placeholder="Annual %"></div>
    <div class="fin-row"><label>Months</label><input id="fin-n" type="number" value="12" placeholder="Months"></div>`,
  compound: `
    <div class="fin-row"><label>Principal</label><input id="fin-p" type="number" value="1000"></div>
    <div class="fin-row"><label>Rate %/yr</label><input id="fin-r" type="number" value="5"></div>
    <div class="fin-row"><label>Years</label><input id="fin-n" type="number" value="10"></div>
    <div class="fin-row"><label>Compound</label><select id="fin-c"><option value="1">Annually</option><option value="2">Semi-annually</option><option value="4" selected>Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option></select></div>`,
  tip: `
    <div class="fin-row"><label>Bill Total</label><input id="fin-p" type="number" value="50"></div>
    <div class="fin-row"><label>Tip %</label><input id="fin-r" type="number" value="18"></div>
    <div class="fin-row"><label>People</label><input id="fin-n" type="number" value="2"></div>`,
  discount: `
    <div class="fin-row"><label>Original</label><input id="fin-p" type="number" value="100"></div>
    <div class="fin-row"><label>Discount %</label><input id="fin-r" type="number" value="20"></div>`,
};

function setupFinanceForm() {
  const type = document.getElementById('finType')?.value || 'loan';
  document.getElementById('finFields').innerHTML = financeFields[type] || '';
}

function calculateFinance() {
  const type = document.getElementById('finType')?.value || 'loan';
  const p = parseFloat(document.getElementById('fin-p')?.value) || 0;
  const r = parseFloat(document.getElementById('fin-r')?.value) || 0;
  const n = parseFloat(document.getElementById('fin-n')?.value) || 1;

  let html = '';
  if (type === 'loan') {
    const rm = r / 100 / 12;
    const emi = rm > 0 ? p * rm * Math.pow(1+rm,n) / (Math.pow(1+rm,n)-1) : p/n;
    const total = emi * n;
    const interest = total - p;
    html = `<p>Monthly EMI: <strong>${emi.toFixed(2)}</strong></p>
            <p>Total Payment: <strong>${total.toFixed(2)}</strong></p>
            <p>Total Interest: <strong>${interest.toFixed(2)}</strong></p>`;
    state.current = emi.toFixed(2);
  } else if (type === 'compound') {
    const c = parseFloat(document.getElementById('fin-c')?.value) || 12;
    const A = p * Math.pow(1 + r/100/c, c*n);
    const interest = A - p;
    html = `<p>Final Amount: <strong>${A.toFixed(2)}</strong></p>
            <p>Interest Earned: <strong>${interest.toFixed(2)}</strong></p>`;
    state.current = A.toFixed(2);
  } else if (type === 'tip') {
    const tip = p * r / 100;
    const total = p + tip;
    const perPerson = total / (n || 1);
    html = `<p>Tip Amount: <strong>${tip.toFixed(2)}</strong></p>
            <p>Total: <strong>${total.toFixed(2)}</strong></p>
            <p>Per Person: <strong>${perPerson.toFixed(2)}</strong></p>`;
    state.current = perPerson.toFixed(2);
  } else if (type === 'discount') {
    const saved = p * r / 100;
    const final = p - saved;
    html = `<p>You Save: <strong>${saved.toFixed(2)}</strong></p>
            <p>Final Price: <strong>${final.toFixed(2)}</strong></p>`;
    state.current = final.toFixed(2);
  }

  financeResultEl.innerHTML = html;
  financeResultEl.classList.add('visible');
  state.waitingForOperand = true;
  updateDisplay();
}

// ── Button Layouts ─────────────────────────────────────────────────────────
const layouts = {
  basic: {
    cols: 4,
    buttons: [
      { label:'MC', cls:'btn-mem', action:()=>memOp('MC') },
      { label:'MR', cls:'btn-mem', action:()=>memOp('MR') },
      { label:'M+', cls:'btn-mem', action:()=>memOp('M+') },
      { label:'MS', cls:'btn-mem', action:()=>memOp('MS') },

      { label:'AC', cls:'btn-clear', span:2, action:clearAll },
      { label:'⌫', cls:'btn-fn', action:backspace },
      { label:'÷', cls:'btn-op', action:()=>setOperator('÷') },

      { label:'7', action:()=>inputDigit('7') },
      { label:'8', action:()=>inputDigit('8') },
      { label:'9', action:()=>inputDigit('9') },
      { label:'×', cls:'btn-op', action:()=>setOperator('×') },

      { label:'4', action:()=>inputDigit('4') },
      { label:'5', action:()=>inputDigit('5') },
      { label:'6', action:()=>inputDigit('6') },
      { label:'−', cls:'btn-op', action:()=>setOperator('−') },

      { label:'1', action:()=>inputDigit('1') },
      { label:'2', action:()=>inputDigit('2') },
      { label:'3', action:()=>inputDigit('3') },
      { label:'+', cls:'btn-op', action:()=>setOperator('+') },

      { label:'±', cls:'btn-fn', action:negate },
      { label:'0', action:()=>inputDigit('0') },
      { label:'.', action:inputDecimal },
      { label:'=', cls:'btn-eq', action:calculate },
    ]
  },

  scientific: {
    cols: 5,
    buttons: [
      { label:'DEG', cls:'btn-mode', action:()=>{ state.angleUnit='DEG'; document.getElementById('dispLabel').textContent='DEG'; notify('Degrees'); } },
      { label:'sin', cls:'btn-fn', action:()=>applySciFn('sin') },
      { label:'cos', cls:'btn-fn', action:()=>applySciFn('cos') },
      { label:'tan', cls:'btn-fn', action:()=>applySciFn('tan') },
      { label:'n!', cls:'btn-fn', action:()=>applySciFn('n!') },

      { label:'RAD', cls:'btn-mode', action:()=>{ state.angleUnit='RAD'; document.getElementById('dispLabel').textContent='RAD'; notify('Radians'); } },
      { label:'sin⁻¹', cls:'btn-fn', action:()=>applySciFn('asin') },
      { label:'cos⁻¹', cls:'btn-fn', action:()=>applySciFn('acos') },
      { label:'tan⁻¹', cls:'btn-fn', action:()=>applySciFn('atan') },
      { label:'1/x', cls:'btn-fn', action:()=>applySciFn('1/x') },

      { label:'log', cls:'btn-fn', action:()=>applySciFn('log') },
      { label:'ln', cls:'btn-fn', action:()=>applySciFn('ln') },
      { label:'√', cls:'btn-fn', action:()=>applySciFn('sqrt') },
      { label:'x²', cls:'btn-fn', action:()=>applySciFn('x^2') },
      { label:'xʸ', cls:'btn-op', action:()=>setOperator('xʸ') },

      { label:'10ˣ', cls:'btn-fn', action:()=>applySciFn('10^x') },
      { label:'eˣ', cls:'btn-fn', action:()=>applySciFn('e^x') },
      { label:'∛', cls:'btn-fn', action:()=>applySciFn('cbrt') },
      { label:'x³', cls:'btn-fn', action:()=>applySciFn('x^3') },
      { label:'AC', cls:'btn-clear', action:clearAll },

      { label:'π', cls:'btn-fn', action:()=>applySciFn('π') },
      { label:'e', cls:'btn-fn', action:()=>applySciFn('e') },
      { label:'±', cls:'btn-fn', action:negate },
      { label:'⌫', cls:'btn-fn', action:backspace },
      { label:'÷', cls:'btn-op', action:()=>setOperator('÷') },

      { label:'7', action:()=>inputDigit('7') },
      { label:'8', action:()=>inputDigit('8') },
      { label:'9', action:()=>inputDigit('9') },
      { label:'(', cls:'btn-fn', action:()=>notify('( coming soon)') },
      { label:'×', cls:'btn-op', action:()=>setOperator('×') },

      { label:'4', action:()=>inputDigit('4') },
      { label:'5', action:()=>inputDigit('5') },
      { label:'6', action:()=>inputDigit('6') },
      { label:')', cls:'btn-fn', action:()=>notify(') coming soon') },
      { label:'−', cls:'btn-op', action:()=>setOperator('−') },

      { label:'1', action:()=>inputDigit('1') },
      { label:'2', action:()=>inputDigit('2') },
      { label:'3', action:()=>inputDigit('3') },
      { label:'%', cls:'btn-fn', action:percent },
      { label:'+', cls:'btn-op', action:()=>setOperator('+') },

      { label:'rand', cls:'btn-fn', action:()=>applySciFn('rand') },
      { label:'0', action:()=>inputDigit('0') },
      { label:'.', action:inputDecimal },
      { label:'abs', cls:'btn-fn', action:()=>applySciFn('abs') },
      { label:'=', cls:'btn-eq', action:calculate },
    ]
  },

  programmer: {
    cols: 5,
    buttons: [
      { label:'AND', cls:'btn-fn', action:()=>progOp('AND') },
      { label:'OR',  cls:'btn-fn', action:()=>progOp('OR') },
      { label:'XOR', cls:'btn-fn', action:()=>progOp('XOR') },
      { label:'NOT', cls:'btn-fn', action:()=>progOp('NOT') },
      { label:'AC',  cls:'btn-clear', action:clearAll },

      { label:'LSH', cls:'btn-fn', action:()=>progOp('LSH') },
      { label:'RSH', cls:'btn-fn', action:()=>progOp('RSH') },
      { label:'MOD', cls:'btn-fn', action:()=>progOp('MOD') },
      { label:'⌫',   cls:'btn-fn', action:backspace },
      { label:'÷',   cls:'btn-op', action:()=>progSetOperator('÷') },

      // Hex digits A-F (enabled in HEX mode)
      { label:'A', cls:'btn-fn hex-only', action:()=>inputDigit('A') },
      { label:'B', cls:'btn-fn hex-only', action:()=>inputDigit('B') },
      { label:'C', cls:'btn-fn hex-only', action:()=>inputDigit('C') },
      { label:'D', cls:'btn-fn hex-only', action:()=>inputDigit('D') },
      { label:'×', cls:'btn-op', action:()=>progSetOperator('×') },

      { label:'E', cls:'btn-fn hex-only', action:()=>inputDigit('E') },
      { label:'F', cls:'btn-fn hex-only', action:()=>inputDigit('F') },
      { label:'7', cls:'btn dec-oct', action:()=>inputDigit('7') },
      { label:'8', cls:'btn dec-oct', action:()=>inputDigit('8') },
      { label:'−', cls:'btn-op', action:()=>progSetOperator('−') },

      { label:'4', cls:'btn dec-oct', action:()=>inputDigit('4') },
      { label:'5', cls:'btn dec-oct', action:()=>inputDigit('5') },
      { label:'6', cls:'btn dec-oct', action:()=>inputDigit('6') },
      { label:'9', cls:'btn dec-only', action:()=>inputDigit('9') },
      { label:'+', cls:'btn-op', action:()=>progSetOperator('+') },

      { label:'1', action:()=>inputDigit('1') },
      { label:'2', cls:'btn no-bin', action:()=>inputDigit('2') },
      { label:'3', cls:'btn no-bin', action:()=>inputDigit('3') },
      { label:'0', action:()=>inputDigit('0') },
      { label:'=', cls:'btn-eq', action:()=>{
        if (!state.operator || state.waitingForOperand) return;
        const prev = parseInt(state.previous, 10) || 0;
        const curr = parseInt(state.current, getBaseRadix(state.base)) || 0;
        let r;
        switch(state.operator) {
          case '+': r=prev+curr; break; case '−': r=prev-curr; break;
          case '×': r=prev*curr; break; case '÷': r=curr?Math.floor(prev/curr):0; break;
          default: r=curr;
        }
        state.current = Math.abs(r).toString(getBaseRadix(state.base)).toUpperCase();
        state.operator = null; state.previous = ''; state.waitingForOperand = true;
        updateDisplay();
      }},
    ]
  },

  finance: {
    cols: 4,
    buttons: [
      { label:'Calculate', cls:'btn-eq btn-span4', action:calculateFinance },
      { label:'7', action:()=>inputDigit('7') },
      { label:'8', action:()=>inputDigit('8') },
      { label:'9', action:()=>inputDigit('9') },
      { label:'⌫', cls:'btn-fn', action:backspace },
      { label:'4', action:()=>inputDigit('4') },
      { label:'5', action:()=>inputDigit('5') },
      { label:'6', action:()=>inputDigit('6') },
      { label:'AC', cls:'btn-clear', action:clearAll },
      { label:'1', action:()=>inputDigit('1') },
      { label:'2', action:()=>inputDigit('2') },
      { label:'3', action:()=>inputDigit('3') },
      { label:'.', action:inputDecimal },
      { label:'0', cls:'btn-span2', action:()=>inputDigit('0') },
      { label:'%', cls:'btn-fn', action:()=>{ state.current = (parseFloat(state.current)/100).toString(); updateDisplay(); }},
      { label:'±', cls:'btn-fn', action:negate },
    ]
  },

  stats: {
    cols: 4,
    buttons: [
      { label:'n',     cls:'btn-fn', action:()=>statFn('n') },
      { label:'Σx',    cls:'btn-fn', action:()=>statFn('sum') },
      { label:'mean',  cls:'btn-fn', action:()=>statFn('mean') },
      { label:'AC',    cls:'btn-clear', action:()=>{ clearAll(); document.getElementById('statsData').value=''; statsDisplayEl.classList.remove('visible'); } },

      { label:'σ',     cls:'btn-fn', action:()=>statFn('σ') },
      { label:'s',     cls:'btn-fn', action:()=>statFn('s') },
      { label:'var',   cls:'btn-fn', action:()=>statFn('var') },
      { label:'⌫',     cls:'btn-fn', action:backspace },

      { label:'min',   cls:'btn-fn', action:()=>statFn('min') },
      { label:'max',   cls:'btn-fn', action:()=>statFn('max') },
      { label:'range', cls:'btn-fn', action:()=>statFn('range') },
      { label:'≈Calc', cls:'btn-eq', action:updateStatsDisplay },

      { label:'7', action:()=>inputDigit('7') },
      { label:'8', action:()=>inputDigit('8') },
      { label:'9', action:()=>inputDigit('9') },
      { label:'÷', cls:'btn-op', action:()=>setOperator('÷') },

      { label:'4', action:()=>inputDigit('4') },
      { label:'5', action:()=>inputDigit('5') },
      { label:'6', action:()=>inputDigit('6') },
      { label:'×', cls:'btn-op', action:()=>setOperator('×') },

      { label:'1', action:()=>inputDigit('1') },
      { label:'2', action:()=>inputDigit('2') },
      { label:'3', action:()=>inputDigit('3') },
      { label:'−', cls:'btn-op', action:()=>setOperator('−') },

      { label:'±', cls:'btn-fn', action:negate },
      { label:'0', action:()=>inputDigit('0') },
      { label:'.', action:inputDecimal },
      { label:'=', cls:'btn-eq', action:calculate },
    ]
  }
};

// ── Render ─────────────────────────────────────────────────────────────────
function renderButtons() {
  const layout = layouts[state.mode];
  buttonsEl.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
  buttonsEl.innerHTML = '';

  layout.buttons.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (def.cls || '');
    if (def.span) btn.classList.add(`btn-span${def.span}`);
    btn.textContent = def.label;
    btn.addEventListener('click', (e) => {
      addRipple(btn, e);
      def.action();
    });
    buttonsEl.appendChild(btn);
  });

  // Programmer: dim unavailable digits
  if (state.mode === 'programmer') updateProgButtons();
}

function updateProgButtons() {
  const base = state.base;
  document.querySelectorAll('.hex-only').forEach(b => {
    b.style.opacity = base === 'HEX' ? '1' : '0.25';
    b.style.pointerEvents = base === 'HEX' ? 'auto' : 'none';
  });
  document.querySelectorAll('.dec-oct').forEach(b => {
    b.style.opacity = (base === 'DEC' || base === 'HEX') ? '1' : '0.25';
    b.style.pointerEvents = (base === 'DEC' || base === 'HEX') ? 'auto' : 'none';
  });
  document.querySelectorAll('.dec-only').forEach(b => {
    b.style.opacity = (base === 'DEC' || base === 'HEX') ? '1' : '0.25';
    b.style.pointerEvents = (base === 'DEC' || base === 'HEX') ? 'auto' : 'none';
  });
  document.querySelectorAll('.no-bin').forEach(b => {
    b.style.opacity = base !== 'BIN' ? '1' : '0.25';
    b.style.pointerEvents = base !== 'BIN' ? 'auto' : 'none';
  });
}

// ── Mode Switching ─────────────────────────────────────────────────────────
function switchMode(mode) {
  state.mode = mode;
  clearAll();

  // Tabs
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));

  // Visibility toggles
  baseDisplayEl.classList.toggle('visible', mode === 'programmer');
  baseSelectorEl.classList.toggle('visible', mode === 'programmer');
  financeFormEl.classList.toggle('visible', mode === 'finance');
  financeResultEl.classList.remove('visible');
  statsInputEl.classList.toggle('visible', mode === 'stats');
  statsDisplayEl.classList.toggle('visible', false);

  // Display label
  const labels = { basic:'BASIC', scientific:'SCIENTIFIC', programmer:'PROGRAMMER', finance:'FINANCE', stats:'STATISTICS' };
  document.getElementById('dispLabel').textContent = labels[mode] || mode.toUpperCase();

  if (mode === 'finance') {
    setupFinanceForm();
    document.getElementById('finType').addEventListener('change', setupFinanceForm);
  }

  if (mode === 'stats') {
    document.getElementById('statsData').addEventListener('input', updateStatsDisplay);
  }

  renderButtons();
}

// ── Keyboard Support ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const k = e.key;
  if (k >= '0' && k <= '9') inputDigit(k);
  else if (k === '.') inputDecimal();
  else if (k === '+') setOperator('+');
  else if (k === '-') setOperator('−');
  else if (k === '*') setOperator('×');
  else if (k === '/') { e.preventDefault(); setOperator('÷'); }
  else if (k === 'Enter' || k === '=') calculate();
  else if (k === 'Backspace') backspace();
  else if (k === 'Escape') clearAll();
  else if (k === '%') percent();
});

// ── Theme Toggle ───────────────────────────────────────────────────────────
const themeBtn = document.getElementById('themeToggle');
let dark = true;
themeBtn.addEventListener('click', () => {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? '' : 'light');
  themeBtn.textContent = dark ? '🌙' : '☀️';
});

// ── Mode Tabs ──────────────────────────────────────────────────────────────
document.getElementById('modeTabs').addEventListener('click', e => {
  const tab = e.target.closest('.mode-tab');
  if (tab) switchMode(tab.dataset.mode);
});

// ── Base Selector ──────────────────────────────────────────────────────────
baseSelectorEl.addEventListener('click', e => {
  const btn = e.target.closest('.base-btn');
  if (btn) switchBase(btn.dataset.base);
});

// ── Init ───────────────────────────────────────────────────────────────────
switchMode('basic');
updateDisplay();