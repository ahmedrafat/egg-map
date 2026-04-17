// Pulls every geo-relevant table in the Egypt Globe Supabase in parallel
// and returns a single unified shape for the map dashboard.
//
// Every query uses the anon key via the supabase client, so RLS must allow
// the authenticated role to read these tables.

import { supabase } from './supabase.js'

async function safeSelect(table, columns, extra = (q) => q) {
  try {
    const q = extra(supabase.from(table).select(columns))
    const { data, error } = await q
    if (error) {
      console.warn(`[ecosystemLoader] ${table}:`, error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.warn(`[ecosystemLoader] ${table} threw:`, err.message)
    return []
  }
}

export async function loadEcosystem() {
  const [
    ports,
    fleet,
    properties,
    rfqs,
    leads,
    buyers,
    customers,
    providers,
    customsShipments,
    pelotsaltOrders,
    ordersGeneric,
    freightRates,
    portRates,
    pelotsaltProducts,
    marketProducts,
  ] = await Promise.all([
    safeSelect('ports',
      'id,name,country,lat,lng,status,vessels_in_port'),
    safeSelect('fleet',
      'id,name,status,capacity,capacity_unit,current_port,destination,lat,lng'),
    safeSelect('realty_properties',
      'id,address,lat,lng,status'),
    safeSelect('market_rfqs',
      'id,buyer_name,buyer_country,country,delivery_port,dest_port,commodity_name,status,created_at',
      (q) => q.order('created_at', { ascending: false }).limit(1000)),
    safeSelect('leads',
      'id,name,country,commodity,created_at',
      (q) => q.order('created_at', { ascending: false }).limit(500)),
    safeSelect('pelotsalt_buyers',
      'id,address,city,country,status,created_at',
      (q) => q.order('created_at', { ascending: false }).limit(500)),
    safeSelect('customers',
      'id,name,country,city,status'),
    safeSelect('logistics_providers',
      'id,name,country,country_flag,covered_ports'),
    safeSelect('customs_shipments',
      'id,commodity,origin_country,dest_country,dest_port,status,created_at'),
    safeSelect('pelotsalt_orders',
      'id,buyer_name,buyer_country,destination_port,port_of_loading,status,created_at'),
    safeSelect('orders',
      'id,commodity,origin,destination,status,created_at'),
    safeSelect('globe_freight_rates',
      'id,destination_port,destination_country'),
    safeSelect('globe_port_loading_rates',
      'id,port_name,country,port_charges_usd_mt'),
    safeSelect('pelotsalt_products',
      'id,product_name'),
    safeSelect('market_products',
      'id,name,origin'),
  ])

  return {
    ports,
    fleet,
    properties,
    rfqs,
    leads,
    buyers,
    customers,
    providers,
    customsShipments,
    pelotsaltOrders,
    ordersGeneric,
    freightRates,
    portRates,
    pelotsaltProducts,
    marketProducts,
  }
}
