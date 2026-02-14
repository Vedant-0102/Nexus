import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GitBranch, GitCommit, GitMerge, RotateCcw, BookOpen, Zap, Copy, Terminal,
  Brain, ChevronRight, CheckCircle, XCircle, Play, Pause, SkipBack,
  SkipForward, Hash, Clock, User, Tag, AlertCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommitNode {
  id: string;
  hash: string;
  message: string;
  branch: string;
  parents: string[];
  author?: string;
  timestamp?: string;
  tags?: string[];
}

interface BranchInfo {
  name: string;
  color: string;
  lane: number;
}

type ScenarioKey = 'basic' | 'feature-branch' | 'merge' | 'rebase' | 'hotfix' | 'gitflow';
type TabKey = 'visualizer' | 'commands' | 'guide';

// ─── Constants ──────────────────────────────────────────────────────────────

const BRANCH_COLORS: Record<string, string> = {
  main: '#3b82f6',
  develop: '#8b5cf6',
  feature: '#10b981',
  'feature/auth': '#10b981',
  'feature/ui': '#06b6d4',
  hotfix: '#ef4444',
  'hotfix/critical': '#ef4444',
  release: '#f59e0b',
  'release/1.0': '#f59e0b',
};

const getBranchColor = (branch: string): string => {
  if (BRANCH_COLORS[branch]) return BRANCH_COLORS[branch];
  if (branch.startsWith('feature')) return '#10b981';
  if (branch.startsWith('hotfix')) return '#ef4444';
  if (branch.startsWith('release')) return '#f59e0b';
  return '#6b7280';
};

const GRAPH_CONFIG = {
  nodeRadius: 6,
  laneWidth: 24,
  rowHeight: 56,
  leftPadding: 20,
  topPadding: 28,
};

// ─── Scenarios ──────────────────────────────────────────────────────────────

interface CommandPart {
  text: string;
  desc: string;
}

interface ScenarioStep {
  action: string;
  description: string;
  command: string;
  explanation: string;
  syntax: CommandPart[];
  commits: CommitNode[];
  branches: BranchInfo[];
  head: string;
}

interface Scenario {
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: ScenarioStep[];
}

