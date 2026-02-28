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
        <div className="overflow-x-auto border-4 border-black bg-white shadow-hard">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-neo-yellow text-black font-black border-b-4 border-black">
                    <tr>
                        <th scope="col" className="px-6 py-4 w-1/4 min-w-[120px] uppercase text-lg">
                            스펙 항목
                        </th>
                        <th scope="col" className={`px-6 py-4 ${isCompare ? 'w-[37.5%]' : 'w-3/4'} text-center border-l-4 border-black bg-white`}>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-black text-white mb-2 bg-neo-blue px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">{productA.brand}</span>
                                <span className="text-xl font-black break-keep text-black uppercase">{productA.name}</span>
                            </div>
                        </th>
                        {isCompare && (
                            <th scope="col" className="px-6 py-4 w-[37.5%] text-center border-l-4 border-black bg-white">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-black text-white mb-2 bg-neo-pink px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">{productB.brand}</span>
                                    <span className="text-xl font-black break-keep text-black uppercase">{productB.name}</span>
                                </div>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                    <tr className="border-b-4 border-black bg-gray-50">
                        <th scope="row" className="px-6 py-4 font-black text-black text-base uppercase">
                            가격
                        </th>
                        <td className="px-6 py-4 text-center border-l-2 border-black font-black text-black text-2xl">
                            {productA.price.toLocaleString()}원
                        </td>
                        {isCompare && (
                            <td className="px-6 py-4 text-center border-l-2 border-black font-black text-black text-2xl">
                                {productB.price.toLocaleString()}원
                            </td>
                        )}
                    </tr>

                    {specRows.map((row) => (
                        <tr key={row.key} className="hover:bg-neo-yellow/20 transition-colors">
                            <th scope="row" className="px-6 py-4 font-black text-black text-base uppercase bg-gray-50 border-r-2 border-black">
                                {row.label}
                            </th>
                            <td className="px-6 py-4 text-center text-black font-bold text-base">
                                {renderSpecValue(productA.specs[row.key])} {row.unit && productA.specs[row.key] ? row.unit : ''}
                            </td>
                            {isCompare && (
                                <td className="px-6 py-4 text-center border-l-2 border-black text-black font-bold text-base">
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
