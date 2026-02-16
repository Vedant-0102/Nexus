import React, { useState, useRef } from 'react';
import { ClipboardList, Plus, Trash2, Copy, Eye, Download, Upload, Save, Settings, CheckSquare, Circle, Type, Calendar, Clock, Mail, Phone, Hash, Star, Image as ImageIcon, List, ToggleLeft, ArrowUp, ArrowDown, BarChart3, FileText, Minus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

type QuestionType = 'short-text' | 'long-text' | 'multiple-choice' | 'checkboxes' | 'dropdown' | 'linear-scale' | 'date' | 'time' | 'email' | 'phone' | 'number' | 'rating' | 'file-upload' | 'section-header';

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface FormResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
}

interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  theme: string;
  responses: FormResponse[];
  settings: {
    collectEmail: boolean;
    allowMultipleResponses: boolean;
    showProgressBar: boolean;
    shuffleQuestions: boolean;
    confirmationMessage: string;
  };
}

export const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([
    {
      id: '1',
      title: 'Sample Survey',
      description: 'This is a sample form to demonstrate the form builder features.',
      questions: [
        { id: '1', type: 'section-header', title: 'Personal Information', description: 'Tell us about yourself', required: false },
        { id: '2', type: 'short-text', title: 'What is your name?', required: true },
        { id: '3', type: 'email', title: 'Email address', required: true },
        { id: '4', type: 'section-header', title: 'Feedback', description: 'Share your experience', required: false },
        { id: '5', type: 'multiple-choice', title: 'How satisfied are you?', required: false, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] },
        { id: '6', type: 'rating', title: 'Rate your overall experience', required: false },
        { id: '7', type: 'long-text', title: 'Any additional comments?', required: false },
      ],
      theme: '#6366f1',
      responses: [
        { id: '1', submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(), answers: { '2': 'John Doe', '3': 'john@example.com', '5': 'Very Satisfied', '6': '5', '7': 'Great experience!' } },
        { id: '2', submittedAt: new Date(Date.now() - 86400000).toISOString(), answers: { '2': 'Jane Smith', '3': 'jane@example.com', '5': 'Satisfied', '6': '4', '7': 'Good overall' } },
        { id: '3', submittedAt: new Date().toISOString(), answers: { '2': 'Bob Wilson', '3': 'bob@example.com', '5': 'Neutral', '6': '3', '7': '' } },
      ],
      settings: {
        collectEmail: true,
        allowMultipleResponses: false,
        showProgressBar: true,
        shuffleQuestions: false,
        confirmationMessage: 'Thank you for your response!',
      }
    }
  ]);
  const [activeFormId, setActiveFormId] = useState('1');
  const [activeTab, setActiveTab] = useState('build');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string | string[] | number>>({});
  const [previewRatings, setPreviewRatings] = useState<Record<string, number>>({});
  const [previewHoverRatings, setPreviewHoverRatings] = useState<Record<string, number>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeForm = forms.find(f => f.id === activeFormId) || forms[0];

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: type === 'section-header' ? 'Section Title' : 'Untitled Question',
      required: false,
      options: type === 'multiple-choice' || type === 'checkboxes' || type === 'dropdown'
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
      min: type === 'linear-scale' ? 1 : undefined,
      max: type === 'linear-scale' ? 5 : type === 'rating' ? 5 : undefined
    };

    setForms(forms.map(f =>
      f.id === activeFormId
        ? { ...f, questions: [...f.questions, newQuestion] }
        : f
    ));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setForms(forms.map(f =>
      f.id === activeFormId
        ? { ...f, questions: f.questions.map(q => q.id === questionId ? { ...q, ...updates } : q) }
        : f
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setForms(forms.map(f =>
      f.id === activeFormId
        ? { ...f, questions: f.questions.filter(q => q.id !== questionId) }
        : f
    ));
  };

  const duplicateQuestion = (questionId: string) => {
    const question = activeForm.questions.find(q => q.id === questionId);
    if (!question) return;

    const newQuestion = { ...question, id: Date.now().toString() };
    const idx = activeForm.questions.findIndex(q => q.id === questionId);
    const newQuestions = [...activeForm.questions];
    newQuestions.splice(idx + 1, 0, newQuestion);

    setForms(forms.map(f =>
      f.id === activeFormId
        ? { ...f, questions: newQuestions }
        : f
    ));
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const idx = activeForm.questions.findIndex(q => q.id === questionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === activeForm.questions.length - 1) return;

    const newQuestions = [...activeForm.questions];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newQuestions[idx], newQuestions[targetIdx]] = [newQuestions[targetIdx], newQuestions[idx]];

    setForms(forms.map(f =>
      f.id === activeFormId
        ? { ...f, questions: newQuestions }
        : f
    ));
  };

  const addOption = (questionId: string) => {
    const question = activeForm.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    updateQuestion(questionId, {
      options: [...question.options, `Option ${question.options.length + 1}`]
    });
  };

  const updateOption = (questionId: string, optionIdx: number, value: string) => {
    const question = activeForm.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = [...question.options];
    newOptions[optionIdx] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const deleteOption = (questionId: string, optionIdx: number) => {
    const question = activeForm.questions.find(q => q.id === questionId);
    if (!question || !question.options || question.options.length <= 1) return;

    updateQuestion(questionId, {
      options: question.options.filter((_, i) => i !== optionIdx)
    });
  };

  const updateForm = (updates: Partial<Form>) => {
    setForms(forms.map(f => f.id === activeFormId ? { ...f, ...updates } : f));
  };

  const createNewForm = () => {
    const newForm: Form = {
      id: Date.now().toString(),
      title: 'Untitled Form',
      description: '',
      questions: [],
      theme: '#6366f1',
      responses: [],
      settings: {
        collectEmail: false,
        allowMultipleResponses: true,
        showProgressBar: true,
        shuffleQuestions: false,
        confirmationMessage: 'Thank you for your response!',
      }
    };
    setForms([...forms, newForm]);
    setActiveFormId(newForm.id);
  };

  const deleteForm = () => {
    if (forms.length <= 1) return;
    const newForms = forms.filter(f => f.id !== activeFormId);
    setForms(newForms);
    setActiveFormId(newForms[0].id);
  };

  const exportForm = () => {
    const json = JSON.stringify(activeForm, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeForm.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.title && data.questions) {
          const imported: Form = {
            id: Date.now().toString(),
            title: data.title || 'Imported Form',
            description: data.description || '',
            questions: (data.questions || []).map((q: Question, i: number) => ({
              ...q,
              id: q.id || `${Date.now()}-${i}`,
            })),
            theme: data.theme || '#6366f1',
            responses: [],
            settings: data.settings || {
              collectEmail: false,
              allowMultipleResponses: true,
              showProgressBar: true,
              shuffleQuestions: false,
              confirmationMessage: 'Thank you for your response!',
            }
          };
          setForms([...forms, imported]);
          setActiveFormId(imported.id);
        }
      } catch {
        // Invalid JSON - silently ignore
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const exportResponses = () => {
    const questions = activeForm.questions.filter(q => q.type !== 'section-header');
    const headers = ['Submitted At', ...questions.map(q => q.title)];
    const rows = activeForm.responses.map(r => [
      new Date(r.submittedAt).toLocaleString(),
      ...questions.map(q => {
        const answer = r.answers[q.id];
        if (Array.isArray(answer)) return `"${answer.join(', ')}"`;
        return `"${answer || ''}"`;
      })
    ]);

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeForm.title}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview functions
  const handlePreviewSubmit = () => {
    const newResponse: FormResponse = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      answers: { ...previewAnswers, ...Object.fromEntries(Object.entries(previewRatings).map(([k, v]) => [k, v.toString()])) },
    };
    updateForm({ responses: [...activeForm.responses, newResponse] });
    setPreviewSubmitted(true);
  };

  const resetPreview = () => {
    setPreviewAnswers({});
    setPreviewRatings({});
    setPreviewHoverRatings({});
    setPreviewSubmitted(false);
  };

  const answeredCount = activeForm.questions.filter(q =>
    q.type !== 'section-header' && (previewAnswers[q.id] || previewRatings[q.id])
  ).length;
  const totalQuestions = activeForm.questions.filter(q => q.type !== 'section-header').length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
    'short-text': <Type className="h-4 w-4" />,
    'long-text': <Type className="h-4 w-4" />,
    'multiple-choice': <Circle className="h-4 w-4" />,
    'checkboxes': <CheckSquare className="h-4 w-4" />,
    'dropdown': <List className="h-4 w-4" />,
    'linear-scale': <ToggleLeft className="h-4 w-4" />,
    'date': <Calendar className="h-4 w-4" />,
    'time': <Clock className="h-4 w-4" />,
    'email': <Mail className="h-4 w-4" />,
    'phone': <Phone className="h-4 w-4" />,
    'number': <Hash className="h-4 w-4" />,
    'rating': <Star className="h-4 w-4" />,
    'file-upload': <ImageIcon className="h-4 w-4" />,
    'section-header': <Minus className="h-4 w-4" />,
  };

  const renderQuestionEditor = (question: Question) => {
    if (question.type === 'section-header') {
      return (
        <Card key={question.id} className="p-4 mb-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Minus className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Section Header</span>
              </div>
              <input
                type="text"
                value={question.title}
                onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                className="w-full p-2 mb-2 border rounded text-lg font-bold dark:bg-gray-700 dark:text-white"
                placeholder="Section title"
              />
              <input
                type="text"
                value={question.description || ''}
                onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Section description (optional)"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Button onClick={() => moveQuestion(question.id, 'up')} size="sm" variant="ghost"><ArrowUp className="h-4 w-4" /></Button>
              <Button onClick={() => moveQuestion(question.id, 'down')} size="sm" variant="ghost"><ArrowDown className="h-4 w-4" /></Button>
              <Button onClick={() => deleteQuestion(question.id)} size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card key={question.id} className="p-4 mb-4 border-2 hover:border-indigo-300 transition-all">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {questionTypeIcons[question.type]}
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="short-text">Short Text</option>
                <option value="long-text">Long Text</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="checkboxes">Checkboxes</option>
                <option value="dropdown">Dropdown</option>
                <option value="linear-scale">Linear Scale</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="number">Number</option>
                <option value="rating">Rating</option>
                <option value="file-upload">File Upload</option>
                <option value="section-header">Section Header</option>
              </select>
            </div>

            <input
              type="text"
              value={question.title}
              onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
              className="w-full p-2 mb-2 border rounded font-semibold dark:bg-gray-700 dark:text-white"
              placeholder="Question title"
            />

            <input
              type="text"
              value={question.description || ''}
              onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
              className="w-full p-2 mb-3 border rounded text-sm dark:bg-gray-700 dark:text-white"
              placeholder="Description (optional)"
            />

            {(question.type === 'multiple-choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
              <div className="space-y-2 mb-3">
                {question.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {question.type === 'multiple-choice' && <Circle className="h-4 w-4 text-gray-400 shrink-0" />}
                    {question.type === 'checkboxes' && <CheckSquare className="h-4 w-4 text-gray-400 shrink-0" />}
                    {question.type === 'dropdown' && <span className="text-gray-400 text-sm shrink-0">{idx + 1}.</span>}
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(question.id, idx, e.target.value)}
                      className="flex-1 p-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => deleteOption(question.id, idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button onClick={() => addOption(question.id)} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            )}

            {question.type === 'linear-scale' && (
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Min:</label>
                  <input
                    type="number"
                    value={question.min || 1}
                    onChange={(e) => updateQuestion(question.id, { min: parseInt(e.target.value) })}
                    className="w-16 p-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Max:</label>
                  <input
                    type="number"
                    value={question.max || 5}
                    onChange={(e) => updateQuestion(question.id, { max: parseInt(e.target.value) })}
                    className="w-16 p-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {question.type === 'rating' && (
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Stars:</label>
                  <select
                    value={question.max || 5}
                    onChange={(e) => updateQuestion(question.id, { max: parseInt(e.target.value) })}
                    className="p-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                  >
                    {[3, 4, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <Button onClick={() => moveQuestion(question.id, 'up')} size="sm" variant="ghost">
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button onClick={() => moveQuestion(question.id, 'down')} size="sm" variant="ghost">
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button onClick={() => duplicateQuestion(question.id)} size="sm" variant="ghost">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={() => deleteQuestion(question.id)} size="sm" variant="ghost" className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderQuestionPreview = (question: Question) => {
    if (question.type === 'section-header') {
      return (
        <div key={question.id} className="mb-6 pt-4 border-t-2 dark:border-gray-600">
          <h2 className="text-xl font-bold dark:text-white mb-1">{question.title}</h2>
          {question.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{question.description}</p>
          )}
        </div>
      );
    }

    return (
      <div key={question.id} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="font-semibold mb-1 dark:text-white">
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{question.description}</p>
        )}

        {question.type === 'short-text' && (
          <input
            type="text"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Your answer"
          />
        )}

        {question.type === 'long-text' && (
          <textarea
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="Your answer"
          />
        )}

        {question.type === 'multiple-choice' && (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name={`preview-${question.id}`}
                  checked={previewAnswers[question.id] === option}
                  onChange={() => setPreviewAnswers(prev => ({ ...prev, [question.id]: option }))}
                  className="rounded-full"
                />
                <span className="dark:text-white">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'checkboxes' && (
          <div className="space-y-2">
            {question.options?.map((option, idx) => {
              const current = (previewAnswers[question.id] as string[] | undefined) || [];
              const isChecked = current.includes(option);
              return (
                <label key={idx} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const updated = isChecked ? current.filter(o => o !== option) : [...current, option];
                      setPreviewAnswers(prev => ({ ...prev, [question.id]: updated }));
                    }}
                    className="rounded"
                  />
                  <span className="dark:text-white">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'dropdown' && (
          <select
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="">Choose</option>
            {question.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        )}

        {question.type === 'linear-scale' && (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-sm dark:text-white font-semibold">{question.min}</span>
            {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }, (_, i) => {
              const val = (question.min || 1) + i;
              const isSelected = previewAnswers[question.id] === val.toString();
              return (
                <label key={i} className="flex flex-col items-center cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setPreviewAnswers(prev => ({ ...prev, [question.id]: val.toString() }))}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500 text-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:text-white'
                    }`}
                  >
                    {val}
                  </button>
                </label>
              );
            })}
            <span className="text-sm dark:text-white font-semibold">{question.max}</span>
          </div>
        )}

        {question.type === 'date' && (
          <input
            type="date"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        )}

        {question.type === 'time' && (
          <input
            type="time"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        )}

        {question.type === 'email' && (
          <input
            type="email"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="your@email.com"
          />
        )}

        {question.type === 'phone' && (
          <input
            type="tel"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="(123) 456-7890"
          />
        )}

        {question.type === 'number' && (
          <input
            type="number"
            value={(previewAnswers[question.id] as string) || ''}
            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        )}

        {question.type === 'rating' && (
          <div className="flex gap-1.5 py-1">
            {Array.from({ length: question.max || 5 }, (_, i) => {
              const starNum = i + 1;
              const currentRating = previewRatings[question.id] || 0;
              const hoverRating = previewHoverRatings[question.id] || 0;
              const displayRating = hoverRating || currentRating;
              const isFilled = starNum <= displayRating;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewRatings(prev => ({ ...prev, [question.id]: starNum }))}
                  onMouseEnter={() => setPreviewHoverRatings(prev => ({ ...prev, [question.id]: starNum }))}
                  onMouseLeave={() => setPreviewHoverRatings(prev => ({ ...prev, [question.id]: 0 }))}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`h-8 w-8 transition-colors ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
              );
            })}
            {previewRatings[question.id] && (
              <span className="ml-2 self-center text-sm text-gray-500 dark:text-gray-400">
                {previewRatings[question.id]} / {question.max || 5}
              </span>
            )}
          </div>
        )}

        {question.type === 'file-upload' && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer">
            <ImageIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-500" />
          <h2 className="font-semibold dark:text-white text-sm">Form Builder</h2>
          <select
            value={activeFormId}
            onChange={(e) => { setActiveFormId(e.target.value); setPreviewMode(false); resetPreview(); }}
            className="ml-2 px-2 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white"
          >
            {forms.map(form => (
              <option key={form.id} value={form.id}>{form.title}</option>
            ))}
          </select>
          {activeForm.responses.length > 0 && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-semibold">
              {activeForm.responses.length} responses
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button onClick={createNewForm} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
          <Button onClick={() => { setPreviewMode(!previewMode); resetPreview(); }} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Eye className="h-3.5 w-3.5 mr-1" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={() => importInputRef.current?.click()} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Upload className="h-3.5 w-3.5 mr-1" />
            Import
          </Button>
          <Button onClick={exportForm} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
          <input ref={importInputRef} type="file" accept=".json" onChange={importForm} className="hidden" />
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            {previewSubmitted ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckSquare className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold dark:text-white mb-3">
                  {activeForm.settings.confirmationMessage || 'Thank you for your response!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Your response has been recorded.</p>
                <Button onClick={resetPreview} variant="outline">Submit another response</Button>
              </div>
            ) : (
              <>
                <div
                  className="p-8 rounded-t-lg text-white"
                  style={{ backgroundColor: activeForm.theme }}
                >
                  <h1 className="text-3xl font-bold mb-2">{activeForm.title}</h1>
                  {activeForm.description && (
                    <p className="text-lg opacity-90">{activeForm.description}</p>
                  )}
                </div>

                {/* Progress Bar */}
                {activeForm.settings.showProgressBar && totalQuestions > 0 && (
                  <div className="bg-white dark:bg-gray-800 px-8 pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span>{answeredCount} of {totalQuestions} answered</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%`, backgroundColor: activeForm.theme }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-8 rounded-b-lg shadow-lg">
                  {activeForm.settings.collectEmail && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <label className="block font-semibold mb-2 dark:text-white">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={(previewAnswers['_email'] as string) || ''}
                        onChange={(e) => setPreviewAnswers(prev => ({ ...prev, '_email': e.target.value }))}
                        className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                        placeholder="your@email.com"
                      />
                    </div>
                  )}

                  {activeForm.questions.map(renderQuestionPreview)}

                  <div className="mt-8 flex gap-3">
                    <Button
                      onClick={handlePreviewSubmit}
                      style={{ backgroundColor: activeForm.theme }}
                      className="text-white hover:opacity-90"
                    >
                      Submit
                    </Button>
                    <Button variant="outline" onClick={resetPreview}>Clear Form</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 h-8">
            <TabsTrigger value="build" className="text-xs px-3 py-1">Build</TabsTrigger>
            <TabsTrigger value="design" className="text-xs px-3 py-1">Design</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs px-3 py-1">Settings</TabsTrigger>
            <TabsTrigger value="responses" className="text-xs px-3 py-1">
              Responses
              {activeForm.responses.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold">
                  {activeForm.responses.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Build Tab */}
          <TabsContent value="build" className="flex-1 overflow-hidden flex gap-4 p-4 data-[state=inactive]:hidden">
            {/* Question Types Sidebar */}
            <div className="w-56 bg-white dark:bg-gray-800 rounded-lg p-3 overflow-y-auto shrink-0">
              <h3 className="font-bold mb-2 dark:text-white text-sm">Add Question</h3>
              <div className="space-y-1">
                <Button
                  onClick={() => addQuestion('section-header')}
                  variant="outline"
                  className="w-full justify-start text-xs border-dashed border-indigo-300"
                  size="sm"
                >
                  <Minus className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                  Section Header
                </Button>
                <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />
                {([
                  { type: 'short-text' as QuestionType, label: 'Short Text', icon: <Type className="h-3.5 w-3.5" /> },
                  { type: 'long-text' as QuestionType, label: 'Long Text', icon: <Type className="h-3.5 w-3.5" /> },
                  { type: 'multiple-choice' as QuestionType, label: 'Multiple Choice', icon: <Circle className="h-3.5 w-3.5" /> },
                  { type: 'checkboxes' as QuestionType, label: 'Checkboxes', icon: <CheckSquare className="h-3.5 w-3.5" /> },
                  { type: 'dropdown' as QuestionType, label: 'Dropdown', icon: <List className="h-3.5 w-3.5" /> },
                  { type: 'linear-scale' as QuestionType, label: 'Linear Scale', icon: <ToggleLeft className="h-3.5 w-3.5" /> },
                  { type: 'date' as QuestionType, label: 'Date', icon: <Calendar className="h-3.5 w-3.5" /> },
                  { type: 'time' as QuestionType, label: 'Time', icon: <Clock className="h-3.5 w-3.5" /> },
                  { type: 'email' as QuestionType, label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
                  { type: 'phone' as QuestionType, label: 'Phone', icon: <Phone className="h-3.5 w-3.5" /> },
                  { type: 'number' as QuestionType, label: 'Number', icon: <Hash className="h-3.5 w-3.5" /> },
                  { type: 'rating' as QuestionType, label: 'Rating', icon: <Star className="h-3.5 w-3.5" /> },
                  { type: 'file-upload' as QuestionType, label: 'File Upload', icon: <ImageIcon className="h-3.5 w-3.5" /> }
                ]).map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    onClick={() => addQuestion(type)}
                    variant="outline"
                    className="w-full justify-start text-xs"
                    size="sm"
                  >
                    <span className="mr-1.5">{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Form Editor */}
            <div className="flex-1 overflow-y-auto">
              <Card className="p-5 mb-4">
                <input
                  type="text"
                  value={activeForm.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="w-full text-2xl font-bold mb-2 border-b-2 pb-2 dark:bg-gray-800 dark:text-white"
                  placeholder="Form Title"
                />
                <textarea
                  value={activeForm.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  className="w-full text-gray-600 dark:text-gray-400 dark:bg-gray-800 resize-none text-sm"
                  rows={2}
                  placeholder="Form description"
                />
              </Card>

              {activeForm.questions.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No questions yet. Add questions from the sidebar.</p>
                </Card>
              ) : (
                activeForm.questions.map(renderQuestionEditor)
              )}
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Form Theme</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { name: 'Indigo', color: '#6366f1' },
                  { name: 'Blue', color: '#3b82f6' },
                  { name: 'Purple', color: '#8b5cf6' },
                  { name: 'Pink', color: '#ec4899' },
                  { name: 'Red', color: '#ef4444' },
                  { name: 'Orange', color: '#f97316' },
                  { name: 'Green', color: '#10b981' },
                  { name: 'Teal', color: '#14b8a6' }
                ].map(theme => (
                  <div
                    key={theme.name}
                    onClick={() => updateForm({ theme: theme.color })}
                    className={`p-5 rounded-lg cursor-pointer transition-all ${
                      activeForm.theme === theme.color
                        ? 'ring-4 ring-offset-2 ring-indigo-500'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: theme.color }}
                  >
                    <p className="text-white font-bold text-center text-sm">{theme.name}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2 dark:text-white text-sm">Custom Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeForm.theme}
                    onChange={(e) => updateForm({ theme: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activeForm.theme}
                    onChange={(e) => updateForm({ theme: e.target.value })}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-bold mb-3 dark:text-white text-sm">Preview</h4>
                <div
                  className="p-5 rounded-lg text-white"
                  style={{ backgroundColor: activeForm.theme }}
                >
                  <h2 className="text-xl font-bold mb-1">{activeForm.title || 'Form Title'}</h2>
                  <p className="opacity-90 text-sm">{activeForm.description || 'Form description goes here'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Form Settings</h3>

              <Card className="p-5 space-y-5">
                {[
                  { key: 'collectEmail', title: 'Collect Email Addresses', desc: 'Require respondents to provide their email' },
                  { key: 'allowMultipleResponses', title: 'Allow Multiple Responses', desc: 'Let users submit the form multiple times' },
                  { key: 'showProgressBar', title: 'Show Progress Bar', desc: 'Display completion progress to respondents' },
                  { key: 'shuffleQuestions', title: 'Shuffle Questions', desc: 'Randomize question order for each respondent' },
                ].map((setting, idx) => (
                  <div key={setting.key} className={idx > 0 ? 'border-t dark:border-gray-700 pt-5' : ''}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeForm.settings[setting.key as keyof typeof activeForm.settings] as boolean}
                        onChange={(e) => updateForm({
                          settings: { ...activeForm.settings, [setting.key]: e.target.checked }
                        })}
                        className="w-5 h-5 rounded"
                      />
                      <div>
                        <p className="font-semibold dark:text-white text-sm">{setting.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{setting.desc}</p>
                      </div>
                    </label>
                  </div>
                ))}

                <div className="border-t dark:border-gray-700 pt-5">
                  <label className="block font-semibold mb-2 dark:text-white text-sm">Confirmation Message</label>
                  <input
                    type="text"
                    value={activeForm.settings.confirmationMessage}
                    onChange={(e) => updateForm({
                      settings: { ...activeForm.settings, confirmationMessage: e.target.value }
                    })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Thank you for your response!"
                  />
                </div>
              </Card>

              <Card className="p-5 mt-5">
                <h4 className="font-bold mb-3 dark:text-white text-sm">Form Statistics</h4>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Questions</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{activeForm.questions.filter(q => q.type !== 'section-header').length}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Required</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {activeForm.questions.filter(q => q.required).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sections</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {activeForm.questions.filter(q => q.type === 'section-header').length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Responses</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{activeForm.responses.length}</p>
                  </div>
                </div>
              </Card>

              {/* Delete Form */}
              {forms.length > 1 && (
                <div className="mt-5 flex justify-end">
                  <Button onClick={deleteForm} size="sm" variant="outline" className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete Form
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold dark:text-white">
                  Responses ({activeForm.responses.length})
                </h3>
                {activeForm.responses.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={exportResponses} size="sm" variant="outline" className="text-xs">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => updateForm({ responses: [] })}
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear All
                    </Button>
                  </div>
                )}
              </div>

              {activeForm.responses.length === 0 ? (
                <Card className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No responses yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Preview and submit the form to see responses here.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <Card className="p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Responses</p>
                      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{activeForm.responses.length}</p>
                    </Card>
                    <Card className="p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Latest Response</p>
                      <p className="text-sm font-semibold dark:text-white mt-1">
                        {new Date(activeForm.responses[activeForm.responses.length - 1].submittedAt).toLocaleString()}
                      </p>
                    </Card>
                    <Card className="p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Completion</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(activeForm.responses.reduce((acc, r) => {
                          const answered = Object.values(r.answers).filter(a => a && a !== '').length;
                          return acc + (answered / Math.max(1, totalQuestions)) * 100;
                        }, 0) / activeForm.responses.length)}%
                      </p>
                    </Card>
                  </div>

                  {/* Response List */}
                  {activeForm.responses.map((response, rIdx) => (
                    <Card
                      key={response.id}
                      className={`p-4 dark:bg-gray-800 cursor-pointer transition-all ${
                        selectedResponseId === response.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedResponseId(selectedResponseId === response.id ? null : response.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">#{rIdx + 1}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(response.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {Object.values(response.answers).filter(a => a && a !== '').length} / {totalQuestions} answered
                        </span>
                      </div>

                      {selectedResponseId === response.id && (
                        <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-2">
                          {activeForm.questions.filter(q => q.type !== 'section-header').map(q => {
                            const answer = response.answers[q.id];
                            return (
                              <div key={q.id} className="flex gap-3 text-sm">
                                <span className="font-semibold dark:text-gray-300 min-w-0 shrink-0 max-w-[40%] truncate">{q.title}:</span>
                                <span className="dark:text-white text-gray-700 min-w-0">
                                  {answer ? (Array.isArray(answer) ? answer.join(', ') : String(answer)) : <span className="text-gray-400 italic">No answer</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
