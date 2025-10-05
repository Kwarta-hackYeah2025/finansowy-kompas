from pydantic import BaseModel, Field


class FunFact(BaseModel):
    fact: str = Field(..., description="A fun fact related to ZUS, pensions, or retirement in Poland")
