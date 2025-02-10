import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import ProductDescriptionEditor from '../../components/ProductDescriptionEditor';

interface Category {
  id: number;
  name: string;
}

interface ProductVariant {
  size?: string;
  color?: string;
  stock: number;
  price: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image: string;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
  variants: ProductVariant[];
  specifications: { [key: string]: string };
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: 0,
    image: '',
    featured: false,
    variants: [],
    specifications: {}
  });
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    onDrop: acceptedFiles => {
      // Handle image upload
      const file = acceptedFiles[0];
      setPreviewImage(URL.createObjectURL(file));
      // TODO: Upload to server/storage
    }
  });

  useEffect(() => {
    // Fetch categories
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));

    // If editing, fetch product data
    if (id) {
      fetch(`http://localhost:5000/api/products/${id}`)
        .then(res => res.json())
        .then(data => setFormData(data));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = id 
      ? `http://localhost:5000/api/admin/products/${id}`
      : 'http://localhost:5000/api/admin/products';
      
    const method = id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...prev.variants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {id ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <ProductDescriptionEditor onChange={() => {}} />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {/* Featured Product */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Featured Product
              </label>
            </div>
          </div>
        </div>

        {/* Media Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Media</h2>
          <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center">
            <input {...getInputProps()} />
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="mx-auto max-h-64" />
            ) : (
              <p>Drag & drop product images here, or click to select files</p>
            )}
          </div>
        </div>

        {/* Variants Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Product Variants</h2>
          {formData.variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Size"
                value={variant.size}
                onChange={e => handleVariantChange(index, 'size', e.target.value)}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Color"
                value={variant.color}
                onChange={e => handleVariantChange(index, 'color', e.target.value)}
                className="border rounded p-2"
              />
              <input
                type="number"
                placeholder="Stock"
                value={variant.stock}
                onChange={e => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                className="border rounded p-2"
              />
              <input
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={e => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                className="border rounded p-2"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, variants: [...prev.variants, { stock: 0, price: 0 }] }))}
            className="text-blue-600 hover:text-blue-700"
          >
            + Add Variant
          </button>
        </div>

        {/* SEO Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Title
              </label>
              <input
                type="text"
                name="seo_title"
                value={formData.seo_title || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="SEO optimized title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Description
              </label>
              <textarea
                name="seo_description"
                value={formData.seo_description || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Meta description for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim())
                }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Pricing & Inventory</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Regular Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Price ($)
                </label>
                <input
                  type="number"
                  name="discount_price"
                  value={formData.discount_price || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Start Date
                </label>
                <input
                  type="datetime-local"
                  name="discount_start"
                  value={formData.discount_start || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount End Date
                </label>
                <input
                  type="datetime-local"
                  name="discount_end"
                  value={formData.discount_end || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {id ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 