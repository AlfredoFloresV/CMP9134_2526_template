1 - Framework Smell. 
Not using Pydantic

2 - Magic Numbers. 
t? d? b?

3 - Duplicated Code. 
if score > 100:
            score = 100

4 - Security Smells
Unsafe SQL query 
INSERT INTO stats (mission, score) VALUES ('{status}', {score})