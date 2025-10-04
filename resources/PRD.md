# Zakres MVP — Aplikacja Planowania Emerytalnego — dokument wymagań projektowych (PRD)

> Projekt 24-godzinny na hackaton HackYeah 2025

## Opis zadania

Designing an original and thought-provoking solution to the Hackaton challenge:
Financial security in the future is one of the greatest challenges of modern society.

Many people do not consider how their career and life choices will affect their quality of life after retirement.
The lack of awareness about future pension levels often makes it difficult for younger generations to assess their
long-term situation.

Demographic changes, life expectancy, inflation, and breaks in employment are just some of the factors that
significantly impact financial stability in later years. How can we make the idea of retirement more tangible,
understandable, and accessible to everyone?

How can citizens be encouraged to see how today’s decisions shape their tomorrow?
As part of this challenge, participants will have the opportunity to address these questions and seek innovative and
engaging ways to tackle the problem.

Sponsor zadania: ZUS

---

## Wybór technologii

- Hosting: `Vercel` (szybki deployment, darmowy hosting na szybkie MVP na czas hackatonu)
- Frontend: SPA z użyciem `Recharts` (`React`, `React Router`, `Redux`, `TypeScript`, `Tailwind`, `shadcn`/`Radix`,
  `Tanstack Query` itp.)
- Backend: `FastAPI`, `Pandas`/`Numpy` do modeli matematycznych i procesowania danych
- DB (optional): MongoDB (MongoDB Atlas na Vercel)

---

## MODUŁ 1: Autoryzacja i profil użytkownika (opcjonalne)

**Cel modułu:** Umożliwienie użytkownikowi bezpiecznego dostępu do aplikacji i podstawowej personalizacji (tylko
najprostsza implementacja)

**Funkcjonalności:**

- Logowanie przez konto Google (jedyna metoda autoryzacji w MVP)
- Automatyczne utworzenie profilu przy pierwszym logowaniu
- Przechowywanie podstawowych danych: wiek, lokalizacja (miasto), branża zawodowa
- Możliwość wylogowania z aplikacji

**Wartość dla użytkownika:** Szybki start bez konieczności wypełniania długich formularzy — wystarczy jedno kliknięcie.

---

## MODUŁ 2: Inteligentne domyślne założenia

**Cel modułu:** Redukcja barier wejścia poprzez automatyczne wypełnienie kluczowych parametrów na podstawie
minimalnych danych.

**Funkcjonalności:**

- Automatyczne oszacowanie wynagrodzenia na podstawie: wieku, lokalizacji, branży
- Domyślne założenia kosztów życia według wybranego miasta
- Predefiniowane parametry emerytalne (wiek emerytalny, składki ZUS)
- Możliwość zmiany wszystkich automatycznie uzupełnionych wartości

**Wartość dla użytkownika:** Użytkownik widzi pierwszą projekcję w 30 sekund, bez wypełniania 20 pól formularza.

---

## MODUŁ 3: Ilustracja inflacji

**Cel modułu:** Uzmysłowić użytkownikom (zaczynającym życie zawodowe) realia inflacji i fakt, iż pieniądze trzymane
na koncie efektywnie znikają w czasie nawet w ramach kont oszczędnościowych czy lokat.

**Funkcjonalności:**

- spadek środków na koncie w czasie (lub na wykresie)
- Wzrost cen podstawowych produktów i atrakcji (podróże, sprzęt, etc.) - najlepiej potrzebne i pożądane rzeczy
  codzienne,
  o których nie myśli się, że mogą mocno zdrożeć

**Wartość dla użytkownika:** Moduł pozwala użytkownikowi zrozumieć rolę inwestowania w przeciwdziałaniu inflacji.

## MODUŁ 4: Kalkulator podstawowych przewidywań

**Cel modułu:** Pokazanie użytkownikowi realistycznej prognozy jego sytuacji emerytalnej.

**Funkcjonalności:**

- Obliczanie przyszłego kapitału emerytalnego (ZUS I filar)
- Szacowanie przyszłej emerytury miesięcznej według formuły ZUS (ale bez wypełniania miliarda pól)
- Uwzględnienie inflacji i wzrostu wynagrodzeń
- Porównanie przyszłej emerytury z obecnym wynagrodzeniem (stopa zastąpienia)

**Wartość dla użytkownika:** Zrozumienie skali problemu -
,,Za 40 lat otrzymam emeryturę stanowiącą tylko 27% mojej dzisiejszej pensji."

## MODUŁ 5: Podstawy inwestowania

**Cel modułu:** Pokazanie użytkownikowi możliwości inwestowania w ramach II i III filaru emerytalnego.

**Funkcjonalności:**

- Zwrot na obligacjach państwowych (w połączeniu z ilustracją małego ryzyka, w przeciwieństwie do np.
  inwestowania w akcje)
- PPK, IKE/IKZE jako obejście podatku Belki (realna korzyść i opportunity cost, jeśli nie wpłacamy co roku do IKE/IKZE)

**Wartość dla użytkownika:** Pokazanie wpływu podatku Belki na długoterminowe oszczędzanie — realia procentu składanego.

---

## MODUŁ 6: Interaktywna oś czasu życia

**Cel modułu:** Stworzenie emocjonalnego połączenia z przyszłością poprzez wizualizację życia użytkownika.

**Funkcjonalności:**

- Przewijalna/przeciągalna oś czasu od obecnego wieku do 90 lat
- Wizualizacja akumulacji kapitału na wykresie liniowym (`recharts`)
- Kolorowe wyróżnienie faz: akumulacja (zielony) kontra emerytura (niebieski)
- Animowane przejścia między latami przy przewijaniu
- Wyświetlanie kluczowych danych przy każdym roku: wiek, kapitał, miesięczna emerytura (jeśli na emeryturze)

