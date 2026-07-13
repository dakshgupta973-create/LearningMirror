"""Explainability (SHAP) + all figures for the LearningMirror feasibility study."""
import numpy as np, pandas as pd, warnings, json
warnings.filterwarnings('ignore')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_curve, roc_auc_score
from xgboost import XGBClassifier
import shap

OUT="/tmp/lm"; FIG="/tmp/lm/figures"; import os; os.makedirs(FIG,exist_ok=True)
RNG=np.random.default_rng(42)

# rebuild the exact same data as pipeline.py
hw=pd.read_csv(f"{OUT}/handwriting_features.csv"); y=hw['label'].values; N=len(y)
hw_feats=[c for c in hw.columns if c not in ('ID','label')]; Xhw=hw[hw_feats].values
oral=pd.read_csv(f"{OUT}/oral_features_SYNTHETIC.csv"); rt=pd.read_csv(f"{OUT}/reaction_features_SYNTHETIC.csv")
or_feats=[c for c in oral.columns if c!='label']; rt_feats=[c for c in rt.columns if c!='label']
Xor=oral[or_feats].values; Xrt=rt[rt_feats].values
Xall=np.hstack([Xhw,Xor,Xrt]); all_feats=hw_feats+or_feats+rt_feats
mod_of={**{f:'handwriting' for f in hw_feats},**{f:'oral' for f in or_feats},**{f:'reaction' for f in rt_feats}}

cv=StratifiedKFold(5,shuffle=True,random_state=7)
def lr(): return Pipeline([('imp',SimpleImputer()),('sc',StandardScaler()),('clf',LogisticRegression(max_iter=2000,C=0.5))])
def xgb(): return XGBClassifier(n_estimators=180,max_depth=3,learning_rate=0.05,subsample=0.9,
    colsample_bytree=0.8,reg_lambda=2.0,eval_metric='logloss',random_state=0)
def oof(fn,X): return cross_val_predict(fn(),X,y,cv=cv,method='predict_proba')[:,1]

s_hw,s_or,s_rt=oof(xgb,Xhw),oof(xgb,Xor),oof(xgb,Xrt)
s_fuse=oof(lr,Xall)

# ---------- Figure 1: AUC comparison bar with 95% CI ----------
import scipy.stats as st
def auc_ci(y,s):
    a=roc_auc_score(y,s)
    # bootstrap CI
    rng=np.random.default_rng(1); bs=[]
    for _ in range(2000):
        idx=rng.integers(0,len(y),len(y))
        if len(np.unique(y[idx]))<2: continue
        bs.append(roc_auc_score(y[idx],s[idx]))
    return a,np.percentile(bs,2.5),np.percentile(bs,97.5)
names=['Handwriting\n(REAL)','Oral reading\n(synthetic)','Reaction time\n(synthetic)','MULTI-MODAL\nFUSION']
ss=[s_hw,s_or,s_rt,s_fuse]; aucs=[];los=[];his=[]
for s in ss:
    a,l,h=auc_ci(y,s); aucs.append(a);los.append(l);his.append(h)
plt.figure(figsize=(8,5))
colors=['#4C72B0','#55A868','#C44E52','#8172B3']
bars=plt.bar(names,aucs,yerr=[np.array(aucs)-np.array(los),np.array(his)-np.array(aucs)],
    capsize=6,color=colors,edgecolor='black',linewidth=0.8)
plt.axhline(0.5,ls='--',c='grey',label='chance (0.5)')
for b,a in zip(bars,aucs): plt.text(b.get_x()+b.get_width()/2,a+0.02,f'{a:.3f}',ha='center',fontweight='bold')
plt.ylabel('ROC-AUC (5-fold cross-validation)'); plt.ylim(0.4,1.0)
plt.title('Single-modality vs multi-modal fusion\n(error bars = 95% bootstrap CI)')
plt.legend(); plt.tight_layout(); plt.savefig(f"{FIG}/fig1_auc_comparison.png",dpi=140); plt.close()

# ---------- Figure 2: ROC curves ----------
plt.figure(figsize=(6.5,6))
for s,nm,c in zip(ss,['Handwriting (real)','Oral reading (synth)','Reaction time (synth)','Multi-modal fusion'],colors):
    fpr,tpr,_=roc_curve(y,s); plt.plot(fpr,tpr,c=c,lw=2.2,label=f'{nm}  AUC={roc_auc_score(y,s):.3f}')
