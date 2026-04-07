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

const erpCard = document.getElementById("erpCard");
const resultValue = document.getElementById("resultValue");

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

    resultValue.textContent = spread.toFixed(4);
  } catch {
    resultValue.textContent = "-";
  }
}

if (erpCard && resultValue) {
  loadErpSnapshot();
}
