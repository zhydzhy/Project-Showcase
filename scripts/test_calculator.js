const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "calculator.js"), "utf8");
const elements = new Map();
[
  "erpCard",
  "resultValue",
  "erpPercentile",
  "erpStatus",
  "erpInvestmentAmount",
  "erpInvestmentMultiplier",
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
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getInvestmentPlan(68, 8000))), {
  amount: 9600,
  multiplier: 1.2,
});
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.getInvestmentPlan(10, 8000))), {
  amount: 4000,
  multiplier: 0.5,
});
sandbox.renderErpDecision(5.7415);
assert.equal(elements.get("erpInvestmentAmount").textContent, "9,600 元");
assert.equal(elements.get("erpInvestmentMultiplier").textContent, "1.2x 基础定投");

console.log("calculator tests passed");