const createScenarios = (): Record<ScenarioKey, Scenario> => ({
  basic: {
    title: 'Basic Workflow',
    icon: <GitCommit className="h-3.5 w-3.5" />,
    description: 'Linear commits on a single branch',
    steps: [
      {
        action: 'Initialize repo',
        description: 'Create the repository with an initial commit',
        command: 'git init && git commit -m "Initial commit"',
        explanation: '"git init" creates a new Git repository in the current directory. Then "git commit" saves the first snapshot. The -m flag lets you write the commit message inline.',
        syntax: [
          { text: 'git init', desc: 'Initialize a new .git directory' },
          { text: '&&', desc: 'Run next command only if init succeeds' },
          { text: 'git commit', desc: 'Record changes to the repository' },
          { text: '-m "..."', desc: 'Inline commit message' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '2 hours ago' },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c1',
      },
      {
        action: 'Add feature',
        description: 'Stage files and create a second commit',
        command: 'git add . && git commit -m "Add user model"',
        explanation: '"git add ." stages all changed files in the working directory. Staging tells Git which changes to include in the next commit. Then "git commit" records those staged changes.',
        syntax: [
          { text: 'git add', desc: 'Stage file changes for commit' },
          { text: '.', desc: 'Select all files in current directory' },
          { text: '&&', desc: 'Chain: run commit after add' },
          { text: 'git commit -m "..."', desc: 'Commit with inline message' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add user model', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '1 hour ago' },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c2',
      },
      {
        action: 'Fix bug',
        description: 'Fix a bug and commit the change',
        command: 'git commit -m "Fix validation bug"',
        explanation: 'When you have already staged your changes (via git add), you can commit directly. Each commit creates a new snapshot linked to the previous one, forming a chain of history.',
        syntax: [
          { text: 'git commit', desc: 'Create a new commit' },
          { text: '-m', desc: 'Message flag (avoids editor)' },
          { text: '"Fix validation bug"', desc: 'Descriptive commit message' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add user model', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '1 hour ago' },
          { id: 'c3', hash: 'i7j8k9l', message: 'Fix validation bug', branch: 'main', parents: ['c2'], author: 'dev', timestamp: '45 min ago' },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c3',
      },
      {
        action: 'Add tests',
        description: 'Write tests and commit',
        command: 'git commit -m "Add unit tests"',
        explanation: 'Continue building history by committing. Good practice: commit early and often. Each commit should represent one logical change. Notice the tag v0.1.0 marking a release.',
        syntax: [
          { text: 'git commit', desc: 'Snapshot current staged changes' },
          { text: '-m "Add unit tests"', desc: 'Clear, imperative message' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add user model', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '1 hour ago' },
          { id: 'c3', hash: 'i7j8k9l', message: 'Fix validation bug', branch: 'main', parents: ['c2'], author: 'dev', timestamp: '45 min ago' },
          { id: 'c4', hash: 'm0n1o2p', message: 'Add unit tests', branch: 'main', parents: ['c3'], author: 'dev', timestamp: '20 min ago', tags: ['v0.1.0'] },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c4',
      },
    ],
  },
  'feature-branch': {
    title: 'Feature Branch',
    icon: <GitBranch className="h-3.5 w-3.5" />,
    description: 'Develop features on isolated branches',
    steps: [
      {
        action: 'Start on main',
        description: 'Begin with existing commits on main',
        command: 'git log --oneline',
        explanation: '"git log" shows the commit history. The --oneline flag shows each commit on a single line (hash + message). This is how you inspect your current state before branching.',
        syntax: [
          { text: 'git log', desc: 'Show commit history' },
          { text: '--oneline', desc: 'Compact: one line per commit' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '3 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '2 hours ago' },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c2',
      },
      {
        action: 'Create feature branch',
        description: 'Branch off from main to develop a feature',
        command: 'git checkout -b feature/auth',
        explanation: '"git checkout -b" creates a new branch AND switches to it in one step. The branch starts at the current HEAD. Use descriptive names like "feature/auth" to communicate intent.',
        syntax: [
          { text: 'git checkout', desc: 'Switch branches or restore files' },
          { text: '-b', desc: 'Create the branch if it does not exist' },
          { text: 'feature/auth', desc: 'New branch name (feature prefix)' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '3 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '2 hours ago' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature/auth', color: getBranchColor('feature/auth'), lane: 1 },
        ],
        head: 'c2',
      },
      {
        action: 'Work on feature',
        description: 'Commit authentication logic to the feature branch',
        command: 'git commit -m "Add login endpoint"',
        explanation: 'Now you are on the feature branch. Commits go to this branch only, keeping main untouched. This isolation is the key benefit of branching.',
        syntax: [
          { text: 'git commit', desc: 'Create commit on current branch' },
          { text: '-m "Add login endpoint"', desc: 'Message describing the change' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '3 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login endpoint', branch: 'feature/auth', parents: ['c2'], author: 'dev', timestamp: '1 hour ago' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature/auth', color: getBranchColor('feature/auth'), lane: 1 },
        ],
        head: 'c3',
      },
      {
        action: 'Main progresses',
        description: 'Meanwhile, another dev pushes to main',
        command: 'git checkout main && git commit -m "Update README"',
        explanation: 'Switch back to main with "git checkout main", then commit. This shows how branches diverge independently. Main and feature/auth now have different histories.',
        syntax: [
          { text: 'git checkout main', desc: 'Switch to the main branch' },
          { text: '&&', desc: 'Chain commands together' },
          { text: 'git commit -m "..."', desc: 'Commit on main' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '3 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login endpoint', branch: 'feature/auth', parents: ['c2'], author: 'dev', timestamp: '1 hour ago' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Update README', branch: 'main', parents: ['c2'], author: 'alice', timestamp: '50 min ago' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature/auth', color: getBranchColor('feature/auth'), lane: 1 },
        ],
        head: 'c4',
      },
      {
        action: 'Continue feature',
        description: 'Add more commits to the feature branch',
        command: 'git checkout feature/auth && git commit -m "Add JWT tokens"',
        explanation: 'Switch back to the feature branch and continue working. The branches are now diverged: main has "Update README" while feature/auth has "Add login endpoint".',
        syntax: [
          { text: 'git checkout feature/auth', desc: 'Switch to feature branch' },
          { text: '&&', desc: 'Then run next command' },
          { text: 'git commit -m "..."', desc: 'Add another commit' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', timestamp: '3 hours ago' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev', timestamp: '2 hours ago' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login endpoint', branch: 'feature/auth', parents: ['c2'], author: 'dev', timestamp: '1 hour ago' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Update README', branch: 'main', parents: ['c2'], author: 'alice', timestamp: '50 min ago' },
          { id: 'c5', hash: 'h7i8j9k', message: 'Add JWT tokens', branch: 'feature/auth', parents: ['c3'], author: 'dev', timestamp: '30 min ago' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature/auth', color: getBranchColor('feature/auth'), lane: 1 },
        ],
        head: 'c5',
      },
    ],
  },
  merge: {
    title: 'Merge',
    icon: <GitMerge className="h-3.5 w-3.5" />,
    description: 'Integrate feature branches back into main',
    steps: [
      {
        action: 'Diverged branches',
        description: 'Main and feature have diverged',
        command: 'git log --all --graph --oneline',
        explanation: '"git log --all --graph" shows the history of ALL branches as an ASCII graph. This helps you see how branches have diverged before merging.',
        syntax: [
          { text: 'git log', desc: 'Show commit history' },
          { text: '--all', desc: 'Include all branches' },
          { text: '--graph', desc: 'Draw ASCII branch graph' },
          { text: '--oneline', desc: 'Compact single-line format' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login page', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Fix typo in docs', branch: 'main', parents: ['c2'], author: 'alice' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c4',
      },
      {
        action: 'Feature complete',
        description: 'Finish work on the feature branch',
        command: 'git checkout feature && git commit -m "Add signup page"',
        explanation: 'Finish the last piece of work on the feature branch before merging. Always complete and test your feature before integrating it into main.',
        syntax: [
          { text: 'git checkout feature', desc: 'Switch to feature branch' },
          { text: '&&', desc: 'Chain commands' },
          { text: 'git commit -m "..."', desc: 'Final feature commit' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login page', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Fix typo in docs', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c5', hash: 'h7i8j9k', message: 'Add signup page', branch: 'feature', parents: ['c3'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c5',
      },
      {
        action: 'Merge into main',
        description: 'Create a merge commit to integrate the feature',
        command: 'git checkout main && git merge feature',
        explanation: 'First switch to main (the target branch), then merge feature into it. Git creates a "merge commit" with TWO parents, combining both histories. This is a non-destructive operation.',
        syntax: [
          { text: 'git checkout main', desc: 'Switch to target branch' },
          { text: '&&', desc: 'Then merge' },
          { text: 'git merge', desc: 'Integrate another branch' },
          { text: 'feature', desc: 'The branch to merge in' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login page', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Fix typo in docs', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c5', hash: 'h7i8j9k', message: 'Add signup page', branch: 'feature', parents: ['c3'], author: 'dev' },
          { id: 'c6', hash: 'l0m1n2o', message: 'Merge feature into main', branch: 'main', parents: ['c4', 'c5'], author: 'dev', tags: ['v1.0.0'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c6',
      },
      {
        action: 'Continue development',
        description: 'Development continues on main after merge',
        command: 'git commit -m "Improve performance"',
        explanation: 'After merging, main contains all the feature work. You can now continue development on main or create new branches for new features.',
        syntax: [
          { text: 'git commit', desc: 'Continue committing on main' },
          { text: '-m "Improve performance"', desc: 'Describe the new change' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add base config', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add login page', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Fix typo in docs', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c5', hash: 'h7i8j9k', message: 'Add signup page', branch: 'feature', parents: ['c3'], author: 'dev' },
          { id: 'c6', hash: 'l0m1n2o', message: 'Merge feature into main', branch: 'main', parents: ['c4', 'c5'], author: 'dev', tags: ['v1.0.0'] },
          { id: 'c7', hash: 'p3q4r5s', message: 'Improve performance', branch: 'main', parents: ['c6'], author: 'dev' },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c7',
      },
    ],
  },
  rebase: {
    title: 'Rebase',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    description: 'Replay commits on top of another branch for linear history',
    steps: [
      {
        action: 'Diverged state',
        description: 'Feature and main have diverged',
        command: 'git log --all --graph --oneline',
        explanation: 'View the current state. Feature and main branched off from the same point and have since diverged with separate commits. Rebase will fix this.',
        syntax: [
          { text: 'git log', desc: 'Show commit history' },
          { text: '--all --graph --oneline', desc: 'All branches, graph, compact' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Base setup', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'Feature work A', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Main hotpatch', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c5', hash: 'h7i8j9k', message: 'Feature work B', branch: 'feature', parents: ['c3'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c5',
      },
      {
        action: 'Start rebase',
        description: 'Rebase feature onto main to get a linear history',
        command: 'git checkout feature && git rebase main',
        explanation: '"git rebase main" replays feature commits on TOP of main\'s latest commit. The old commits get NEW hashes (note the \' marks). This creates a clean, linear history without merge commits.',
        syntax: [
          { text: 'git checkout feature', desc: 'Switch to branch being rebased' },
          { text: '&&', desc: 'Then rebase' },
          { text: 'git rebase', desc: 'Replay commits onto another base' },
          { text: 'main', desc: 'The new base branch' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Base setup', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Main hotpatch', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c3r', hash: 'x1y2z3a', message: "Feature work A'", branch: 'feature', parents: ['c4'], author: 'dev' },
          { id: 'c5r', hash: 'b4c5d6e', message: "Feature work B'", branch: 'feature', parents: ['c3r'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c5r',
      },
      {
        action: 'Fast-forward merge',
        description: 'Now main can fast-forward to feature tip',
        command: 'git checkout main && git merge feature',
        explanation: 'After rebasing, feature is directly ahead of main. Git can "fast-forward" main\'s pointer to the feature tip -- no merge commit needed. The result is a perfectly linear history.',
        syntax: [
          { text: 'git checkout main', desc: 'Switch to main' },
          { text: '&&', desc: 'Then merge' },
          { text: 'git merge feature', desc: 'Fast-forward main to feature' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev' },
          { id: 'c2', hash: 'e4f5g6h', message: 'Base setup', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c4', hash: 'd4e5f6g', message: 'Main hotpatch', branch: 'main', parents: ['c2'], author: 'alice' },
          { id: 'c3r', hash: 'x1y2z3a', message: "Feature work A'", branch: 'main', parents: ['c4'], author: 'dev' },
          { id: 'c5r', hash: 'b4c5d6e', message: "Feature work B'", branch: 'main', parents: ['c3r'], author: 'dev', tags: ['v1.1.0'] },
        ],
        branches: [{ name: 'main', color: getBranchColor('main'), lane: 0 }],
        head: 'c5r',
      },
    ],
  },
  hotfix: {
    title: 'Hotfix',
    icon: <Zap className="h-3.5 w-3.5" />,
    description: 'Emergency fix applied to production',
    steps: [
      {
        action: 'Production state',
        description: 'Main is deployed, feature in progress',
        command: 'git log --all --oneline',
        explanation: 'The current state: main is deployed to production with v1.0.0, and a feature is being developed in parallel. Then a critical bug is discovered in production.',
        syntax: [
          { text: 'git log', desc: 'Show commit history' },
          { text: '--all --oneline', desc: 'All branches, compact format' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', tags: ['v1.0.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add dashboard', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'New feature WIP', branch: 'feature', parents: ['c2'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c3',
      },
      {
        action: 'Create hotfix branch',
        description: 'Critical bug found! Branch off main immediately',
        command: 'git checkout main && git checkout -b hotfix/critical',
        explanation: 'Emergency! First switch to main (production code), then create a hotfix branch. Hotfix branches branch from main, NOT from develop or feature, because they need to patch production directly.',
        syntax: [
          { text: 'git checkout main', desc: 'Go to production branch' },
          { text: '&&', desc: 'Then create hotfix branch' },
          { text: 'git checkout -b', desc: 'Create + switch' },
          { text: 'hotfix/critical', desc: 'Descriptive hotfix name' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', tags: ['v1.0.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add dashboard', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'New feature WIP', branch: 'feature', parents: ['c2'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
          { name: 'hotfix/critical', color: getBranchColor('hotfix/critical'), lane: 2 },
        ],
        head: 'c2',
      },
      {
        action: 'Apply fix',
        description: 'Fix the critical bug on the hotfix branch',
        command: 'git commit -m "Fix critical security bug"',
        explanation: 'Apply the fix on the hotfix branch. Keep the fix minimal and focused. Do not add unrelated changes. The hotfix branch exists solely for this emergency.',
        syntax: [
          { text: 'git commit', desc: 'Commit the fix' },
          { text: '-m "Fix critical security bug"', desc: 'Clear, specific message' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', tags: ['v1.0.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add dashboard', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'New feature WIP', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'z9y8x7w', message: 'Fix critical security bug', branch: 'hotfix/critical', parents: ['c2'], author: 'dev' },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
          { name: 'hotfix/critical', color: getBranchColor('hotfix/critical'), lane: 2 },
        ],
        head: 'c4',
      },
      {
        action: 'Merge hotfix to main',
        description: 'Merge the fix into main and tag a release',
        command: 'git checkout main && git merge hotfix/critical',
        explanation: 'Merge the hotfix back into main and tag it as v1.0.1 (patch release). After merging, deploy the fix. The feature branch can later merge or rebase to pick up the fix.',
        syntax: [
          { text: 'git checkout main', desc: 'Switch to main' },
          { text: '&&', desc: 'Then merge the fix' },
          { text: 'git merge', desc: 'Integrate hotfix' },
          { text: 'hotfix/critical', desc: 'Hotfix branch to merge' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], author: 'dev', tags: ['v1.0.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Add dashboard', branch: 'main', parents: ['c1'], author: 'dev' },
          { id: 'c3', hash: 'f1a2b3c', message: 'New feature WIP', branch: 'feature', parents: ['c2'], author: 'dev' },
          { id: 'c4', hash: 'z9y8x7w', message: 'Fix critical security bug', branch: 'hotfix/critical', parents: ['c2'], author: 'dev' },
          { id: 'c5', hash: 'v6u5t4s', message: 'Merge hotfix into main', branch: 'main', parents: ['c2', 'c4'], author: 'dev', tags: ['v1.0.1'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'feature', color: getBranchColor('feature'), lane: 1 },
        ],
        head: 'c5',
      },
    ],
  },
  gitflow: {
    title: 'Git Flow',
    icon: <Brain className="h-3.5 w-3.5" />,
    description: 'Full Git Flow with develop, feature, and release branches',
    steps: [
      {
        action: 'Initialize Git Flow',
        description: 'Set up main and develop branches',
        command: 'git flow init',
        explanation: '"git flow init" sets up the Git Flow branching model. It creates a "develop" branch from main. Main holds production code, develop holds the latest development state.',
        syntax: [
          { text: 'git flow', desc: 'Git Flow extension command' },
          { text: 'init', desc: 'Initialize branch structure' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], tags: ['v0.1.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Setup project', branch: 'develop', parents: ['c1'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'develop', color: getBranchColor('develop'), lane: 1 },
        ],
        head: 'c2',
      },
      {
        action: 'Start feature',
        description: 'Create a feature branch off develop',
        command: 'git flow feature start auth',
        explanation: '"git flow feature start" creates a feature branch from develop (not main). Features are always based on the latest development state, keeping main stable.',
        syntax: [
          { text: 'git flow feature', desc: 'Feature subcommand' },
          { text: 'start', desc: 'Create a new feature branch' },
          { text: 'auth', desc: 'Feature name (creates feature/auth)' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], tags: ['v0.1.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Setup project', branch: 'develop', parents: ['c1'] },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add auth module', branch: 'feature/auth', parents: ['c2'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'develop', color: getBranchColor('develop'), lane: 1 },
          { name: 'feature/auth', color: getBranchColor('feature/auth'), lane: 2 },
        ],
        head: 'c3',
      },
      {
        action: 'Finish feature',
        description: 'Merge feature back into develop',
        command: 'git flow feature finish auth',
        explanation: '"git flow feature finish" merges the feature into develop and deletes the feature branch. The feature is now part of develop but not yet in main (not released).',
        syntax: [
          { text: 'git flow feature', desc: 'Feature subcommand' },
          { text: 'finish', desc: 'Merge and delete feature branch' },
          { text: 'auth', desc: 'Name of feature to finish' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], tags: ['v0.1.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Setup project', branch: 'develop', parents: ['c1'] },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add auth module', branch: 'feature/auth', parents: ['c2'] },
          { id: 'c4', hash: 'd4e5f6g', message: 'Merge feature/auth', branch: 'develop', parents: ['c2', 'c3'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'develop', color: getBranchColor('develop'), lane: 1 },
        ],
        head: 'c4',
      },
      {
        action: 'Create release',
        description: 'Start a release branch from develop',
        command: 'git flow release start 1.0',
        explanation: '"git flow release start" creates a release branch from develop. This is for final preparations: version bumps, last-minute fixes. No new features are added here.',
        syntax: [
          { text: 'git flow release', desc: 'Release subcommand' },
          { text: 'start', desc: 'Begin a new release' },
          { text: '1.0', desc: 'Version number' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], tags: ['v0.1.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Setup project', branch: 'develop', parents: ['c1'] },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add auth module', branch: 'feature/auth', parents: ['c2'] },
          { id: 'c4', hash: 'd4e5f6g', message: 'Merge feature/auth', branch: 'develop', parents: ['c2', 'c3'] },
          { id: 'c5', hash: 'h7i8j9k', message: 'Bump version to 1.0', branch: 'release/1.0', parents: ['c4'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'develop', color: getBranchColor('develop'), lane: 1 },
          { name: 'release/1.0', color: getBranchColor('release/1.0'), lane: 2 },
        ],
        head: 'c5',
      },
      {
        action: 'Finish release',
        description: 'Merge release into main and develop, tag it',
        command: 'git flow release finish 1.0',
        explanation: '"git flow release finish" merges the release into BOTH main and develop, tags main with the version, and deletes the release branch. Main now has the release.',
        syntax: [
          { text: 'git flow release', desc: 'Release subcommand' },
          { text: 'finish', desc: 'Finalize and merge release' },
          { text: '1.0', desc: 'Release version to finish' },
        ],
        commits: [
          { id: 'c1', hash: 'a1b2c3d', message: 'Initial commit', branch: 'main', parents: [], tags: ['v0.1.0'] },
          { id: 'c2', hash: 'e4f5g6h', message: 'Setup project', branch: 'develop', parents: ['c1'] },
          { id: 'c3', hash: 'f1a2b3c', message: 'Add auth module', branch: 'feature/auth', parents: ['c2'] },
          { id: 'c4', hash: 'd4e5f6g', message: 'Merge feature/auth', branch: 'develop', parents: ['c2', 'c3'] },
          { id: 'c5', hash: 'h7i8j9k', message: 'Bump version to 1.0', branch: 'release/1.0', parents: ['c4'] },
          { id: 'c6', hash: 'l0m1n2o', message: 'Release v1.0.0', branch: 'main', parents: ['c1', 'c5'], tags: ['v1.0.0'] },
          { id: 'c7', hash: 'p3q4r5s', message: 'Merge release back', branch: 'develop', parents: ['c4', 'c5'] },
        ],
        branches: [
          { name: 'main', color: getBranchColor('main'), lane: 0 },
          { name: 'develop', color: getBranchColor('develop'), lane: 1 },
        ],
        head: 'c6',
      },
    ],
  },
});

// ─── Graph Layout Engine ────────────────────────────────────────────────────

interface LayoutNode {
  commit: CommitNode;
  x: number;
  y: number;
  lane: number;
  color: string;
}

interface LayoutEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isMerge: boolean;
}

function layoutGraph(commits: CommitNode[], branches: BranchInfo[]): { nodes: LayoutNode[]; edges: LayoutEdge[]; width: number; height: number } {
  const branchLaneMap = new Map<string, number>();
  branches.forEach(b => branchLaneMap.set(b.name, b.lane));

  const nodes: LayoutNode[] = commits.map((commit, idx) => {
    const lane = branchLaneMap.get(commit.branch) ?? 0;
    const color = getBranchColor(commit.branch);
    return {
      commit,
      x: GRAPH_CONFIG.leftPadding + lane * GRAPH_CONFIG.laneWidth,
      y: GRAPH_CONFIG.topPadding + idx * GRAPH_CONFIG.rowHeight,
      lane,
      color,
    };
  });

  const nodeMap = new Map<string, LayoutNode>();
  nodes.forEach(n => nodeMap.set(n.commit.id, n));

  const edges: LayoutEdge[] = [];
  for (const node of nodes) {
    for (const parentId of node.commit.parents) {
      const parent = nodeMap.get(parentId);
      if (!parent) continue;
      const isMerge = node.commit.parents.length > 1;
      edges.push({
        from: { x: parent.x, y: parent.y },
        to: { x: node.x, y: node.y },
        color: node.color,
        isMerge,
      });
    }
  }

  const maxLane = Math.max(...nodes.map(n => n.lane), 0);
  const width = GRAPH_CONFIG.leftPadding * 2 + maxLane * GRAPH_CONFIG.laneWidth;
  const height = GRAPH_CONFIG.topPadding * 2 + (commits.length - 1) * GRAPH_CONFIG.rowHeight;

  return { nodes, edges, width: Math.max(width, 80), height: Math.max(height, 60) };
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const r = GRAPH_CONFIG.nodeRadius;
  if (from.x === to.x) {
    return `M ${from.x} ${from.y + r} L ${to.x} ${to.y - r}`;
  }
  const midY = from.y + (to.y - from.y) * 0.4;
  return `M ${from.x} ${from.y + r} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - r}`;
}

// ─── Git Graph SVG Component ────────────────────────────────────────────────

const GitGraph: React.FC<{
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  headId: string;
  hoveredCommit: string | null;
  onHoverCommit: (id: string | null) => void;
  onClickCommit: (id: string) => void;
}> = ({ nodes, edges, width, height, headId, hoveredCommit, onHoverCommit, onClickCommit }) => (
  <svg
    width={width}
    height={height}
    className="flex-shrink-0"
    style={{ minWidth: width }}
  >
    {/* Lane guide lines */}
    {Array.from(new Set(nodes.map(n => n.x))).map(x => (
      <line
        key={`lane-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="currentColor"
        className="text-slate-200 dark:text-slate-700"
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.5"
      />
    ))}

    {/* Edges */}
    {edges.map((edge, idx) => (
      <path
        key={idx}
        d={edgePath(edge.from, edge.to)}
        fill="none"
        stroke={edge.color}
        strokeWidth={edge.isMerge ? 1.5 : 2}
        strokeDasharray={edge.isMerge ? '4 2' : undefined}
        opacity={0.7}
      />
    ))}

    {/* Nodes */}
    {nodes.map(node => {
      const isHead = node.commit.id === headId;
      const isHovered = node.commit.id === hoveredCommit;
      const r = isHead ? GRAPH_CONFIG.nodeRadius + 2 : GRAPH_CONFIG.nodeRadius;
      return (
        <g
          key={node.commit.id}
          onMouseEnter={() => onHoverCommit(node.commit.id)}
          onMouseLeave={() => onHoverCommit(null)}
          onClick={() => onClickCommit(node.commit.id)}
          className="cursor-pointer"
        >
          {isHead && (
            <circle cx={node.x} cy={node.y} r={r + 3} fill={node.color} opacity={0.2} />
          )}
          <circle
            cx={node.x}
            cy={node.y}
            r={r}
            fill={node.color}
            stroke={isHovered ? '#fff' : node.color}
            strokeWidth={isHovered ? 2 : 1.5}
            style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
          />
          {isHead && (
            <circle cx={node.x} cy={node.y} r={2.5} fill="#fff" />
          )}
        </g>
      );
    })}
  </svg>
);

// ─── Commit Row Component ───────────────────────────────────────────────────

const CommitRow: React.FC<{
  node: LayoutNode;
  isHead: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ node, isHead, isHovered, onHover, onClick }) => {
  const { commit } = node;
  return (
    <div
      className={`flex items-center gap-3 px-3 h-14 border-b transition-colors cursor-pointer ${
        isHovered
          ? 'bg-slate-100 dark:bg-slate-700/50'
          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
      } ${isHead ? 'border-l-2' : 'border-l-2 border-l-transparent'}`}
      style={isHead ? { borderLeftColor: node.color } : undefined}
      onMouseEnter={() => onHover(commit.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(commit.id)}
    >
      {/* Hash */}
      <code className="text-xs font-mono w-16 flex-shrink-0" style={{ color: node.color }}>
        {commit.hash}
      </code>

      {/* Message */}
      <span className="text-sm text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0 font-medium">
        {commit.message}
      </span>

      {/* Tags */}
      {commit.tags?.map(tag => (
        <Badge
          key={tag}
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
        >
          <Tag className="h-2.5 w-2.5 mr-0.5" />
          {tag}
        </Badge>
      ))}

      {/* HEAD indicator */}
      {isHead && (
        <Badge className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 text-white" style={{ backgroundColor: node.color }}>
          HEAD
        </Badge>
      )}

      {/* Branch badge */}
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
        style={{ borderColor: node.color, color: node.color }}
      >
        {commit.branch}
      </Badge>

      {/* Author and time */}
      {commit.author && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 hidden lg:inline">
          {commit.author}
        </span>
      )}
      {commit.timestamp && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 hidden xl:inline w-20 text-right">
          {commit.timestamp}
        </span>
      )}
    </div>
  );
};

// ─── Command Reference Data ─────────────────────────────────────────────────

const COMMAND_GROUPS = [
  {
    title: 'Setup & Init',
    commands: [
      { cmd: 'git init', desc: 'Initialize a new repository' },
      { cmd: 'git clone <url>', desc: 'Clone a remote repository' },
      { cmd: 'git config --global user.name "Name"', desc: 'Set your identity' },
    ],
  },
  {
    title: 'Staging & Committing',
    commands: [
      { cmd: 'git status', desc: 'Check working tree status' },
      { cmd: 'git add <file>', desc: 'Stage specific file' },
      { cmd: 'git add .', desc: 'Stage all changes' },
      { cmd: 'git commit -m "msg"', desc: 'Commit with message' },
      { cmd: 'git commit --amend', desc: 'Amend last commit' },
    ],
  },
  {
    title: 'Branching',
    commands: [
      { cmd: 'git branch', desc: 'List local branches' },
      { cmd: 'git branch <name>', desc: 'Create a new branch' },
      { cmd: 'git checkout <branch>', desc: 'Switch to branch' },
      { cmd: 'git checkout -b <name>', desc: 'Create and switch' },
      { cmd: 'git branch -d <name>', desc: 'Delete merged branch' },
    ],
  },
  {
    title: 'Merging & Rebasing',
    commands: [
      { cmd: 'git merge <branch>', desc: 'Merge branch into current' },
      { cmd: 'git rebase <branch>', desc: 'Rebase onto branch' },
      { cmd: 'git rebase -i HEAD~3', desc: 'Interactive rebase last 3' },
      { cmd: 'git cherry-pick <hash>', desc: 'Apply specific commit' },
    ],
  },
  {
    title: 'Remote',
    commands: [
      { cmd: 'git remote -v', desc: 'List remotes' },
      { cmd: 'git fetch origin', desc: 'Download remote changes' },
      { cmd: 'git pull origin main', desc: 'Fetch and merge' },
      { cmd: 'git push origin <branch>', desc: 'Upload commits' },
      { cmd: 'git push -u origin <branch>', desc: 'Push and track' },
    ],
  },
  {
    title: 'Inspection & History',
    commands: [
      { cmd: 'git log --oneline --graph', desc: 'Compact graph log' },
      { cmd: 'git diff', desc: 'Show unstaged changes' },
      { cmd: 'git diff --staged', desc: 'Show staged changes' },
      { cmd: 'git show <hash>', desc: 'Inspect a commit' },
      { cmd: 'git blame <file>', desc: 'Line-by-line authorship' },
    ],
  },
  {
    title: 'Undo & Fix',
    commands: [
      { cmd: 'git reset HEAD <file>', desc: 'Unstage a file' },
      { cmd: 'git reset --soft HEAD~1', desc: 'Undo last commit, keep changes' },
      { cmd: 'git reset --hard HEAD~1', desc: 'Discard last commit entirely' },
      { cmd: 'git stash', desc: 'Stash working changes' },
      { cmd: 'git stash pop', desc: 'Restore stash' },
      { cmd: 'git revert <hash>', desc: 'Create undo commit' },
    ],
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export const GitVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('visualizer');
  const [scenario, setScenario] = useState<ScenarioKey>('basic');
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [userCommand, setUserCommand] = useState('');
  const [cmdFeedback, setCmdFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [cmdHistory, setCmdHistory] = useState<{ cmd: string; ok: boolean; msg: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const scenarios = useMemo(() => createScenarios(), []);
  const currentScenario = scenarios[scenario];
  const currentStep = currentScenario.steps[step];
  const { nodes, edges, width: graphWidth, height: graphHeight } = useMemo(
    () => layoutGraph(currentStep.commits, currentStep.branches),
    [currentStep]
  );

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => {
      if (step < currentScenario.steps.length - 1) {
        setStep(s => s + 1);
      } else {
        setAutoPlay(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoPlay, step, currentScenario.steps.length]);

  // Reset feedback on step/scenario change
  useEffect(() => {
    setCmdFeedback({ status: 'idle', message: '' });
    setUserCommand('');
    setSelectedCommit(null);
    setShowHint(false);
  }, [scenario, step]);

  // Reset history on scenario change
  useEffect(() => {
    setCmdHistory([]);
  }, [scenario]);

  // Scroll to bottom when commits change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStep.commits.length]);

  const changeScenario = useCallback((s: ScenarioKey) => {
    setScenario(s);
    setStep(0);
    setAutoPlay(false);
  }, []);

  const normalizeCmd = useCallback((s: string) =>
    s.trim().replace(/^\$\s*/, '').replace(/\s+/g, ' ').toLowerCase(), []);

  const handleCmdSubmit = useCallback(() => {
    const val = userCommand.trim();
    if (!val) return;

    const normalized = normalizeCmd(val);
    const fullExpected = normalizeCmd(currentStep.command);
    const expectedParts = currentStep.command.split('&&').map(s => normalizeCmd(s));

    // Check full match
    if (normalized === fullExpected) {
      const msg = 'Command executed successfully.';
      setCmdFeedback({ status: 'success', message: msg });
      setCmdHistory(h => [...h, { cmd: val, ok: true, msg }]);
      setUserCommand('');
      setShowHint(false);
      if (step < currentScenario.steps.length - 1) {
        setTimeout(() => setStep(s => s + 1), 600);
      }
      return;
    }

    // Check if it matches any individual part of a compound command
    if (expectedParts.length > 1 && expectedParts.some(e => normalized === e)) {
      const msg = `Partially correct. The full command is: ${currentStep.command}`;
      setCmdFeedback({ status: 'error', message: msg });
      setCmdHistory(h => [...h, { cmd: val, ok: false, msg }]);
      setUserCommand('');
      return;
    }

    // Check if it starts with 'git'
    if (!normalized.startsWith('git')) {
      const msg = 'Not a git command. Commands should start with "git".';
      setCmdFeedback({ status: 'error', message: msg });
      setCmdHistory(h => [...h, { cmd: val, ok: false, msg }]);
      setUserCommand('');
      return;
    }

    // Check if the right git subcommand is used
    const expectedSubcmd = fullExpected.split(' ')[1];
    const userSubcmd = normalized.split(' ')[1];
    if (expectedSubcmd && userSubcmd && userSubcmd !== expectedSubcmd) {
      const msg = `Wrong command. Expected "git ${expectedSubcmd} ..." but got "git ${userSubcmd} ...".`;
      setCmdFeedback({ status: 'error', message: msg });
      setCmdHistory(h => [...h, { cmd: val, ok: false, msg }]);
      setUserCommand('');
      return;
    }

    // Generic wrong command
    const msg = 'Incorrect command. Use the hint button if you need help.';
    setCmdFeedback({ status: 'error', message: msg });
    setCmdHistory(h => [...h, { cmd: val, ok: false, msg }]);
    setUserCommand('');
  }, [userCommand, currentStep, step, currentScenario.steps.length, normalizeCmd]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1500);
  }, []);

  const selectedNode = selectedCommit ? nodes.find(n => n.commit.id === selectedCommit) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* ── Tab Bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-md p-0.5">
            {([
              { key: 'visualizer' as TabKey, icon: <Zap className="h-3 w-3" />, label: 'Visualizer' },
              { key: 'commands' as TabKey, icon: <Terminal className="h-3 w-3" />, label: 'Commands' },
              { key: 'guide' as TabKey, icon: <BookOpen className="h-3 w-3" />, label: 'Guide' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visualizer Tab ──────────────────────────────────────────── */}
        {activeTab === 'visualizer' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scenario selector bar */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex-shrink-0 overflow-x-auto">
              {(Object.entries(scenarios) as [ScenarioKey, Scenario][]).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => changeScenario(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    scenario === key
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {s.icon}
                  {s.title}
                </button>
              ))}
            </div>

            {/* Main content: graph + commit list */}
            <div className="flex-1 flex overflow-hidden">
              {/* Commit graph area (left side) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Column headers */}
                <div className="flex items-center px-4 py-1.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0">
                  <div style={{ width: graphWidth + 16 }} className="flex-shrink-0">Graph</div>
                  <div className="w-16 flex-shrink-0">Hash</div>
                  <div className="flex-1 ml-3">Message</div>
                </div>

                {/* Scrollable commit area */}
                <div ref={scrollRef} className="flex-1 overflow-auto">
                  <div className="flex">
                    {/* SVG graph column */}
                    <div className="flex-shrink-0 border-r border-slate-100 dark:border-slate-700/50" style={{ width: graphWidth + 16, padding: '0 8px' }}>
                      <GitGraph
                        nodes={nodes}
                        edges={edges}
                        width={graphWidth}
                        height={graphHeight}
                        headId={currentStep.head}
                        hoveredCommit={hoveredCommit}
                        onHoverCommit={setHoveredCommit}
                        onClickCommit={setSelectedCommit}
                      />
                    </div>

                    {/* Commit message rows */}
                    <div className="flex-1 min-w-0">
                      {nodes.map(node => (
                        <CommitRow
                          key={node.commit.id}
                          node={node}
                          isHead={node.commit.id === currentStep.head}
                          isHovered={node.commit.id === hoveredCommit}
                          onHover={setHoveredCommit}
                          onClick={setSelectedCommit}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Branch labels bar */}
                <div className="flex items-center gap-2 px-4 py-1.5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mr-1">Branches:</span>
                  {currentStep.branches.map(b => (
                    <div key={b.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-[11px] font-mono font-medium" style={{ color: b.color }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail sidebar */}
              {selectedNode && (
                <div className="w-64 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 overflow-auto">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commit Details</span>
                      <button onClick={() => setSelectedCommit(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><Hash className="h-2.5 w-2.5" />Hash</div>
                        <code className="text-xs font-mono font-bold" style={{ color: selectedNode.color }}>{selectedNode.commit.hash}</code>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><GitCommit className="h-2.5 w-2.5" />Message</div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{selectedNode.commit.message}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><GitBranch className="h-2.5 w-2.5" />Branch</div>
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: selectedNode.color, color: selectedNode.color }}>{selectedNode.commit.branch}</Badge>
                      </div>
                      {selectedNode.commit.author && (
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><User className="h-2.5 w-2.5" />Author</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{selectedNode.commit.author}</p>
                        </div>
                      )}
                      {selectedNode.commit.timestamp && (
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Time</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{selectedNode.commit.timestamp}</p>
                        </div>
                      )}
                      {selectedNode.commit.parents.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Parents</div>
                          <div className="flex gap-1 flex-wrap">
                            {selectedNode.commit.parents.map(p => {
                              const parentNode = nodes.find(n => n.commit.id === p);
                              return (
                                <code
                                  key={p}
                                  className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 cursor-pointer hover:ring-1 ring-slate-400"
                                  style={{ color: parentNode?.color }}
                                  onClick={() => setSelectedCommit(p)}
                                >
                                  {parentNode?.commit.hash ?? p}
                                </code>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {selectedNode.commit.tags && selectedNode.commit.tags.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1"><Tag className="h-2.5 w-2.5" />Tags</div>
                          <div className="flex gap-1 flex-wrap">
                            {selectedNode.commit.tags.map(t => (
                              <Badge key={t} variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instruction panel - always visible */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 flex-shrink-0 px-4 py-2.5 space-y-2">
              {/* Step header */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400">
                  Step {step + 1}/{currentScenario.steps.length}
                </Badge>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{currentStep.action}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">-- {currentStep.description}</span>
              </div>

              {/* Command to type */}
              <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-950 rounded-md px-3 py-1.5 font-mono">
                <span className="text-green-500 text-xs flex-shrink-0">$</span>
                <code className="text-xs text-green-400 flex-1 select-all">{currentStep.command}</code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => copyToClipboard(currentStep.command)}
                      className="text-slate-500 hover:text-slate-300 flex-shrink-0"
                    >
                      {copiedCmd === currentStep.command ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy command</TooltipContent>
                </Tooltip>
              </div>

              {/* Syntax breakdown */}
              <div className="flex flex-wrap gap-1.5">
                {currentStep.syntax.map((part, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-help border border-transparent hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                        {part.text}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs"><span className="font-mono font-bold text-orange-400">{part.text}</span> -- {part.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Explanation */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentStep.explanation}
              </p>
            </div>

            {/* Bottom control panel */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex-shrink-0">
              {/* Step info + controls */}
              <div className="flex items-center gap-3 px-4 py-2">
                {/* Step counter */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {currentScenario.steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setStep(i); setAutoPlay(false); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === step ? 'scale-125' : 'opacity-40 hover:opacity-70'
                      }`}
                      style={{ backgroundColor: i <= step ? getBranchColor('main') : '#94a3b8' }}
                    />
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

                {/* Playback controls */}
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => { setStep(0); setAutoPlay(false); }}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={step === 0}
                        onClick={() => setStep(s => s - 1)}
                      >
                        <SkipBack className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous step</TooltipContent>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 w-7 p-0 ${autoPlay ? 'text-orange-600' : ''}`}
                    onClick={() => setAutoPlay(a => !a)}
                  >
                    {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={step === currentScenario.steps.length - 1}
                        onClick={() => setStep(s => s + 1)}
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Next step</TooltipContent>
                  </Tooltip>
                </div>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

                {/* Compact label */}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-1 truncate">
                  Try typing the command above, or use the playback controls
                </span>

                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex-shrink-0">
                  {step + 1}/{currentScenario.steps.length}
                </span>
              </div>

              {/* Terminal area */}
              <div ref={terminalRef} className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-900 dark:bg-slate-950 rounded-b-lg overflow-hidden">
                {/* Command history (scrollable, max 3 visible) */}
                {cmdHistory.length > 0 && (
                  <div className="max-h-[72px] overflow-y-auto px-4 pt-1.5 space-y-0.5">
                    {cmdHistory.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] font-mono">
                        <span className="text-slate-600 flex-shrink-0">$</span>
                        <span className={entry.ok ? 'text-green-500' : 'text-red-400'}>{entry.cmd}</span>
                        {!entry.ok && (
                          <span className="text-red-500/70 ml-auto flex-shrink-0 text-[10px] max-w-[50%] truncate">{entry.msg}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback message */}
                {cmdFeedback.status !== 'idle' && (
                  <div className={`flex items-center gap-1.5 px-4 py-1 text-[11px] font-mono ${
                    cmdFeedback.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {cmdFeedback.status === 'success'
                      ? <CheckCircle className="h-3 w-3 flex-shrink-0" />
                      : <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    }
                    <span className="truncate">{cmdFeedback.message}</span>
                  </div>
                )}

                {/* Hint (toggled) - links back to instruction panel */}
                {showHint && (
                  <div className="flex items-center gap-1.5 px-4 py-1 text-[11px] font-mono text-amber-400/80">
                    <Info className="h-3 w-3 flex-shrink-0" />
                    <span>Look at the instruction panel above for the full command and syntax breakdown</span>
                  </div>
                )}

                {/* Input row */}
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="text-green-500 text-xs font-mono flex-shrink-0">$</span>
                  <Input
                    value={userCommand}
                    onChange={(e) => { setUserCommand(e.target.value); if (cmdFeedback.status !== 'idle') setCmdFeedback({ status: 'idle', message: '' }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCmdSubmit(); }}
                    placeholder={`Type the git command for "${currentStep.action}"...`}
                    className="h-6 text-xs font-mono bg-slate-800 dark:bg-slate-800 border-slate-700 text-green-400 placeholder:text-slate-600 flex-1"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 ${showHint ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setShowHint(h => !h)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showHint ? 'Hide hint' : 'Show hint'}</TooltipContent>
                  </Tooltip>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs bg-green-700 hover:bg-green-600 text-white"
                    onClick={handleCmdSubmit}
                  >
                    Run
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Commands Tab ────────────────────────────────────────────── */}
        {activeTab === 'commands' && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMMAND_GROUPS.map(group => (
                  <Card key={group.title} className="overflow-hidden border-slate-200 dark:border-slate-700">
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{group.title}</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {group.commands.map(c => (
                        <div key={c.cmd} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                          <code className="text-xs font-mono text-orange-600 dark:text-orange-400 flex-1 min-w-0 truncate">{c.cmd}</code>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 max-w-[140px] truncate">{c.desc}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(c.cmd)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {copiedCmd === c.cmd ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ── Guide Tab ──────────────────────────────────────────────── */}
        {activeTab === 'guide' && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4 max-w-3xl mx-auto">
              {/* Intro */}
              <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Git Fundamentals</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Git is a distributed version control system that tracks changes as snapshots (commits). Every developer has a full copy of the repository, enabling offline work and fast operations.
                </p>
              </Card>

              {/* Core concepts */}
              {[
                {
                  icon: <GitCommit className="h-4 w-4" />,
                  color: '#3b82f6',
                  title: 'Commits',
                  desc: 'Immutable snapshots of your project. Each commit has a unique SHA-1 hash, a message, author info, and pointers to parent commits.',
                  tips: ['Write clear, imperative messages: "Add login endpoint"', 'Keep commits atomic -- one logical change per commit', 'Use git commit --amend to fix the last commit message'],
                },
                {
                  icon: <GitBranch className="h-4 w-4" />,
                  color: '#10b981',
                  title: 'Branches',
                  desc: 'Lightweight movable pointers to commits. Branches enable parallel development without affecting the main codebase.',
                  tips: ['Use descriptive names: feature/auth, bugfix/login-error', 'Keep branches short-lived and focused', 'Delete branches after merging to keep the repo clean'],
                },
                {
                  icon: <GitMerge className="h-4 w-4" />,
                  color: '#8b5cf6',
                  title: 'Merging',
                  desc: 'Combines work from different branches. A merge commit has two parents, preserving the full branching history.',
                  tips: ['Use --no-ff to always create a merge commit for clarity', 'Resolve conflicts carefully, test after resolving', 'Squash merges for cleaner history on feature branches'],
                },
                {
                  icon: <RotateCcw className="h-4 w-4" />,
                  color: '#f59e0b',
                  title: 'Rebasing',
                  desc: 'Replays commits from one branch onto another, creating a linear history. Rewrites commit hashes.',
                  tips: ['Never rebase commits that have been pushed and shared', 'Use interactive rebase to clean up local commits', 'Prefer rebase for feature branches, merge for shared branches'],
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-4 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: item.color }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0" style={{ color: item.color }}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{item.desc}</p>
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                        {item.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <ChevronRight className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: item.color }} />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Best practices */}
              <Card className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">Best Practices</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Commit early, commit often',
                    'Pull before you push',
                    'Use .gitignore for generated files',
                    'Review diffs before committing',
                    'Tag releases with semantic versioning',
                    'Write meaningful branch names',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
};
