"""Allowed values for the daily log. The frontend (services/logs/index.ts) mirrors these lists."""

FLOW = ["Spotting", "Light", "Medium", "Heavy"]
BLOOD_COLOR = ["Bright Red", "Dark Red", "Brown", "Pink"]
CLOT_SIZE = ["Small", "Medium", "Large"]
CRAMPS = ["None", "Mild", "Moderate", "Severe"]
MOOD = ["Happy", "Calm", "Neutral", "Irritable", "Sad"]
ENERGY = ["Low", "Moderate", "High"]
LIBIDO = ["Low", "Medium", "High"]
MUCUS = ["Dry", "Sticky", "Creamy", "Watery", "Egg white"]
LH_TEST = ["Negative", "Low", "High", "Peak"]
SLEEP = ["Poor", "Fair", "Good", "Excellent"]
LEVEL = ["None", "Mild", "Moderate", "High"]  # fatigue, cravings
SYMPTOMS = [
    "headache", "bloating", "fatigue", "backPain", "breastTenderness",
    "acne", "nausea", "cravings", "insomnia", "anxiety",
]
PRODUCT_SIZES = {
    "Pad": ["Small", "Medium", "Large", "Overnight"],
    "Tampon": ["Light", "Regular", "Super"],
    "Menstrual cup": ["Small", "Medium", "Large"],
    "Other": [],
}

# API (camelCase) name -> model attribute
FIELD_MAP = {
    "flow": "flow",
    "bloodColor": "blood_color",
    "clotsPresent": "clots_present",
    "clotSize": "clot_size",
    "cramps": "cramps",
    "painScore": "pain_score",
    "symptoms": "symptoms",
    "mood": "mood",
    "energy": "energy",
    "libido": "libido",
    "cervicalMucus": "cervical_mucus",
    "bbtCelsius": "bbt_celsius",
    "bbtTime": "bbt_time",
    "lhTest": "lh_test",
    "intercourse": "intercourse",
    "sleep": "sleep",
    "fatigue": "fatigue",
    "cravings": "cravings",
    "waterMl": "water_ml",
    "steps": "steps",
    "weightKg": "weight_kg",
    "products": "products",
    "notes": "notes",
}
LIST_FIELDS = {"symptoms", "products"}
