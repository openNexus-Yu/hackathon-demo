import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// Internal form state (never null)
interface ActivityFormData {
    campaign_id: number;
    name: string;
    description: string;
    icon: string;
    order_index: number;
}

// External Activity type (can have null)
interface Activity {
    id?: number;
    campaign_id: number;
    name: string;
    description: string | null;
    icon: string | null;
    order_index: number;
}

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: Activity) => Promise<void>;
    activity?: Activity | null;
    campaigns: Array<{ id: number; name: string }>;
}

export default function ActivityModal({ isOpen, onClose, onSave, activity, campaigns }: ActivityModalProps) {
    const [formData, setFormData] = useState<ActivityFormData>({
        campaign_id: 0,
        name: '',
        description: '',
        icon: '🎯',
        order_index: 0
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activity) {
            setFormData({
                campaign_id: activity.campaign_id,
                name: activity.name,
                description: activity.description || '',
                icon: activity.icon || '🎯',
                order_index: activity.order_index
            });
        } else {
            setFormData({
                campaign_id: campaigns[0]?.id || 0,
                name: '',
                description: '',
                icon: '🎯',
                order_index: 0
            });
        }
    }, [activity, isOpen, campaigns]);

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

    const iconOptions = ['🎯', '🎓', '💻', '🐛', '✅', '📚', '🚀', '⚡', '🔥', '💡', '🎨', '🔧'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {activity ? '编辑活动主题' : '创建活动主题'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            所属活动 <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.campaign_id}
                            onChange={(e) => setFormData({ ...formData, campaign_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">选择活动</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            主题名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="例如：新手入门任务"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            主题描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="简要描述这个主题..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            图标 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {iconOptions.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                                        formData.icon === icon
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
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
