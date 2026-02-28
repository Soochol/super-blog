import { Product, ProductSpec } from '@/types';
import { Check, X } from 'lucide-react';

interface ProductSpecTableProps {
    productA: Product;
    productB?: Product;
}

export default function ProductSpecTable({ productA, productB }: ProductSpecTableProps) {

    const isCompare = !!productB;

    // Helper to render boolean-like specs or text
    const renderSpecValue = (val: string | number | boolean | undefined) => {
        if (val === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
        if (val === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
        if (val === undefined || val === null) return <span className="text-gray-400">-</span>;
        return val;
    };

    const specRows: { key: keyof ProductSpec; label: string; unit?: string }[] = [
        { key: 'cpu', label: '프로세서 (CPU)' },
        { key: 'gpu', label: '그래픽 (GPU)' },
        { key: 'ram', label: '메모리 (RAM)' },
        { key: 'storage', label: '저장장치' },
        { key: 'display', label: '디스플레이' },
        { key: 'weight', label: '무게', unit: 'kg' },
        { key: 'os', label: '운영체제' },
    ];

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-4 w-1/4 min-w-[120px]">
                            스펙 항목
                        </th>
                        <th scope="col" className={`px-6 py-4 ${isCompare ? 'w-[37.5%]' : 'w-3/4'} text-center border-l border-gray-200`}>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-blue-600 mb-1 bg-blue-50 px-2 py-0.5 rounded-full">{productA.brand}</span>
                                <span className="text-base break-keep text-gray-900">{productA.name}</span>
                            </div>
                        </th>
                        {isCompare && (
                            <th scope="col" className="px-6 py-4 w-[37.5%] text-center border-l border-gray-200 bg-gray-50/50">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-blue-600 mb-1 bg-blue-50 px-2 py-0.5 rounded-full">{productB.brand}</span>
                                    <span className="text-base break-keep text-gray-900">{productB.name}</span>
                                </div>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <tr>
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 bg-gray-50/30">
                            가격
                        </th>
                        <td className="px-6 py-4 text-center border-l border-gray-100 font-bold text-gray-900 text-lg">
                            {productA.price.toLocaleString()}원
                        </td>
                        {isCompare && (
                            <td className="px-6 py-4 text-center border-l border-gray-100 font-bold text-gray-900 text-lg">
                                {productB.price.toLocaleString()}원
                            </td>
                        )}
                    </tr>

                    {specRows.map((row) => (
                        <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-700 bg-gray-50/30">
                                {row.label}
                            </th>
                            <td className="px-6 py-4 text-center border-l border-gray-100 text-gray-600">
                                {renderSpecValue(productA.specs[row.key])} {row.unit && productA.specs[row.key] ? row.unit : ''}
                            </td>
                            {isCompare && (
                                <td className="px-6 py-4 text-center border-l border-gray-100 text-gray-600">
                                    {renderSpecValue(productB.specs[row.key])} {row.unit && productB.specs[row.key] ? row.unit : ''}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
