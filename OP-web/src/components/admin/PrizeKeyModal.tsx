import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Key, Download, AlertCircle, Check } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3000';

interface PrizeKey {
    id: number;
    prize_id: number;
    key_value: string;
    key_type: string;
    is_used: boolean;
    used_by_user_id?: number;
    used_at?: string;
    key_metadata?: any;
    created_at: string;
}

interface PrizeKeyListResponse {
    total: number;
    used: number;
    available: number;
    keys: PrizeKey[];
}

interface Props {
    prizeId: number;
    prizeName: string;
    onClose: () => void;
}

export default function PrizeKeyModal({ prizeId, prizeName, onClose }: Props) {
    const [keys, setKeys] = useState<PrizeKey[]>([]);
    const [stats, setStats] = useState({ total: 0, used: 0, available: 0 });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // 批量导入
    const [bulkKeys, setBulkKeys] = useState('');
    const [keyType, setKeyType] = useState('voucher');
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, [prizeId]);

    const fetchKeys = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/prize/${prizeId}/keys`);
            if (res.ok) {
                const data: PrizeKeyListResponse = await res.json();
                setKeys(data.keys);
                setStats({ total: data.total, used: data.used, available: data.available });
            }
        } catch (err) {
            console.error('Failed to fetch keys:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkKeys.trim()) return;

        setUploading(true);
        try {
            // 按行分割密钥
            const keyList = bulkKeys
                .split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            const res = await fetch(`${BACKEND_URL}/api/incentive/prize/${prizeId}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prize_id: prizeId,
                    keys: keyList,
                    key_type: keyType
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`成功添加 ${result.total_added} 个密钥！${result.skipped > 0 ? `跳过 ${result.skipped} 个重复密钥。` : ''}`);
                setBulkKeys('');
                setShowUpload(false);
                fetchKeys();
            } else {
                alert('上传失败，请重试');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('上传失败');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteKey = async (keyId: number) => {
        if (!confirm('确定要删除这个密钥吗？')) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/prize-key/${keyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchKeys();
            } else {
                alert('删除失败');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('删除失败');
        }
    };

    const exportKeys = () => {
        const csv = keys.map(k => 
            `${k.key_value},${k.key_type},${k.is_used ? '已使用' : '未使用'},${k.created_at}`
        ).join('\n');
        
        const header = '密钥,类型,状态,创建时间\n';
        const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${prizeName}_keys_${Date.now()}.csv`;
        link.click();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">密钥库管理</h2>
                            <p className="text-sm text-gray-500">{prizeName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600">总密钥数</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                        <div className="text-sm text-gray-600">可用</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{stats.used}</div>
                        <div className="text-sm text-gray-600">已使用</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-6 border-b border-border">
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        批量导入
                    </button>
                    <button
                        onClick={exportKeys}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        导出CSV
                    </button>
                </div>

                {/* Upload Form */}
                <AnimatePresence>
                    {showUpload && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-border overflow-hidden"
                        >
                            <div className="p-6 bg-blue-50">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        密钥类型
                                    </label>
                                    <select
                                        value={keyType}
                                        onChange={(e) => setKeyType(e.target.value)}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary"
                                    >
                                        <option value="voucher">代金券</option>
                                        <option value="license">许可证</option>
                                        <option value="token">令牌</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        密钥列表（每行一个）
                                    </label>
                                    <textarea
                                        value={bulkKeys}
                                        onChange={(e) => setBulkKeys(e.target.value)}
                                        placeholder="在这里粘贴密钥，每行一个&#10;例如：&#10;VOUCHER-ABC123&#10;VOUCHER-DEF456&#10;VOUCHER-GHI789"
                                        rows={8}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                                    />
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4" />
                                        将自动去重，跳过已存在的密钥
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleBulkUpload}
                                        disabled={uploading || !bulkKeys.trim()}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {uploading ? '上传中...' : '确认上传'}
                                    </button>
                                    <button
                                        onClick={() => { setBulkKeys(''); setShowUpload(false); }}
                                        className="px-6 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Keys List */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            还没有密钥，点击"批量导入"添加
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {keys.map((key) => (
                                <div
                                    key={key.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${
                                        key.is_used ? 'bg-gray-50 border-gray-200' : 'bg-white border-border'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <code className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">
                                                {key.key_value}
                                            </code>
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                {key.key_type}
                                            </span>
                                            {key.is_used && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Check className="w-3 h-3" />
                                                    已使用
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            创建于 {new Date(key.created_at).toLocaleString('zh-CN')}
                                        </div>
                                    </div>
                                    {!key.is_used && (
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
