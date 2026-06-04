#!/usr/bin/env python3

from __future__ import annotations

import json
import math
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "content" / "ERP.md"
HISTORY_PATH = ROOT / "content" / "erp_history.json"
VOLATILITY_PATH = ROOT / "content" / "hs300_volatility.json"

LEGULEGU_URL = "https://legulegu.com/stockdata/hs300-ttm-lyr"
CHINABOND_DETAIL_URL = "https://yield.chinabond.com.cn/cbweb-mn/yc/ycDetail"
CHINABOND_CURVE_ID = "2c9081e50a2f9606010a3068cae70001"
EASTMONEY_HS300_KLINE_URL = (
    "https://push2his.eastmoney.com/api/qt/stock/kline/get"
    "?secid=1.000300"
    "&fields1=f1,f2,f3,f4,f5,f6"
    "&fields2=f51,f52,f53,f54,f55,f56,f57"
    "&klt=101&fqt=1&beg=20050101&end=20500101"
)
VOLATILITY_LOOKBACK_DAYS = 250

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


class TableTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._in_cell = False
        self._cell_parts: list[str] = []
        self._row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs: Iterable[tuple[str, str | None]]) -> None:
        if tag in {"td", "th"}:
            self._in_cell = True
            self._cell_parts = []
        elif tag == "tr":
            self._row = []

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._cell_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self._in_cell:
            text = "".join(self._cell_parts).strip()
            self._row.append(" ".join(text.split()))
            self._in_cell = False
            self._cell_parts = []
        elif tag == "tr" and self._row:
            self.rows.append(self._row)


def fetch_text(url: str, *, method: str = "GET", data: bytes | None = None) -> str:
    request = Request(url, data=data, method=method, headers=DEFAULT_HEADERS)
    try:
        with urlopen(request, timeout=20) as response:
            return response.read().decode("utf-8", errors="ignore")
    except HTTPError as error:
        raise RuntimeError(f"Request failed with status {error.code} for {url}") from error
    except URLError as error:
        raise RuntimeError(f"Request failed for {url}: {error.reason}") from error


def fetch_json(url: str) -> object:
    return json.loads(fetch_text(url))


def parse_rows(html: str) -> list[list[str]]:
    parser = TableTextParser()
    parser.feed(html)
    return parser.rows


def parse_legulegu(html: str) -> dict[str, str | float]:
    date_match = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", html)
    if not date_match:
        raise RuntimeError("Could not find the Legulegu source date.")

    source_date = (
        f"{date_match.group(1)}-"
        f"{date_match.group(2).zfill(2)}-"
        f"{date_match.group(3).zfill(2)}"
    )

    for row in parse_rows(html):
        if len(row) >= 2 and row[0] == "沪深300滚动市盈率(TTM)":
            try:
                value = float(row[1])
            except ValueError as error:
                raise RuntimeError("Legulegu value is not a valid number.") from error
            return {"value": value, "source_date": source_date}

    raise RuntimeError("Could not find the HS300 TTM row on Legulegu.")


def parse_chinabond(html: str) -> dict[str, str | float]:
    date_match = re.search(r"workTime=(\d{4}-\d{2}-\d{2})", html)
    if not date_match:
        raise RuntimeError("Could not find the ChinaBond source date.")

    source_date = date_match.group(1)

    for row in parse_rows(html):
        if len(row) >= 2 and row[0] == "10.0y":
            try:
                value = float(row[1])
            except ValueError as error:
                raise RuntimeError("ChinaBond 10Y value is not a valid number.") from error
            return {"value": value, "source_date": source_date}

    raise RuntimeError("Could not find the 10.0y row on ChinaBond.")


def compute_equity_bond_spread(hs300_ttm: float, china_bond_10y_pct: float) -> float:
    if hs300_ttm <= 0:
        raise RuntimeError("HS300 TTM must be positive.")
    return (1 / hs300_ttm - china_bond_10y_pct / 100) * 100


def fetch_hs300_ttm() -> dict[str, str | float]:
    return parse_legulegu(fetch_text(LEGULEGU_URL))


def fetch_chinabond_10y() -> dict[str, str | float]:
    payload = urlencode(
        {
            "ycDefIds": CHINABOND_CURVE_ID,
            "zblx": "txy",
            "workTime": "",
            "dxbj": "",
            "qxlx": "",
            "yqqxN": "",
            "yqqxK": "",
            "wrjxCBFlag": "0",
            "locale": "zh_CN",
        }
    ).encode("utf-8")
    return parse_chinabond(
        fetch_text(CHINABOND_DETAIL_URL, method="POST", data=payload)
    )


def build_snapshot() -> dict[str, object]:
    hs300 = fetch_hs300_ttm()
    bond = fetch_chinabond_10y()
    spread = compute_equity_bond_spread(
        float(hs300["value"]),
        float(bond["value"]),
    )
    snapshot_time = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    return {
        "name": "ERP Value",
        "spread": round(spread, 4),
        "hs300_ttm": round(float(hs300["value"]), 4),
        "china_bond_10y_pct": round(float(bond["value"]), 4),
        "hs300_source_date": hs300["source_date"],
        "china_bond_source_date": bond["source_date"],
        "updated_at": snapshot_time,
    }


