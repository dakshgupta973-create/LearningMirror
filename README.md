# LearningMirror

**A free, multilingual AI screening tool that helps Indian parents notice possible signs of Specific Learning Difficulties (SLDs) in children aged 5–10 — no specialist, no cost, no login.**

Built for the AI Fellowship for Global Young Innovators 2026 (The Innovation Story).

## The problem

10–15% of school-age children in India have an SLD (dyslexia, dysgraphia, dyscalculia), but fewer than 5% are ever diagnosed. Professional screening costs ₹3,000–15,000, requires a psychologist, and is mostly available only in cities. The critical intervention window (ages 6–12) closes while families search for answers.

## Research: Multi-Modal Fusion Feasibility Study

This repository also contains the research behind LearningMirror, in the study_outputs/ folder. The study tests whether combining three weak learning-related signals — handwriting, oral reading, and reaction time — screens for learning-disability risk more effectively than any single signal alone. Using a real public handwriting dataset (Drotár & Dobeš 2020, 120 children) plus two literature-grounded synthetic modalities, the multi-modal fusion model reached AUC 0.842 versus 0.754 for the best single modality (DeLong test, p = 0.044), and reduced missed at-risk children (false negatives) from 40.4% to 29.8% at an equal false-alarm rate. Explainable AI (SHAP) attributes the result 50% to handwriting, 31% to oral reading, and 19% to reaction time. The folder includes the full paper, all code, figures, and the trained models (study_outputs/models/). This is a feasibility/methodology study and a screening tool only — not a diagnostic tool. The oral-reading and reaction-time data are synthetic, so results demonstrate the method, not a validated clinical claim.

## How it works

1. **Common core** — the parent answers 6 general observation questions. No disorder is named anywhere before the result, to avoid biasing the parent.
2. **AI router** — an AI reads those answers and silently selects the most relevant question set: A (reading/dyslexia), B (writing/dysgraphia), C (maths/dyscalculia) or D (attention/ADHD-linked). Rule-based fallback if offline.
3. **Focused set** — 8 questions, answered Always / Often / Sometimes / Never (scored 3/2/1/0).
4. **Objective activity** — one machine-measured task per SLD:
   - Reading: timed read-aloud → words-correct-per-minute vs age norms
   - Writing: handwriting photo → **custom CNN** (see below) + vision-model analysis
   - Maths: timed number game → response times + error patterns
   - Attention: 30-second go/no-go tap game → reaction-time variability, false taps
5. **Result** — plain-language, strengths-first screening result with home steps, free helplines (Tele MANAS 14416, KIRAN, Childline 1098), and a reminder to re-check after 8–12 weeks. Always framed as "patterns often linked with…", never a diagnosis.
See study_outputs/ for the multi-modal fusion research (paper, code, results).

## The trained model

`tfjs_model/` contains a CNN trained on the [Synthetic Dyslexia Handwriting Dataset](https://www.kaggle.com/datasets/michaelfink0923/synthetic-dyslexia-handwriting-dataset) (~138,000 letters: Normal / Reversal / Corrected; Apache 2.0). **93% validation accuracy** (per-class F1 0.91–0.94). It runs fully in the browser via TensorFlow.js — the child's handwriting never leaves the device. Training code: `LearningMirror_Train_Handwriting_Model.ipynb` (Google Colab, ~40 min on a T4 GPU).

## Languages

Dropdown with all 22 scheduled languages of India + English. Hindi and English are hand-written; other languages are AI-translated on first selection and cached locally.

## Running it

Any static web server works. Locally:

```
python3 -m http.server 8000
```

then open http://localhost:8000. On first AI use, the site asks for an Anthropic API key, which is stored only in the browser (never in this repository).

## Files

| File | What it is |
|---|---|
| `index.html` | Screens/skeleton |
| `style.css` | Styling (mobile-first, low-bandwidth) |
| `config.js` | Model name + key placeholder |
| `questions.js` | All questions & text, grounded in SLD-SQ, BCSLD, DALI, CLDQ, Shaywitz, DSM-5 |
| `app.js` | Flow, AI router, scoring, tasks, CNN inference |
| `tfjs_model/` | Trained handwriting CNN (browser format) |
| `LearningMirror_Train_Handwriting_Model.ipynb` | Model training notebook |
| `LearningMirror_QuestionBank_v2.1_Ages5-10.docx` | Question bank with clinical grounding & sources |

## Disclaimer

LearningMirror is a screening aid, not a clinical or diagnostic tool. If you are concerned about a child, please speak to a qualified educational psychologist.
