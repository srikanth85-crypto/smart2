import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

DATA_DIR = Path(__file__).resolve().parent / "data"
MODEL_PATH = Path(__file__).resolve().parent / "models" / "flood_risk_24h_model.pkl"
CSV_PATH = DATA_DIR / "demo_flood_risk_24h.csv"

AREAS = [
    "Velachery",
    "Pallikaranai",
    "Tambaram",
    "Saidapet",
    "Guindy",
    "Kodambakkam",
    "Madipakkam",
    "Adyar",
    "Sholinganallur",
    "Porur",
]


def generate_demo_data(rows_per_area: int = 200, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    records = []

    for area in AREAS:
        for _ in range(rows_per_area):
            rainfall_1h = rng.integers(10, 90)
            rainfall_3h = rng.integers(20, 120)
            rainfall_6h = rng.integers(35, 180)
            rainfall_12h = rng.integers(50, 220)
            rainfall_24h = rng.integers(60, 260)

            waterlogging = rng.integers(10, 95)
            historical_flood = rng.integers(0, 100)
            elevation = rng.integers(5, 80)
            drainage_efficiency = rng.integers(20, 95)
            urban_density = rng.integers(40, 100)
            slope = rng.integers(2, 35)
            previous_risk = rng.integers(10, 90)

            risk_score = (
                rainfall_24h * 0.32
                + waterlogging * 0.22
                + historical_flood * 0.18
                + (100 - drainage_efficiency) * 0.16
                + urban_density * 0.08
                + (100 - elevation) * 0.04
                + (40 - slope) * 0.02
                + previous_risk * 0.08
            )
            risk_score += rng.normal(0, 8)
            risk_score = max(0, min(100, risk_score))

            if risk_score >= 75:
                risk_label = "SEVERE"
            elif risk_score >= 55:
                risk_label = "HIGH"
            elif risk_score >= 35:
                risk_label = "MODERATE"
            else:
                risk_label = "LOW"

            records.append(
                {
                    "area": area,
                    "rainfall_1h": rainfall_1h,
                    "rainfall_3h": rainfall_3h,
                    "rainfall_6h": rainfall_6h,
                    "rainfall_12h": rainfall_12h,
                    "rainfall_24h": rainfall_24h,
                    "waterlogging": waterlogging,
                    "historical_flood": historical_flood,
                    "elevation": elevation,
                    "drainage_efficiency": drainage_efficiency,
                    "urban_density": urban_density,
                    "slope": slope,
                    "previous_risk": previous_risk,
                    "risk_score_24h": round(risk_score, 2),
                    "risk_label_24h": risk_label,
                }
            )

    df = pd.DataFrame(records)
    return df


def train_model(df: pd.DataFrame):
    feature_columns = [
        "rainfall_1h",
        "rainfall_3h",
        "rainfall_6h",
        "rainfall_12h",
        "rainfall_24h",
        "waterlogging",
        "historical_flood",
        "elevation",
        "drainage_efficiency",
        "urban_density",
        "slope",
        "previous_risk",
    ]

    X = df[feature_columns]
    y = df["risk_label_24h"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    acc = accuracy_score(y_test, predictions)
    print("Model accuracy:", round(acc, 4))
    print(classification_report(y_test, predictions))

    DATA_DIR.mkdir(exist_ok=True)
    MODEL_PATH.parent.mkdir(exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "features": feature_columns}, f)

    print(f"Saved model to: {MODEL_PATH}")
    return model, feature_columns


def predict_sample(model_file: Path = MODEL_PATH):
    with open(model_file, "rb") as f:
        payload = pickle.load(f)

    model = payload["model"]
    features = payload["features"]

    sample = pd.DataFrame(
        [{
            "rainfall_1h": 68,
            "rainfall_3h": 96,
            "rainfall_6h": 134,
            "rainfall_12h": 160,
            "rainfall_24h": 210,
            "waterlogging": 86,
            "historical_flood": 91,
            "elevation": 18,
            "drainage_efficiency": 35,
            "urban_density": 92,
            "slope": 8,
            "previous_risk": 78,
        }]
    )

    prediction = model.predict(sample[features])[0]
    prob = model.predict_proba(sample[features])[0].max()
    print("Sample prediction:", prediction)
    print("Confidence:", round(prob * 100, 2), "%")


if __name__ == "__main__":
    df = generate_demo_data()
    DATA_DIR.mkdir(exist_ok=True)
    df.to_csv(CSV_PATH, index=False)
    print(f"Saved demo data to: {CSV_PATH}")

    train_model(df)
    predict_sample()
