import { X, Anchor, Ship, Home, Globe, Truck } from 'lucide-react'

const ICON_FOR = {
  Port: Anchor,
  Fleet: Ship,
  Property: Home,
  Demand: Globe,
  Providers: Truck,
}

function Row({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[#141414] last:border-0">
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 w-24 flex-shrink-0">{label}</div>
      <div className="text-xs text-white flex-1 break-words">{String(value)}</div>
    </div>
  )
}

export default function RightPanel({ item, onClose }) {
  if (!item) return null
  const Icon = ICON_FOR[item.type] || Globe

  return (
    <div className="absolute top-3 right-3 bottom-3 z-[1000] w-80 bg-[#0a0a0a]/95 border border-[#1a1a1a] rounded-xl backdrop-blur-md shadow-2xl flex flex-col right-panel-enter">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#FF6321]/20 border border-[#FF6321]/30 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-[#FF6321]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-widest text-neutral-500">{item.type}</div>
          <div className="text-xs font-bold text-white truncate">
            {item.name || item.address || item.code || '—'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md text-neutral-500 hover:text-white hover:bg-[#141414] flex items-center justify-center transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {item.type === 'Port' && (
          <>
            <Row label="Country"   value={item.country} />
            <Row label="Status"    value={item.status} />
            <Row label="Vessels"   value={item.vessels_in_port} />
            <Row label="Lat"       value={item.lat} />
            <Row label="Lng"       value={item.lng} />
          </>
        )}
        {item.type === 'Fleet' && (
          <>
            <Row label="Status"       value={item.status} />
            <Row label="Capacity"     value={item.capacity && `${item.capacity} ${item.capacity_unit || ''}`} />
            <Row label="Current port" value={item.current_port} />
            <Row label="Destination"  value={item.destination} />
          </>
        )}
        {item.type === 'Property' && (
          <>
            <Row label="Address" value={item.address} />
            <Row label="Status"  value={item.status} />
          </>
        )}
        {item.type === 'Demand' && (
          <>
            <Row label="Country"  value={item.code} />
            <Row label="Total"    value={item.total} />
            <Row label="RFQs"     value={item.rfqs} />
            <Row label="Leads"    value={item.leads} />
            <Row label="Buyers"   value={item.buyers} />
            <div className="mt-4 pt-3 border-t border-[#141414]">
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2">Market breakdown</div>
              {[
                { k: 'RFQs (marketplace)', v: item.rfqs, c: '#FF6321' },
                { k: 'CRM Leads',           v: item.leads, c: '#eab308' },
                { k: 'Salt Buyers',         v: item.buyers, c: '#a855f7' },
              ].map(({ k, v, c }) => (
                <div key={k} className="mb-1.5">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-neutral-400">{k}</span>
                    <span className="text-neutral-500 font-mono">{v}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#141414] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (v / (item.total || 1)) * 100)}%`, background: c }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {item.type === 'Providers' && (
          <>
            <Row label="Country" value={item.code} />
            <Row label="Count"   value={item.count} />
            <div className="mt-3">
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1.5">Partners</div>
              <div className="space-y-1">
                {item.names?.map((n, i) => (
                  <div key={i} className="text-[11px] text-neutral-300 bg-[#111] px-2 py-1 rounded-md">{n}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
