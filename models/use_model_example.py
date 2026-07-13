"""
Example: load the saved LearningMirror research models and score a child.
Requires: pip install scikit-learn xgboost joblib pandas numpy
"""
import joblib, json, numpy as np, pandas as pd

manifest = json.load(open("model_manifest.json"))

# Load the fusion model (the best one: AUC 0.842)
fusion = joblib.load("fusion_model.pkl")
feats = manifest["fusion_model"]["features"]   # the 37 feature names, in order
print("Fusion model expects", len(feats), "features:")
print(feats)

# --- To score a child, build a row with those features in the SAME order ---
# Here we just use the average of the training data as a dummy example.
# Replace this with a real child's extracted features.
example = pd.read_csv("../data/handwriting_features.csv").drop(columns=["ID","label"]).mean()
oral   = pd.read_csv("../data/oral_features_SYNTHETIC.csv").drop(columns="label").mean()
react  = pd.read_csv("../data/reaction_features_SYNTHETIC.csv").drop(columns="label").mean()
row = pd.concat([example, oral, react])[feats].values.reshape(1, -1)

risk = fusion.predict_proba(row)[0, 1]
print(f"\nRisk-indicator score for this example child: {risk:.2f}")
print("(0 = lower indicators, 1 = higher indicators — screening only, NOT a diagnosis)")

# You can load the single-modality models the same way:
#   hw = joblib.load("handwriting_model.pkl")
#   hw.predict_proba(<22 handwriting features>)
