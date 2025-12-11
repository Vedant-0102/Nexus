import React, { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, GitPullRequest, Plus, RefreshCw, Upload, Download, Terminal, FileText, Check, X, Clock, User, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch: string;
  files: string[];
}

interface Branch {
  name: string;
  commits: number;
  lastCommit: Date;
  isActive: boolean;
}

interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  staged: boolean;
}

export const GitClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState('changes');
  const [currentBranch, setCurrentBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');
  
  // Mock data - in real app, this would come from git commands
  const [branches] = useState<Branch[]>([
    { name: 'main', commits: 42, lastCommit: new Date('2024-01-15'), isActive: true },
    { name: 'feature/new-ui', commits: 8, lastCommit: new Date('2024-01-14'), isActive: false },
    { name: 'bugfix/login-issue', commits: 3, lastCommit: new Date('2024-01-13'), isActive: false },
    { name: 'develop', commits: 35, lastCommit: new Date('2024-01-12'), isActive: false },
  ]);

  const [commits] = useState<Commit[]>([
    {
      hash: 'a1b2c3d',
      message: 'Add new feature: Mind Map Creator',
      author: 'John Doe',
      date: new Date('2024-01-15T10:30:00'),
      branch: 'main',
      files: ['src/MindMap.tsx', 'src/index.ts']
    },
    {
      hash: 'e4f5g6h',
      message: 'Fix: Resolve calendar notification bug',
      author: 'Jane Smith',
      date: new Date('2024-01-15T09:15:00'),
      branch: 'main',
      files: ['src/Calendar.tsx']
    },
    {
      hash: 'i7j8k9l',
      message: 'Update: Improve spreadsheet performance',
      author: 'John Doe',
      date: new Date('2024-01-14T16:45:00'),
      branch: 'main',
      files: ['src/Spreadsheet.tsx', 'src/utils/formulas.ts']
    },
    {
      hash: 'm0n1o2p',
      message: 'Docs: Add README for markdown editor',
      author: 'Alice Johnson',
      date: new Date('2024-01-14T14:20:00'),
      branch: 'main',
      files: ['README.md', 'docs/markdown.md']
    },
    {
      hash: 'q3r4s5t',
      message: 'Feature: Add desktop icon context menu',
      author: 'Bob Wilson',
      date: new Date('2024-01-13T11:00:00'),
      branch: 'main',
      files: ['src/DesktopIcons.tsx', 'src/ContextMenu.tsx']
    },
  ]);

  const [fileChanges] = useState<FileChange[]>([
    { path: 'src/components/GitClient.tsx', status: 'added', staged: false },
    { path: 'src/components/Window.tsx', status: 'modified', staged: true },
    { path: 'src/styles/main.css', status: 'modified', staged: true },
    { path: 'src/utils/old-helper.ts', status: 'deleted', staged: false },
  ]);

  const stagedFiles = fileChanges.filter(f => f.staged);
  const unstagedFiles = fileChanges.filter(f => !f.staged);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-600 dark:text-green-400';
      case 'modified': return 'text-blue-600 dark:text-blue-400';
      case 'deleted': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return <Plus className="h-4 w-4" />;
      case 'modified': return <FileText className="h-4 w-4" />;
      case 'deleted': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold dark:text-white">Git Client</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 rounded-full border dark:border-gray-600">
            <GitBranch className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold dark:text-white">{currentBranch}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Fetch
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Pull
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Upload className="h-4 w-4 mr-2" />
            Push
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="changes">
            <FileText className="h-4 w-4 mr-2" />
            Changes ({fileChanges.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="branches">
            <GitBranch className="h-4 w-4 mr-2" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="terminal">
            <Terminal className="h-4 w-4 mr-2" />
            Terminal
          </TabsTrigger>
        </TabsList>

        {/* Changes Tab */}
        <TabsContent value="changes" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-4">
            {/* Commit Section */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <h3 className="font-bold mb-3 dark:text-white">Commit Changes</h3>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Enter commit message..."
                className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none mb-3"
                rows={3}
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!commitMessage || stagedFiles.length === 0}>
                  <GitCommit className="h-4 w-4 mr-2" />
                  Commit ({stagedFiles.length} files)
                </Button>
                <Button variant="outline">
                  <GitCommit className="h-4 w-4 mr-2" />
                  Commit & Push
                </Button>
              </div>
            </div>

            {/* Staged Changes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold dark:text-white">Staged Changes ({stagedFiles.length})</h3>
                <Button size="sm" variant="outline">Unstage All</Button>
              </div>
              {stagedFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  No staged changes
                </div>
              ) : (
                <div className="space-y-2">
                  {stagedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={getStatusColor(file.status)}>
                          {getStatusIcon(file.status)}
                        </div>
                        <span className="font-mono text-sm dark:text-white">{file.path}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(file.status)} bg-white dark:bg-gray-800`}>
                          {file.status}
                        </span>
                      </div>
                      <Button size="sm" variant="ghost">Unstage</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unstaged Changes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold dark:text-white">Unstaged Changes ({unstagedFiles.length})</h3>
                <Button size="sm" variant="outline">Stage All</Button>
              </div>
              {unstagedFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  No unstaged changes
                </div>
              ) : (
                <div className="space-y-2">
                  {unstagedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750">
                      <div className="flex items-center gap-3">
                        <div className={getStatusColor(file.status)}>
                          {getStatusIcon(file.status)}
                        </div>
                        <span className="font-mono text-sm dark:text-white">{file.path}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(file.status)} bg-white dark:bg-gray-700`}>
                          {file.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">View Diff</Button>
                        <Button size="sm" variant="outline">Stage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search commits..."
                className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {commits.map((commit, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GitCommit className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold dark:text-white">{commit.message}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{commit.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{commit.date.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{commit.hash}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" variant="outline">Revert</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {commit.files.map((file, fileIdx) => (
                      <span key={fileIdx} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-4">
            <div className="mb-4 flex gap-2">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
              <Button variant="outline">
                <GitMerge className="h-4 w-4 mr-2" />
                Merge
              </Button>
              <Button variant="outline">
                <GitPullRequest className="h-4 w-4 mr-2" />
                Pull Request
              </Button>
            </div>

            <div className="space-y-2">
              {branches.map((branch, idx) => (
                <div key={idx} className={`p-4 border rounded-lg ${
                  branch.isActive 
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GitBranch className={`h-5 w-5 ${branch.isActive ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold dark:text-white">{branch.name}</span>
                          {branch.isActive && (
                            <span className="text-xs px-2 py-1 bg-orange-600 text-white rounded">ACTIVE</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {branch.commits} commits • Last commit {branch.lastCommit.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!branch.isActive && (
                        <Button size="sm" variant="outline">Checkout</Button>
                      )}
                      <Button size="sm" variant="outline">Merge</Button>
                      {!branch.isActive && (
                        <Button size="sm" variant="outline" className="text-red-600">Delete</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Terminal Tab */}
        <TabsContent value="terminal" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="mb-2">$ git status</div>
              <div className="text-gray-400 mb-4">
                On branch {currentBranch}<br/>
                Your branch is up to date with 'origin/{currentBranch}'.<br/>
                <br/>
                Changes to be committed:<br/>
                {stagedFiles.map((f, i) => (
                  <div key={i} className="text-green-400 ml-4">
                    {f.status}: {f.path}
                  </div>
                ))}
                <br/>
                Changes not staged for commit:<br/>
                {unstagedFiles.map((f, i) => (
                  <div key={i} className="text-red-400 ml-4">
                    {f.status}: {f.path}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span>$</span>
                <input
                  type="text"
                  placeholder="Enter git command..."
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h4 className="font-bold mb-2 dark:text-white">Common Git Commands</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git status</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git add .</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git commit -m "message"</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git push</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git pull</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git branch</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git checkout -b branch</code>
                <code className="p-2 bg-white dark:bg-gray-800 rounded">git merge branch</code>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="p-2 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {currentBranch}
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" />
            {stagedFiles.length} staged
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-blue-600" />
            {unstagedFiles.length} unstaged
          </span>
        </div>
        <span className="text-orange-600 dark:text-orange-400">
          Repository: my-project
        </span>
      </div>
    </div>
  );
};
