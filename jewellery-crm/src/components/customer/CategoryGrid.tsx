'use client';

import { Category } from '@/lib/api-service';
import { useParams } from 'next/navigation';

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

const categoryIcons: { [key: string]: string } = {
  'Rings': '💍',
  'Necklaces': '📿',
  'Earrings': '👂',
  'Bracelets': '💫',
  'Pendants': '✨',
  'Chains': '🔗',
  'Anklets': '🦶',
  'Nose Pins': '👃',
  'Bangles': '💫',
  'default': '💎'
};

export default function CategoryGrid({ 
  categories, 
  onCategorySelect, 
  selectedCategory 
}: CategoryGridProps) {
  const params = useParams();
  const tenant = params.tenant as string;

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons.default;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {/* All Categories */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`group relative overflow-hidden rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 ${
          selectedCategory === null
            ? 'bg-gold text-gray-900 shadow-lg'
            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
        }`}
      >
        <div className="text-4xl mb-3">💎</div>
        <h3 className="font-semibold text-sm">All Categories</h3>
        <p className="text-xs text-gray-500 mt-1">View All</p>
      </button>

      {/* Individual Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.name)}
          className={`group relative overflow-hidden rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 ${
            selectedCategory === category.name
              ? 'bg-gold text-gray-900 shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
          }`}
        >
          <div className="text-4xl mb-3">{getCategoryIcon(category.name)}</div>
          <h3 className="font-semibold text-sm">{category.name}</h3>
          {category.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      ))}
    </div>
  );
} 