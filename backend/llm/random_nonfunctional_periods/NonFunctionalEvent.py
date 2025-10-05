from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

class NonFunctionalEvent(BaseModel):
    """
    Event that affects the contribution base for E+R (pension + disability).
    - If basis_zero == True → no insurance title (contributions = 0).
    - Otherwise, apply contrib_multiplier within [0, 1].
    """
    reason: str = Field(description="Krótki powód, np. 'bezrobocie', '1/2 etatu', 'zagranica bez ZUS'")
    start_age: int = Field(ge=0, description="Wiek start (włącznie)")
    end_age: int = Field(gt=0, description="Wiek koniec (wyłącznie)")
    contrib_multiplier: Optional[float] = Field(
        default=None,
        description="Mnożnik podstawy do składek; przy basis_zero=True będzie ignorowany/ustawiony na 0.0"
    )
    basis_zero: Optional[bool] = Field(
        default=None,
        description="True, gdy brak tytułu do ubezpieczeń E+R (podstawa = 0)."
    )
    kind: Optional[str] = Field(default=None, description="np. 'przerwa','zagranica','inne','niepełny etat'")

    @model_validator(mode="after")
    def _normalize(cls, values):
        # start < end
        if values.end_age <= values.start_age:
            raise ValueError("end_age must be > start_age")

        # basis_zero -> multiplier = 0
        if values.basis_zero:
            values.contrib_multiplier = 0.0
        else:
            # jeśli nie zero, to zapewniamy domyślny mnożnik i ograniczamy do [0,1]
            m = values.contrib_multiplier
            if m is None:
                m = 1.0
            m = max(0.0, min(1.0, float(m)))
            values.contrib_multiplier = m
        return values

class NonFunctionalPlan(BaseModel):
    events: List[NonFunctionalEvent] = Field(default_factory=list)