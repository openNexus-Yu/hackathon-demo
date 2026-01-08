import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// Internal form state (never null)
interface TaskFormData {
    activity_id: number;
    title: string;
    description: string;
    points: number;
    task_type: string;
    recurrence: string;
    stock_limit: number | null;
    order_index: number;
    chat_room_id: string;
    chat_required: boolean;
}

// External Task type (can have null)
interface Task {
    id?: number;
    activity_id: number;
    title: string;
    description: string | null;
    points: number;
    task_type: string;
    recurrence: string;
    stock_limit: number | null;
    order_index: number;
    chat_room_id: string | null;
    chat_required: boolean;
}

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => Promise<void>;
    task?: Task | null;
    activities: Array<{ id: number; name: string; campaign_name?: string }>;
}

export default function TaskModal({ isOpen, onClose, onSave, task, activities }: TaskModalProps) {
    const [formData, setFormData] = useState<TaskFormData>({
        activity_id: 0,
        title: '',
        description: '',
        points: 100,
        task_type: 'manual',
        recurrence: 'once',
        stock_limit: null,
        order_index: 0,
        chat_room_id: '',
        chat_required: false
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setFormData({
                activity_id: task.activity_id,
                title: task.title,
                description: task.description || '',
                points: task.points,
                task_type: task.task_type,
                recurrence: task.recurrence,
                stock_limit: task.stock_limit,
                order_index: task.order_index,
                chat_room_id: task.chat_room_id || '',
                chat_required: task.chat_required
            });
        } else {
            setFormData({
                activity_id: activities[0]?.id || 0,
                title: '',
                description: '',
                points: 100,
                task_type: 'manual',
                recurrence: 'once',
                stock_limit: null,
                order_index: 0,
                chat_room_id: '',
                chat_required: false
            });
        }
    }, [task, isOpen, activities]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData as any);
            onClose();
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {task ? '编辑任务' : '创建任务'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            所属主题 <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.activity_id}
                            onChange={(e) => setFormData({ ...formData, activity_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">选择活动主题</option>
                            {activities.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.campaign_name ? `${a.campaign_name} - ${a.name}` : a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            任务标题 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="例如：完成新手教程"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            任务描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="详细描述任务要求..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                任务类型 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.task_type}
                                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="manual">手动验证</option>
                                <option value="dev">开发任务</option>
                                <option value="social">社交任务</option>
                                <option value="content">内容创作</option>
                                <option value="chat">聊天室任务</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                重复类型 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.recurrence}
                                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="once">一次性</option>
                                <option value="daily">每日</option>
                                <option value="weekly">每周</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                奖励积分 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                库存限制
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stock_limit || ''}
                                onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="不限制"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            排序顺序
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.order_index}
                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">数字越小，显示越靠前</p>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">聊天室设置</h3>
                        
                        <div className="flex items-center mb-3">
                            <input
                                type="checkbox"
                                id="chat_required"
                                checked={formData.chat_required}
                                onChange={(e) => setFormData({ ...formData, chat_required: e.target.checked })}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="chat_required" className="ml-2 text-sm text-gray-700">
                                需要加入聊天室才能完成此任务
                            </label>
                        </div>

                        {formData.chat_required && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    聊天室ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.chat_room_id}
                                    onChange={(e) => setFormData({ ...formData, chat_room_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="#room:matrix.org"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
