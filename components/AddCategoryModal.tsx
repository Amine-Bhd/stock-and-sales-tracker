import React, { useState } from 'react';
import { Category } from '../types';
import { XMarkIcon } from './icons';

interface AddCategoryModalProps {
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAddCategory }) => {
  const [emoji, setEmoji] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emoji && name) {
      setIsSubmitting(true);
      try {
        await onAddCategory({ emoji, name });
        onClose();
      } catch (error) {
         console.error("Failed to add category", error);
        alert("Failed to add category. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert('Please provide both a symbol and a name for the category.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-700 dark:text-slate-200">Add New Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-slate-600 dark:text-slate-300 mb-2 text-center">Category Symbol</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full text-center text-5xl p-2 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="🍓"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
              placeholder="e.g., Fruits"
            />
          </div>
           <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-500 text-white font-bold py-4 rounded-lg text-lg hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
