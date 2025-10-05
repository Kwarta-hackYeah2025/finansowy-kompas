from backend.llm.random_nonfunctional_periods.generate_break_simulation import get_nonfunctional_periods


async def generate_periods(birth_year: int, current_year: int, min_events: int = 2, max_events: int = 5):
    return await get_nonfunctional_periods(
        birth_year=birth_year,
        current_year=current_year,
        min_events=min_events,
        max_events=max_events,
    )