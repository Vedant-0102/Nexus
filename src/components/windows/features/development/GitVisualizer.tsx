import React, { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, Play, RotateCcw, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommitNode {
  id: string;
  message: string;
  branch: string;
  x: number;
  y: number;
  parents: string[];
}

interface BranchInfo {
  name: string;
  color: string;
  head: string;
}

export const GitVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('visualizer');
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<'basic' | 'branch' | 'merge'>('basic');

  // Scenarios
  const scenarios = {
    basic: {
      title: 'Basic Git Workflow',
      steps: [
        { action: 'Initial commit', description: 'Create first commit on main branch' },
        { action: 'Add feature', description: 'Make changes and commit' },
        { action: 'Fix bug', description: 'Another commit on main' },
        { action: 'Add docs', description: 'Documentation commit' },
      ]
    },
    branch: {
      title: 'Branching Workflow',
      steps: [
        { action: 'Initial commit', description: 'Start with main branch' },
        { action: 'Create feature branch', description: 'Branch off from main' },
        { action: 'Work on feature', description: 'Commit to feature branch' },
        { action: 'Continue on main', description: 'Main branch progresses' },
        { action: 'More feature work', description: 'Another commit on feature' },
      ]
    },
    merge: {
      title: 'Merge Workflow',
      steps: [
        { action: 'Initial state', description: 'Main and feature branches' },
        { action: 'Feature complete', description: 'Final commit on feature' },
        { action: 'Merge feature', description: 'Merge feature into main' },
        { action: 'Continue development', description: 'Work continues on main' },
      ]
    }
  };

  const getCommitsForStep = (scenario: string, currentStep: number): CommitNode[] => {
    if (scenario === 'basic') {
      const commits: CommitNode[] = [
        { id: 'c1', message: 'Initial commit', branch: 'main', x: 100, y: 200, parents: [] }
      ];
      if (currentStep >= 1) commits.push({ id: 'c2', message: 'Add feature', branch: 'main', x: 250, y: 200, parents: ['c1'] });
      if (currentStep >= 2) commits.push({ id: 'c3', message: 'Fix bug', branch: 'main', x: 400, y: 200, parents: ['c2'] });
      if (currentStep >= 3) commits.push({ id: 'c4', message: 'Add docs', branch: 'main', x: 550, y: 200, parents: ['c3'] });
      return commits;
    } else if (scenario === 'branch') {
      const commits: CommitNode[] = [
        { id: 'c1', message: 'Initial', branch: 'main', x: 100, y: 200, parents: [] }
      ];
      if (currentStep >= 1) {
        commits.push({ id: 'c2', message: 'Branch point', branch: 'main', x: 250, y: 200, parents: ['c1'] });
      }
      if (currentStep >= 2) {
        commits.push({ id: 'c3', message: 'Feature work', branch: 'feature', x: 400, y: 100, parents: ['c2'] });
      }
      if (currentStep >= 3) {
        commits.push({ id: 'c4', message: 'Main progress', branch: 'main', x: 400, y: 200, parents: ['c2'] });
      }
      if (currentStep >= 4) {
        commits.push({ id: 'c5', message: 'More feature', branch: 'feature', x: 550, y: 100, parents: ['c3'] });
      }
      return commits;
    } else {
      const commits: CommitNode[] = [
        { id: 'c1', message: 'Initial', branch: 'main', x: 100, y: 200, parents: [] },
        { id: 'c2', message: 'Branch', branch: 'main', x: 250, y: 200, parents: ['c1'] },
        { id: 'c3', message: 'Feature 1', branch: 'feature', x: 400, y: 100, parents: ['c2'] },
        { id: 'c4', message: 'Main work', branch: 'main', x: 400, y: 200, parents: ['c2'] },
      ];
      if (currentStep >= 1) {
        commits.push({ id: 'c5', message: 'Feature done', branch: 'feature', x: 550, y: 100, parents: ['c3'] });
      }
      if (currentStep >= 2) {
        commits.push({ id: 'c6', message: 'Merge', branch: 'main', x: 700, y: 200, parents: ['c4', 'c5'] });
      }
      if (currentStep >= 3) {
        commits.push({ id: 'c7', message: 'Continue', branch: 'main', x: 850, y: 200, parents: ['c6'] });
      }
      return commits;
    }
  };

  const branches: BranchInfo[] = [
    { name: 'main', color: '#3b82f6', head: '' },
    { name: 'feature', color: '#10b981', head: '' }
  ];

  const commits = getCommitsForStep(scenario, step);
  const currentScenario = scenarios[scenario];

  const nextStep = () => {
    if (step < currentScenario.steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const reset = () => {
    setStep(0);
  };

  const changeScenario = (newScenario: 'basic' | 'branch' | 'merge') => {
    setScenario(newScenario);
    setStep(0);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold dark:text-white">Git Visualizer</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">Learn how Git works</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={reset} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="visualizer">
            <Zap className="h-4 w-4 mr-2" />
            Interactive Visualizer
          </TabsTrigger>
          <TabsTrigger value="guide">
            <BookOpen className="h-4 w-4 mr-2" />
            Git Guide
          </TabsTrigger>
        </TabsList>

        {/* Visualizer Tab */}
        <TabsContent value="visualizer" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
          {/* Scenario Selector */}
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-2">
              <Button
                onClick={() => changeScenario('basic')}
                variant={scenario === 'basic' ? 'default' : 'outline'}
                size="sm"
              >
                Basic Workflow
              </Button>
              <Button
                onClick={() => changeScenario('branch')}
                variant={scenario === 'branch' ? 'default' : 'outline'}
                size="sm"
              >
                Branching
              </Button>
              <Button
                onClick={() => changeScenario('merge')}
                variant={scenario === 'merge' ? 'default' : 'outline'}
                size="sm"
              >
                Merging
              </Button>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <svg className="w-full h-full">
              {/* Draw connections */}
              {commits.map(commit =>
                commit.parents.map(parentId => {
                  const parent = commits.find(c => c.id === parentId);
                  if (!parent) return null;
                  return (
                    <line
                      key={`${commit.id}-${parentId}`}
                      x1={parent.x + 30}
                      y1={parent.y + 30}
                      x2={commit.x + 30}
                      y2={commit.y + 30}
                      stroke={commit.branch === 'main' ? '#3b82f6' : '#10b981'}
                      strokeWidth="3"
                      opacity="0.6"
                    />
                  );
                })
              )}

              {/* Draw commits */}
              {commits.map(commit => (
                <g key={commit.id}>
                  <circle
                    cx={commit.x + 30}
                    cy={commit.y + 30}
                    r="25"
                    fill={commit.branch === 'main' ? '#3b82f6' : '#10b981'}
                    stroke="white"
                    strokeWidth="3"
                  />
                  <text
                    x={commit.x + 30}
                    y={commit.y + 35}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {commit.id.toUpperCase()}
                  </text>
                  <text
                    x={commit.x + 30}
                    y={commit.y + 70}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11"
                    className="dark:fill-white"
                  >
                    {commit.message}
                  </text>
                </g>
              ))}
            </svg>

            {/* Branch Labels */}
            <div className="absolute top-4 left-4 space-y-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-sm font-semibold dark:text-white">main</span>
              </div>
              {scenario !== 'basic' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-sm font-semibold dark:text-white">feature</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold dark:text-white">{currentScenario.title}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Step {step + 1} of {currentScenario.steps.length}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    {currentScenario.steps[step].action}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {currentScenario.steps[step].description}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={prevStep} disabled={step === 0} variant="outline" className="flex-1">
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={step === currentScenario.steps.length - 1}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Next Step
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="flex-1 overflow-auto mt-0 p-6 data-[state=inactive]:hidden">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-2xl font-bold mb-4 dark:text-white">What is Git?</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Git is a distributed version control system that tracks changes in your code over time. 
                It allows multiple developers to work together, maintains a complete history of changes, 
                and enables you to experiment with new features without affecting the main codebase.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold dark:text-white">Key Concepts</h3>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <GitCommit className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-bold dark:text-white mb-2">Commits</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      A commit is a snapshot of your code at a specific point in time. Each commit has a unique ID (hash) 
                      and contains information about what changed, who made the change, and when.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <GitBranch className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-bold dark:text-white mb-2">Branches</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Branches allow you to work on different features or experiments independently. The main branch 
                      (usually called "main" or "master") contains the stable code, while feature branches contain 
                      work-in-progress changes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <GitMerge className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-bold dark:text-white mb-2">Merging</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Merging combines changes from one branch into another. When you finish working on a feature branch, 
                      you merge it back into the main branch to integrate your changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Common Workflow</h3>
              <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">1.</span>
                  <span><strong>Clone</strong> - Download a repository to your computer</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">2.</span>
                  <span><strong>Branch</strong> - Create a new branch for your feature</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">3.</span>
                  <span><strong>Edit</strong> - Make changes to your code</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">4.</span>
                  <span><strong>Stage</strong> - Select which changes to include</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">5.</span>
                  <span><strong>Commit</strong> - Save your changes with a message</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">6.</span>
                  <span><strong>Push</strong> - Upload your commits to the remote repository</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-600">7.</span>
                  <span><strong>Merge</strong> - Integrate your changes into the main branch</span>
                </li>
              </ol>
            </div>

            <div className="p-6 bg-gray-900 text-green-400 rounded-xl font-mono text-sm">
              <div className="mb-4 text-white font-bold">Essential Git Commands:</div>
              <div className="space-y-2">
                <div><span className="text-gray-500">$</span> git clone &lt;url&gt;</div>
                <div><span className="text-gray-500">$</span> git branch feature-name</div>
                <div><span className="text-gray-500">$</span> git checkout feature-name</div>
                <div><span className="text-gray-500">$</span> git add .</div>
                <div><span className="text-gray-500">$</span> git commit -m "message"</div>
                <div><span className="text-gray-500">$</span> git push origin feature-name</div>
                <div><span className="text-gray-500">$</span> git merge feature-name</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
