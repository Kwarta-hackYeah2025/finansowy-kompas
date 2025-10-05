from typing import List
import logging
from backend.llm.client import client
from backend.llm.random_nonfunctional_periods import NonFunctionalEvent, NonFunctionalPlan

logger = logging.getLogger(__name__)

async def get_nonfunctional_periods(
    birth_year: int,
    current_year: int,
    min_events: int = 2,
    max_events: int = 5
) -> List[NonFunctionalEvent]:
    """
    Asks the LLM (in Polish) to propose 2–5 realistic periods of breaks or reduced contributions,
    returning a list of NonFunctionalEvent objects (defined by start/end age, basis_zero flag,
    and contrib_multiplier).
    """

    system_prompt = f"""
    Jesteś asystentem, który proponuje realistyczne w Polsce powody i okresy
    braku pracy lub pracy w ograniczonym wymiarze, wpływające WYŁĄCZNIE na składki
    emerytalne i rentowe (E+R) w ZUS.
    
    Ważne zasady (upraszczamy do prostych, zgodnych z logiką ZUS):
    - NIE uwzględniaj: chorobowego, wypadkowego, macierzyńskiego/rodzicielskiego, urlopu wychowawczego,
      ani żadnych świadczeń liczonych odrębnie.
    - Uwzględniaj TYLKO proste przypadki, gdzie łatwo policzyć podstawę:
      * brak tytułu do ubezpieczeń (bezrobocie, umowy wyłącznie o dzieło, wyjazd zagraniczny bez ZUS) -> basis_zero = true
      * praca w niepełnym wymiarze (np. 1/2 etatu), praca dorywcza, niski wymiar czasu -> basis_zero = false i contrib_multiplier 0.3–0.8
    - Zwróć między {min_events} a {max_events} zdarzeń (events).
    - Posługuj się WIEKIEM (lata życia), nie latami kalendarzowymi.
    - Przedziały wieku w formie [start_age, end_age), gdzie 0 <= start_age < end_age (liczby całkowite).
    - Pola zdarzenia:
      * reason: krótki opis (2–4 słowa), np. "bezrobocie", "1/2 etatu", "zagranica bez ZUS".
      * start_age, end_age: całkowite.
      * jeśli brak tytułu -> basis_zero = true (contrib_multiplier będzie traktowany jako 0).
      * jeśli ograniczony wymiar pracy -> basis_zero = false i podaj contrib_multiplier z zakresu 0.3–0.8.
      * kind (opcjonalne) z puli: ["przerwa","zagranica","inne","niepełny etat"].
    - Unikaj dużych nachodzeń; lekkie włożenie krótszego okresu w dłuższy jest dopuszczalne.
    - Pamiętaj: w silniku obliczeń „basis_zero=TRUE” daje składki 0, a przy wielu zdarzeniach w tym samym wieku
      bierzemy minimum z mnożników.
    
    ODPOWIADAJ WYŁĄCZNIE danymi w formacie zgodnym ze schematem NonFunctionalPlan/NonFunctionalEvent (bez komentarzy).
    """.strip()

    user_prompt = (
        f"Osoba urodzona w {birth_year}. Bieżący rok: {current_year}.\n"
        f"Zaproponuj {min_events}–{max_events} okresów (w wieku), które wpływają na brak lub redukcję składek.\n"
        f"Preferuj wiek 18–{min(70, (current_year - birth_year) + 30)}."
    )

    response: NonFunctionalPlan = await client.chat.completions.create(
        response_model=NonFunctionalPlan,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    logger.info("LLM zwrócił plan okresów: %s", response.model_dump())

    events: List[NonFunctionalEvent] = []
    for ev in response.events:
        try:
            start = int(ev.start_age)
            end = int(ev.end_age)
            if end <= start:
                continue

            basis_zero = bool(ev.basis_zero) if ev.basis_zero is not None else False
            m = 0.0 if basis_zero else float(ev.contrib_multiplier or 1.0)
            m = max(0.0, min(1.0, m))

            events.append(NonFunctionalEvent(
                reason=ev.reason.strip(),
                start_age=start,
                end_age=end,
                contrib_multiplier=m,
                basis_zero=basis_zero,
                kind=ev.kind
            ))
        except Exception as e:
            logger.warning("Pominięto zdarzenie z powodu walidacji: %s; ev=%s", e, ev.model_dump())

    events.sort(key=lambda e: (e.start_age, e.end_age))
    return events