def append_history(snapshot: dict[str, object]) -> None:
    """Append the current ERP reading to the history log, deduplicating by date."""
    try:
        if HISTORY_PATH.exists():
            history = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        else:
            history = []
    except (json.JSONDecodeError, OSError):
        history = []

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if history and history[-1].get("date") == today:
        # Replace today's existing entry (e.g. re-runs during the same day)
        history[-1] = {
            "date": today,
            "spread": snapshot["spread"],
            "hs300_pe": snapshot["hs300_ttm"],
            "cb_10y": snapshot["china_bond_10y_pct"],
            "source": "legulegu + chinabond",
        }
    else:
        history.append({
            "date": today,
            "spread": snapshot["spread"],
            "hs300_pe": snapshot["hs300_ttm"],
            "cb_10y": snapshot["china_bond_10y_pct"],
            "source": "legulegu + chinabond",
        })

    # Keep last 500 entries (~4 years of weekdays)
    history = history[-500:]
    HISTORY_PATH.write_text(json.dumps(history, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Appended to {HISTORY_PATH} ({len(history)} total entries)")


def should_refresh_volatility() -> bool:
    if not VOLATILITY_PATH.exists():
        return True

    try:
        payload = json.loads(VOLATILITY_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return True

    generated_at = str(payload.get("generated_at", ""))
    today = datetime.now(timezone.utc).date().isoformat()
    return not generated_at.startswith(today)


def parse_eastmoney_klines(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise RuntimeError("Eastmoney kline payload is not an object.")

    data = payload.get("data")
    if not isinstance(data, dict):
        raise RuntimeError("Eastmoney kline payload is missing data.")

    klines = data.get("klines")
    if not isinstance(klines, list):
        raise RuntimeError("Eastmoney kline payload is missing klines.")

    rows: list[dict[str, object]] = []
    for raw in klines:
        if not isinstance(raw, str):
            continue
        parts = raw.split(",")
        if len(parts) < 3:
            continue
        try:
            rows.append({
                "date": parts[0],
                "close": float(parts[2]),
            })
        except ValueError:
            continue

    if len(rows) < VOLATILITY_LOOKBACK_DAYS + 2:
        raise RuntimeError("Eastmoney kline history is too short for 250-day volatility.")
    return rows


def build_volatility_observations(prices: list[dict[str, object]]) -> list[dict[str, object]]:
    returns: list[dict[str, object]] = []
    previous_close: float | None = None
    for row in prices:
        close = float(row["close"])
        if previous_close and close > 0 and previous_close > 0:
            returns.append({
                "date": row["date"],
                "return": math.log(close / previous_close),
                "close": close,
            })
        previous_close = close

    observations: list[dict[str, object]] = []
    rolling_vols: list[float] = []
    for index in range(VOLATILITY_LOOKBACK_DAYS - 1, len(returns)):
        window = [float(item["return"]) for item in returns[index - VOLATILITY_LOOKBACK_DAYS + 1:index + 1]]
        mean = sum(window) / len(window)
        variance = sum((value - mean) ** 2 for value in window) / (len(window) - 1)
        volatility = math.sqrt(variance) * math.sqrt(252)
        rolling_vols.append(volatility)
        percentile = round(
            sum(1 for value in rolling_vols if value <= volatility) / len(rolling_vols) * 100
        )
        observations.append({
            "date": returns[index]["date"],
            "close": round(float(returns[index]["close"]), 4),
            "volatility": round(volatility, 4),
            "vol_percentile": percentile,
        })

    return observations


def update_volatility_history() -> None:
    if not should_refresh_volatility():
        print(f"Skipped {VOLATILITY_PATH}; already refreshed today")
        return

    prices = parse_eastmoney_klines(fetch_json(EASTMONEY_HS300_KLINE_URL))
    observations = build_volatility_observations(prices)
    payload = {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": "eastmoney hs300 daily kline",
        "index_code": "000300",
        "lookback_days": VOLATILITY_LOOKBACK_DAYS,
        "annualization_days": 252,
        "observations": observations,
    }
    VOLATILITY_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {VOLATILITY_PATH} ({len(observations)} observations)")


def main() -> None:
    snapshot = build_snapshot()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(render_markdown(snapshot), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    append_history(snapshot)
    try:
        update_volatility_history()
    except RuntimeError as error:
        print(f"Skipped volatility update: {error}")


def render_markdown(snapshot: dict[str, object]) -> str:
    return (
        f"Title: {snapshot['name']}\n"
        f"Spread: {snapshot['spread']}\n"
        f"Updated: {snapshot['updated_at']}\n"
        f"HS300 TTM: {snapshot['hs300_ttm']}\n"
        f"HS300 Source Date: {snapshot['hs300_source_date']}\n"
        f"ChinaBond 10Y: {snapshot['china_bond_10y_pct']}\n"
        f"ChinaBond Source Date: {snapshot['china_bond_source_date']}\n"
    )


if __name__ == "__main__":
    main()
