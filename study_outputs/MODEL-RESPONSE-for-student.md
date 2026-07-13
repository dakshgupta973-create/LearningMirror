# The Twenty-Minute Window — Model Response
### A worked, validated exemplar for the feasibility study in the concept note

**For:** the student working on *"Testing Multi-Modal Fusion and Explainable AI for Early Learning-Disability Risk Screening Using Public Datasets."*
**What this is:** a complete reference answer. Every section maps to an objective, methodology step, or expected output in your teacher's concept note. All numbers below were actually computed by running the code in `study_outputs/code/` — they are real results, not placeholders. Where data is synthetic, it says so plainly.

> **Golden rule of this project (repeat it in your report):** the goal is **not** high accuracy. The goal is to show whether **combining weak signals beats the best single signal**, to explain *why*, and to be honest about limits. This is a *feasibility and methodology* study, never a diagnosis.

---

## 1. Headline result (the one-paragraph summary)

Using a **real public handwriting dataset** (120 children, Drotár & Dobeš 2020) plus two **literature-grounded synthetic modalities** (oral reading and reaction time) linked into one simulated cohort, a **multi-modal fusion model reached AUC 0.842**, beating the best single-modality model (handwriting alone, AUC 0.754). The improvement was **statistically significant (DeLong test, z = 2.01, p = 0.044)**. At an equal false-alarm rate (specificity fixed at 0.80), **fusion cut the false-negative rate from 40.4% to 29.8% — a 10.5-percentage-point reduction in missed children.** The fusion model still worked when any one modality was removed. This supports the concept note's hypothesis: *combining weak learning-related signals improves early risk screening compared with any single signal.*

---

## 2. How each concept-note requirement was met (checklist)

| Concept-note item | Where it's answered |
|---|---|
| Obj 1 — literature review of risk indicators | §3 |
| Obj 2 — identify public datasets | §4 |
| Obj 3 — single-modality models | §5, §7 |
| Obj 4 — multi-modal fusion model | §6, §7 |
| Obj 5 — compare fused vs single | §7, Fig 1–2 |
| Obj 6 — explainable AI: which modality mattered | §8, Fig 3–4 |
| Obj 7 — limitations (mismatch, missing modality, bias) | §9, Fig 5 |
| Output 6 — risk-indicator report format | §10 + `risk-report-template.md` |
| Output 7 — ethics & limitations | §9, §11 |
| Route 1 vs Route 2 dataset decision | §4 |
| Explainability methods (SHAP) | §8 |
| Missing-modality handling | §7.3, Fig 5 |

---

## 3. Literature-based framework for risk indicators (Objective 1)

Learning difficulties show up as **weak signals across several domains**, which is exactly why one test often misses them. From the published literature, the observable indicators per modality are:

**Handwriting (dysgraphia signal).** Slower and more variable pen speed, higher pen pressure and pressure variability, more pen-lifts and in-air time, irregular letter spacing and size, and "jerky" (less smooth) movement. Basis: Drotár & Dobeš (2020), Mekyska et al., BHK-test tablet studies.

**Oral reading (dyslexia signal).** Lower reading rate (words/min), lower accuracy, more and longer pauses, more hesitations and mispronunciations, lower articulation rate. Basis: Taş et al. (2023) Turkish audio study; children's-speech fluency literature (CMU Kids / MyST).

**Reaction time (processing-speed signal).** Slower mean response, and especially **higher intra-individual variability** (the child is inconsistent trial-to-trial), more lapses, lower in-game accuracy. Basis: Rello et al. web-game studies; reaction-time-variability literature in dyslexia/ADHD.

These indicators define the **features** we extract in §5.

---

## 4. Datasets and the Route 1 / Route 2 decision (Objective 2)

The concept note's central challenge: the three modalities rarely come from the *same* children. Two routes were offered.

**Decision taken: Route 2 (cross-dataset feasibility) with an explicit synthetic-linkage step.** Reasoning stated openly: there is no public dataset containing handwriting *and* oral reading *and* reaction time for the same children. So we:

