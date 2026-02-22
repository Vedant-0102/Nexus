import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProblemType = 'classification' | 'regression' | 'clustering';
type DataSize = 'small' | 'medium' | 'large';
type FeatureType = 'numeric' | 'categorical' | 'mixed' | 'text' | 'image';
type Priority = 'accuracy' | 'speed' | 'interpretability';

interface Recommendation {
  name: string;
  score: number;
  description: string;
  pros: string[];
  cons: string[];
  complexity: string;
  explainerTag: string;
}

/* ------------------------------------------------------------------ */
/*  Recommendation engine                                              */
/* ------------------------------------------------------------------ */

const ALL_ALGORITHMS: Record<string, {
  desc: string;
  pros: string[];
  cons: string[];
  complexity: string;
  tag: string;
  supports: { problem: ProblemType[]; size: DataSize[]; features: FeatureType[]; priority: Priority[] };
}> = {
  'Linear / Logistic Regression': {
    desc: 'Simple model that fits a line (or hyperplane) to separate classes or predict values. Great starting point.',
    pros: ['Very fast training & inference', 'Highly interpretable coefficients', 'Works well with small data', 'Low memory usage'],
    cons: ['Cannot capture non-linear patterns', 'Assumes feature independence', 'Sensitive to outliers (linear)', 'Needs feature engineering for complex data'],
    complexity: 'O(n*d)',
    tag: 'linear-regression',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium', 'large'], features: ['numeric', 'mixed'], priority: ['speed', 'interpretability'] },
  },
  'K-Nearest Neighbors (KNN)': {
    desc: 'Classifies by finding the K most similar training examples. Instance-based, lazy learner -- no explicit training phase.',
    pros: ['Intuitive and simple', 'No training phase', 'Naturally handles multi-class', 'Non-linear decision boundaries'],
    cons: ['Slow at inference for large data', 'Sensitive to irrelevant features', 'Needs good distance metric', 'High memory -- stores all data'],
    complexity: 'O(n*d) per query',
    tag: 'knn',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium'], features: ['numeric'], priority: ['accuracy', 'interpretability'] },
  },
  'Decision Tree': {
    desc: 'Learns a hierarchy of if-else rules to split data. Produces human-readable tree structures.',
    pros: ['Highly interpretable', 'Handles numeric & categorical', 'No feature scaling needed', 'Fast inference'],
    cons: ['Prone to overfitting', 'Unstable (small data change => different tree)', 'Biased towards dominant classes', 'Greedy splits may miss global optimum'],
    complexity: 'O(n*d*log(n))',
    tag: 'decision-tree',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium'], features: ['numeric', 'categorical', 'mixed'], priority: ['interpretability', 'speed'] },
  },
  'Random Forest': {
    desc: 'Ensemble of many decision trees, each on a random subset. Reduces variance and overfitting.',
    pros: ['High accuracy', 'Robust to overfitting', 'Handles mixed features', 'Feature importance built-in'],
    cons: ['Less interpretable than single tree', 'Slower than single tree', 'High memory for many trees', 'Harder to tune many hyperparameters'],
    complexity: 'O(T*n*d*log(n))',
    tag: 'random-forest',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium', 'large'], features: ['numeric', 'categorical', 'mixed'], priority: ['accuracy'] },
  },
  'Support Vector Machine (SVM)': {
    desc: 'Finds the optimal hyperplane with maximum margin between classes. Kernel trick for non-linear data.',
    pros: ['Effective in high-dimensional spaces', 'Memory efficient (support vectors)', 'Kernel trick for non-linearity', 'Strong generalization'],
    cons: ['Slow on large datasets (O(n^2 - n^3))', 'Sensitive to feature scaling', 'Not directly probabilistic', 'Hard to tune kernel & C'],
    complexity: 'O(n^2) to O(n^3)',
    tag: 'svm',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium'], features: ['numeric'], priority: ['accuracy'] },
  },
  'K-Means Clustering': {
    desc: 'Partitions data into K clusters by iteratively updating centroids. Simple unsupervised algorithm.',
    pros: ['Fast and scalable', 'Easy to understand', 'Works well with spherical clusters', 'Guaranteed convergence'],
    cons: ['Must specify K upfront', 'Sensitive to initialization', 'Assumes spherical clusters', 'Struggles with varying densities'],
    complexity: 'O(n*K*d*i)',
    tag: 'kmeans',
    supports: { problem: ['clustering'], size: ['small', 'medium', 'large'], features: ['numeric'], priority: ['speed', 'interpretability'] },
  },
  'DBSCAN': {
    desc: 'Density-based clustering that finds arbitrarily shaped clusters and identifies outliers as noise.',
    pros: ['No need to specify K', 'Finds arbitrary shapes', 'Robust to outliers', 'Deterministic (no random init)'],
    cons: ['Sensitive to eps & min_samples', 'Struggles with varying densities', 'Poor on high-dimensional data', 'O(n^2) without spatial index'],
    complexity: 'O(n*log(n)) with index',
    tag: 'dbscan',
    supports: { problem: ['clustering'], size: ['small', 'medium'], features: ['numeric'], priority: ['accuracy', 'interpretability'] },
  },
  'Neural Network (MLP)': {
    desc: 'Multi-layer perceptron with backpropagation. Universal function approximator for complex patterns.',
    pros: ['Captures complex non-linear patterns', 'Flexible architecture', 'Scales with data', 'State-of-art on many tasks'],
    cons: ['Needs lots of data', 'Slow to train', 'Black-box model', 'Many hyperparameters'],
    complexity: 'O(n*d*h*L*epochs)',
    tag: 'neural-network',
    supports: { problem: ['classification', 'regression'], size: ['medium', 'large'], features: ['numeric', 'image'], priority: ['accuracy'] },
  },
  'Convolutional Neural Network (CNN)': {
    desc: 'Specialized neural net for grid-like data (images). Learns spatial hierarchies of features.',
    pros: ['State-of-art for image tasks', 'Learns features automatically', 'Translation invariance', 'Parameter sharing'],
    cons: ['Needs large labeled datasets', 'GPU required for training', 'Very slow to train', 'Complex architecture design'],
    complexity: 'O(n*K^2*C*H*W*L)',
    tag: 'cnn',
    supports: { problem: ['classification'], size: ['large'], features: ['image'], priority: ['accuracy'] },
  },
  'Gradient Boosting (XGBoost)': {
    desc: 'Ensemble method that builds trees sequentially, each correcting the errors of the previous one.',
    pros: ['Top accuracy on tabular data', 'Handles missing values', 'Built-in regularization', 'Feature importance'],
    cons: ['Slower to train than RF', 'Many hyperparameters', 'Can overfit with too many rounds', 'Less interpretable'],
    complexity: 'O(T*n*d*log(n))',
    tag: 'gradient-boosting',
    supports: { problem: ['classification', 'regression'], size: ['small', 'medium', 'large'], features: ['numeric', 'categorical', 'mixed'], priority: ['accuracy'] },
  },
  'Naive Bayes': {
    desc: 'Probabilistic classifier based on Bayes theorem. Assumes feature independence (hence "naive").',
    pros: ['Extremely fast', 'Works great with text', 'Handles high-dimensional data', 'Good with small training sets'],
    cons: ['Assumes independence (rarely true)', 'Poor probability estimates', 'Cannot learn interactions', 'Sensitive to input distribution'],
    complexity: 'O(n*d)',
    tag: 'naive-bayes',
    supports: { problem: ['classification'], size: ['small', 'medium', 'large'], features: ['categorical', 'text'], priority: ['speed', 'interpretability'] },
  },
  'Hierarchical Clustering': {
    desc: 'Builds a tree (dendrogram) of cluster merges/splits. Visualise at any granularity by cutting the tree.',
    pros: ['No need to specify K', 'Dendrogram visualization', 'Deterministic', 'Works with any distance metric'],
    cons: ['O(n^2) memory', 'Slow on large data', 'Cannot undo merge/split', 'Sensitive to metric choice'],
    complexity: 'O(n^2*log(n))',
    tag: 'hierarchical',
    supports: { problem: ['clustering'], size: ['small'], features: ['numeric', 'mixed'], priority: ['interpretability'] },
  },
};

