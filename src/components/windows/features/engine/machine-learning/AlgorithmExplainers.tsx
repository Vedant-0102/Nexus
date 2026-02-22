import React, { useState, useRef, useEffect, useCallback } from 'react';

type AlgorithmId = 'linear-reg' | 'logistic-reg' | 'decision-tree' | 'knn' | 'k-means' | 'naive-bayes' | 'svm' | 'random-forest' | 'neural-net';

interface Point { x: number; y: number; label?: number }

interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  formula: string;
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
  code: string;
  interactive?: boolean;
}

const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'linear-reg',
    name: 'Linear Regression',
    formula: 'y\u0302 = \u03B20 + \u03B21x\u2081 + \u03B22x\u2082 + ... + \u03B5\n\nCost: J(\u03B8) = (1/2m) \u2211(h\u03B8(x\u207E) \u2212 y\u207E)\u00B2',
    description: 'Models the linear relationship between a dependent variable and one or more independent variables by fitting a best-fit line that minimizes the sum of squared residuals.',
    whenToUse: 'When you need to predict a continuous numeric value and suspect a linear relationship between features and the target variable.',
    pros: ['Simple and interpretable', 'Fast training and prediction', 'Works well with linearly separable data', 'No tuning parameters needed'],
    cons: ['Assumes linear relationship', 'Sensitive to outliers', 'Cannot capture complex patterns', 'Prone to underfitting'],
    code: `import numpy as np
from sklearn.linear_model import LinearRegression

# Create and train model
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2.1, 4.0, 5.8, 8.1, 9.9])

model = LinearRegression()
model.fit(X, y)

# Predict
pred = model.predict([[6]])
print(f"Coefficient: {model.coef_[0]:.2f}")
print(f"Intercept: {model.intercept_:.2f}")
print(f"Prediction for x=6: {pred[0]:.2f}")`,
  },
  {
    id: 'logistic-reg',
    name: 'Logistic Regression',
    formula: 'P(y=1|x) = \u03C3(w\u1D40x + b) = 1 / (1 + e^(\u2212(w\u1D40x + b)))\n\nCost: J = \u2212(1/m)\u2211[y\u00B7log(h) + (1\u2212y)\u00B7log(1\u2212h)]',
    description: 'A classification algorithm that uses the sigmoid function to map predictions to probabilities. Despite its name, it is used for binary classification tasks.',
    whenToUse: 'Binary classification problems where you need probability estimates. Good baseline for classification tasks.',
    pros: ['Outputs probabilities', 'Efficient and fast', 'Works well for linearly separable classes', 'Regularization available'],
    cons: ['Assumes linear decision boundary', 'Not suitable for complex relationships', 'Requires feature scaling', 'Can underfit nonlinear data'],
    code: `from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification

X, y = make_classification(
    n_samples=100, n_features=2,
    n_redundant=0, random_state=42
)

model = LogisticRegression()
model.fit(X, y)

prob = model.predict_proba([[0.5, -0.3]])
print(f"P(class=0): {prob[0][0]:.3f}")
print(f"P(class=1): {prob[0][1]:.3f}")
print(f"Accuracy: {model.score(X, y):.3f}")`,
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree',
    formula: 'Gini Impurity: G = 1 \u2212 \u2211 p\u1D62\u00B2\n\nEntropy: H = \u2212\u2211 p\u1D62 \u00B7 log\u2082(p\u1D62)\n\nInfo Gain: IG = H(parent) \u2212 \u2211(w\u2C7C \u00B7 H(child\u2C7C))',
    description: 'A tree-structured model that splits data at each node based on feature thresholds. Each leaf represents a prediction. Splits are chosen to maximize information gain or minimize impurity.',
    whenToUse: 'When interpretability matters. Good for datasets with mixed feature types and when you need to explain decisions clearly.',
    pros: ['Highly interpretable', 'Handles mixed data types', 'No feature scaling needed', 'Captures nonlinear relationships'],
    cons: ['Prone to overfitting', 'Unstable (small data changes \u2192 different tree)', 'Biased toward features with more levels', 'Not great for extrapolation'],
    code: `from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

model = DecisionTreeClassifier(
    max_depth=3,
    min_samples_split=5,
    criterion='gini'
)
model.fit(X, y)

print(f"Tree depth: {model.get_depth()}")
print(f"Num leaves: {model.get_n_leaves()}")
print(f"Feature importances: {model.feature_importances_}")`,
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    formula: 'Euclidean: d(p,q) = \u221A(\u2211(p\u1D62 \u2212 q\u1D62)\u00B2)\n\nManhattan: d(p,q) = \u2211|p\u1D62 \u2212 q\u1D62|\n\ny\u0302 = mode({y\u1D62 : x\u1D62 \u2208 N\u2096(x)})',
    description: 'A lazy learning algorithm that classifies new data points based on the majority class of their K nearest neighbors in the feature space. No explicit training phase.',
    whenToUse: 'Small to medium datasets where decision boundaries are irregular. Good for recommendation systems and anomaly detection.',
    pros: ['No training phase', 'Simple and intuitive', 'Adapts to any shape boundary', 'Works for multi-class'],
    cons: ['Slow prediction for large datasets', 'Sensitive to feature scaling', 'Curse of dimensionality', 'Memory intensive'],
    code: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

# Scale features first
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

model = KNeighborsClassifier(
    n_neighbors=5,
    metric='euclidean',
    weights='distance'
)
model.fit(X_scaled, y_train)

pred = model.predict(scaler.transform(X_test))
print(f"Accuracy: {model.score(X_scaled, y_train):.3f}")`,
    interactive: true,
  },
  {
    id: 'k-means',
    name: 'K-Means Clustering',
    formula: 'Objective: J = \u2211\u2096 \u2211(x\u2208C\u2096) \u2016x \u2212 \u03BC\u2096\u2016\u00B2\n\nUpdate: \u03BC\u2096 = (1/|C\u2096|) \u2211(x\u2208C\u2096) x\n\nAssign: c\u1D62 = argmin\u2096 \u2016x\u1D62 \u2212 \u03BC\u2096\u2016\u00B2',
    description: 'An unsupervised clustering algorithm that partitions data into K clusters by iteratively assigning points to the nearest centroid and updating centroid positions.',
    whenToUse: 'Unsupervised learning when you want to discover natural groupings. Customer segmentation, image compression, data preprocessing.',
    pros: ['Simple and fast', 'Scales well to large datasets', 'Easy to interpret', 'Guaranteed convergence'],
    cons: ['Must specify K in advance', 'Sensitive to initialization', 'Assumes spherical clusters', 'Sensitive to outliers'],
    code: `from sklearn.cluster import KMeans
import numpy as np

X = np.random.randn(300, 2)

model = KMeans(
    n_clusters=3,
    init='k-means++',
    n_init=10,
    max_iter=300
)
labels = model.fit_predict(X)

print(f"Inertia: {model.inertia_:.2f}")
print(f"Centroids:\\n{model.cluster_centers_}")
print(f"Iterations: {model.n_iter_}")`,
    interactive: true,
  },
  {
    id: 'naive-bayes',
    name: 'Naive Bayes',
    formula: 'P(C|X) = P(X|C) \u00B7 P(C) / P(X)\n\nNaive assumption:\nP(x\u2081,x\u2082,...|C) = \u220F P(x\u1D62|C)\n\nPredict: y\u0302 = argmax\u1D04 P(C) \u220F P(x\u1D62|C)',
    description: 'A probabilistic classifier based on Bayes\' theorem with the "naive" assumption that features are conditionally independent given the class label.',
    whenToUse: 'Text classification (spam filtering, sentiment analysis), when features are roughly independent, when you need a fast baseline.',
    pros: ['Extremely fast', 'Works well with high-dimensional data', 'Good for text classification', 'Handles missing data gracefully'],
    cons: ['Strong independence assumption', 'Poor probability estimates', 'Cannot learn feature interactions', 'Zero frequency problem'],
    code: `from sklearn.naive_bayes import GaussianNB
from sklearn.naive_bayes import MultinomialNB

# For numeric features
gnb = GaussianNB()
gnb.fit(X_train, y_train)

# For text/count features
mnb = MultinomialNB(alpha=1.0)  # Laplace smoothing
mnb.fit(X_train_counts, y_train)

# Predict probabilities
probs = gnb.predict_proba(X_test)
print(f"Class priors: {gnb.class_prior_}")
print(f"Accuracy: {gnb.score(X_test, y_test):.3f}")`,
  },
  {
    id: 'svm',
    name: 'Support Vector Machine',
    formula: 'Objective: min (1/2)\u2016w\u2016\u00B2 + C\u2211\u03BE\u1D62\n\nSubject to: y\u1D62(w\u1D40x\u1D62 + b) \u2265 1 \u2212 \u03BE\u1D62\n\nKernel: K(x,y) = \u03C6(x)\u1D40\u03C6(y)\nRBF: K = exp(\u2212\u03B3\u2016x\u2212y\u2016\u00B2)',
    description: 'Finds the optimal hyperplane that maximizes the margin between two classes. Support vectors are the data points closest to the decision boundary that define it.',
    whenToUse: 'Medium-sized datasets with clear margin of separation. Effective in high-dimensional spaces. Text classification and image recognition.',
    pros: ['Effective in high dimensions', 'Memory efficient (uses support vectors)', 'Kernel trick for nonlinear boundaries', 'Robust to overfitting in high dim'],
    cons: ['Slow on large datasets O(n\u00B2~n\u00B3)', 'Sensitive to feature scaling', 'No direct probability output', 'Hard to interpret'],
    code: `from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

model = SVC(
    kernel='rbf',
    C=1.0,
    gamma='scale',
    probability=True
)
model.fit(X_scaled, y_train)

print(f"Support vectors: {model.n_support_}")
print(f"Accuracy: {model.score(X_scaled, y_train):.3f}")`,
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    formula: 'y\u0302 = (1/B) \u2211 f\u1D47(x)  (regression)\ny\u0302 = mode({f\u1D47(x)})  (classification)\n\nEach tree uses:\n- Bootstrap sample of data\n- Random subset of m = \u221Ap features',
    description: 'An ensemble of decision trees where each tree is trained on a random bootstrap sample with a random subset of features. Predictions are aggregated by voting (classification) or averaging (regression).',
    whenToUse: 'General-purpose algorithm that works well out-of-the-box. Good when you need robustness, feature importance, and don\'t need a linear model.',
    pros: ['Robust to overfitting', 'Handles missing values', 'Provides feature importance', 'Works with mixed feature types'],
    cons: ['Less interpretable than single tree', 'Slower prediction than simpler models', 'Large memory footprint', 'Can overfit noisy data'],
    code: `from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    max_features='sqrt',
    random_state=42
)
model.fit(X_train, y_train)

