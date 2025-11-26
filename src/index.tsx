import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Trash2, X, Plus, Settings, Moon, Sun, Check, ChevronRight, Undo2 } from 'lucide-react';
import './index.css';

// DEBUG: Verify JS execution
window.alert('Version 2: App is starting...');

// ... imports ...

// --- Types ---
type Task = {
    id: string;
    title: string;
    startMin: number; // Minutes from 00:00
    duration: number; // Minutes
    color: string;
    isCompleted?: boolean;
};

type TaskTemplate = {
    id: string;
    title: string;
    duration: number;
    color: string;
};

type AppSettings = {
    wakeTime: number; // Hour (0-23)
    bedTime: number; // Hour (0-23)
};

type UndoAction = {
    taskId: string;
    prevStartMin: number;
};

// --- Constants ---
const STORAGE_KEYS = {
    TASKS: 'daily-timebox-tasks',
    SETTINGS: 'daily-timebox-settings',
    TEMPLATES: 'daily-timebox-templates',
};

// "Highlighter" colors: Transparent backgrounds with deeply saturated text
const TASK_COLORS = [
    { name: 'Slate', value: 'rgba(51, 65, 85, 0.25)', text: '#0f172a' }, // Deep Slate Text
    { name: 'Clay', value: 'rgba(194, 65, 12, 0.25)', text: '#7c2d12' },  // Deep Orange Text
    { name: 'Sage', value: 'rgba(21, 128, 61, 0.25)', text: '#14532d' },  // Deep Green Text
    { name: 'Mustard', value: 'rgba(202, 138, 4, 0.3)', text: '#713f12' }, // Deep Yellow/Brown Text
    { name: 'Charcoal', value: 'rgba(68, 64, 60, 0.25)', text: '#1c1917' }, // Deep Stone Text
];

const DEFAULT_COLOR = TASK_COLORS[0].value;

const DEFAULT_TEMPLATES: TaskTemplate[] = [
    { id: 't1', title: '아침 루틴', duration: 30, color: TASK_COLORS[1].value },
    { id: 't2', title: '집중 업무', duration: 60, color: TASK_COLORS[0].value },
    { id: 't3', title: '휴식', duration: 15, color: TASK_COLORS[2].value },
];

