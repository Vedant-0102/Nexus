import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2, Copy, Eye, Download, Upload, Save, Settings, CheckSquare, Circle, Type, Calendar, Clock, Mail, Phone, Hash, Star, Image as ImageIcon, List, ToggleLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

type QuestionType = 'short-text' | 'long-text' | 'multiple-choice' | 'checkboxes' | 'dropdown' | 'linear-scale' | 'date' | 'time' | 'email' | 'phone' | 'number' | 'rating' | 'file-upload';

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

interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  theme: string;
  settings: {
    collectEmail: boolean;
    allowMultipleResponses: boolean;
    showProgressBar: boolean;
    shuffleQuestions: boolean;
  };
}

export const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([
    {
      id: '1',
      title: 'Sample Survey',
      description: 'This is a sample form',
      questions: [
        { id: '1', type: 'short-text', title: 'What is your name?', required: true },
        { id: '2', type: 'email', title: 'Email address', required: true },
        { id: '3', type: 'multiple-choice', title: 'How satisfied are you?', required: false, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] }
      ],
      theme: '#6366f1',
      settings: {
        collectEmail: true,
        allowMultipleResponses: false,
        showProgressBar: true,
        shuffleQuestions: false
      }
    }
  ]);
  const [activeFormId, setActiveFormId] = useState('1');
  const [activeTab, setActiveTab] = useState('build');
  const [previewMode, setPreviewMode] = useState(false);

  const activeForm = forms.find(f => f.id === activeFormId) || forms[0];

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: 'Untitled Question',
      required: false,
      options: type === 'multiple-choice' || type === 'checkboxes' || type === 'dropdown' 
        ? ['Option 1', 'Option 2', 'Option 3'] 
        : undefined,
      min: type === 'linear-scale' ? 1 : undefined,
      max: type === 'linear-scale' ? 5 : undefined
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
    setForms(forms.map(f => 
      f.id === activeFormId 
        ? { ...f, questions: [...f.questions, newQuestion] }
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
      settings: {
        collectEmail: false,
        allowMultipleResponses: true,
        showProgressBar: true,
        shuffleQuestions: false
      }
    };
    setForms([...forms, newForm]);
    setActiveFormId(newForm.id);
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
    'file-upload': <ImageIcon className="h-4 w-4" />
  };

  const renderQuestionEditor = (question: Question) => (
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
                  {question.type === 'multiple-choice' && <Circle className="h-4 w-4 text-gray-400" />}
                  {question.type === 'checkboxes' && <CheckSquare className="h-4 w-4 text-gray-400" />}
                  {question.type === 'dropdown' && <span className="text-gray-400">{idx + 1}.</span>}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, idx, e.target.value)}
                    className="flex-1 p-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => deleteOption(question.id, idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
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

  const renderQuestionPreview = (question: Question) => (
    <div key={question.id} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-semibold mb-1 dark:text-white">
        {question.title}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      {question.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{question.description}</p>
      )}
      
      {question.type === 'short-text' && (
        <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Your answer" />
      )}
      
      {question.type === 'long-text' && (
        <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" rows={4} placeholder="Your answer" />
      )}
      
      {question.type === 'multiple-choice' && (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={question.id} className="rounded-full" />
              <span className="dark:text-white">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      {question.type === 'checkboxes' && (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="dark:text-white">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      {question.type === 'dropdown' && (
        <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
          <option>Choose</option>
          {question.options?.map((option, idx) => (
            <option key={idx}>{option}</option>
          ))}
        </select>
      )}
      
      {question.type === 'linear-scale' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm dark:text-white">{question.min}</span>
          {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }, (_, i) => (
            <label key={i} className="flex flex-col items-center cursor-pointer">
              <input type="radio" name={question.id} className="mb-1" />
              <span className="text-sm dark:text-white">{(question.min || 1) + i}</span>
            </label>
          ))}
          <span className="text-sm dark:text-white">{question.max}</span>
        </div>
      )}
      
      {question.type === 'date' && (
        <input type="date" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
      )}
      
      {question.type === 'time' && (
        <input type="time" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
      )}
      
      {question.type === 'email' && (
        <input type="email" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="your@email.com" />
      )}
      
      {question.type === 'phone' && (
        <input type="tel" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="(123) 456-7890" />
      )}
      
      {question.type === 'number' && (
        <input type="number" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="0" />
      )}
      
      {question.type === 'rating' && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} className="h-8 w-8 cursor-pointer text-gray-300 hover:text-yellow-400" />
          ))}
        </div>
      )}
      
      {question.type === 'file-upload' && (
        <div className="border-2 border-dashed rounded p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-500" />
          <h2 className="font-semibold dark:text-white">Form Builder</h2>
          <select
            value={activeFormId}
            onChange={(e) => setActiveFormId(e.target.value)}
            className="ml-2 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            {forms.map(form => (
              <option key={form.id} value={form.id}>{form.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewForm} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
          <Button onClick={() => setPreviewMode(!previewMode)} size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={exportForm} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div 
              className="p-8 rounded-t-lg text-white"
              style={{ backgroundColor: activeForm.theme }}
            >
              <h1 className="text-4xl font-bold mb-2">{activeForm.title}</h1>
              {activeForm.description && (
                <p className="text-lg opacity-90">{activeForm.description}</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-b-lg shadow-lg">
              {activeForm.settings.collectEmail && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <label className="block font-semibold mb-2 dark:text-white">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white" 
                    placeholder="your@email.com" 
                  />
                </div>
              )}
              
              {activeForm.questions.map(renderQuestionPreview)}
              
              <div className="mt-8 flex gap-3">
                <Button className="bg-indigo-500 hover:bg-indigo-600">Submit</Button>
                <Button variant="outline">Clear Form</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Build Tab */}
          <TabsContent value="build" className="flex-1 overflow-hidden flex gap-4 p-4">
            {/* Question Types Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 rounded-lg p-4 overflow-y-auto">
              <h3 className="font-bold mb-3 dark:text-white">Add Question</h3>
              <div className="space-y-2">
                {[
                  { type: 'short-text' as QuestionType, label: 'Short Text', icon: <Type className="h-4 w-4" /> },
                  { type: 'long-text' as QuestionType, label: 'Long Text', icon: <Type className="h-4 w-4" /> },
                  { type: 'multiple-choice' as QuestionType, label: 'Multiple Choice', icon: <Circle className="h-4 w-4" /> },
                  { type: 'checkboxes' as QuestionType, label: 'Checkboxes', icon: <CheckSquare className="h-4 w-4" /> },
                  { type: 'dropdown' as QuestionType, label: 'Dropdown', icon: <List className="h-4 w-4" /> },
                  { type: 'linear-scale' as QuestionType, label: 'Linear Scale', icon: <ToggleLeft className="h-4 w-4" /> },
                  { type: 'date' as QuestionType, label: 'Date', icon: <Calendar className="h-4 w-4" /> },
                  { type: 'time' as QuestionType, label: 'Time', icon: <Clock className="h-4 w-4" /> },
                  { type: 'email' as QuestionType, label: 'Email', icon: <Mail className="h-4 w-4" /> },
                  { type: 'phone' as QuestionType, label: 'Phone', icon: <Phone className="h-4 w-4" /> },
                  { type: 'number' as QuestionType, label: 'Number', icon: <Hash className="h-4 w-4" /> },
                  { type: 'rating' as QuestionType, label: 'Rating', icon: <Star className="h-4 w-4" /> },
                  { type: 'file-upload' as QuestionType, label: 'File Upload', icon: <ImageIcon className="h-4 w-4" /> }
                ].map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    onClick={() => addQuestion(type)}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    {icon}
                    <span className="ml-2">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Form Editor */}
            <div className="flex-1 overflow-y-auto">
              <Card className="p-6 mb-4">
                <input
                  type="text"
                  value={activeForm.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="w-full text-3xl font-bold mb-3 border-b-2 pb-2 dark:bg-gray-800 dark:text-white"
                  placeholder="Form Title"
                />
                <textarea
                  value={activeForm.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  className="w-full text-gray-600 dark:text-gray-400 dark:bg-gray-800 resize-none"
                  rows={2}
                  placeholder="Form description"
                />
              </Card>
              
              {activeForm.questions.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No questions yet. Add questions from the sidebar.</p>
                </Card>
              ) : (
                activeForm.questions.map(renderQuestionEditor)
              )}
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Form Theme</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                    className={`p-6 rounded-lg cursor-pointer transition-all ${
                      activeForm.theme === theme.color 
                        ? 'ring-4 ring-offset-2 ring-indigo-500' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: theme.color }}
                  >
                    <p className="text-white font-bold text-center">{theme.name}</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <label className="block font-semibold mb-2 dark:text-white">Custom Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeForm.theme}
                    onChange={(e) => updateForm({ theme: e.target.value })}
                    className="w-16 h-16 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activeForm.theme}
                    onChange={(e) => updateForm({ theme: e.target.value })}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-bold mb-4 dark:text-white">Preview</h4>
                <div 
                  className="p-6 rounded-lg text-white"
                  style={{ backgroundColor: activeForm.theme }}
                >
                  <h2 className="text-2xl font-bold mb-2">{activeForm.title || 'Form Title'}</h2>
                  <p className="opacity-90">{activeForm.description || 'Form description goes here'}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Form Settings</h3>
              
              <Card className="p-6 space-y-6">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeForm.settings.collectEmail}
                      onChange={(e) => updateForm({ 
                        settings: { ...activeForm.settings, collectEmail: e.target.checked } 
                      })}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <p className="font-semibold dark:text-white">Collect Email Addresses</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Require respondents to provide their email</p>
                    </div>
                  </label>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeForm.settings.allowMultipleResponses}
                      onChange={(e) => updateForm({ 
                        settings: { ...activeForm.settings, allowMultipleResponses: e.target.checked } 
                      })}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <p className="font-semibold dark:text-white">Allow Multiple Responses</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Let users submit the form multiple times</p>
                    </div>
                  </label>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeForm.settings.showProgressBar}
                      onChange={(e) => updateForm({ 
                        settings: { ...activeForm.settings, showProgressBar: e.target.checked } 
                      })}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <p className="font-semibold dark:text-white">Show Progress Bar</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Display completion progress to respondents</p>
                    </div>
                  </label>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeForm.settings.shuffleQuestions}
                      onChange={(e) => updateForm({ 
                        settings: { ...activeForm.settings, shuffleQuestions: e.target.checked } 
                      })}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <p className="font-semibold dark:text-white">Shuffle Questions</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Randomize question order for each respondent</p>
                    </div>
                  </label>
                </div>
              </Card>
              
              <Card className="p-6 mt-6">
                <h4 className="font-bold mb-4 dark:text-white">Form Statistics</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{activeForm.questions.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Required Questions</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {activeForm.questions.filter(q => q.required).length}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Optional Questions</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {activeForm.questions.filter(q => !q.required).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
