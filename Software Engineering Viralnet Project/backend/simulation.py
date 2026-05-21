import numpy as np

def run_seir(N, S0, E0, I0, R0, D0, beta, sigma, gamma, mu, days):
    # Added D0 (Initial Deaths) and mu (Mortality rate)
    S, E, I, R, D = [S0], [E0], [I0], [R0], [D0]
    
    for t in range(days):
        new_exposed = (beta * S[-1] * I[-1]) / N
        new_infected = sigma * E[-1]
        
        # Infected people now either recover (gamma) OR die (mu)
        new_recovered = gamma * I[-1]
        new_deaths = mu * I[-1]
        
        S.append(S[-1] - new_exposed)
        E.append(E[-1] + new_exposed - new_infected)
        I.append(I[-1] + new_infected - new_recovered - new_deaths)
        R.append(R[-1] + new_recovered)
        D.append(D[-1] + new_deaths)
        
    return {
        "Susceptible": [int(x) for x in S],
        "Exposed": [int(x) for x in E],
        "Infected": [int(x) for x in I],
        "Recovered": [int(x) for x in R],
        "Deaths": [int(x) for x in D]
    }