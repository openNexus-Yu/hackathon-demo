import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// Internal form state (never null)
interface CampaignFormData {
    name: string;
    description: string;
    type: 'permanent' | 'limited';
    start_time: string;
    end_time: string;
    chat_room_id: string;
}

// External Campaign type (can have null)
interface Campaign {
    id?: number;
    name: string;
    description: string | null;
    type: 'permanent' | 'limited';
    start_time: string | null;
    end_time: string | null;
    chat_room_id?: string | null;
}

interface CampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (campaign: Campaign) => Promise<void>;
    campaign?: Campaign | null;
}

export default function CampaignModal({ isOpen, onClose, onSave, campaign }: CampaignModalProps) {
    const [formData, setFormData] = useState<CampaignFormData>({
        name: '',
        description: '',
        type: 'permanent',
        start_time: '',
        end_time: '',
        chat_room_id: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name,
                description: campaign.description || '',
                type: campaign.type,
                start_time: campaign.start_time || '',
                end_time: campaign.end_time || '',
                chat_room_id: campaign.chat_room_id || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'permanent',
                start_time: '',
                end_time: '',
                chat_room_id: ''
            });
        }
    }, [campaign, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
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
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {campaign ? '编辑活动' : '创建活动'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            活动名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="例如：新春开发者挑战赛"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            活动描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="简要描述活动内容..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            活动类型 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'permanent' | 'limited' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="permanent">常驻活动</option>
                            <option value="limited">限时活动</option>
                        </select>
                    </div>

                    {formData.type === 'limited' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    开始时间
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    结束时间
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            聊天室ID（可选）
                        </label>
                        <input
                            type="text"
                            value={formData.chat_room_id}
                            onChange={(e) => setFormData({ ...formData, chat_room_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="#room:matrix.org"
                        />
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
