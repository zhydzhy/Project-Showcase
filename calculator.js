function parseErpMarkdown(source) {
  const meta = {};

  source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (!match) return;
      meta[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
    });

  return meta;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const historicalErpValues = [
  // ── 2016: post-2015-crash recovery, rates 2.7–3.3% ──
  3.85, 4.42, 4.58, 3.96,

  // ── 2017: blue-chip bull, PE expanding, rates rising 3.3–4.0% ──
  3.72, 3.35, 3.08, 2.58,

  // ── 2018: trade-war bear, PE collapsed, ERP spiked ──
  2.86, 3.42, 5.24, 6.18,

  // ── 2019: recovery rally ──
  5.10, 4.75, 4.66, 4.44,

  // ── 2020: COVID shock + recovery, rates falling ──
  6.02, 5.22, 4.05, 3.28,

  // ── 2021: post-COVID, regulation crackdowns, PE elevated ──
  2.72, 2.98, 3.84, 4.32,

  // ── 2022: zero-COVID lockdowns, property crisis ──
  5.18, 5.56, 6.42, 6.34,

  // ── 2023: reopening rally then fade ──
  5.08, 5.60, 5.84, 6.46,

  // ── 2024: stimulus, rates at decade lows (1.7–2.5%) ──
  6.28, 6.00, 5.88, 5.92,

  // ── 2025: low-rate regime, moderate PE ──
  5.96, 5.75, 6.08, 6.25,

  // ── 2026 YTD ──
  5.88, 5.74,
];
const baseInvestmentAmount = 8000;

function normalizeErpPercent(value) {
  return Math.abs(value) < 1 ? value * 100 : value;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${normalizeErpPercent(value).toFixed(2)}%`;
}

function calculatePercentile(currentErp, values) {
  if (!Array.isArray(values) || values.length === 0 || !Number.isFinite(currentErp)) {
    return null;
  }

  const currentPercent = normalizeErpPercent(currentErp);
  const normalizedValues = values
    .map((value) => normalizeErpPercent(value))
    .filter((value) => Number.isFinite(value));

  if (normalizedValues.length === 0) return null;

  const belowOrEqualCount = normalizedValues.filter((value) => value <= currentPercent).length;
  return Math.round((belowOrEqualCount / normalizedValues.length) * 100);
}

function getValuationStatus(percentile) {
  if (!Number.isFinite(percentile)) return "暂无数据";
  if (percentile >= 90) return "极度便宜";
  if (percentile >= 80) return "偏便宜";
  if (percentile >= 40) return "正常区间";
  if (percentile >= 20) return "偏贵";
  return "较贵";
}

function getInvestmentPlan(percentile, baseAmount) {
  if (!Number.isFinite(percentile)) return null;

  let multiplier = 0.5;
  if (percentile >= 90) multiplier = 2;
  else if (percentile >= 80) multiplier = 1.5;
  else if (percentile >= 60) multiplier = 1.2;
  else if (percentile >= 40) multiplier = 1;
  else if (percentile >= 20) multiplier = 0.8;

  return {
    amount: Math.round(baseAmount * multiplier),
    multiplier,
  };
}

function getVolatilityAdjustment(percentile) {
  if (!Number.isFinite(percentile)) {
    return {
      multiplier: 1,
      label: "波动数据暂无",
    };
  }

  if (percentile < 20) {
    return {
      multiplier: 1.2,
      label: "低波动",
    };
  }

  if (percentile > 80) {
    return {
      multiplier: 0.8,
      label: "高波动",
    };
  }

  return {
    multiplier: 1,
    label: "常态波动",
  };
}

function getDecisionNote(erpPercentile, volPercentile) {
  if (!Number.isFinite(erpPercentile) || !Number.isFinite(volPercentile)) {
    return "等待 ERP 与波动率数据，暂按 ERP 单因子估算新增资金节奏。";
  }

  if (erpPercentile >= 80 && volPercentile > 80) {
    return "估值便宜，但波动偏高，适合分批加速投入。";
  }

  if (erpPercentile >= 80 && volPercentile < 20) {
    return "估值便宜且波动温和，可提高新增资金投入。";
  }

  if (erpPercentile < 20 && volPercentile < 30) {
    return "估值吸引力低且市场平静，降低新增资金投入。";
  }

  if (erpPercentile < 20 && volPercentile >= 30) {
    return "估值偏低但风险释放中，保持观察，避免机械减仓。";
  }

  return "ERP 与波动率都处于中间区域，维持常规新增资金节奏。";
}

const erpCard = document.getElementById("erpCard");
const resultValue = document.getElementById("resultValue");
const erpPercentile = document.getElementById("erpPercentile");
const erpStatus = document.getElementById("erpStatus");
const erpVolatilityPercentile = document.getElementById("erpVolatilityPercentile");
const erpRiskEnvironment = document.getElementById("erpRiskEnvironment");
const erpInvestmentAmount = document.getElementById("erpInvestmentAmount");
const erpInvestmentMultiplier = document.getElementById("erpInvestmentMultiplier");
const erpDecisionNote = document.getElementById("erpDecisionNote");

function renderErpDecision(spread, values = historicalErpValues, volatilitySummary = null) {
  const percentile = calculatePercentile(spread, values);
  const investmentPlan = getInvestmentPlan(percentile, baseInvestmentAmount);
  const volPercentile = Number.parseFloat(volatilitySummary?.percentile);
  const volatilityAdjustment = getVolatilityAdjustment(volPercentile);

  resultValue.textContent = formatPercent(spread);

  if (percentile === null) {
    erpPercentile.textContent = "历史分位暂无数据";
    erpStatus.textContent = "暂无数据";
    erpVolatilityPercentile.textContent = Number.isFinite(volPercentile) ? `${Math.round(volPercentile)}%` : "-";
    erpRiskEnvironment.textContent = volatilityAdjustment.label;
    erpInvestmentAmount.textContent = "-";
    erpInvestmentMultiplier.textContent = "等待历史数据";
    erpDecisionNote.textContent = "等待 ERP 历史数据，暂不调整新增资金节奏。";
    return;
  }

  const adjustedAmount = Math.round(investmentPlan.amount * volatilityAdjustment.multiplier);
  erpPercentile.textContent = `${percentile}%`;
  erpStatus.textContent = getValuationStatus(percentile);
  erpVolatilityPercentile.textContent = Number.isFinite(volPercentile) ? `${Math.round(volPercentile)}%` : "-";
  erpRiskEnvironment.textContent = volatilityAdjustment.label;
  erpInvestmentAmount.textContent = `${adjustedAmount.toLocaleString("zh-CN")} 元`;
  erpInvestmentMultiplier.textContent = `${investmentPlan.multiplier.toFixed(1)}x ERP × ${volatilityAdjustment.multiplier.toFixed(1)}x Vol`;
  erpDecisionNote.textContent = getDecisionNote(percentile, volPercentile);
}

function renderErpError() {
  resultValue.textContent = "-";
  erpPercentile.textContent = "历史分位暂无数据";
  erpStatus.textContent = "暂无数据";
  erpVolatilityPercentile.textContent = "-";
  erpRiskEnvironment.textContent = "暂无数据";
  erpInvestmentAmount.textContent = "-";
  erpInvestmentMultiplier.textContent = "等待 ERP 数据";
  erpDecisionNote.textContent = "等待 ERP 与波动率数据。";
}

async function fetchHistoryValues() {
  try {
    const response = await fetch(`content/erp_history.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
    const history = await response.json();
    const values = history
      .map((entry) => Number.parseFloat(entry.spread))
      .filter((v) => Number.isFinite(v));
    if (values.length < 5) throw new Error("Not enough history entries");
    return values;
  } catch {
    return null;
  }
}

