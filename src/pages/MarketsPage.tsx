import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useMarketOverview, MarketRow } from '@/hooks/useMarketOverview';
import { AssetCategory } from '@/hooks/useForexFeed';

type Tab = 'all' | AssetCategory;

const TABS: { label: string; value: Tab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Forex', value: 'forex' },
  { label: 'Commodities', value: 'commodity' },
  { label: 'Indices', value: 'index' },
];

const Sparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const fillD = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${positive ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${positive ? 'up' : 'dn'})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AssetRow = ({ row, onTrade }: { row: MarketRow; onTrade: () => void }) => {
  const positive = row.changePercent >= 0;
  const decimals = row.asset.decimals;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 active:bg-white/5 transition-colors cursor-pointer"
      onClick={onTrade}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
        {row.asset.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">{row.asset.display}</span>
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/10 text-muted-foreground uppercase tracking-wide">
            OTC
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{row.asset.name}</div>
      </div>

      <div className="flex-shrink-0">
        <Sparkline data={row.sparkline} positive={positive} />
      </div>

      <div className="flex-shrink-0 text-right min-w-[80px]">
        <div className="text-sm font-mono font-semibold text-white tabular-nums">
          {row.price.toFixed(decimals)}
        </div>
        <div className={`flex items-center justify-end gap-0.5 text-[11px] font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? '+' : ''}{row.changePercent.toFixed(2)}%
        </div>
      </div>

      <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
    </div>
  );
};

const PayoutBadge = ({ payout }: { payout: number }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payout >= 90 ? 'bg-green-500/20 text-green-400' : payout >= 87 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-muted-foreground'}`}>
    {payout}%
  </span>
);

const MarketsPage = () => {
  const navigate = useNavigate();
  const rows = useMarketOverview();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchCat = activeTab === 'all' || r.asset.category === activeTab;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.asset.display.toLowerCase().includes(q) ||
        r.asset.name.toLowerCase().includes(q) ||
        r.asset.symbol.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [rows, activeTab, search]);

  const topGainers = useMemo(() =>
    [...rows].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3),
  [rows]);

  const handleTrade = (symbol: string) => {
    navigate(`/trade?symbol=${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-white/5">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-white mb-3">Markets</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.value
                  ? 'bg-primary text-black'
                  : 'bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'all' && !search && (
        <div className="px-4 pt-4 pb-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Top Movers
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {topGainers.map((row) => {
              const positive = row.changePercent >= 0;
              return (
                <button
                  key={row.asset.symbol}
                  onClick={() => handleTrade(row.asset.symbol)}
                  className="flex-shrink-0 flex flex-col items-start gap-1 bg-white/5 border border-white/8 rounded-2xl p-3 w-[120px] active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">{row.asset.icon}</span>
                    <PayoutBadge payout={row.asset.payout} />
                  </div>
                  <div className="text-xs font-bold text-white">{row.asset.display}</div>
                  <div className="text-[10px] font-mono text-white/70">{row.price.toFixed(row.asset.decimals)}</div>
                  <div className={`text-[11px] font-semibold flex items-center gap-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {positive ? '+' : ''}{row.changePercent.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {filtered.length} Asset{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-muted-foreground">Payout</span>
        </div>

        <div className="bg-white/[0.02] rounded-2xl mx-2 overflow-hidden border border-white/5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No assets found
            </div>
          ) : (
            filtered.map((row, i) => (
              <div key={row.asset.symbol} className="relative">
                <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
                  <PayoutBadge payout={row.asset.payout} />
                </div>
                <AssetRow row={row} onTrade={() => handleTrade(row.asset.symbol)} />
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MarketsPage;