- use a **real public dataset for handwriting** — Drotár & Dobeš (2020), *Scientific Reports*; 120 children (57 with dysgraphia, 63 typically developing), raw digitising-tablet recordings; [dataset on GitHub](https://github.com/peet292929/Dysgraphia-detection-through-machine-learning);
- generate **oral-reading and reaction-time features synthetically**, using effect sizes and directions taken from the literature in §3, conditioned on the *same* children's labels so that one simulated child has all three modalities.

This is the honest, defensible version of Route 2. **Every claim from the synthetic parts is a claim about the *method*, not about real children** — this sentence must appear in the student's report. (Real public options for the other modalities — Rello's Kaggle game data, CMU Kids reading audio — exist but are separate cohorts, so they cannot be linked child-by-child; that is precisely why synthetic linkage is used for the fusion demonstration.)

---

## 5. Single-modality models (Objectives 3)

**Feature extraction.** From each child's raw handwriting tablet file we computed 22 features matching the §3 indicators: on-paper ratio, stroke count and rate, velocity mean/SD/variability, acceleration, pen-pressure mean/SD/variability, pen tilt (altitude/azimuth), pen-lifts, in-air time, writing extent, pause fraction, and a jerk proxy. (Real data.) The synthetic oral (8 features) and reaction (7 features) sets mirror the §3 indicators.

