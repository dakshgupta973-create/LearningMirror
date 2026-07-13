"""
LearningMirror feasibility study — full modeling pipeline.

Modalities:
  - handwriting : REAL public data (Drotar & Dobes 2020, Scientific Reports; 120 children)
  - oral-reading: SYNTHETIC, literature-grounded (no public same-child dyslexia reading corpus)
  - reaction-time: SYNTHETIC, literature-grounded (Rello web-game features)

Route 2 (cross-dataset feasibility). A synthetic FUSION cohort links all three
modalities per simulated child so single vs multi-modal can be compared with DeLong.
Everything synthetic is clearly labelled; conclusions on synthetic data are claims
about the METHOD, not about real children.
"""
import numpy as np, pandas as pd, warnings, json
warnings.filterwarnings('ignore')
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, f1_score, recall_score, precision_score, brier_score_loss
from xgboost import XGBClassifier
import scipy.stats as st

RNG = np.random.default_rng(42)
OUT = "/tmp/lm"

# ----------------------------------------------------------------------
# DeLong test for two correlated ROC AUCs (Sun & Xu 2014 fast implementation)
# ----------------------------------------------------------------------
def _compute_midrank(x):
    J = np.argsort(x); Z = x[J]; N = len(x); T = np.zeros(N)
    i = 0
    while i < N:
        j = i
        while j < N and Z[j] == Z[i]: j += 1
        T[i:j] = 0.5*(i+j-1)+1
        i = j
    T2 = np.empty(N); T2[J] = T
    return T2

def delong_auc_var(y_true, scores):
    # scores: array (k_models, n)
    order = (-y_true).argsort()  # positives first via label 1
    label1 = y_true[order]==1
    m = int(np.sum(y_true==1)); n = int(np.sum(y_true==0))
    pos = scores[:, y_true==1]; neg = scores[:, y_true==0]
    k = scores.shape[0]
    tx = np.array([_compute_midrank(pos[r]) for r in range(k)])
    ty = np.array([_compute_midrank(neg[r]) for r in range(k)])
    tz = np.array([_compute_midrank(np.concatenate([pos[r],neg[r]])) for r in range(k)])
    aucs = (tz[:, :m].sum(axis=1)/m - (m+1)/2)/n
    v01 = (tz[:, :m]-tx)/n
    v10 = 1 - (tz[:, m:]-ty)/m
    sx = np.cov(v01); sy = np.cov(v10)
    sx = np.atleast_2d(sx); sy = np.atleast_2d(sy)
    delongcov = sx/m + sy/n
    return aucs, delongcov

def delong_test(y_true, s1, s2):
    y_true = np.asarray(y_true); scores = np.vstack([s1, s2])
    aucs, cov = delong_auc_var(y_true, scores)
    L = np.array([[1, -1]])
    var = L @ cov @ L.T
    z = (aucs[0]-aucs[1]) / np.sqrt(var[0,0]+1e-12)
    p = 2*st.norm.sf(abs(z))
    return float(aucs[0]), float(aucs[1]), float(z), float(p)

def auc_ci(y, s):
    y=np.asarray(y); a,cov = delong_auc_var(y, np.vstack([s,s]))
    se = np.sqrt(cov[0,0]); auc=a[0]
    return auc, max(0,auc-1.96*se), min(1,auc+1.96*se)

# ----------------------------------------------------------------------
# Load REAL handwriting features
# ----------------------------------------------------------------------
hw = pd.read_csv(f"{OUT}/handwriting_features.csv")
y = hw['label'].values
hw_feats = [c for c in hw.columns if c not in ('ID','label')]
Xhw = hw[hw_feats].values
N = len(hw)
print(f"[REAL] handwriting: {N} children, {len(hw_feats)} features, "
      f"{y.sum()} dysgraphia / {N-y.sum()} typical")

# ----------------------------------------------------------------------
# SYNTHETIC oral-reading & reaction-time, conditioned on the SAME labels y
# so the fusion cohort is one child = all three modalities (Route 2 simulation).
#
# DESIGN (avoids the synthetic-data pitfall of trivially separable classes):
# The brief's premise is WEAK signals. Each modality is a noisy read-out of a
# per-child latent "risk severity" L_m. L_m = signal*(y-centred) + shared common
# factor + large modality noise, so:
#   (a) each single modality alone is only modestly predictive (AUC ~0.68-0.78),
#   (b) features WITHIN a modality are correlated (a shared latent), so they do
#       not independently stack to perfection,
#   (c) modalities are partially independent, leaving room for fusion to help.
# ----------------------------------------------------------------------
def synth_modality(y, specs, signal, latent_noise, rng, common=None):
    yc = (y - y.mean())
    L = signal*yc + rng.normal(0, latent_noise, len(y))          # per-child latent
    if common is not None: L = L + 0.35*common                    # shared cross-modality factor
    L = (L - L.mean())/L.std()
    cols={}
    for name,(mu0,mu1,sd,load) in specs.items():
        # each feature = midpoint + loading*latent*(gap) + independent feature noise
        gap = (mu1-mu0)
        cols[name] = (mu0+mu1)/2 + load*L*gap*0.5 + rng.normal(0, sd, len(y))
    return pd.DataFrame(cols)

