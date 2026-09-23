import { colors } from '../../theme/colors';

/**
 * BrandFilter Component - Brand filter with "ALL" option and brand logos
 */
const BrandFilter = ({ brands, selectedBrand, onSelectBrand }) => {
  return (
    <div 
      className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8 pt-0 pb-2 md:pb-4 md:justify-center"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* ALL Button */}
      <button
        onClick={() => onSelectBrand('all')}
        className={`flex items-center gap-1 md:gap-2 px-2.5 md:px-4 lg:px-5 py-1 md:py-2 rounded-full flex-shrink-0 ${
          selectedBrand === 'all' 
            ? '' 
            : 'bg-gray-200 md:bg-white md:shadow-sm'
        }`}
        style={selectedBrand === 'all' ? { backgroundColor: colors.backgroundTertiary } : {}}
      >
        {/* Swirl Icon */}
        <svg 
          className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
          />
        </svg>
        <span className={`text-[10px] md:text-sm lg:text-base font-medium ${
          selectedBrand === 'all' ? 'text-white' : 'text-black'
        }`}>
          ALL
        </span>
      </button>

      {/* Brand Logos - Logo and Name in Same Row */}
      {brands.map((brand) => (
        <button
          key={brand.id}
          onClick={() => onSelectBrand(brand.id)}
          className={`flex items-center gap-1 md:gap-2 flex-shrink-0 px-2 md:px-3 lg:px-4 py-1 md:py-2 rounded-full ${
            selectedBrand === brand.id ? '' : 'md:bg-white md:shadow-sm'
          }`}
          style={selectedBrand === brand.id ? { backgroundColor: colors.backgroundTertiary } : {}}
        >
          <div 
            className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center p-1 md:p-1.5 transition-all ${
              selectedBrand === brand.id ? 'ring-2 ring-gray-400 md:ring-4 md:ring-gray-300' : ''
            }`}
            style={{ backgroundColor: colors.brandBlack }}
          >
            <img 
              src={brand.logo} 
              alt={brand.name} 
              className="w-full h-full object-contain"
            />
          </div>
          <span className={`text-[10px] md:text-sm lg:text-base font-medium whitespace-nowrap ${
            selectedBrand === brand.id ? 'text-white' : 'text-gray-600'
          }`}>{brand.name}</span>
        </button>
      ))}
    </div>
  );
};

export default BrandFilter;