**Wartość dla użytkownika:** ,,Aha moment" - przeciągam slider na wiek 67 i widzę konkretne liczby, nie abstrakcję.

---

## MODUŁ 7: Zdjęcie lub kamerka pokazująca siebie starzejącego się

**Cel modułu:** Stworzenie emocjonalnego połączenia z przyszłym ja.

**Funkcjonalności:**

- Badania pokazują, że młodzi ludzie mają emocjonalny stosunek do przyszłych siebie taki, jak dla obcych ludzi —
  przybliżenie im samych siebie z przyszłości pozwala zachęcić do inwestowania (jest na to badanie!)
- Można powiązać ten moduł z modułem 6 i osią czasu

**Wartość dla użytkownika:** ,,Przyszły ja" staje się bliższy i perspektywa życia z oszczędności staje się bardziej
realna na emocjonalnym poziomie.

---

## MODUŁ 8: Karty scenariuszy ,,Co jeśli?"

**Cel modułu:** Umożliwienie eksperymentowania z różnymi decyzjami życiowymi w czasie rzeczywistym.

**Funkcjonalności:**

- Zestaw 5-7 interaktywnych sliderów:
    - Wiek przejścia na emeryturę (60-75 lat)
    - Miesięczne wydatki na emeryturze (3k-10k PLN)
    - Dodatkowe oszczędności (PPK/IKZE, 0-2000 PLN/mies.)
    - Duży jednorazowy wydatek (np. mieszkanie, 0-500k PLN)
    - Praca na pół etatu po przejściu na emeryturę (0-3k PLN/mies.)
- Natychmiastowa aktualizacja wykresu po zmianie wartości (debouncing)
- Widok ,,przed/po" porównujący scenariusze
- Kolorowe oznaczenie czy cel został osiągnięty (zielony/czerwony)

**Wartość dla użytkownika:** Eksperymentowanie bez konsekwencji - Co się stanie, jeśli będę pracował 3 lata dłużej?
O, zyskam 300k PLN!"

---

## MODUŁ 9: Planowanie finansów poprzez zaplanowanie stylu życia

**Cel modułu:** Odwrócenie tradycyjnego podejścia — zaczynamy od marzeń, nie od liczb.

**Funkcjonalności:**

- Galeria aktywności emerytalnych z obrazkami:
    - Podróże zagraniczne (koszt: 20k PLN/rok)
    - Hobby i rekreacja (5k PLN/rok)
    - Zakup mieszkania (~1 mln PLN)
    - Opieka zdrowotna w przypadku chorób/starości (7k PLN/rok)
- Wybór aktywności przez kliknięcie (wielokrotny wybór możliwy)
- Automatyczne obliczenie całkowitego kosztu wybranego stylu życia
- Wyświetlenie luki: ,,Jesteś na dobrej drodze do 1.5M PLN, ale Twój wymarzony styl życia wymaga 1.8M PLN"
- Sugestie jak zamknąć lukę: ,,Oszczędzaj dodatkowo 800 PLN/mies." lub ,,Pracuj 2 lata dłużej"

**Wartość dla użytkownika:** Emocjonalne zaangażowanie — nie planuję ,,emerytury",
planuję ,,rejsy po Morzu Śródziemnym i grę w golfa."

---

## MODUŁ 10: Grywalizacja oszczędzania

**Cel modułu:** Gamifikacja procesu oszczędzania poprzez system punktów i osiągnięć.

**Funkcjonalności:**

- Obliczanie wyniku 0-100 na podstawie:
    - Stopy oszczędzania (waga 40%)
    - Czasu do emerytury (20%)
    - Dywersyfikacji oszczędności (15%)
    - Funduszu awaryjnego (15%)
    - Wskaźnika zadłużenia (10%)
- Wizualizacja wyniku z gradientem kolorów i animowaną ikoną/emoji
- System osiągnięć:
    - Odznaki za kamienie milowe (,,Pierwszy miesiąc oszczędzania! 🏆")
    - Pasy poziomu (,,Nowicjusz Planowania" → ,,Świadomy Oszczędzający" → ,,Gotowy na Emeryturę")
    - Serie (consecutive days/months)
- Wzmocnienie pozytywne: ,,Twój wynik wzrósł z 62 do 68! Świetna robota!"

**Wartość dla użytkownika:** Natychmiastowa gratyfikacja i motywacja do kontynuacji — efekt dopaminy po każdej poprawie.

---

## MODUŁ 11: Edukacyjne Podpowiedzi

**Cel modułu:** Subtelne edukowanie użytkownika bez przytłaczania informacjami.

**Funkcjonalności:**

- Kontekstowe dymki ,,?" przy kluczowych terminach
- Krótkie wyjaśnienia (2-3 zdania) po najechaniu/kliknięciu
- Progresywne ujawnianie: podstawowe → średnie → zaawansowane wyjaśnienia
- Linki do pełnych artykułów ,,Dowiedz się więcej" (otwierają się w nowej karcie)
- Tematy pokryte:
    - Czym jest ZUS i jak działa formuła NDC?
    - Co to jest PPK i jakie są korzyści podatkowe?
    - Różnica między IKE a IKZE
    - Dlaczego inflacja zjada wartość pieniądza?
    - Co to jest stopa zastąpienia?

**Wartość dla użytkownika:** Nauka przez działanie — dostaję wyjaśnienia dokładnie wtedy, gdy ich potrzebuję, nie
wcześniej.
