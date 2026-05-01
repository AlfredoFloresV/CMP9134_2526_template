# backend/legacy_stats.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class MissionStats(BaseModel):
    mission_type: int
    distance: float
    battery: float
    payload_weight: float = 0


@router.post("/api/mission_stats", response_model=MissionStats)
def calc_stats(data: MissionStats):
    try:
        mission_type = data.mission_type
        distance = data.distance
        battery = data.battery
        payload_weight = data.payload_weight
    except KeyError:
        raise HTTPException(status_code=400, detail="Missing required data")

    score = 0
    status = "unknown"

    if mission_type == 1:
        status = "recon"
        if distance > 0 and battery > 0:
            score = (distance * 10) / battery
        else:
            score = 0

    elif mission_type == 2:
        status = "transport"
        battery = data.battery
        if distance > 0 and battery > 0:
            score = (distance * 5) / battery
            if payload_weight > 50:
                score = score - (payload_weight * 0.1)
        else:
            score = 0

    else:
        return {"status": "error", "msg": "invalid mission type"}

    save_stats_to_db(status, min(100, score))
    return {"status": "success", "mission": status, "final_score": round(score, 2)}


def save_stats_to_db(status, score):
    # db.connect()
    # db.execute("INSERT INTO stats (mission, score) VALUES (?, ?)", (status, score))
    # db.close()
    return True
