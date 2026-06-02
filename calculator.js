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
  3.1,
  3.45,
  3.8,
  4.05,
  4.22,
  4.5,
  4.72,
  4.9,
  5.05,
  5.18,
  5.3,
  5.39,
  5.45,
  5.5,
  5.53,
  5.55,
  5.5665,
  5.7,
  5.9,
  6.1,
  6.35,
  6.6,
  6.85,
  7.1,
  7.35,
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

const erpCard = document.getElementById("erpCard");
const resultValue = document.getElementById("resultValue");
const erpPercentile = document.getElementById("erpPercentile");
const erpStatus = document.getElementById("erpStatus");
const erpInvestmentAmount = document.getElementById("erpInvestmentAmount");
const erpInvestmentMultiplier = document.getElementById("erpInvestmentMultiplier");

function renderErpDecision(spread) {
  const percentile = calculatePercentile(spread, historicalErpValues);
  const investmentPlan = getInvestmentPlan(percentile, baseInvestmentAmount);

  resultValue.textContent = formatPercent(spread);

  if (percentile === null) {
    erpPercentile.textContent = "历史分位暂无数据";
    erpStatus.textContent = "暂无数据";
    erpInvestmentAmount.textContent = "-";
    erpInvestmentMultiplier.textContent = "等待历史数据";
    return;
  }

  erpPercentile.textContent = `${percentile}%`;
  erpStatus.textContent = getValuationStatus(percentile);
  erpInvestmentAmount.textContent = `${investmentPlan.amount.toLocaleString("zh-CN")} 元`;
  erpInvestmentMultiplier.textContent = `${investmentPlan.multiplier.toFixed(1)}x 基础定投`;
}

function renderErpError() {
  resultValue.textContent = "-";
  erpPercentile.textContent = "历史分位暂无数据";
  erpStatus.textContent = "暂无数据";
  erpInvestmentAmount.textContent = "-";
  erpInvestmentMultiplier.textContent = "等待 ERP 数据";
}

async function loadErpSnapshot() {
  if (!erpCard || !resultValue) return;
  if (isWeekend(new Date())) {
    erpCard.hidden = true;
    return;
  }

  erpCard.hidden = false;

  try {
    const response = await fetch(`content/ERP.md?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    const parsed = parseErpMarkdown(await response.text());
    const spread = Number.parseFloat(parsed.spread);
    if (Number.isNaN(spread)) {
      throw new Error("Spread value is missing from content/ERP.md.");
    }

    renderErpDecision(spread);
  } catch {
    renderErpError();
  }
}

if (erpCard && resultValue) {
  loadErpSnapshot();
}
