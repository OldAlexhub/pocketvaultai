"""Local deterministic insight engine for PocketVault AI.

The module uses only the Python standard library. It accepts JSON-compatible
data from the Android bridge and returns JSON-compatible insight objects.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from typing import Any, Dict, Iterable, List, Optional, Tuple


SENSITIVE_TYPES = {
    "identity_reference",
    "vehicle_registration",
    "auto_insurance",
    "travel_reference",
    "health_insurance_reference",
}


def _today(value: Any) -> date:
    parsed = _parse_date(value)
    return parsed or date.today()


def _parse_date(value: Any) -> Optional[date]:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _active_items(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [item for item in items if isinstance(item, dict) and not item.get("archived", False)]


def _item_id(item: Dict[str, Any]) -> str:
    return str(item.get("id") or "")


def _title(item: Dict[str, Any]) -> str:
    title = item.get("title")
    return str(title).strip() if title else "Untitled reference"


def _insight(
    insight_type: str,
    title: str,
    message: str,
    severity: str,
    item_ids: Optional[List[str]] = None,
    carry_mode_ids: Optional[List[str]] = None,
    score: int = 0,
    explanation: str = "",
) -> Dict[str, Any]:
    item_ids = item_ids or []
    carry_mode_ids = carry_mode_ids or []
    stable = "-".join(item_ids + carry_mode_ids) or str(abs(hash(title)) % 100000)
    return {
        "id": f"{insight_type}-{stable}",
        "type": insight_type,
        "title": title,
        "message": message,
        "severity": severity,
        "itemIds": item_ids,
        "carryModeIds": carry_mode_ids,
        "score": int(max(0, min(100, score))),
        "generatedAt": _now_iso(),
        "dismissed": False,
        "explanation": explanation,
    }


def score_expiration(item: Dict[str, Any], today: Any) -> Dict[str, Any]:
    """Score expiration urgency without judging official validity."""
    today_date = _today(today)
    expiration = _parse_date(item.get("expirationDate"))
    renewal = _parse_date(item.get("renewalDate"))
    target = expiration or renewal
    if target is None:
        return {
            "itemId": _item_id(item),
            "score": 0,
            "daysUntil": None,
            "reason": "No expiration or renewal date was entered.",
            "severity": "low",
        }
    days_until = (target - today_date).days
    if days_until < 0:
        score = 100
        severity = "high"
        reason = "The reference date has passed based on the date entered."
    elif days_until <= 7:
        score = 95 - days_until
        severity = "high"
        reason = "The reference date is within 7 days."
    elif days_until <= 30:
        score = 80 - days_until
        severity = "medium"
        reason = "The reference date is within 30 days."
    elif days_until <= 90:
        score = 45
        severity = "low"
        reason = "The reference date is within 90 days."
    else:
        score = 10
        severity = "low"
        reason = "The reference date is more than 90 days away."
    return {
        "itemId": _item_id(item),
        "score": int(max(0, min(100, score))),
        "daysUntil": days_until,
        "reason": reason,
        "severity": severity,
    }


def detect_missing_documents(items: List[Dict[str, Any]], carry_modes: List[Dict[str, Any]], today: Any) -> List[Dict[str, Any]]:
    active = _active_items(items)
    active_types = {item.get("type") for item in active}
    insights: List[Dict[str, Any]] = []

    if any(item.get("type") == "vehicle_registration" for item in active) and "auto_insurance" not in active_types:
        insights.append(
            _insight(
                "missing_document",
                "Vehicle folder may be missing auto insurance",
                "Your vehicle references include registration but no auto insurance reference.",
                "medium",
                score=70,
                explanation="This is an organization prompt based on saved categories. It does not verify coverage or legal status.",
            )
        )

    for mode in carry_modes or []:
        if not isinstance(mode, dict):
            continue
        missing_types = []
        for required in mode.get("requiredItemTypes") or []:
            if required not in active_types:
                missing_types.append(required)
        if missing_types:
            mode_name = str(mode.get("name") or "Carry mode")
            insights.append(
                _insight(
                    "missing_document",
                    f"{mode_name} is missing saved item types",
                    f"{mode_name} has {len(missing_types)} required item type missing from the vault.",
                    "medium",
                    carry_mode_ids=[str(mode.get("id") or "")],
                    score=65,
                    explanation="Required carry mode categories are compared with active vault items.",
                )
            )
    return insights


def detect_duplicates(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    active = _active_items(items)
    insights: List[Dict[str, Any]] = []
    used_pairs = set()
    for i, left in enumerate(active):
        left_title = _title(left).lower()
        for right in active[i + 1 :]:
            right_title = _title(right).lower()
            pair = tuple(sorted((_item_id(left), _item_id(right))))
            if pair in used_pairs:
                continue
            ratio = SequenceMatcher(None, left_title, right_title).ratio()
            same_issuer = bool(left.get("issuer")) and str(left.get("issuer")).lower() == str(right.get("issuer")).lower()
            if left_title and (ratio >= 0.88 or (ratio >= 0.78 and same_issuer)):
                used_pairs.add(pair)
                insights.append(
                    _insight(
                        "duplicate_possible",
                        "Possible duplicate references",
                        f"{_title(left)} and {_title(right)} have similar names. Review them if they represent the same reference.",
                        "low",
                        item_ids=[_item_id(left), _item_id(right)],
                        score=int(ratio * 100),
                        explanation="Duplicate detection compares normalized names and issuer when present.",
                    )
                )
    return insights


def rank_renewals(items: List[Dict[str, Any]], today: Any) -> List[Dict[str, Any]]:
    ranked = []
    for item in _active_items(items):
        scored = score_expiration(item, today)
        if scored["daysUntil"] is not None and scored["daysUntil"] <= 90:
            scored["title"] = _title(item)
            ranked.append(scored)
    ranked.sort(key=lambda row: (-int(row.get("score", 0)), 9999 if row.get("daysUntil") is None else int(row.get("daysUntil"))))
    return ranked


def suggest_carry_mode(
    items: List[Dict[str, Any]],
    carry_modes: List[Dict[str, Any]],
    usage_history: List[Dict[str, Any]],
    today: Any,
) -> Dict[str, Any]:
    if not carry_modes:
        return {"carryModeId": None, "reason": "No carry modes are available.", "score": 0}
    today_date = _today(today)
    weekday = today_date.weekday()
    js_weekday = (weekday + 1) % 7
    usage_counts: Dict[str, int] = {}
    for event in usage_history or []:
        if isinstance(event, dict) and event.get("carryModeId"):
            usage_counts[str(event.get("carryModeId"))] = usage_counts.get(str(event.get("carryModeId")), 0) + 1

    best: Tuple[int, Dict[str, Any], str] = (-1, carry_modes[0], "First available carry mode.")
    for mode in carry_modes:
        if not isinstance(mode, dict):
            continue
        score = usage_counts.get(str(mode.get("id")), 0) * 4
        reason = "Based on previous use."
        if js_weekday in (mode.get("activeDays") or []):
            score += 30
            reason = "Active today based on the carry mode schedule."
        required_count = len(mode.get("requiredItemTypes") or []) + len(mode.get("requiredItemIds") or [])
        score += min(required_count * 2, 12)
        if score > best[0]:
            best = (score, mode, reason)
    return {"carryModeId": str(best[1].get("id") or ""), "reason": best[2], "score": best[0]}


def calculate_vault_health(items: List[Dict[str, Any]], carry_modes: List[Dict[str, Any]], today: Any) -> Dict[str, Any]:
    active = _active_items(items)
    score = 100
    factors: List[str] = []
    if not active:
        score -= 20
        factors.append("No active vault items.")

    rankings = [score_expiration(item, today) for item in active]
    expired = [row for row in rankings if row["daysUntil"] is not None and row["daysUntil"] < 0]
    due_soon = [row for row in rankings if row["daysUntil"] is not None and 0 <= row["daysUntil"] <= 30]
    missing_dates = [item for item in active if not item.get("expirationDate") and not item.get("renewalDate")]
    duplicates = detect_duplicates(active)
    missing = detect_missing_documents(active, carry_modes, today)

    score -= min(25, len(expired) * 5)
    score -= min(15, len(due_soon) * 3)
    score -= min(25, len(missing) * 5)
    score -= min(10, len(duplicates) * 2)
    score -= min(10, len(missing_dates))

    factors.extend(
        [
            f"{len(active)} active item(s).",
            f"{len(expired)} reference date(s) passed.",
            f"{len(due_soon)} reference date(s) within 30 days.",
            f"{len(missing)} missing carry mode requirement(s).",
            f"{len(duplicates)} duplicate candidate(s).",
            f"{len(missing_dates)} item(s) missing expiration or renewal dates.",
        ]
    )
    clamped = max(0, min(100, score))
    label = "Organized" if clamped >= 80 else "Needs review" if clamped >= 60 else "Needs attention"
    return {
        "score": clamped,
        "label": label,
        "explanation": "Vault organization score uses dates, carry mode coverage, duplicate candidates, and missing review dates.",
        "factors": factors,
    }


def generate_insights(
    items: List[Dict[str, Any]],
    carry_modes: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    today: Any,
) -> List[Dict[str, Any]]:
    insights: List[Dict[str, Any]] = []
    health = calculate_vault_health(items, carry_modes, today)
    insights.append(
        _insight(
            "vault_health",
            "Vault organization score",
            f"Your vault organization score is {health['score']}.",
            "high" if health["score"] < 60 else "medium" if health["score"] < 80 else "low",
            score=health["score"],
            explanation=health["explanation"],
        )
    )

    for row in rank_renewals(items, today)[:8]:
        item = next((candidate for candidate in items if _item_id(candidate) == row["itemId"]), None)
        if not item:
            continue
        severity = row.get("severity", "low")
        days = row.get("daysUntil")
        if days is not None and days < 0:
            message = f"{_title(item)} has a reference date that passed based on the date you entered."
        else:
            message = f"{_title(item)} has a reference date in {days} day(s)."
        insights.append(
            _insight(
                "high_priority" if severity == "high" else "expiring_soon",
                f"{_title(item)} needs review",
                message,
                severity,
                item_ids=[_item_id(item)],
                score=row.get("score", 0),
                explanation=row.get("reason", "This is based on the date entered by the user."),
            )
        )

    insights.extend(detect_missing_documents(items, carry_modes, today))
    insights.extend(detect_duplicates(items))

    missing_dates = [item for item in _active_items(items) if not item.get("expirationDate") and not item.get("renewalDate")]
    if missing_dates:
        insights.append(
            _insight(
                "review_needed",
                "Some items have no review date",
                f"{len(missing_dates)} saved item(s) have no expiration or renewal date.",
                "low",
                item_ids=[_item_id(item) for item in missing_dates[:10]],
                score=30,
                explanation="Adding dates can make reminders and priority sorting more useful.",
            )
        )

    suggestion = suggest_carry_mode(items, carry_modes, events, today)
    if suggestion.get("carryModeId"):
        mode = next((mode for mode in carry_modes if str(mode.get("id")) == suggestion["carryModeId"]), None)
        if mode:
            insights.append(
                _insight(
                    "carry_mode_suggestion",
                    f"Suggested carry mode: {mode.get('name')}",
                    "This carry mode may be useful today based on your schedule and local history.",
                    "low",
                    carry_mode_ids=[str(mode.get("id"))],
                    score=suggestion.get("score", 0),
                    explanation=suggestion.get("reason", "Local schedule and usage history were used."),
                )
            )
    return insights


def analyze_vault(payload: Any) -> Any:
    """Main bridge entry point.

    If called with a JSON string, return a JSON string for the native bridge.
    If called with a dict, return a dict for direct Python tests.
    """
    string_input = isinstance(payload, str)
    try:
        data = json.loads(payload) if string_input else payload
        if not isinstance(data, dict):
            data = {}
        items = data.get("items") if isinstance(data.get("items"), list) else []
        carry_modes = data.get("carryModes") if isinstance(data.get("carryModes"), list) else []
        events = data.get("usageEvents") if isinstance(data.get("usageEvents"), list) else []
        today = data.get("today")

        health = calculate_vault_health(items, carry_modes, today)
        renewals = rank_renewals(items, today)
        insights = generate_insights(items, carry_modes, events, today)
        missing = [insight for insight in insights if insight["type"] == "missing_document"]
        duplicates = [insight for insight in insights if insight["type"] == "duplicate_possible"]
        suggestion = suggest_carry_mode(items, carry_modes, events, today)

        result = {
            "ok": True,
            "source": "python",
            "generatedAt": _now_iso(),
            "vaultHealth": health,
            "insights": insights,
            "expiringSoon": [row for row in renewals if row.get("daysUntil") is not None and row["daysUntil"] <= 30],
            "highPriorityRenewals": [row for row in renewals if row.get("severity") == "high"],
            "missingDocuments": missing,
            "duplicateCandidates": duplicates,
            "suggestedCarryModeId": suggestion.get("carryModeId"),
        }
    except Exception as exc:
        result = {
            "ok": False,
            "source": "python",
            "generatedAt": _now_iso(),
            "error": f"Insight engine handled an error safely: {type(exc).__name__}",
            "vaultHealth": {"score": 0, "label": "Unavailable", "explanation": "Python analysis failed safely.", "factors": []},
            "insights": [],
            "expiringSoon": [],
            "highPriorityRenewals": [],
            "missingDocuments": [],
            "duplicateCandidates": [],
        }
    return json.dumps(result) if string_input else result
