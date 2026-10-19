import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  ExternalLink,
  Zap,
  CheckCircle2,
  Tag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AffiliateProduct } from '../types';
import { getMarketplaceProducts } from '../services/apiClient';

interface MarketplaceAffiliatesProps {
  initialCategory?: string;
  onNavigateToCustomizer: () => void;
}

export const MarketplaceAffiliates: React.FC<MarketplaceAffiliatesProps> = ({
  initialCategory,
  onNavigateToCustomizer,
}) => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    { id: 'all', label: 'All Upgrades' },
    { id: 'Intake', label: 'Intakes & Induction' },
    { id: 'Exhaust', label: 'Exhausts & Downpipes' },
    { id: 'Suspension', label: 'Suspension & Coilovers' },
    { id: 'Wheels', label: 'Forged Wheels' },
    { id: 'Aero', label: 'Aero & Carbon' },
    { id: 'Ignition', label: 'Ignition & Coils' },
    { id: 'Sensors', label: 'OBD Sensors' },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getMarketplaceProducts(
          selectedCategory === 'all' ? undefined : selectedCategory
        );
        setProducts(data);
      } catch (err) {
        console.error('Failed to load marketplace products:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategory]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.fitmentDescription.toLowerCase().includes(q)
    );
  });

  return (
    <div id="marketplace-view" className="space-y-6">
      {/* Marketplace Header Banner */}
      <div className="relative flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl overflow-hidden sm:flex-row sm:items-center">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
              PARTS & PERFORMANCE UPGRADE MARKETPLACE
            </h2>
            <span className="rounded-md bg-emerald-500/25 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-200 font-mono-tech">
              Verified Fitment
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-200 leading-relaxed max-w-2xl font-normal">
            Source exact-fit replacement parts and stage upgrades for diagnosed trouble codes and custom styling builds.
          </p>
        </div>

        <button
          onClick={onNavigateToCustomizer}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-600/30 transition-all z-10 min-h-[48px]"
        >
          <Sparkles className="h-5 w-5" />
          <span>Visualize In AI Customizer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#2C3440] bg-[#14181F] p-5 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-md border border-cyan-400'
                  : 'bg-[#1A202A] text-zinc-200 hover:bg-[#252D3B] hover:text-white border border-[#2C3440]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search parts, brands, cars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
          />
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] shadow-lg transition-all hover:border-[#434F61] hover:shadow-2xl"
          >
            <div>
              {/* Product Image */}
              <div className="relative h-52 w-full overflow-hidden bg-[#0E1116]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <span className="absolute top-3.5 left-3.5 rounded-xl bg-[#0E1116]/90 border border-[#2C3440] px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md font-mono-tech">
                  {product.category}
                </span>
                <span className="absolute top-3.5 right-3.5 rounded-xl bg-emerald-500/90 px-3 py-1 text-xs font-bold text-zinc-950 backdrop-blur-md">
                  {product.affiliateNetwork}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono-tech">
                    {product.brand}
                  </span>
                  <span className="font-mono-tech text-lg font-bold text-emerald-400">
                    ${product.price.toLocaleString()}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-white line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-zinc-200 line-clamp-2 leading-relaxed font-normal">{product.description}</p>

                {/* Fitment & Power Gain */}
                <div className="rounded-2xl bg-[#1A202A] border border-[#2C3440] p-3.5 text-xs sm:text-sm space-y-2">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">{product.fitmentDescription}</span>
                  </div>
                  {product.performanceGain && (
                    <div className="flex items-center gap-2 text-cyan-200 font-semibold font-mono-tech">
                      <Zap className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span>{product.performanceGain}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buy & Affiliate Button */}
            <div className="border-t border-[#2C3440] p-5">
              <a
                href={product.buyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/25 transition-all active:scale-[0.98] min-h-[48px]"
              >
                <span>Buy on {product.affiliateNetwork}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
