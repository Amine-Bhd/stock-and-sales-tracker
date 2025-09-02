import React from 'react';
import { Sale } from '../types';

interface SalesHistoryViewProps {
  sales: Sale[];
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ sales }) => {
  return (
    <div className="p-4 h-full flex flex-col">
      {sales.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400">
          <p className="text-lg">No sales have been recorded yet.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4">
            {sales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sale) => (
              <div key={sale.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {new Date(sale.date).toLocaleString()}
                  </span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-400">
                    Total: ${sale.total.toFixed(2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Items sold:</h3>
                  <div className="flex flex-wrap gap-4">
                    {sale.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1">
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryView;