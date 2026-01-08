import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// Internal form state (never null)
interface PrizeFormData {
    name: string;
    description: string;
    type: string;
    points_required: number;
    stock: number | null;
    image_url: string;
    use_key_pool: boolean;  // 是否使用密钥库
    delivery_type: string;  // 配送方式
}

// External Prize type (can have null)
interface Prize {
    id?: number;
    name: string;
    description: string | null;
    type: string;
    points_required: number;
    stock: number | null;
    image_url: string | null;
    use_key_pool?: boolean;
    delivery_type?: string;
}

interface PrizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prize: Prize) => Promise<void>;
    prize?: Prize | null;
}

export default function PrizeModal({ isOpen, onClose, onSave, prize }: PrizeModalProps) {
    const [formData, setFormData] = useState<PrizeFormData>({
        name: '',
        description: '',
        type: 'digital',
        points_required: 0,
        stock: null,
        image_url: '',
        use_key_pool: false,
        delivery_type: 'manual'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (prize) {
            setFormData({
                name: prize.name,
                description: prize.description || '',
                type: prize.type,
                points_required: prize.points_required,
                stock: prize.stock,
                image_url: prize.image_url || '',
                use_key_pool: prize.use_key_pool || false,
                delivery_type: prize.delivery_type || 'manual'
            });
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'digital',
                points_required: 0,
                stock: null,
                image_url: '',
                use_key_pool: false,
                delivery_type: 'manual'
            });
        }
    }, [prize, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 保留 ID 字段（编辑时）
            const dataToSave = prize?.id 
                ? { ...formData, id: prize.id }  // 编辑：带上 ID
                : formData;  // 创建：不需要 ID
            
            await onSave(dataToSave);
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
                        {prize ? '编辑奖品' : '创建奖品'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            奖品名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="例如：GitHub Pro 订阅"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            奖品描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="详细描述奖品内容..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            奖品类型 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="digital">数字商品</option>
                            <option value="voucher">代金券/优惠券</option>
                            <option value="physical">实物商品</option>
                            <option value="service">服务类</option>
                        </select>
                    </div>

                    {/* 密钥库选项 */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="use_key_pool"
                                checked={formData.use_key_pool}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    use_key_pool: e.target.checked,
                                    delivery_type: e.target.checked ? 'key_pool' : 'manual'
                                })}
                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div className="flex-1">
                                <label htmlFor="use_key_pool" className="text-sm font-medium text-gray-900 cursor-pointer">
                                    使用密钥库 🔑
                                </label>
                                <p className="text-xs text-gray-600 mt-1">
                                    启用后，用户兑换时会随机获得一个密钥（如优惠码、兑换码）。需要在创建后导入密钥。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                所需积分 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.points_required}
                                onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        {!formData.use_key_pool && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    库存数量
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.stock || ''}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="不限制"
                                />
                            </div>
                        )}
                        {formData.use_key_pool && (
                            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4">
                                <p className="text-sm text-gray-600">
                                    💡 库存由密钥数量决定
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            图片URL
                        </label>
                        <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://example.com/image.png"
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