common = RNG.normal(0,1,N)   # a weak factor shared across modalities (realism)

# oral reading: risk kids read slower, more pauses/errors (specs: mu0,mu1,noise_sd,loading)
oral_specs = {
 'reading_wpm':        (110, 78, 22, 1.0),
 'accuracy_pct':       (97, 88, 5, 0.9),
 'pause_rate_permin':  (4, 9, 3.2, 0.8),
 'hesitations_permin': (2, 6, 2.6, 0.7),
 'errors_permin':      (1.5, 5, 2.3, 0.8),
 'mean_pause_ms':      (280, 520, 160, 0.7),
 'pitch_sd':           (28, 36, 9, 0.5),
 'articulation_rate':  (4.2, 3.3, 0.8, 0.8),
}
rt_specs = {
 'rt_mean_ms':      (620, 760, 150, 0.9),
 'rt_sd_ms':        (150, 260, 95, 1.0),   # intra-individual variability hallmark
 'rt_cv':           (0.24, 0.34, 0.09, 0.9),
 'accuracy':        (0.92, 0.80, 0.09, 0.8),
 'misses':          (3, 8, 3.6, 0.7),
 'clicks_total':    (40, 52, 11, 0.5),
 'lapses_gt1s':     (2, 6, 3.0, 0.8),
}
# signal strengths tuned so single-modality AUC lands in a realistic weak range
oral = synth_modality(y, oral_specs, signal=1.15, latent_noise=1.15, rng=RNG, common=common)
rt   = synth_modality(y, rt_specs,   signal=1.20, latent_noise=1.20, rng=RNG, common=common)
oral.insert(0,'label',y); rt.insert(0,'label',y)
oral.to_csv(f"{OUT}/oral_features_SYNTHETIC.csv", index=False)
rt.to_csv(f"{OUT}/reaction_features_SYNTHETIC.csv", index=False)
Xor = oral.drop(columns='label').values
Xrt = rt.drop(columns='label').values
print(f"[SYNTHETIC] oral-reading: {Xor.shape[1]} feats | reaction-time: {Xrt.shape[1]} feats")

# ----------------------------------------------------------------------
# Model builders + honest CV out-of-fold predictions
# ----------------------------------------------------------------------
def logreg():
    return Pipeline([('imp',SimpleImputer()),('sc',StandardScaler()),
                     ('clf',LogisticRegression(max_iter=2000,C=0.5))])
def xgb():
    return Pipeline([('imp',SimpleImputer()),
                     ('clf',XGBClassifier(n_estimators=180, max_depth=3, learning_rate=0.05,
                        subsample=0.9, colsample_bytree=0.8, reg_lambda=2.0,
                        eval_metric='logloss', random_state=0))])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=7)
def oof(model_fn, X, y):
    return cross_val_predict(model_fn(), X, y, cv=cv, method='predict_proba')[:,1]

# single-modality out-of-fold scores (XGBoost primary, LogReg baseline)
scores = {}
for name,X in [('handwriting',Xhw),('oral',Xor),('reaction',Xrt)]:
    scores[f'{name}_xgb']    = oof(xgb, X, y)
    scores[f'{name}_logreg'] = oof(logreg, X, y)

# ----------------------------------------------------------------------
# FUSION
# early fusion: concatenate all features -> one model
# late/weighted fusion: combine per-modality XGB scores
# ----------------------------------------------------------------------
Xall = np.hstack([Xhw, Xor, Xrt])
scores['fusion_early_xgb']    = oof(xgb, Xall, y)
scores['fusion_early_logreg'] = oof(logreg, Xall, y)

s_hw, s_or, s_rt = scores['handwriting_xgb'], scores['oral_xgb'], scores['reaction_xgb']
scores['fusion_late_mean'] = (s_hw+s_or+s_rt)/3
# weighted late fusion: weight by single-modality CV AUC
w = np.array([roc_auc_score(y,s) for s in (s_hw,s_or,s_rt)]); w=w/w.sum()
scores['fusion_late_weighted'] = w[0]*s_hw + w[1]*s_or + w[2]*s_rt
# stacked fusion: meta LogReg on the 3 scores
meta_X = np.vstack([s_hw,s_or,s_rt]).T
scores['fusion_stacked'] = oof(logreg, meta_X, y)

