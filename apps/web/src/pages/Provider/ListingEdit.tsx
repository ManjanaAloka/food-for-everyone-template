import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IoCameraOutline, IoCloseOutline } from 'react-icons/io5';

type Form = { 
  title: string; 
  description?: string; 
  category: string; 
  ingredients?: string; 
  unitPrice: number; 
  discountPrice: number; 
  qtyAvailable: number; 
  weightGrams?: number; 
  expiresAt: string;
};

export function ListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Form>();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Fetch existing listing data
  const listingQ = useQuery({ 
    queryKey: ['listing', id], 
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data.listing;
    }
  });

  // Populate form when data loads
  useEffect(() => {
    if (listingQ.data) {
      const listing = listingQ.data;
      reset({
        title: listing.title,
        description: listing.description || '',
        category: listing.category,
        ingredients: listing.ingredients || '',
        unitPrice: listing.unitPrice,
        discountPrice: listing.discountPrice,
        qtyAvailable: listing.qtyAvailable,
        weightGrams: listing.weightGrams || undefined,
        expiresAt: new Date(listing.expiresAt).toISOString().slice(0, 16)
      });
      // Load existing images
      if (listing.images && Array.isArray(listing.images)) {
        setExistingImages(listing.images);
      }
    }
  }, [listingQ.data, reset]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      // Upload new images to Cloudinary via backend
      let newImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return res.data.url;
        });
        newImageUrls = await Promise.all(uploadPromises);
      }

      // Combine existing images with new ones
      const allImages = [...existingImages, ...newImageUrls];

      const payload = {
        ...data,
        description: data.description || undefined,
        ingredients: data.ingredients || undefined,
        weightGrams: data.weightGrams || undefined,
        images: allImages
      };

      await api.patch(`/listings/${id}`, payload);
      toast.success('Listing updated successfully!');
      nav('/provider/dashboard');
    } catch (error: any) {
      toast.error('Error: ' + (error.response?.data?.error || 'Failed to update listing'));
    } finally {
      setLoading(false);
    }
  };

  if (listingQ.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (listingQ.isError || !listingQ.data) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-red-600">Failed to load listing</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
          <p className="text-gray-600 mt-2">Update your listing details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g. Fresh Baked Bread"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              {...register('description')}
              placeholder="Describe your item..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Category & Ingredients */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">Select category...</option>
                <option value="Bakery">Bakery</option>
                <option value="Produce">Produce</option>
                <option value="Dairy">Dairy</option>
                <option value="Prepared Meals">Prepared Meals</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients</label>
              <input
                {...register('ingredients')}
                placeholder="e.g. flour, eggs, milk"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Original Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice', { required: 'Price is required', min: 0 })}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('discountPrice', { required: 'Discount price is required', min: 0 })}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {errors.discountPrice && <p className="text-red-500 text-sm mt-1">{errors.discountPrice.message}</p>}
            </div>
          </div>

          {/* Quantity & Weight */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity Available <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('qtyAvailable', { required: 'Quantity is required', min: 1 })}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {errors.qtyAvailable && <p className="text-red-500 text-sm mt-1">{errors.qtyAvailable.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (grams)</label>
              <input
                type="number"
                {...register('weightGrams', { min: 0 })}
                placeholder="Optional"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expires At <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('expiresAt', { required: 'Expiry date is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            {errors.expiresAt && <p className="text-red-500 text-sm mt-1">{errors.expiresAt.message}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Images
            </label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Current images:</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                      >
                        <IoCloseOutline />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <div className="text-4xl mb-2 flex justify-center text-gray-400"><IoCameraOutline /></div>
                <p className="text-gray-600 font-medium">Click to upload new images</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </label>
            </div>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mt-4 mb-2">New images to add:</p>
                <div className="grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => nav('/provider/dashboard')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? 'Updating...' : 'Update Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
