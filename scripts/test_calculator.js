const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "calculator.js"), "utf8");
const techlifeHtml = fs.readFileSync(path.join(__dirname, "..", "techlife.html"), "utf8");
const erpHistory = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "erp_history.json"), "utf8"));
const volatilityHistory = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "hs300_volatility.json"), "utf8"));
const elements = new Map();
[
  "erpCard",
  "resultValue",
  "erpPercentile",
  "erpStatus",
  "erpVolatilityPercentile",
  "erpRiskEnvironment",
  "erpInvestmentAmount",
  "erpInvestmentMultiplier",
  "erpDecisionNote",
].forEach((id) => elements.set(id, { hidden: false, textContent: "" }));

const sandbox = {
  document: {
    getElementById(id) {
      return elements.get(id) || null;
    },
  },
  fetch: async () => {
    throw new Error("fetch is not used by these unit tests");
  },
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

assert.equal(sandbox.formatPercent(5.5665), "5.57%");
assert.equal(sandbox.formatPercent(0.055665), "5.57%");
assert.equal(sandbox.calculatePercentile(5.5665, [4, 5, 5.5665, 6]), 75);
assert.equal(sandbox.calculatePercentile(5.5665, []), null);
assert.equal(sandbox.getValuationStatus(90), "极度便宜");
assert.equal(sandbox.getValuationStatus(85), "偏便宜");
assert.equal(sandbox.getValuationStatus(68), "正常区间");
assert.equal(sandbox.getValuationStatus(30), "偏贵");
assert.equal(sandbox.getValuationStatus(19), "较贵");
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getInvestmentPlan(68, 5000))), {
  amount: 6000,
  multiplier: 1.2,
});
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getInvestmentPlan(10, 5000))), {
  amount: 2500,
  multiplier: 0.5,
});
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getVolatilityAdjustment(15))), {
  multiplier: 1.2,
  label: "低波动",
});
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getVolatilityAdjustment(95))), {
  multiplier: 0.8,
  label: "高波动",
});
assert.match(sandbox.getDecisionNote(85, 15), /提高新增资金投入/);
sandbox.renderErpDecision(5.7415, undefined, { percentile: 15, volatility: 0.18 });
assert.equal(elements.get("erpInvestmentAmount").textContent, "7,200 元");
assert.equal(elements.get("erpInvestmentMultiplier").textContent, "1.2x ERP × 1.2x Vol");
assert.equal(elements.get("erpVolatilityPercentile").textContent, "15%");
assert.equal(elements.get("erpRiskEnvironment").textContent, "低波动");
assert.match(elements.get("erpDecisionNote").textContent, /常规新增资金节奏/);
assert.match(techlifeHtml, /<script src="calculator\.js\?v=[^"]+"><\/script>/);
assert.match(techlifeHtml, /id="erpVolatilityPercentile"/);
assert.match(techlifeHtml, /id="erpRiskEnvironment"/);
assert.match(techlifeHtml, /id="erpDecisionNote"/);
assert.ok(erpHistory.length >= 100);
assert.equal(erpHistory[0].date, "2016-07-29");
assert.match(erpHistory[0].source, /lixingren/);
assert.equal(volatilityHistory.lookback_days, 250);
assert.match(volatilityHistory.source, /eastmoney/);
assert.ok(volatilityHistory.observations.length >= 1000);
assert.ok(Number.isFinite(volatilityHistory.observations.at(-1).vol_percentile));

console.log("calculator tests passed");
