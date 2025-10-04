from pydantic import BaseModel, Field, field_validator

from backend.models.salary_regressions.data.regression_dict import regression_dict




class JobEnum(BaseModel):
    # Only require the category. Enforce via Pydantic (no Python Enum at runtime).
    category: str = Field(
        ...,
        description="One of the predefined categories from the regression dictionary",
        json_schema_extra={"enum": list(regression_dict.keys())},
    )

    @field_validator("category")
    @classmethod
    def category_must_be_known(cls, v: str) -> str:
        if v not in regression_dict:
            raise ValueError("Unknown category: must be one of the regression_dict keys")
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"category": list(regression_dict.keys())[0]},
                {"category": list(regression_dict.keys())[59]},
            ]
        }
    }
