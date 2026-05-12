# backend/legacy_stats.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class MissionStats(BaseModel):
    mission_type: int
    distance: float
    battery: float
    payload_weight: float = 0


def _calculate_score(m_type: int, dist: float, batt: float, weight: float):
    if dist <= 0 or batt <= 0:
        return 0, "unknown"

    if m_type == 1:
        return (dist * 10) / batt, "recon"
    if m_type == 2:
        score = (dist * 5) / batt
        if weight > 50:
            score -= (weight * 0.1)
        return score, "transport"

    return 0, "invalid"


@router.post("/api/mission_stats")
def calc_stats(data: MissionStats):
    score, status = _calculate_score(
        data.mission_type, data.distance, data.battery, data.payload_weight
    )

    if status == "invalid":
        return {"status": "error", "msg": "invalid mission type"}

    final_score = min(100, score)
    save_stats_to_db(status, final_score)

    return {
        "status": "success",
        "mission": status,
        "final_score": round(final_score, 2)
    }


def save_stats_to_db(status, score):
    # db.connect()
    # db.execute(
    #   "INSERT INTO stats (mission, score) VALUES (?, ?)", (status, score)
    # )
    # db.close()
    return True