# ----------------------------------------------------------------------
# Metrics table
# ----------------------------------------------------------------------
def fn_rate_at_sens(y,s,target_sens=0.90):
    # threshold giving >= target sensitivity; report resulting FN & FP rates
    thr = np.quantile(s[y==1], 1-target_sens)
    pred = (s>=thr).astype(int)
    tp=((pred==1)&(y==1)).sum(); fn=((pred==0)&(y==1)).sum()
    fp=((pred==1)&(y==0)).sum(); tn=((pred==0)&(y==0)).sum()
    sens=tp/(tp+fn); spec=tn/(tn+fp); fnr=fn/(tp+fn)
    return thr, sens, spec, fnr, fp/(fp+tn)

rows=[]
for name,s in scores.items():
    auc,lo,hi = auc_ci(y,s)
    pred = (s>=0.5).astype(int)
    thr,sens,spec,fnr,fpr = fn_rate_at_sens(y,s,0.90)
    rows.append(dict(model=name, AUC=round(auc,3), CI_low=round(lo,3), CI_high=round(hi,3),
        F1=round(f1_score(y,pred),3), recall=round(recall_score(y,pred),3),
        precision=round(precision_score(y,pred),3), brier=round(brier_score_loss(y,s),3),
        FN_rate_at90sens=round(fnr,3), FP_rate_at90sens=round(fpr,3)))
res = pd.DataFrame(rows).sort_values('AUC', ascending=False)
res.to_csv(f"{OUT}/results_metrics.csv", index=False)
print("\n=== RESULTS (5-fold out-of-fold) ===")
print(res.to_string(index=False))

# ----------------------------------------------------------------------
# DeLong: best fusion vs best single modality
# ----------------------------------------------------------------------
single_models = ['handwriting_xgb','handwriting_logreg','oral_xgb','oral_logreg','reaction_xgb','reaction_logreg']
fusion_candidates = ['fusion_early_xgb','fusion_early_logreg','fusion_late_weighted','fusion_stacked','fusion_late_mean']
single_best = max(single_models, key=lambda k: roc_auc_score(y,scores[k]))
fusion_best = max(fusion_candidates, key=lambda k: roc_auc_score(y,scores[k]))
a1,a2,z,p = delong_test(y, scores[fusion_best], scores[single_best])
print(f"\n=== DeLong: {fusion_best} ({a1:.3f}) vs {single_best} ({a2:.3f}) ===")
print(f"z = {z:.3f}, two-sided p = {p:.4f}  -> "
      f"{'SIGNIFICANT' if p<0.05 else 'not significant'} at alpha=0.05")

# FN reduction at MATCHED specificity (equal false-alarm rate) -- brief's headline metric.
def sens_at_spec(y,s,target_spec=0.80):
    thr = np.quantile(s[y==0], target_spec)     # threshold giving ~target specificity
    pred=(s>=thr).astype(int)
    tp=((pred==1)&(y==1)).sum(); fn=((pred==0)&(y==1)).sum()
    return tp/(tp+fn), fn/(tp+fn)   # sensitivity, FN rate
sens_fuse, fnr_fuse   = sens_at_spec(y,scores[fusion_best],0.80)
sens_single, fnr_single = sens_at_spec(y,scores[single_best],0.80)
print(f"\n=== At matched specificity 0.80 (equal false-alarm rate) ===")
print(f"  best single ({single_best}): sensitivity={sens_single:.3f}, FN rate={fnr_single:.3f}")
print(f"  best fusion ({fusion_best}): sensitivity={sens_fuse:.3f}, FN rate={fnr_fuse:.3f}")
print(f"  -> false negatives reduced by {(fnr_single-fnr_fuse)*100:.1f} percentage points")

# ----------------------------------------------------------------------
# Missing-modality robustness: drop each modality, re-run late-weighted fusion
# ----------------------------------------------------------------------
print("\n=== Missing-modality robustness (late-weighted fusion) ===")
combos = {'all three': (s_hw,s_or,s_rt),
          'no handwriting': (s_or,s_rt),
          'no oral': (s_hw,s_rt),
          'no reaction': (s_hw,s_or)}
robust={}
for k,ss in combos.items():
    fused = np.mean(np.vstack(ss),axis=0)
    au=roc_auc_score(y,fused); robust[k]=round(au,3)
    print(f"  {k:16s} AUC={au:.3f}")

summary = dict(
    n=N, n_pos=int(y.sum()), n_neg=int(N-y.sum()),
    single_best=single_best, single_best_auc=round(roc_auc_score(y,scores[single_best]),3),
    fusion_best=fusion_best, fusion_best_auc=round(roc_auc_score(y,scores[fusion_best]),3),
    delong_z=round(z,3), delong_p=round(p,4),
    fn_rate_single=round(fnr_single,3), fn_rate_fusion=round(fnr_fuse,3),
    robustness=robust)
json.dump(summary, open(f"{OUT}/summary.json","w"), indent=2)
print("\nSaved: results_metrics.csv, summary.json, *_features*.csv")
PY_END = True
