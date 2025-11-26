import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Trash2, X, Settings, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './index.css';

// --- Types ---
type Task = {
    id: string;
    title: string;
    startMin: number;
    duration: number;
    color: string;
    isCompleted?: boolean;
};

type AppSettings = {
    wakeTime: number;
    bedTime: number;
};

// --- Constants ---
const STORAGE_KEYS = {
    TASKS: 'daily-timebox-tasks-v2',
    SETTINGS: 'daily-timebox-settings',
    LEGACY_TASKS: 'daily-timebox-tasks',
};

const TASK_COLORS = [
    { value: 'rgba(239, 68, 68, 0.15)', text: '#dc2626', label: 'Red' },
    { value: 'rgba(59, 130, 246, 0.15)', text: '#2563eb', label: 'Blue' },
    { value: 'rgba(34, 197, 94, 0.15)', text: '#16a34a', label: 'Green' },
    { value: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', label: 'Purple' },
    { value: 'rgba(251, 146, 60, 0.15)', text: '#ea580c', label: 'Orange' },
];

const DEFAULT_COLOR = TASK_COLORS[0].value;

// --- Helper Functions ---
const formatTime24 = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayString = (): string => {
    return formatDate(new Date());
};

const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return formatDate(date);
};

// --- Components ---
const CalendarPicker = ({
    isOpen,
    onClose,
    currentDate,
    onSelectDate,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onSelectDate: (date: string) => void;
}) => {
    const [viewDate, setViewDate] = useState(currentDate);

    useEffect(() => {
        if (isOpen) setViewDate(currentDate);
    }, [isOpen, currentDate]);

    if (!isOpen) return null;

    const date = new Date(viewDate + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => {
        const newDate = new Date(year, month - 1, 1);
        setViewDate(formatDate(newDate));
    };

    const nextMonth = () => {
        const newDate = new Date(year, month + 1, 1);
        setViewDate(formatDate(newDate));
    };

    const selectDate = (day: number) => {
        const selected = formatDate(new Date(year, month, day));
        onSelectDate(selected);
        onClose();
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = formatDate(new Date(year, month, day));
        const isToday = dayDate === getTodayString();
        const isSelected = dayDate === currentDate;
        days.push(
            <button
                key={day}
                onClick={() => selectDate(day)}
                className={`aspect-square flex items-center justify-center text-sm font-semibold rounded-lg transition-all
                    ${isSelected ? 'bg-stone-900 text-white' : isToday ? 'bg-stone-200 text-stone-900' : 'hover:bg-stone-100 text-stone-700'}
                    active:scale-95`}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white shadow-2xl w-full max-w-sm rounded-3xl overflow-hidden relative z-10 font-sans p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-full">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold">
                        {year}년 {month + 1}월
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-full">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-stone-400 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({
    isOpen,
    onClose,
    settings,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
}) => {
    const [wake, setWake] = useState(settings.wakeTime);
    const [bed, setBed] = useState(settings.bedTime);

    useEffect(() => {
        if (isOpen) {
            setWake(settings.wakeTime);
            setBed(settings.bedTime);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white shadow-2xl max-w-sm w-full rounded-3xl overflow-hidden relative z-10">
                <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-stone-900">설정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">기상 시간</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={wake}
                            onChange={(e) => setWake(Number(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">취침 시간</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={bed}
                            onChange={(e) => setBed(Number(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-stone-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            onSave({ wakeTime: wake, bedTime: bed });
                            onClose();
                        }}
                        className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    onDelete?: (id: string) => void;
    initialData?: Partial<Task>;
}) => {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [color, setColor] = useState(DEFAULT_COLOR);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || '');
            setStartTime(initialData?.startMin !== undefined ? formatTime24(initialData.startMin) : '');
            setDuration(initialData?.duration || 30);
            setColor(initialData?.color || DEFAULT_COLOR);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [h, m] = startTime.split(':').map(Number);
        const startMin = h * 60 + m;

        onSave({
            id: initialData?.id || Date.now().toString(),
            title,
            startMin,
            duration,
            color,
            isCompleted: initialData?.isCompleted || false,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white shadow-2xl max-w-sm w-full rounded-3xl overflow-hidden relative z-10">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-stone-900">
                            {initialData?.id ? '작업 수정' : '새 작업'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-2">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-2">시작 시간</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-2">소요 시간 (분)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                min="15"
                                step="15"
                                className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-2">색상</label>
                            <div className="flex gap-2">
                                {TASK_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${color === c.value ? 'border-stone-900 scale-110' : 'border-stone-200'
                                            }`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-stone-50 flex gap-3">
                        {initialData?.id && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(initialData.id!);
                                    onClose();
                                }}
                                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-semibold hover:bg-stone-100"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-black"
                        >
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const App = () => {
    // Date State
    const [currentDate, setCurrentDate] = useState<string>(getTodayString());

    // All tasks (date-based storage)
    const [allTasks, setAllTasks] = useState<Record<string, Task[]>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
            if (saved) return JSON.parse(saved);

            // Migration from legacy storage
            const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_TASKS);
            if (legacy) {
                const legacyTasks = JSON.parse(legacy);
                const today = getTodayString();
                return { [today]: legacyTasks };
            }
            return {};
        } catch {
            return {};
        }
    });

    // Current date's tasks
    const tasks = allTasks[currentDate] || [];
    const setTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
        setAllTasks(prev => {
            const updated = typeof newTasks === 'function' ? newTasks(prev[currentDate] || []) : newTasks;
            return { ...prev, [currentDate]: updated };
        });
    };

    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : { wakeTime: 7, bedTime: 23 };
        } catch {
            return { wakeTime: 7, bedTime: 23 };
        }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    }, [allTasks]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const saveTask = (task: Task) => {
        setTasks((prev) => {
            const exists = prev.find((t) => t.id === task.id);
            if (exists) return prev.map((t) => (t.id === task.id ? task : t));
            return [...prev, task];
        });
    };

    const toggleTaskCompletion = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
    };

    const deleteTask = (id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const getTaskInSlot = (hour: number, quarter: number) => {
        const slotStart = hour * 60 + quarter * 15;
        const slotEnd = slotStart + 15;
        return tasks.find((t) => {
            const tEnd = t.startMin + t.duration;
            return t.startMin < slotEnd && tEnd > slotStart;
        });
    };

    const handleSlotClick = (hour: number, quarter: number) => {
        const startMin = hour * 60 + quarter * 15;
        setEditingTask({ startMin, duration: 30, color: DEFAULT_COLOR });
        setModalOpen(true);
    };

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    return (
        <div className="flex flex-col h-screen max-w-lg mx-auto bg-stone-50 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-40 px-6 py-3 flex justify-between items-center bg-gradient-to-b from-stone-50 to-transparent h-16">
                <h1 className="text-xl font-bold text-stone-900">Timebox</h1>

                {/* Date Navigation */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -1))}
                        className="w-8 h-8 flex items-center justify-center bg-white/80 text-stone-600 hover:text-stone-900 rounded-full shadow-sm border border-stone-200"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => setCalendarOpen(true)}
                        className="bg-white/90 px-3 py-1 rounded-xl shadow-sm border border-stone-200 hover:bg-white"
                    >
                        <span className="text-xs font-bold text-stone-700">
                            {new Date(currentDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                    </button>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 1))}
                        className="w-8 h-8 flex items-center justify-center bg-white/80 text-stone-600 hover:text-stone-900 rounded-full shadow-sm border border-stone-200"
                    >
                        <ChevronRight size={14} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(getTodayString())}
                        className="w-8 h-8 flex items-center justify-center bg-white/80 text-stone-600 hover:text-stone-900 rounded-full shadow-sm border border-stone-200"
                        title="오늘"
                    >
                        <Calendar size={12} />
                    </button>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="w-8 h-8 flex items-center justify-center bg-white/80 text-stone-600 hover:text-stone-900 rounded-full shadow-sm border border-stone-200"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-y-auto pt-16 pb-24">
                {Array.from({ length: 24 }).map((_, hour) => {
                    const isBlocked = hour < settings.wakeTime || hour >= settings.bedTime;

                    return (
                        <div key={hour} className="grid grid-cols-[3rem_repeat(4,1fr)] h-20 border-b border-stone-100 relative">
                            <div className="flex items-start pt-2 justify-center bg-stone-50 border-r border-stone-100">
                                <span className={`text-sm font-bold ${hour === currentHour ? 'text-stone-900' : 'text-stone-400'}`}>
                                    {hour}
                                </span>
                            </div>

                            {Array.from({ length: 4 }).map((_, quarter) => {
                                const task = getTaskInSlot(hour, quarter);
                                const slotStartMin = hour * 60 + quarter * 15;
                                const isTaskStart = task && task.startMin === slotStartMin;

                                return (
                                    <div
                                        key={quarter}
                                        onClick={() => {
                                            if (task) {
                                                setEditingTask(task);
                                                setModalOpen(true);
                                            } else if (!isBlocked) {
                                                handleSlotClick(hour, quarter);
                                            }
                                        }}
                                        className="relative border-r border-stone-100/50 hover:bg-stone-100/50 cursor-pointer transition-colors"
                                    >
                                        {task && (
                                            <div
                                                className={`absolute inset-0.5 ${task.isCompleted ? 'opacity-40' : 'opacity-90'}`}
                                                style={{ backgroundColor: task.color }}
                                            >
                                                {isTaskStart && (
                                                    <div className="px-2 py-1 flex items-center gap-1.5">
                                                        <button
                                                            onClick={(e) => toggleTaskCompletion(task.id, e)}
                                                            className="w-5 h-5 rounded-full border-2 border-black/20 bg-white/60 flex items-center justify-center"
                                                        >
                                                            {task.isCompleted && <Check size={12} strokeWidth={3} />}
                                                        </button>
                                                        <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through' : ''}`}
                                                            style={{ color: TASK_COLORS.find((c) => c.value === task.color)?.text }}
                                                        >
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Current time indicator - once per hour */}
                            {hour === currentHour && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                    style={{ left: `calc(3rem + ${(currentMinute / 60) * 100}%)` }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Bar */}
            <div
                className="absolute bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-stone-50"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center justify-center py-4 px-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-stone-900 tabular-nums">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                                {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
                            </span>
                            <span className="text-[10px] font-medium text-stone-400 mt-0.5">
                                {currentTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <CalendarPicker
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                currentDate={currentDate}
                onSelectDate={(date) => {
                    setCurrentDate(date);
                    setCalendarOpen(false);
                }}
            />

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={saveTask}
                onDelete={deleteTask}
                initialData={editingTask || undefined}
            />

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onSave={setSettings}
            />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