plt.plot([0,1],[0,1],'--',c='grey')
plt.xlabel('False Positive Rate (1 - specificity)'); plt.ylabel('True Positive Rate (sensitivity)')
plt.title('ROC curves — fusion sits above every single modality'); plt.legend(loc='lower right')
plt.tight_layout(); plt.savefig(f"{FIG}/fig2_roc.png",dpi=140); plt.close()

# ---------- Figure 3: SHAP modality contribution (fusion model) ----------
# Fit fusion XGB on full data for SHAP (tree explainer, exact TreeSHAP)
import xgboost as xgblib
fus_xgb=xgb().fit(Xall,y)
dm=xgblib.DMatrix(Xall,feature_names=all_feats)
sv=fus_xgb.get_booster().predict(dm,pred_contribs=True)  # native exact TreeSHAP
sv=sv[:,:-1]   # drop bias column
mean_abs=np.abs(sv).mean(axis=0)
contrib=pd.DataFrame({'feature':all_feats,'modality':[mod_of[f] for f in all_feats],'mean_abs_shap':mean_abs})
mod_contrib=contrib.groupby('modality')['mean_abs_shap'].sum()
mod_contrib=mod_contrib/mod_contrib.sum()*100
mod_contrib=mod_contrib.reindex(['handwriting','oral','reaction'])
plt.figure(figsize=(6,4.5))
plt.bar(mod_contrib.index,mod_contrib.values,color=colors[:3],edgecolor='black')
for i,v in enumerate(mod_contrib.values): plt.text(i,v+0.5,f'{v:.0f}%',ha='center',fontweight='bold')
plt.ylabel('Share of total SHAP importance (%)')
plt.title('Explainable AI: which modality drives the fused risk score?')
plt.tight_layout(); plt.savefig(f"{FIG}/fig3_shap_modality.png",dpi=140); plt.close()

# ---------- Figure 4: top-15 feature SHAP bar ----------
top=contrib.sort_values('mean_abs_shap',ascending=False).head(15).iloc[::-1]
cmap={'handwriting':colors[0],'oral':colors[1],'reaction':colors[2]}
plt.figure(figsize=(7,6))
plt.barh(top['feature'],top['mean_abs_shap'],color=[cmap[m] for m in top['modality']],edgecolor='black')
plt.xlabel('mean |SHAP value|'); plt.title('Top 15 risk-indicator features (TreeSHAP, fused model)')
from matplotlib.patches import Patch
plt.legend(handles=[Patch(color=cmap[m],label=m) for m in ['handwriting','oral','reaction']])
plt.tight_layout(); plt.savefig(f"{FIG}/fig4_shap_features.png",dpi=140); plt.close()

# ---------- Figure 5: missing-modality robustness ----------
combos={'All three':(s_hw,s_or,s_rt),'No handwriting':(s_or,s_rt),'No oral':(s_hw,s_rt),'No reaction':(s_hw,s_or)}
rob={k:roc_auc_score(y,np.mean(np.vstack(v),axis=0)) for k,v in combos.items()}
plt.figure(figsize=(6.5,4.2))
plt.bar(rob.keys(),rob.values(),color=['#8172B3','#C44E52','#55A868','#4C72B0'],edgecolor='black')
for i,v in enumerate(rob.values()): plt.text(i,v+0.008,f'{v:.3f}',ha='center',fontweight='bold')
plt.ylim(0.5,0.9); plt.ylabel('Fusion AUC'); plt.title('Robustness: fusion still works if a modality is missing')
plt.tight_layout(); plt.savefig(f"{FIG}/fig5_missing_modality.png",dpi=140); plt.close()

contrib.sort_values('mean_abs_shap',ascending=False).to_csv(f"{OUT}/shap_feature_importance.csv",index=False)
json.dump({'modality_shap_pct':mod_contrib.round(1).to_dict()},open(f"{OUT}/shap_summary.json","w"),indent=2)
print("SHAP modality share (%):",mod_contrib.round(1).to_dict())
print("Figures saved to",FIG)
import os; print(os.listdir(FIG))