async function fetchVolatilitySummary() {
  try {
    const response = await fetch(`content/hs300_volatility.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Volatility fetch failed: ${response.status}`);
    const payload = await response.json();
    const observations = Array.isArray(payload?.observations) ? payload.observations : [];
    const latest = observations[observations.length - 1];
    if (!latest) throw new Error("No volatility observations");
    const percentile = Number.parseFloat(latest.vol_percentile);
    const volatility = Number.parseFloat(latest.volatility);
    if (!Number.isFinite(percentile) || !Number.isFinite(volatility)) {
      throw new Error("Invalid volatility observation");
    }
    return { percentile, volatility };
  } catch {
    return null;
  }
}

async function loadErpSnapshot() {
  if (!erpCard || !resultValue) return;
  if (isWeekend(new Date())) {
    erpCard.hidden = true;
    return;
  }

  erpCard.hidden = false;

  try {
    const [erpResponse, historyValues, volatilitySummary] = await Promise.all([
      fetch(`content/ERP.md?ts=${Date.now()}`, { cache: "no-store" }),
      fetchHistoryValues(),
      fetchVolatilitySummary(),
    ]);

    if (!erpResponse.ok) {
      throw new Error(`Request failed with status ${erpResponse.status}.`);
    }

    const parsed = parseErpMarkdown(await erpResponse.text());
    const spread = Number.parseFloat(parsed.spread);
    if (Number.isNaN(spread)) {
      throw new Error("Spread value is missing from content/ERP.md.");
    }

    renderErpDecision(spread, historyValues || historicalErpValues, volatilitySummary);
  } catch {
    renderErpError();
  }
}

if (erpCard && resultValue) {
  loadErpSnapshot();
}