function getRecommendations(problem: ProblemType, size: DataSize, features: FeatureType, priority: Priority): Recommendation[] {
  const scored: Recommendation[] = [];
  for (const [name, info] of Object.entries(ALL_ALGORITHMS)) {
    let score = 0;
    if (info.supports.problem.includes(problem)) score += 30; else continue;
    if (info.supports.size.includes(size)) score += 25; else score -= 10;
    if (info.supports.features.includes(features)) score += 25; else score -= 5;
    if (info.supports.priority.includes(priority)) score += 20;
    scored.push({ name, score, description: info.desc, pros: info.pros, cons: info.cons, complexity: info.complexity, explainerTag: info.tag });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

const STEPS = [
  { title: 'Problem Type', subtitle: 'What kind of problem are you solving?' },
  { title: 'Data Size', subtitle: 'How many samples in your dataset?' },
  { title: 'Feature Types', subtitle: 'What kind of features are in your data?' },
  { title: 'Priority', subtitle: 'What matters most for your use case?' },
  { title: 'Results', subtitle: 'Our top recommendations for you' },
];

const PROBLEM_OPTIONS: { value: ProblemType; label: string; desc: string }[] = [
  { value: 'classification', label: 'Classification', desc: 'Predict a category or class label (e.g., spam vs ham, cat vs dog)' },
  { value: 'regression', label: 'Regression', desc: 'Predict a continuous number (e.g., house price, temperature)' },
  { value: 'clustering', label: 'Clustering', desc: 'Find natural groupings in unlabeled data (e.g., customer segments)' },
];

const SIZE_OPTIONS: { value: DataSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Small (<1K)', desc: 'Fewer than 1,000 samples. Simple models often work best.' },
  { value: 'medium', label: 'Medium (1K-100K)', desc: '1,000 to 100,000 samples. Most algorithms handle this well.' },
  { value: 'large', label: 'Large (>100K)', desc: 'Over 100,000 samples. Scalability becomes important.' },
];

const FEATURE_OPTIONS: { value: FeatureType; label: string; desc: string }[] = [
  { value: 'numeric', label: 'Numeric', desc: 'Continuous or integer values (height, price, count)' },
  { value: 'categorical', label: 'Categorical', desc: 'Discrete categories (color, country, type)' },
  { value: 'mixed', label: 'Mixed', desc: 'Combination of numeric and categorical features' },
  { value: 'text', label: 'Text', desc: 'Natural language text data (reviews, articles)' },
  { value: 'image', label: 'Image', desc: 'Pixel data from photographs or diagrams' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; desc: string }[] = [
  { value: 'accuracy', label: 'Accuracy', desc: 'Best predictive performance, even if slower or harder to explain' },
  { value: 'speed', label: 'Speed', desc: 'Fast training and inference, may sacrifice some accuracy' },
  { value: 'interpretability', label: 'Interpretability', desc: 'Easy to understand and explain how predictions are made' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ModelWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<ProblemType | null>(null);
  const [size, setSize] = useState<DataSize | null>(null);
  const [features, setFeatures] = useState<FeatureType | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  /* Helpers */
  const canNext = (): boolean => {
    if (step === 0) return problem !== null;
    if (step === 1) return size !== null;
    if (step === 2) return features !== null;
    if (step === 3) return priority !== null;
    return false;
  };

  const recommendations = (step === 4 && problem && size && features && priority)
    ? getRecommendations(problem, size, features, priority)
    : [];

  const reset = () => { setStep(0); setProblem(null); setSize(null); setFeatures(null); setPriority(null); setExpandedIdx(null); };

  /* Render option buttons */
  function renderOptions<T extends string>(
    options: { value: T; label: string; desc: string }[],
    selected: T | null,
    onSelect: (v: T) => void,
  ) {
    return (
      <div className="grid gap-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${
              selected === o.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selected === o.value ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'
              }`}>
                {selected === o.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{o.label}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">{o.desc}</p>
          </button>
        ))}
      </div>
    );
  }

  const medalColors = ['text-yellow-500', 'text-gray-400 dark:text-gray-300', 'text-amber-600 dark:text-amber-500'];
  const medalLabels = ['1st (Best Match)', '2nd', '3rd'];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden">
      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {i < step ? '\u2713' : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline font-medium ${i === step ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{STEPS[step].title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{STEPS[step].subtitle}</p>
        </div>

        {step === 0 && renderOptions(PROBLEM_OPTIONS, problem, setProblem)}
        {step === 1 && renderOptions(SIZE_OPTIONS, size, setSize)}
        {step === 2 && renderOptions(FEATURE_OPTIONS, features, setFeatures)}
        {step === 3 && renderOptions(PRIORITY_OPTIONS, priority, setPriority)}

        {step === 4 && (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={rec.name} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full text-left p-3 flex items-start gap-3"
                >
                  <span className={`text-xl font-bold ${medalColors[idx]}`}>{['#1', '#2', '#3'][idx]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{rec.name}</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">{medalLabels[idx]}</span>
                      <span className="text-[10px] text-gray-400">Score: {rec.score}/100</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.description}</p>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 text-lg">{expandedIdx === idx ? '\u25B2' : '\u25BC'}</span>
                </button>

                {expandedIdx === idx && (
                  <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-2">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Pros</h4>
                        <ul className="space-y-0.5">
                          {rec.pros.map(p => (
                            <li key={p} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">+</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Cons</h4>
                        <ul className="space-y-0.5">
                          {rec.cons.map(c => (
                            <li key={c} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">-</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
                      <span>Complexity: {rec.complexity}</span>
                      <span>Explainer: <span className="text-blue-500">{rec.explainerTag}</span></span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Summary bar */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-3">
              <h3 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">Your Selections</h3>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {[
                  { l: 'Problem', v: problem },
                  { l: 'Data Size', v: size },
                  { l: 'Features', v: features },
                  { l: 'Priority', v: priority },
                ].map(s => (
                  <span key={s.l} className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {s.l}: <strong>{s.v}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => step === 4 ? reset() : setStep(s => Math.max(0, s - 1))}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          {step === 4 ? 'Start Over' : 'Back'}
        </button>
        {step < 4 && (
          <button
            onClick={() => setStep(s => Math.min(4, s + 1))}
            disabled={!canNext()}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-40 transition-colors"
          >
            {step === 3 ? 'Get Recommendations' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
};