importances = model.feature_importances_
print(f"OOB Score: {model.oob_score_:.3f}")
print(f"Feature importances: {importances}")`,
  },
  {
    id: 'neural-net',
    name: 'Neural Networks',
    formula: 'Forward: z\u207E = W\u207Ex\u207E\u207B\u00B9 + b\u207E,  a\u207E = g(z\u207E)\n\nActivations:\n  ReLU: g(z) = max(0, z)\n  Sigmoid: g(z) = 1/(1+e\u207B\u1DBB)\n  Softmax: g(z)\u1D62 = e^(z\u1D62) / \u2211e^(z\u2C7C)\n\nBackprop: \u2202L/\u2202W = \u2202L/\u2202a \u00B7 \u2202a/\u2202z \u00B7 \u2202z/\u2202W',
    description: 'Composed of layers of interconnected neurons that transform inputs through weighted connections and nonlinear activation functions. Trained via backpropagation and gradient descent.',
    whenToUse: 'Complex tasks like image recognition, NLP, speech processing. When you have large datasets and the relationship is highly nonlinear.',
    pros: ['Universal function approximator', 'Handles complex nonlinear patterns', 'Feature learning (no manual engineering)', 'State-of-the-art on many tasks'],
    cons: ['Requires large datasets', 'Computationally expensive', 'Black-box (hard to interpret)', 'Many hyperparameters to tune'],
    code: `from sklearn.neural_network import MLPClassifier

