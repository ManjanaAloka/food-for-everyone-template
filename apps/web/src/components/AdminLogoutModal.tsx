import { useState } from 'react';

interface AdminLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export function AdminLogoutModal({ isOpen, onClose, onConfirm }: AdminLogoutModalProps) {

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeInUp">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logout</h2>
          <p className="text-gray-600">Are you sure you want to log out?</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
