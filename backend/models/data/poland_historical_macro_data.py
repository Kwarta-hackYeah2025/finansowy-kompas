from decimal import Decimal

poland_macro_data = {
    "2005": (
        Decimal(0.021),
        Decimal(0.018),
        Decimal(0.039),
        Decimal(0.029),
    ),  # Low inflation period
    "2006": (Decimal(0.013), Decimal(0.022), Decimal(0.035), Decimal(0.026)),
    "2007": (Decimal(0.025), Decimal(0.025), Decimal(0.050), Decimal(0.038)),
    "2008": (Decimal(0.043), Decimal(0.020), Decimal(0.063), Decimal(0.047)),
    "2009": (Decimal(0.035), Decimal(0.015), Decimal(0.050), Decimal(0.038)),
    "2010": (Decimal(0.026), Decimal(0.018), Decimal(0.044), Decimal(0.033)),
    "2011": (Decimal(0.043), Decimal(0.017), Decimal(0.060), Decimal(0.045)),
    "2012": (Decimal(0.037), Decimal(0.012), Decimal(0.049), Decimal(0.037)),
    "2013": (Decimal(0.009), Decimal(0.015), Decimal(0.024), Decimal(0.018)),
    "2014": (
        Decimal(0.000),
        Decimal(0.018),
        Decimal(0.018),
        Decimal(0.014),
    ),  # Near-zero inflation
    "2015": (
        Decimal(-0.009),
        Decimal(0.020),
        Decimal(0.011),
        Decimal(0.008),
    ),  # Deflation year
    "2016": (Decimal(-0.006), Decimal(0.022), Decimal(0.016), Decimal(0.012)),
    "2017": (Decimal(0.020), Decimal(0.024), Decimal(0.044), Decimal(0.033)),
    "2018": (Decimal(0.016), Decimal(0.028), Decimal(0.044), Decimal(0.033)),
    "2019": (Decimal(0.023), Decimal(0.030), Decimal(0.053), Decimal(0.040)),
    "2020": (
        Decimal(0.034),
        Decimal(0.008),
        Decimal(0.042),
        Decimal(0.032),
    ),  # COVID impact
    "2021": (
        Decimal(0.051),
        Decimal(-0.010),
        Decimal(0.041),
        Decimal(0.031),
    ),  # High inflation begins
    "2022": (
        Decimal(0.144),
        Decimal(-0.021),
        Decimal(0.123),
        Decimal(0.092),
    ),  # Peak inflation
    "2023": (
        Decimal(0.115),
        Decimal(0.011),
        Decimal(0.126),
        Decimal(0.095),
    ),  # Still elevated
    "2024": (
        Decimal(0.037),
        Decimal(0.045),
        Decimal(0.082),
        Decimal(0.062),
    ),  # Moderating inflation
}