model = MLPClassifier(
    hidden_layer_sizes=(64, 32),
    activation='relu',
    solver='adam',
    learning_rate_init=0.001,
    max_iter=500,
    random_state=42
)
model.fit(X_train, y_train)

print(f"Layers: {model.n_layers_}")
print(f"Loss: {model.loss_:.4f}")
print(f"Iterations: {model.n_iter_}")
print(f"Accuracy: {model.score(X_test, y_test):.3f}")`,
  },
];

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AlgorithmExplainers: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>('linear-reg');
  const [interactivePoints, setInteractivePoints] = useState<Point[]>([]);
  const [kValue, setKValue] = useState(3);
  const [kMeansCentroids, setKMeansCentroids] = useState<Point[]>([]);
  const [kMeansAssignments, setKMeansAssignments] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const algo = ALGORITHMS.find(a => a.id === selectedAlgo)!;

  const generateRandomPoints = useCallback((count: number, withLabels: boolean) => {
    const pts: Point[] = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * 280 + 10,
        y: Math.random() * 230 + 10,
        label: withLabels ? (Math.random() > 0.5 ? 1 : 0) : undefined,
      });
    }
    return pts;
  }, []);

  const initInteractive = useCallback(() => {
    if (selectedAlgo === 'knn') {
      const pts = generateRandomPoints(30, true);
      setInteractivePoints(pts);
    } else if (selectedAlgo === 'k-means') {
      const pts = generateRandomPoints(40, false);
      setInteractivePoints(pts);
      const centroids: Point[] = [];
      for (let i = 0; i < kValue; i++) {
        centroids.push({ x: Math.random() * 260 + 20, y: Math.random() * 210 + 20 });
      }
      setKMeansCentroids(centroids);
      setKMeansAssignments([]);
    }
  }, [selectedAlgo, kValue, generateRandomPoints]);

  useEffect(() => {
    if (selectedAlgo === 'knn' || selectedAlgo === 'k-means') {
      initInteractive();
    }
  }, [selectedAlgo, initInteractive]);

  const runKMeansStep = useCallback(() => {
    if (interactivePoints.length === 0 || kMeansCentroids.length === 0) return;
    const assignments = interactivePoints.map(p => {
      let minDist = Infinity, closest = 0;
      kMeansCentroids.forEach((c, ci) => {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < minDist) { minDist = d; closest = ci; }
      });
      return closest;
    });
    setKMeansAssignments(assignments);
    const newCentroids = kMeansCentroids.map((_, ci) => {
      const clusterPts = interactivePoints.filter((_, pi) => assignments[pi] === ci);
      if (clusterPts.length === 0) return kMeansCentroids[ci];
      return {
        x: clusterPts.reduce((s, p) => s + p.x, 0) / clusterPts.length,
        y: clusterPts.reduce((s, p) => s + p.y, 0) / clusterPts.length,
      };
    });
    setKMeansCentroids(newCentroids);
  }, [interactivePoints, kMeansCentroids]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= w; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i <= h; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

    switch (selectedAlgo) {
      case 'linear-reg': {
        const pts: Point[] = [];
        for (let i = 0; i < 20; i++) {
          const x = 20 + i * 13;
          const y = h - 30 - (i * 9) + (Math.random() - 0.5) * 40;
          pts.push({ x, y });
        }
        pts.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        });
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, h - 25);
        ctx.lineTo(w - 15, 30);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('y = mx + b', w - 80, 25);
        break;
      }
      case 'logistic-reg': {
        // Draw sigmoid curve
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
          const xn = (px - w / 2) / 30;
          const sig = 1 / (1 + Math.exp(-xn));
          const y = h - sig * (h - 40) - 20;
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
        // Decision boundary line
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 10);
        ctx.lineTo(w / 2, h - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        // 0.5 line
        ctx.strokeStyle = '#64748b';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(10, h / 2);
        ctx.lineTo(w - 10, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('P=0.5', 10, h / 2 - 5);
        ctx.fillText('P=1.0', 10, 25);
        ctx.fillText('P=0.0', 10, h - 10);
        // Class 0 and 1 dots
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(30 + i * 15, h - 30 + (Math.random() - 0.5) * 10, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        }
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(w - 30 - i * 15, 30 + (Math.random() - 0.5) * 10, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
        break;
      }
      case 'decision-tree': {
        const drawNode = (x: number, y: number, text: string, isLeaf: boolean) => {
          if (isLeaf) {
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x - 22, y - 10, 44, 20);
            ctx.strokeStyle = '#059669';
            ctx.strokeRect(x - 22, y - 10, 44, 20);
          } else {
            ctx.fillStyle = '#1e40af';
            ctx.beginPath();
            ctx.roundRect(x - 30, y - 12, 60, 24, 6);
            ctx.fill();
            ctx.strokeStyle = '#3b82f6';
            ctx.beginPath();
            ctx.roundRect(x - 30, y - 12, 60, 24, 6);
            ctx.stroke();
          }
          ctx.fillStyle = '#fff';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(text, x, y + 3);
        };
        const drawEdge = (x1: number, y1: number, x2: number, y2: number, label: string) => {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1 + 12);
          ctx.lineTo(x2, y2 - 12);
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, (x1 + x2) / 2 + (x2 > x1 ? 10 : -10), (y1 + y2) / 2);
        };
        drawNode(w / 2, 25, 'x1 < 5?', false);
        drawEdge(w / 2, 25, w / 4, 70, 'Yes');
        drawEdge(w / 2, 25, 3 * w / 4, 70, 'No');
        drawNode(w / 4, 70, 'x2 < 3?', false);
        drawNode(3 * w / 4, 70, 'x2 < 7?', false);
        drawEdge(w / 4, 70, w / 8, 120, 'Yes');
        drawEdge(w / 4, 70, 3 * w / 8, 120, 'No');
        drawEdge(3 * w / 4, 70, 5 * w / 8, 120, 'Yes');
        drawEdge(3 * w / 4, 70, 7 * w / 8, 120, 'No');
        drawNode(w / 8, 120, 'A', true);
        drawNode(3 * w / 8, 120, 'B', true);
        drawNode(5 * w / 8, 120, 'A', true);
        drawNode(7 * w / 8, 120, 'B', true);
        ctx.textAlign = 'left';
        // Gini annotations
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.fillText('Gini=0.48', w / 2 + 35, 20);
        ctx.fillText('Gini=0.32', w / 4 + 35, 65);
        break;
      }
      case 'knn': {
        interactivePoints.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = p.label === 1 ? '#3b82f6' : '#ef4444';
          ctx.fill();
          ctx.strokeStyle = p.label === 1 ? '#2563eb' : '#dc2626';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        if (interactivePoints.length > 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Click to classify a new point (K=' + kValue + ')', 8, h - 8);
        }
        break;
      }
      case 'k-means': {
        interactivePoints.forEach((p, i) => {
          const ci = kMeansAssignments[i] ?? 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = kMeansAssignments.length > 0 ? COLORS[ci % COLORS.length] : '#64748b';
          ctx.fill();
        });
        kMeansCentroids.forEach((c, ci) => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[ci % COLORS.length];
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('C', c.x, c.y + 3);
        });
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Click "Step" to iterate K-Means', 8, h - 8);
        break;
      }
      case 'naive-bayes': {
        // Draw overlapping Gaussian distributions
        const drawGaussian = (mean: number, color: string, label: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let px = 0; px < w; px++) {
            const x = (px - mean) / 40;
            const y_val = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
            const y = h - 20 - y_val * (h - 60);
            if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
          }
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.15;
          ctx.lineTo(w, h - 20);
          ctx.lineTo(0, h - 20);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, mean, 15);
        };
        drawGaussian(w * 0.35, '#3b82f6', 'P(x|C\u2081)');
        drawGaussian(w * 0.65, '#ef4444', 'P(x|C\u2082)');
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 10);
        ctx.lineTo(w / 2, h - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Decision boundary', w / 2, h - 5);
        break;
      }
      case 'svm': {
        // Draw support vector machine with margin
        const margin = 40;
        const cx = w / 2, cy = h / 2;
        // Decision boundary
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 100, cy + 80);
        ctx.lineTo(cx + 100, cy - 80);
        ctx.stroke();
        // Margin lines
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 100 - margin * 0.5, cy + 80 - margin * 0.6);
        ctx.lineTo(cx + 100 - margin * 0.5, cy - 80 - margin * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 100 + margin * 0.5, cy + 80 + margin * 0.6);
        ctx.lineTo(cx + 100 + margin * 0.5, cy - 80 + margin * 0.6);
        ctx.stroke();
        ctx.setLineDash([]);
        // Margin fill
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.beginPath();
        ctx.moveTo(cx - 100 - margin * 0.5, cy + 80 - margin * 0.6);
        ctx.lineTo(cx + 100 - margin * 0.5, cy - 80 - margin * 0.6);
        ctx.lineTo(cx + 100 + margin * 0.5, cy - 80 + margin * 0.6);
        ctx.lineTo(cx - 100 + margin * 0.5, cy + 80 + margin * 0.6);
        ctx.fill();
        // Class points
        const svPts = [
          { x: cx - 70, y: cy - 30, label: 0 }, { x: cx - 90, y: cy - 50, label: 0 },
          { x: cx - 50, y: cy - 60, label: 0 }, { x: cx - 100, y: cy - 10, label: 0 },
          { x: cx - 60, y: cy - 70, label: 0 }, { x: cx - 80, y: cy - 80, label: 0 },
          { x: cx + 70, y: cy + 30, label: 1 }, { x: cx + 90, y: cy + 50, label: 1 },
          { x: cx + 50, y: cy + 60, label: 1 }, { x: cx + 100, y: cy + 10, label: 1 },
          { x: cx + 60, y: cy + 70, label: 1 }, { x: cx + 80, y: cy + 80, label: 1 },
        ];
        svPts.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = p.label === 0 ? '#3b82f6' : '#ef4444';
          ctx.fill();
          // Support vectors (closest)
          if (i === 0 || i === 2 || i === 6 || i === 8) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Support vectors', 8, 15);
        ctx.fillStyle = '#10b981';
        ctx.fillText('Maximum margin', 8, 28);
        break;
      }
      case 'random-forest': {
        // Draw multiple small trees
        const treePositions = [
          { x: 40, y: 20 }, { x: 120, y: 20 }, { x: 200, y: 20 },
          { x: 80, y: 100 }, { x: 160, y: 100 },
        ];
        treePositions.forEach((tp, ti) => {
          const color = COLORS[ti % COLORS.length];
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          // Root
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(tp.x - 12, tp.y, 24, 14);
          ctx.globalAlpha = 1;
          ctx.strokeRect(tp.x - 12, tp.y, 24, 14);
          // Branches
          ctx.beginPath();
          ctx.moveTo(tp.x - 5, tp.y + 14);
          ctx.lineTo(tp.x - 18, tp.y + 35);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tp.x + 5, tp.y + 14);
          ctx.lineTo(tp.x + 18, tp.y + 35);
          ctx.stroke();
          // Leaves
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(tp.x - 24, tp.y + 35, 16, 10);
          ctx.fillRect(tp.x + 10, tp.y + 35, 16, 10);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('T' + (ti + 1), tp.x, tp.y + 10);
        });
        // Voting arrow
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 160);
        ctx.lineTo(w / 2, 185);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, 180);
        ctx.lineTo(w / 2, 190);
        ctx.lineTo(w / 2 + 6, 180);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Majority Vote / Average', w / 2, 210);
        // Result
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Final Prediction', w / 2, 235);
        break;
      }
      case 'neural-net': {
        const layers = [3, 5, 4, 2];
        const layerX = layers.map((_, i) => 40 + i * ((w - 80) / (layers.length - 1)));
        const nodePositions: { x: number; y: number }[][] = [];
        layers.forEach((n, li) => {
          const positions: { x: number; y: number }[] = [];
          for (let ni = 0; ni < n; ni++) {
            const y = (h / 2) - ((n - 1) * 28) / 2 + ni * 28;
            positions.push({ x: layerX[li], y });
          }
          nodePositions.push(positions);
        });
        // Draw connections
        for (let li = 0; li < layers.length - 1; li++) {
          nodePositions[li].forEach(from => {
            nodePositions[li + 1].forEach(to => {
              ctx.strokeStyle = `rgba(100, 116, 139, ${0.15 + Math.random() * 0.2})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(from.x + 8, from.y);
              ctx.lineTo(to.x - 8, to.y);
              ctx.stroke();
            });
          });
        }
        // Draw nodes
        const layerColors = ['#3b82f6', '#8b5cf6', '#8b5cf6', '#10b981'];
        const layerLabels = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];
        nodePositions.forEach((layer, li) => {
          layer.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = layerColors[li];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(layerLabels[li], layerX[li], h - 8);
        });
        break;
      }
    }
    ctx.textAlign = 'left';
  }, [selectedAlgo, interactivePoints, kMeansCentroids, kMeansAssignments, kValue]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (selectedAlgo === 'knn') {
      // Find K nearest neighbors and classify
      const distances = interactivePoints.map((p, i) => ({
        dist: Math.hypot(p.x - x, p.y - y),
        idx: i,
        label: p.label!,
      })).sort((a, b) => a.dist - b.dist);
      const kNearest = distances.slice(0, kValue);
      const labelCounts = kNearest.reduce((acc, n) => {
        acc[n.label] = (acc[n.label] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const predictedLabel = Number(Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0][0]);

      // Draw prediction
      const ctx = canvas.getContext('2d')!;
      drawCanvas();
      // Draw query point
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = predictedLabel === 1 ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.5)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Draw connections to K nearest
      kNearest.forEach(n => {
        const p = interactivePoints[n.idx];
        ctx.strokeStyle = 'rgba(245,158,11,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      // Highlight K nearest
      kNearest.forEach(n => {
        const p = interactivePoints[n.idx];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Predicted: Class ${predictedLabel}`, 8, 15);
    } else if (selectedAlgo === 'k-means') {
      setInteractivePoints(prev => [...prev, { x, y }]);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(algo.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      {/* Algo tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {ALGORITHMS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAlgo(a.id)}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
              selectedAlgo === a.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-700'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-auto space-y-3">
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{algo.name}</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">{algo.description}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Canvas visualization */}
          <div className="bg-gray-900 rounded-xl p-2 border border-gray-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Visualization</span>
              {selectedAlgo === 'knn' && (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-400">K:</label>
                  <input
                    type="range" min={1} max={10} value={kValue}
                    onChange={e => setKValue(Number(e.target.value))}
                    className="w-16 h-1 accent-indigo-500"
                  />
                  <span className="text-[10px] text-indigo-400 font-mono w-4">{kValue}</span>
                  <button onClick={initInteractive} className="px-2 py-0.5 text-[9px] bg-indigo-600 text-white rounded hover:bg-indigo-700">Reset</button>
                </div>
              )}
              {selectedAlgo === 'k-means' && (
                <div className="flex items-center gap-1">
                  <button onClick={runKMeansStep} className="px-2 py-0.5 text-[9px] bg-indigo-600 text-white rounded hover:bg-indigo-700">Step</button>
                  <button onClick={initInteractive} className="px-2 py-0.5 text-[9px] bg-gray-600 text-white rounded hover:bg-gray-500">Reset</button>
                </div>
              )}
            </div>
            <canvas
              ref={canvasRef}
              width={300}
              height={250}
              className="w-full rounded-lg cursor-crosshair"
              style={{ imageRendering: 'auto' }}
              onClick={handleCanvasClick}
            />
          </div>

          {/* Formula */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Mathematical Formulation</h3>
            <pre className="text-xs font-mono text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap leading-relaxed bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-lg">
              {algo.formula}
            </pre>
          </div>
        </div>

        {/* When to use, Pros/Cons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1.5">When to Use</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">{algo.whenToUse}</p>
          </div>
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1.5">Pros</h3>
            <ul className="space-y-0.5">
              {algo.pros.map((p, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                  <span className="text-emerald-500 mt-0.5 shrink-0">+</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-1.5">Cons</h3>
            <ul className="space-y-0.5">
              {algo.cons.map((c, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                  <span className="text-rose-500 mt-0.5 shrink-0">-</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Code snippet */}
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Python Example</span>
            <button onClick={copyCode} className="px-2 py-0.5 text-[9px] bg-indigo-600 text-white rounded hover:bg-indigo-700">
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-green-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {algo.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
