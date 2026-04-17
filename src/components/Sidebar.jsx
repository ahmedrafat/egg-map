import { useState } from 'react'
import {
  Anchor, Ship, Home, Globe, Users, Truck, Navigation, DollarSign,
  Layers, RefreshCw, Search, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react'
import clsx from 'clsx'

const LAYER_DEFS = [
  { key: 'ports',      label: 'Ports',            color: '#22c55e', icon: Anchor },
  { key: 'fleet',      label: 'Fleet',            color: '#3b82f6', icon: Ship },
  { key: 'properties', label: 'Properties',       color: '#eab308', icon: Home },
  { key: 'demand',     label: 'Market Demand',    color: '#FF6321', icon: Globe },
  { key: 'providers',  label: 'Logistics Partners', color: '#a855f7', icon: Truck },
  { key: 'routes',     label: 'Shipment Routes',  color: '#FF6321', icon: Navigation },
  { key: 'freight',    label: 'Freight Rate Ports', color: '#06b6d4', icon: DollarSign },
]

const Chip = ({ label, value, tint = '#FF6321' }) => (
  <div className="flex-1 min-w-[90px] rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
    <div className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</div>
    <div className="text-sm font-bold mt-0.5" style={{ color: tint }}>{value}</div>
  </div>
)

export default function Sidebar({
  stats, layers, onToggleLayer,
  searchQuery, onSearchChange, searchResults, onSearchSelect,
  loading, onRefresh,
  user, onSignOut,
  collapsed, onToggleCollapsed,
}) {
  const [tab, setTab] = useState('overview') // 'overview' | 'layers'

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        className="absolute top-3 left-3 z-[1000] w-9 h-9 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-neutral-400 hover:text-white hover:border-[#FF6321]/40 flex items-center justify-center transition-colors"
        title="Show sidebar"
      >
        <ChevronRight size={16} />
      </button>
    )
  }

  return (
    <div className="absolute top-3 left-3 z-[1000] w-72 bg-[#0a0a0a]/95 border border-[#1a1a1a] rounded-xl backdrop-blur-md shadow-2xl flex flex-col max-h-[calc(100vh-24px)]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-[#1a1a1a] flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/40 flex items-center justify-center">
          <Globe size={14} className="text-[#FF6321]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-white tracking-tight">EGG Globe Map</div>
          <div className="text-[9px] text-neutral-500 uppercase tracking-widest">Ecosystem Intel</div>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="w-6 h-6 rounded-md text-neutral-500 hover:text-white hover:bg-[#141414] flex items-center justify-center transition-colors"
          title="Hide sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {['overview', 'layers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors',
              tab === t ? 'text-[#FF6321] border-b-2 border-[#FF6321]' : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-3 py-3 space-y-3 flex-1">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search ports / fleet / countries…"
            className="w-full bg-[#111] border border-[#1a1a1a] rounded-md pl-7 pr-2 py-1.5 text-[11px] text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF6321]/40"
          />
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md shadow-xl z-10 max-h-60 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onSearchSelect(r)}
                  className="w-full text-left px-2.5 py-1.5 text-[10px] text-neutral-300 hover:bg-[#FF6321]/10 hover:text-white border-b border-[#141414] last:border-0"
                >
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-neutral-600 text-[9px]">{r.sub}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'overview' && (
          <>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1.5">Market Signals</div>
              <div className="flex gap-1.5 flex-wrap">
                <Chip label="RFQs"      value={stats.rfqs}    tint="#FF6321" />
                <Chip label="Leads"     value={stats.leads}   tint="#FF6321" />
                <Chip label="Buyers"    value={stats.buyers}  tint="#FF6321" />
                <Chip label="Customers" value={stats.customers} tint="#FF6321" />
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1.5">Infrastructure</div>
              <div className="flex gap-1.5 flex-wrap">
                <Chip label="Ports"      value={stats.ports}      tint="#22c55e" />
                <Chip label="Fleet"      value={stats.fleet}      tint="#3b82f6" />
                <Chip label="Properties" value={stats.properties} tint="#eab308" />
                <Chip label="Partners"   value={stats.providers}  tint="#a855f7" />
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1.5">Flow</div>
              <div className="flex gap-1.5 flex-wrap">
                <Chip label="Shipments" value={stats.shipments} tint="#06b6d4" />
                <Chip label="Orders"    value={stats.orders}    tint="#06b6d4" />
                <Chip label="Countries" value={stats.countries} tint="#06b6d4" />
                <Chip label="Products"  value={stats.products}  tint="#06b6d4" />
              </div>
            </div>
          </>
        )}

        {tab === 'layers' && (
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1 flex items-center gap-1">
              <Layers size={10} />
              Toggle layers
            </div>
            {LAYER_DEFS.map((def) => {
              const Icon = def.icon
              const on = !!layers[def.key]
              return (
                <button
                  key={def.key}
                  onClick={() => onToggleLayer(def.key)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all text-left',
                    on
                      ? 'bg-[#141414] border-[#2a2a2a] text-white'
                      : 'bg-transparent border-[#141414] text-neutral-600 hover:text-neutral-400'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: on ? def.color : '#222', boxShadow: on ? `0 0 6px ${def.color}` : 'none' }}
                  />
                  <Icon size={12} className="flex-shrink-0 opacity-70" />
                  <span className="text-[11px] font-medium flex-1">{def.label}</span>
                  <span className={clsx(
                    'text-[9px] uppercase tracking-wider font-bold',
                    on ? 'text-[#FF6321]' : 'text-neutral-700'
                  )}>
                    {on ? 'on' : 'off'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#1a1a1a] flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
            loading
              ? 'bg-[#141414] border-[#1a1a1a] text-neutral-600 cursor-not-allowed'
              : 'bg-[#141414] border-[#1a1a1a] text-neutral-400 hover:text-white hover:border-[#FF6321]/40'
          )}
        >
          <RefreshCw size={10} className={clsx(loading && 'animate-spin')} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>

        <div className="flex-1 min-w-0 text-right">
          <div className="text-[9px] text-neutral-600 truncate">{user?.email}</div>
        </div>

        <button
          onClick={onSignOut}
          className="w-6 h-6 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
          title="Sign out"
        >
          <LogOut size={12} />
        </button>
      </div>
    </div>
  )
}
