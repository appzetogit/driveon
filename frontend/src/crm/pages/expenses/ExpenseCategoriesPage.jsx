import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdFolder,
    MdAdd,
    MdDelete,
    MdSearch,
    MdArrowBack,
    MdEdit,
    MdClose
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

// --- Shared Simple Modal ---
const SimpleModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <MdClose size={20} className="text-gray-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ExpenseCategoriesPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Category Form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Category Form
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('/crm/finance/categories');
            if (res.data.success) {
                setCategories(res.data.data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.post('/crm/finance/categories', {
                name: name.trim(),
                description: description.trim()
            });

            if (res.data.success) {
                toast.success('Category created successfully');
                setName('');
                setDescription('');
                fetchCategories();
            }
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(error.response?.data?.message || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = (cat) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditDescription(cat.description || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editName.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            setIsUpdating(true);
            const res = await api.put(`/crm/finance/categories/${editingCategory._id}`, {
                name: editName.trim(),
                description: editDescription.trim()
            });

            if (res.data.success) {
                toast.success('Category updated successfully');
                setIsEditModalOpen(false);
                setEditingCategory(null);
                fetchCategories();
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(error.response?.data?.message || 'Failed to update category');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete category "${name}"? This won't delete existing transactions but will remove the category from selection.`)) {
            return;
        }

        try {
            const res = await api.delete(`/crm/finance/categories/${id}`);
            if (res.data.success) {
                toast.success('Category deleted successfully');
                fetchCategories();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    // Filtered categories based on search
    const filteredCategories = categories.filter(cat => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        return (
            cat.name.toLowerCase().includes(cleanSearch) ||
            (cat.description || '').toLowerCase().includes(cleanSearch)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/dashboard')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/expenses/track')}>Expense Tracker</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">Categories</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MdFolder className="text-[#1c205c]" />
                        Expense Categories
                    </h1>
                    <p className="text-gray-500 text-sm">Create and manage expense categories for complete organization.</p>
                </div>

                <button
                    onClick={() => navigate('/crm/expenses/track')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-55 transition-all active:scale-95 shadow-sm"
                >
                    <MdArrowBack /> Back to Expense Tracker
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Section: Create Category */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add New Category</h2>
                        <p className="text-gray-500 text-xs mt-1">This category will instantly become available in the Expense dropdown.</p>
                    </div>

                    <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Electricity bill, Rent, Food"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                            <textarea
                                rows="3"
                                placeholder="Describe what expenses fall under this category..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-sm resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-[#1c205c] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#252d6d] active:scale-98 transition-all disabled:opacity-50"
                        >
                            <MdAdd size={20} />
                            {isSubmitting ? 'Creating...' : 'Create Category'}
                        </button>
                    </form>
                </div>

                {/* Right Section: Category List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                            />
                        </div>

                        <div className="text-xs font-bold text-gray-400 uppercase">
                            Total Categories: <span className="text-[#1c205c] text-sm ml-1">{categories.length}</span>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm font-semibold">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1c205c] mx-auto mb-3"></div>
                            Loading categories...
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm border-dashed border-2 py-16">
                            <MdFolder size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="font-bold text-gray-800 text-base">No categories found</p>
                            <p className="text-gray-400 text-xs mt-1">Try searching for another keyword or create a new category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {filteredCategories.map((cat, idx) => (
                                    <motion.div
                                        key={cat._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 group-hover:text-[#1c205c] transition-colors">
                                                    {cat.name}
                                                </h3>
                                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEditModal(cat)}
                                                        className="p-1.5 text-gray-450 hover:text-[#1c205c] hover:bg-[#1c205c]/10 rounded-lg transition-colors scale-90"
                                                        title="Edit Category"
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                                                        className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors scale-90"
                                                        title="Delete Category"
                                                    >
                                                        <MdDelete size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">
                                                {cat.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                                            <span>Active Status</span>
                                            <span className="text-[#1c205c] bg-[#1c205c]/5 px-2.5 py-1 rounded-md text-xs font-black font-sans">
                                                {cat.transactionCount || 0} Transactions
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Category Modal */}
            <SimpleModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                }}
                title="Edit Category Details"
            >
                <form onSubmit={handleUpdateCategory} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Rent, Chai/Coffee"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-sm font-semibold"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            rows="3"
                            placeholder="Provide category description details..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-sm resize-none"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingCategory(null);
                            }}
                            className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all active:scale-98"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex-1 py-2.5 bg-[#1c205c] text-white rounded-xl font-bold hover:bg-[#252d6d] transition-all active:scale-98 disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </SimpleModal>
        </div>
    );
};

export default ExpenseCategoriesPage;