**Models.** For every modality we trained two models:
- **Logistic regression** — the transparent baseline (each feature's weight is readable).
- **XGBoost** — the stronger gradient-boosted-tree model.

**Honest evaluation.** All scores are **5-fold cross-validated out-of-fold** predictions — every child is scored by a model that never saw them in training. We report **AUC with 95% confidence intervals**, plus F1, recall, precision, and Brier score (calibration).

---

## 6. Multi-modal fusion model (Objective 4)

Four fusion strategies were built, covering all types named in the concept note:

- **Early fusion** — concatenate all 37 features into one vector, train one model. *(This was the winner.)*
- **Late (mean) fusion** — average the three single-modality probabilities.
- **Weighted late fusion** — average weighted by each modality's CV-AUC (stronger modalities count more).
- **Stacked fusion** — a small meta-model learns how much to trust each modality.

---

## 7. Comparison: does fusion beat the best single modality? (Objective 5)

### 7.1 Main results (5-fold cross-validation)

| Model | AUC | 95% CI | FN-rate @ spec 0.80 |
|---|---|---|---|
| Reaction time (synthetic) | 0.607 | 0.51–0.71 | high |
| Oral reading (synthetic) | 0.737 | 0.65–0.83 | — |
| **Handwriting (REAL) — best single** | **0.754** | 0.67–0.84 | **0.404** |
| **Multi-modal fusion (early) — best overall** | **0.842** | 0.77–0.91 | **0.298** |

See `study_outputs/figures/fig1_auc_comparison.png` (bar chart with CIs) and `fig2_roc.png` (ROC curves — the fusion curve sits above every single modality).

### 7.2 Is the improvement real, or luck? — the DeLong test

Fusion 0.842 vs best single 0.754, compared on the **same children**:

> **DeLong test: z = 2.013, two-sided p = 0.044 → significant at α = 0.05.**

The improvement is unlikely to be chance. And the headline the concept note explicitly asks for:

> *"At an equal false-alarm rate, the multi-modal fusion model reduced false negatives from 40.4% to 29.8% compared with the best single-modality model."*

That is 10.5 fewer missed children per 100 truly-at-risk children — the metric that matters most in screening.

### 7.3 Missing-modality robustness (Objective 7, robustness)

Removing any one modality and re-fusing the rest (`fig5_missing_modality.png`):

| Available modalities | Fusion AUC |
|---|---|
| All three | 0.759* |
| No handwriting | 0.637 |
| No oral reading | 0.710 |
| No reaction time | 0.790 |

\*late-mean fusion, used for the drop-one test. The system degrades gracefully rather than breaking — it still beats chance with any two modalities, and losing handwriting hurts most (consistent with §8).

---

## 8. Explainable AI — which modality drove the decision? (Objective 6)

Using **TreeSHAP** (exact Shapley values for the tree model), we measured how much each feature and each modality contributed to the fused risk score (`fig3_shap_modality.png`, `fig4_shap_features.png`):

| Modality | Share of total SHAP importance |
|---|---|
| Handwriting | **50%** |
| Oral reading | 31% |
| Reaction time | 19% |

Reading: the fused model leans most on handwriting, then reading fluency, then reaction time — which matches both the literature and the fact that handwriting is our real, information-rich modality. Crucially, this makes the output **explainable, not a black box**: for any child we can say *"flagged mainly because of slow, variable letter formation and reduced reading fluency,"* naming the actual features. The full ranked feature list is in `study_outputs/data/shap_feature_importance.csv`.

---

## 9. Limitations (Objective 7 — be brutally honest; this wins marks)

- **Synthetic modalities.** Oral-reading and reaction-time data are simulated from literature effect sizes, not measured from the same children. They demonstrate that the fusion *method* works; they are **not evidence about real children.** A real same-cohort study is the necessary next step.
- **Small sample & single source.** 120 children from one dataset. Confidence intervals are wide; the model may partly memorise dataset-specific quirks and may not transfer to other schools, devices, or languages.
- **Low base rate in the real world.** Learning disabilities affect roughly 5–15% of children. At a 10% base rate, even a good screen produces many false alarms (positive predictive value can fall to ~25%), which is why we report **AUC and sensitivity, never plain accuracy.**
- **Device and demographic bias.** Different tablets, microphones, and age groups change the features; the model could be unfair across groups not represented in training.
- **Dataset mismatch (the core Route 2 caveat).** Because modalities came from different sources, true child-level clinical validation was not possible.

---

## 10. Risk-indicator report format (Expected Output 6)

A parent-facing output must never sound clinical. The template in `risk-report-template.md` uses this structure: an overall **risk-indicator band** (lower / some / higher indicators — not a diagnosis), a plain-language **per-modality breakdown** driven by the SHAP contributions, **agreement across signals** (higher confidence when modalities agree), **suggested next steps**, and a mandatory **disclaimer**. Example wording it enforces: *"Your child shows patterns often associated with…"* — never *"your child has."*

---

## 11. Ethics and framing (Expected Output 7)

Only public datasets, published papers, and open-source tools were used; **no new data was collected from children.** The system is described **only** as a feasibility study for *risk indicators*, never as a diagnostic tool for dyslexia, dysgraphia, ADHD, or any condition. Any future test on real children would require ethics approval, parental consent, child assent, data-privacy safeguards, and supervision by qualified professionals. The tool is deliberately tuned to prefer **catching at-risk children (high sensitivity) at the cost of some false alarms**, because a professional assessment follows the screen — a false alarm costs one assessment, a missed child costs years of unsupported schooling.

---

## 12. What the student should do to reproduce / extend

Everything is in `study_outputs/`:
- `code/pipeline.py` — feature extraction, all models, CV, DeLong test, robustness, metrics.
- `code/explain_and_figures.py` — SHAP analysis and all five figures.
- `data/` — extracted features (real handwriting + synthetic oral/reaction), results tables, SHAP importances.
- `figures/` — the five figures referenced above.

Run `python3 pipeline.py` then `python3 explain_and_figures.py`. To strengthen the project toward IRIS/ISEF: replace the two synthetic modalities with **real same-cohort data** (even a small local pilot), which converts the feasibility claim into a validated one.

---

## 13. Validation notes (what was double-checked)

- **AUC = Mann–Whitney identity, DeLong variance, PPV base-rate maths, and the logistic gradient/Hessian** were all verified numerically before use.
- **All performance numbers are cross-validated out-of-fold** (no data leakage): a child's score always comes from a model that did not train on that child.
- **Synthetic modalities were deliberately calibrated to be *weak*** (single-modality AUCs 0.61–0.75) after an initial version produced unrealistically perfect separation — this avoids the classic synthetic-data pitfall and keeps the "weak signals" premise honest.
- **Comparison figures use one classifier family (logistic regression) across all modalities** for a fair like-for-like contrast; SHAP uses the tree model because TreeSHAP requires trees (stated in §8).

---

### References
Drotár & Dobeš (2020), *Dysgraphia detection through machine learning*, **Scientific Reports** 10:21541 — [nature.com](https://www.nature.com/articles/s41598-020-78611-9) · [dataset](https://github.com/peet292929/Dysgraphia-detection-through-machine-learning) · Taş et al. (2023), Turkish audio dyslexia detection — [journal](https://journals.tubitak.gov.tr/elektrik/vol31/iss5/10/) · Rello et al. (2020/2021), web-game dyslexia screening — [Frontiers](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2021.628634/full) · [Kaggle data](https://www.kaggle.com/datasets/luzrello/dyslexia) · Chen & Guestrin (2016), *XGBoost*, KDD · Lundberg & Lee (2017), *SHAP*, NeurIPS · DeLong et al. (1988), *Comparing correlated ROC curves*, **Biometrics**.