// --- Helper Functions ---
const formatTime24 = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const parseTime24 = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// --- Components ---

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white shadow-2xl w-full max-w-sm rounded-3xl overflow-hidden relative z-10 font-sans">
                <div className="px-6 py-5 flex justify-between items-center border-b border-stone-100">
                    <h2 className="text-xl font-bold text-stone-900">설정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-stone-500">
                            <Sun size={16} /> 기상 시간
                        </label>
                        <div className="relative">
                            <select
                                value={wake}
                                onChange={(e) => setWake(Number(e.target.value))}
                                className="w-full p-4 bg-stone-50 rounded-2xl text-stone-900 focus:ring-2 focus:ring-stone-200 focus:outline-none appearance-none text-lg font-bold transition-all font-english"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none rotate-90" size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-stone-500">
                            <Moon size={16} /> 하루 마감
                        </label>
                        <div className="relative">
                            <select
                                value={bed}
                                onChange={(e) => setBed(Number(e.target.value))}
                                className="w-full p-4 bg-stone-50 rounded-2xl text-stone-900 focus:ring-2 focus:ring-stone-200 focus:outline-none appearance-none text-lg font-bold transition-all font-english"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none rotate-90" size={20} />
                        </div>
                    </div>

                    <button
                        onClick={() => { onSave({ wakeTime: wake, bedTime: bed }); onClose(); }}
                        className="w-full py-4 bg-stone-900 text-white font-bold rounded-2xl text-lg hover:bg-black transition-all active:scale-[0.98] mt-2"
                    >
                        저장하기
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
    templates,
    onSaveTemplate,
    onDeleteTemplate,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    onDelete?: (id: string) => void;
    initialData?: Partial<Task>;
    templates: TaskTemplate[];
    onSaveTemplate: (t: TaskTemplate) => void;
    onDeleteTemplate: (id: string) => void;
}) => {
    const [title, setTitle] = useState('');
    const [startTimeStr, setStartTimeStr] = useState('09:00');
    const [duration, setDuration] = useState(30);
    const [color, setColor] = useState(DEFAULT_COLOR);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setStartTimeStr(formatTime24(initialData.startMin || 540));
                setDuration(initialData.duration || 30);
                setColor(initialData.color || DEFAULT_COLOR);
            } else {
                setTitle('');
                setStartTimeStr('09:00');
                setDuration(30);
                setColor(DEFAULT_COLOR);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const startMin = parseTime24(startTimeStr);
        onSave({
            id: initialData?.id || crypto.randomUUID(),
            title: title || '새로운 작업',
            startMin,
            duration,
            color,
            isCompleted: initialData?.isCompleted || false,
        });
        onClose();
    };

    const handleSaveAsTemplate = () => {
        onSaveTemplate({
            id: crypto.randomUUID(),
            title: title || '새 템플릿',
            duration,
            color,
        });
    };

    const handleDelete = () => {
        if (initialData?.id && onDelete) {
            onDelete(initialData.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" onClick={onClose} />

            <div className="bg-white w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl rounded-[32px] relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden font-sans border border-stone-100">

                <div className="px-8 py-6 flex justify-between items-center shrink-0 border-b border-stone-100">
                    <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                        {initialData?.id ? '할 일 수정' : '할 일 추가'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors -mr-2 text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-8 py-8 overflow-y-auto custom-scrollbar flex-1">

                    <form id="taskForm" onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="무슨 일을 하시나요?"
                                className="w-full py-2 bg-transparent border-b-2 border-stone-100 text-2xl font-bold text-stone-900 focus:outline-none focus:border-stone-900 rounded-none placeholder:text-stone-300 transition-colors"
                                autoFocus
                            />
                        </div>

                        {/* Templates */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wide font-english">Templates</label>
                            <div className="flex flex-wrap gap-2">
                                {templates.map(t => (
                                    <div key={t.id} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTitle(t.title);
                                                setDuration(t.duration);
                                                setColor(t.color);
                                            }}
                                            className="pl-3 pr-4 py-2 bg-stone-50 hover:bg-stone-100 rounded-xl text-sm font-semibold text-stone-600 transition-all flex items-center gap-2 active:scale-95 border border-stone-100"
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_COLORS.find(c => c.value === t.color)?.text || t.color }}></span>
                                            {t.title}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id); }}
                                            className="absolute -top-1 -right-1 bg-white text-stone-300 border border-stone-100 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:border-red-100 shadow-sm z-10"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleSaveAsTemplate}
                                    className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-stone-600 border border-dashed border-stone-200 rounded-xl transition-colors flex items-center gap-1 hover:bg-stone-50 hover:border-stone-300"
                                >
                                    <Plus size={14} /> 저장
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide font-english">Start Time</label>
                                <input
                                    type="time"
                                    value={startTimeStr}
                                    onChange={(e) => setStartTimeStr(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-stone-50 rounded-2xl text-lg text-stone-900 focus:ring-2 focus:ring-stone-200 focus:outline-none font-bold font-english"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide font-english">Duration ({duration}m)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDuration(Math.max(15, duration - 15))}
                                        className="w-12 h-[52px] rounded-2xl bg-stone-50 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all text-stone-500 hover:text-stone-700"
                                    >
                                        <span className="text-2xl leading-none mb-1 font-bold">-</span>
                                    </button>
                                    <div className="flex-1 flex flex-col items-center justify-center h-[52px]">
                                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-stone-800 transition-all rounded-full"
                                                style={{ width: `${Math.min(100, (duration / 120) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDuration(duration + 15)}
                                        className="w-12 h-[52px] rounded-2xl bg-stone-50 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all text-stone-500 hover:text-stone-700"
                                    >
                                        <span className="text-2xl leading-none mb-1 font-bold">+</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wide font-english">Color</label>
                            <div className="flex flex-wrap gap-4">
                                {TASK_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center relative hover:scale-105 active:scale-95 ring-2 ring-offset-2 ${color === c.value ? 'ring-stone-300' : 'ring-transparent'}`}
                                        style={{ backgroundColor: c.value }}
                                        aria-label={c.name}
                                    >
                                        {color === c.value && (
                                            <Check size={20} style={{ color: c.text }} strokeWidth={3} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 shrink-0 flex gap-3 bg-white border-t border-stone-50">
                    {initialData?.id && onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-5 py-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-bold active:scale-95"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        type="submit"
                        form="taskForm"
                        className="flex-1 bg-stone-900 text-white hover:bg-black py-4 font-bold text-lg transition-colors active:scale-[0.98] rounded-2xl shadow-xl shadow-stone-200/50"
                    >
                        완료
                    </button>
                </div>
            </div>
        </div>
    );
};

const CurrentTimeCursor = ({ hour, currentHour, currentMinute }: { hour: number, currentHour: number, currentMinute: number }) => {
    if (hour !== currentHour) return null;
    const percent = (currentMinute / 60) * 100;

    return (
        <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-1000 ease-linear"
            style={{ left: `${percent}%` }}
        >
            <div className="w-[2px] h-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>
            <div className="absolute -top-1.5 -left-[4px] w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm border border-white" />
        </div>
    );
};

const App = () => {
    // --- State ---
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : { wakeTime: 7, bedTime: 23 };
        } catch { return { wakeTime: 7, bedTime: 23 }; }
    });

    const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
            return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
        } catch { return DEFAULT_TEMPLATES; }
    });

    // Undo state
    const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null);
    const undoTimeoutRef = useRef<number | null>(null);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<{ h: number, q: number } | null>(null);

    // --- Effects ---
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates)); }, [templates]);

    const [modalOpen, setModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const currentHour = new Date().getHours();
            const scrollPos = Math.max(0, (currentHour * 80) - (window.innerHeight / 3));
            scrollRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
    }, []);

    const handleSlotClick = (hour: number, quarter: number) => {
        const startMin = hour * 60 + quarter * 15;
        setEditingTask({
            startMin,
            duration: 30,
            color: DEFAULT_COLOR,
            isCompleted: false,
        });
        setModalOpen(true);
    };

    const saveTask = (task: Task) => {
        setTasks((prev) => {
            const exists = prev.find((t) => t.id === task.id);
            if (exists) return prev.map((t) => (t.id === task.id ? task : t));
            return [...prev, task];
        });
    };

    const toggleTaskCompletion = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
        ));
    };

    const deleteTask = (id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const getTaskInSlot = (hour: number, quarter: number) => {
        const slotStart = hour * 60 + quarter * 15;
        const slotEnd = slotStart + 15;
        return tasks.find(t => {
            const tEnd = t.startMin + t.duration;
            return t.startMin < slotEnd && tEnd > slotStart;
        });
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.stopPropagation();
        setDraggedTaskId(task.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, hour: number, quarter: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverSlot({ h: hour, q: quarter });
    };

    const handleDragLeave = () => {
        setDragOverSlot(null);
    };

    const handleDrop = (e: React.DragEvent, hour: number, quarter: number) => {
        e.preventDefault();
        e.stopPropagation();

        setDragOverSlot(null);

        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task) {
                const newStartMin = hour * 60 + quarter * 15;
                const prevStartMin = task.startMin;

                if (newStartMin !== prevStartMin) {
                    setTasks(prev => prev.map(t => {
                        if (t.id === draggedTaskId) {
                            return { ...t, startMin: newStartMin };
                        }
                        return t;
                    }));

                    // Set Undo Action
                    setLastUndoAction({ taskId: draggedTaskId, prevStartMin });

                    // Clear previous timeout if exists
                    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);

                    // Hide undo button after 5 seconds
                    undoTimeoutRef.current = window.setTimeout(() => {
                        setLastUndoAction(null);
                    }, 5000);
                }
            }
            setDraggedTaskId(null);
        }
    };

    const performUndo = () => {
        if (lastUndoAction) {
            setTasks(prev => prev.map(t => {
                if (t.id === lastUndoAction.taskId) {
                    return { ...t, startMin: lastUndoAction.prevStartMin };
                }
                return t;
            }));
            setLastUndoAction(null);
            if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
        }
    };

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    return (
        <div className="flex flex-col h-screen max-w-lg mx-auto bg-stone-50 shadow-2xl relative overflow-hidden text-stone-900 font-sans">

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-end pointer-events-none bg-gradient-to-b from-stone-50/90 via-stone-50/60 to-transparent h-24">
                <h1 className="text-4xl font-extrabold text-stone-900 tracking-tighter pointer-events-auto font-english">Timebox.</h1>
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md text-stone-600 hover:text-stone-900 hover:bg-white transition-all rounded-full shadow-sm pointer-events-auto border border-stone-200/60 mb-1"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Main Grid Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-24 pb-32" ref={scrollRef}>
                <div className="px-0 relative">

                    {/* Header for minutes */}
                    <div className="grid grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] mb-1 sticky top-0 z-20 pointer-events-none">
                        <div></div>
                        {[0, 15, 30, 45].map((min) => (
                            <div key={min} className="text-center">
                                <span className="text-[11px] text-stone-400 font-bold opacity-60 font-english">
                                    {min.toString().padStart(2, '0')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Sleep Overlay Top */}
                    <div className="absolute top-[28px] left-0 right-0 hatch-pattern z-20"
                        style={{ height: `${settings.wakeTime * 80}px` }}
                    />
                    {/* Sleep Overlay Bottom */}
                    <div className="absolute left-0 right-0 hatch-pattern z-20"
                        style={{ top: `${28 + settings.bedTime * 80}px`, height: `${(24 - settings.bedTime) * 80}px` }}
                    />

                    <div className="">
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const isBlocked = hour < settings.wakeTime || hour >= settings.bedTime;
                            const isPM = hour >= 12;

                            // --- SUBTLE SHADING LOGIC (4 levels) ---
                            // AM: White (0-30), Faint Warm Grey (30-60)
                            // PM: Faint Cool Grey (0-30), Slightly Deeper Cool Grey (30-60)
                            const bgFirstHalf = isPM ? 'bg-slate-50/50' : 'bg-white';
                            const bgSecondHalf = isPM ? 'bg-slate-100/30' : 'bg-stone-50/40';

                            return (
                                <div
                                    key={hour}
                                    className={`grid grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] h-[80px] relative group border-b border-stone-100`}
                                >
                                    {/* Hour Label - Row 1 */}
                                    <div className={`col-start-1 row-start-1 flex items-start pt-2 justify-center relative z-20 bg-stone-50 border-r border-stone-100`}>
                                        <span className={`text-sm font-bold tracking-tight font-english ${hour === currentHour ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {hour}
                                        </span>
                                    </div>

                                    {/* Background Layers (Grouped 0-30 and 30-60) - Row 1 */}
                                    <div className={`col-start-2 col-span-2 row-start-1 ${bgFirstHalf} relative z-0 transition-colors duration-300`}></div>
                                    <div className={`col-start-4 col-span-2 row-start-1 ${bgSecondHalf} relative z-0 transition-colors duration-300`}></div>

                                    {/* Vertical Grid Lines Overlay */}
                                    <div className="absolute inset-0 left-[3.5rem] grid grid-cols-4 pointer-events-none z-0">
                                        <div className="border-r border-stone-100/80"></div>
                                        <div className="border-r border-stone-100/80"></div>
                                        <div className="border-r border-stone-100/80"></div>
                                        <div></div>
                                    </div>

                                    {/* Interaction Slots - Row 1 */}
                                    {Array.from({ length: 4 }).map((_, quarter) => {
                                        const task = getTaskInSlot(hour, quarter);
                                        const slotStartMin = hour * 60 + quarter * 15;

                                        // Determine if this slot is the start, middle, or end of the task
                                        const isTaskStart = task && task.startMin === slotStartMin;
                                        const isTaskEnd = task && (task.startMin + task.duration) === (slotStartMin + 15);

                                        // For visual continuity (Highlighter effect)
                                        // If it's not the start, remove top border radius and margin
                                        // If it's not the end, remove bottom border radius and margin
                                        const roundedClass = task
                                            ? `${isTaskStart ? 'rounded-t-[4px]' : ''} ${isTaskEnd ? 'rounded-b-[4px]' : ''}`
                                            : 'rounded-[4px]';

                                        const marginClass = task
                                            ? `${isTaskStart ? 'mt-[1px]' : 'mt-0'} ${isTaskEnd ? 'mb-[1px]' : 'mb-0'} mx-[1px]`
                                            : 'm-[1px]';

                                        const showContent = isTaskStart || (task && quarter === 0 && task.startMin < hour * 60);

                                        const colStartClass = [
                                            'col-start-2',
                                            'col-start-3',
                                            'col-start-4',
                                            'col-start-5'
                                        ][quarter];

                                        const isDragOver = dragOverSlot?.h === hour && dragOverSlot?.q === quarter;

                                        return (
                                            <div
                                                key={quarter}
                                                onClick={() => {
                                                    if (task) {
                                                        setEditingTask(task);
                                                        setModalOpen(true);
                                                    } else {
                                                        handleSlotClick(hour, quarter);
                                                    }
                                                }}
                                                onDragOver={(e) => handleDragOver(e, hour, quarter)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, hour, quarter)}
                                                className={`relative h-full z-10 group/slot ${colStartClass} row-start-1 col-span-1 transition-colors duration-200`}
                                            >
                                                {/* Drag Highlight Visual */}
                                                {isDragOver && !task && (
                                                    <div className="absolute inset-1 border-2 border-dashed border-stone-300 bg-stone-100/50 rounded-lg z-0 animate-pulse pointer-events-none" />
                                                )}

                                                {!task && !isBlocked && (
                                                    <div className="absolute inset-0 hover:bg-stone-900/5 cursor-pointer transition-colors" />
                                                )}

                                                {task && (
                                                    <div
                                                        draggable="true"
                                                        onDragStart={(e) => handleDragStart(e, task)}
                                                        className={`absolute inset-0 cursor-pointer transition-all duration-300 hover:brightness-95 active:scale-[0.98] z-20 ${roundedClass} ${marginClass} ${task.isCompleted ? 'opacity-40 grayscale' : 'opacity-90'}`}
                                                        style={{
                                                            backgroundColor: task.color,
                                                            // opacity is handled by class for completed state, but we can add extra transparency if needed for grid lines
                                                            // The user wants "highlighter" feel, so we rely on the rgba color values defined in TASK_COLORS
                                                        }}
                                                    >
                                                        {showContent && (
                                                            <div className="absolute top-0 left-0 w-[400%] h-full px-2 flex items-center gap-1.5 pointer-events-none">
                                                                <button
                                                                    onClick={(e) => toggleTaskCompletion(task.id, e)}
                                                                    className={`shrink-0 w-3.5 h-3.5 rounded-full border border-black/10 bg-white/40 flex items-center justify-center transition-colors pointer-events-auto hover:bg-white/60`}
                                                                >
                                                                    {task.isCompleted && <Check size={10} className="text-stone-900" strokeWidth={3} />}
                                                                </button>
                                                                <span className={`text-[13px] font-bold leading-tight truncate font-sans ${task.isCompleted ? 'line-through opacity-70' : ''}`} style={{ color: TASK_COLORS.find(c => c.value === task.color)?.text || '#1c1917' }}>
                                                                    {task.title}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Current Time Bar */}
                                    <div className="absolute left-[3.5rem] right-0 top-0 bottom-0 pointer-events-none z-30">
                                        <CurrentTimeCursor hour={hour} currentHour={currentHour} currentMinute={currentMinute} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Undo Toast */}
            {lastUndoAction && (
                <div className="absolute bottom-32 left-0 right-0 flex justify-center z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={performUndo}
                        className="bg-stone-800 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-stone-900 active:scale-95 transition-all"
                    >
                        <Undo2 size={16} />
                        <span className="text-sm font-semibold">실행 취소</span>
                    </button>
                </div>
            )}

            {/* Fixed Bottom Bar (Date & Action) */}
            <div className="absolute bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent flex justify-center pointer-events-none">
                <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[28px] py-3.5 pl-8 pr-3.5 flex items-center justify-between gap-12 pointer-events-auto border border-stone-100">
                    <div className="flex flex-col items-start min-w-[100px]">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-stone-900 tabular-nums tracking-tighter font-english">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md mt-1 font-english">
                                {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
                            </span>
                        </div>
                        <span className="text-xs font-medium text-stone-400 font-english">
                            {currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            const now = new Date();
                            const roundedMin = Math.round(now.getMinutes() / 15) * 15;
                            const startMin = now.getHours() * 60 + roundedMin;
                            setEditingTask({ startMin });
                            setModalOpen(true);
                        }}
                        className="w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-stone-200"
                    >
                        <Plus size={26} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={saveTask}
                onDelete={deleteTask}
                initialData={editingTask || undefined}
                templates={templates}
                onSaveTemplate={(t) => setTemplates([...templates, t])}
                onDeleteTemplate={(id) => setTemplates(prev => prev.filter(t => t.id !== id))}
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                    <pre className="text-left bg-gray-100 p-4 rounded overflow-auto text-sm">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}
