from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from simulation import run_seir

app = FastAPI(title="ViralNet Live Engine")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class SimParams(BaseModel):
    population: int = 500000
    beta: float = 0.3
    sigma: float = 0.1
    gamma: float = 0.05
    mu: float = 0.01
    days: int = 150 # Increased to 150 days for longer gameplay
    # NEW: Allow JS to send the current state of the game
    I0: int = 100
    E0: int = 200
    R0: int = 0
    D0: int = 0

@app.post("/api/simulate")
def simulate(params: SimParams):
    # Calculate Susceptible based on whatever the current stats are
    S0 = params.population - params.I0 - params.E0 - params.R0 - params.D0
    
    results = run_seir(
        N=params.population,
        S0=S0, E0=params.E0, I0=params.I0, R0=params.R0, D0=params.D0,
        beta=params.beta, sigma=params.sigma, gamma=params.gamma, mu=params.mu,
        days=params.days
    )
    return {"status": "success", "data": results}

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)