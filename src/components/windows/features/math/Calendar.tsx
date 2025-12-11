import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Bell, Clock, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  reminder: boolean;
  reminderMinutes: number;
  color: string;
  completed: boolean;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    description: '',
    reminder: true,
    reminderMinutes: 15,
    color: '#3b82f6'
  });

  useEffect(() => {
    const saved = localStorage.getItem('calendar-events');
    if (saved) {
      setEvents(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
    checkReminders();
  }, [events]);

  const checkReminders = () => {
    const now = new Date();
    events.forEach(event => {
      if (event.reminder && !event.completed) {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const reminderTime = new Date(eventDateTime.getTime() - event.reminderMinutes * 60000);
        
        if (now >= reminderTime && now < eventDateTime) {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Reminder: ${event.title}`, {
              body: `Event starts at ${event.time}`,
              icon: '📅'
            });
          }
        }
      }
    });
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleAddEvent = () => {
    if (!formData.title || !formData.date) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      ...formData,
      completed: false
    };

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...newEvent, id: editingEvent.id } : e));
      setEditingEvent(null);
    } else {
      setEvents([...events, newEvent]);
    }

    setFormData({
      title: '',
      date: '',
      time: '09:00',
      description: '',
      reminder: true,
      reminderMinutes: 15,
      color: '#3b82f6'
    });
    setShowEventForm(false);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
      reminder: event.reminder,
      reminderMinutes: event.reminderMinutes,
      color: event.color
    });
    setShowEventForm(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const toggleEventComplete = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold dark:text-white">Calendar</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={requestNotificationPermission} size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Enable Reminders
          </Button>
          <Button onClick={() => {
            setShowEventForm(true);
            setEditingEvent(null);
            setFormData({
              title: '',
              date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
              time: '09:00',
              description: '',
              reminder: true,
              reminderMinutes: 15,
              color: '#3b82f6'
            });
          }} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Calendar View */}
        <div className="flex-1 p-6 overflow-auto">
          <Card className="p-6 bg-white dark:bg-gray-800">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button onClick={previousMonth} size="sm" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-2xl font-bold dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button onClick={nextMonth} size="sm" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayEvents = getEventsForDate(day);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={day}
                    onClick={() => {
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      setSelectedDate(date);
                    }}
                    className={`aspect-square p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      isTodayDate
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'dark:text-white'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Events Sidebar */}
        <div className="w-96 border-l dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              {selectedDate 
                ? `Events for ${selectedDate.toLocaleDateString()}`
                : 'All Upcoming Events'}
            </h3>

            {/* Event Form */}
            {showEventForm && (
              <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                <h4 className="font-bold mb-3 dark:text-white">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Event title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.reminder}
                      onChange={(e) => setFormData({ ...formData, reminder: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm dark:text-white">Reminder</label>
                    {formData.reminder && (
                      <select
                        value={formData.reminderMinutes}
                        onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
                        className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="5">5 min before</option>
                        <option value="15">15 min before</option>
                        <option value="30">30 min before</option>
                        <option value="60">1 hour before</option>
                      </select>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm dark:text-white">Color:</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddEvent} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Check className="h-4 w-4 mr-2" />
                      {editingEvent ? 'Update' : 'Add'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowEventForm(false);
                        setEditingEvent(null);
                      }} 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Events List */}
            <div className="space-y-2">
              {(selectedDate 
                ? getEventsForDate(selectedDate.getDate())
                : events.filter(e => new Date(e.date) >= new Date(today.toDateString()))
              ).sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
              }).map(event => (
                <Card 
                  key={event.id} 
                  className={`p-3 border-l-4 ${event.completed ? 'opacity-60' : ''}`}
                  style={{ borderLeftColor: event.color }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={event.completed}
                        onChange={() => toggleEventComplete(event.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <h4 className={`font-semibold dark:text-white ${event.completed ? 'line-through' : ''}`}>
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                          {event.reminder && (
                            <>
                              <Bell className="h-3 w-3 ml-2" />
                              <span>{event.reminderMinutes}m before</span>
                            </>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {(selectedDate 
                ? getEventsForDate(selectedDate.getDate())
                : events.filter(e => new Date(e.date) >= new Date(today.toDateString()))
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
