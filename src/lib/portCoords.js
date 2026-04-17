// Port name → [lat, lng] fallback for well-known global ports.
// The ports table is the primary source; this catches destinations named as
// strings in RFQs / shipments / freight_rates that don't have a ports row.
//
// Normalization is done by lowercasing and stripping "port of", "port ", "new ",
// punctuation, and extra whitespace.

const PORT_LOOKUP = {
  // Egypt
  alexandria:      [31.2001,  29.9187],
  'el dekheila':   [31.1450,  29.8200],
  damietta:        [31.4165,  31.8133],
  'port said':     [31.2565,  32.2841],
  'east port said':[31.2600,  32.3300],
  sokhna:          [29.3833,  32.3333],
  'ain sokhna':    [29.3833,  32.3333],
  suez:            [29.9668,  32.5498],
  safaga:          [26.7333,  33.9333],
  // Saudi Arabia
  jeddah:          [21.4858,  39.1925],
  dammam:          [26.4207,  50.0888],
  jubail:          [27.0046,  49.6578],
  yanbu:           [24.0897,  38.0618],
  // UAE
  'jebel ali':     [25.0118,  55.0618],
  'port rashid':   [25.2692,  55.2726],
  'khalifa port':  [24.7949,  54.6450],
  'abu dhabi':     [24.4539,  54.3773],
  khorfakkan:      [25.3450,  56.3575],
  fujairah:        [25.1288,  56.3265],
  sharjah:         [25.3463,  55.4209],
  // GCC
  dammam:          [26.4207,  50.0888],
  kuwait:          [29.3797,  47.9350],
  shuwaikh:        [29.3588,  47.9372],
  'shuaiba':       [28.7500,  48.2000],
  'hamad port':    [25.0304,  51.5880],
  doha:            [25.2854,  51.5310],
  sohar:           [24.4667,  56.6167],
  salalah:         [16.9444,  54.0067],
  muscat:          [23.6140,  58.5370],
  // India / subcontinent
  mumbai:          [18.9490,  72.8322],
  jnpt:            [18.9490,  72.9500],
  nhava:           [18.9490,  72.9500],
  'nhava sheva':   [18.9490,  72.9500],
  chennai:         [13.0827,  80.2707],
  kolkata:         [22.5726,  88.3639],
  mundra:          [22.7404,  69.7116],
  kandla:          [23.0170,  70.2155],
  hazira:          [21.1010,  72.6200],
  karachi:         [24.8607,  67.0011],
  colombo:         [6.9398,   79.8453],
  chittagong:      [22.3352,  91.8349],
  // China / East Asia
  shanghai:        [31.2304, 121.4737],
  ningbo:          [29.8683, 121.5440],
  shenzhen:        [22.5431, 114.0579],
  qingdao:         [36.0671, 120.3826],
  tianjin:         [39.0842, 117.2010],
  xiamen:          [24.4798, 118.0894],
  'hong kong':     [22.3193, 114.1694],
  busan:           [35.1796, 129.0756],
  incheon:         [37.4563, 126.7052],
  tokyo:           [35.6762, 139.6503],
  yokohama:        [35.4437, 139.6380],
  kobe:            [34.6901, 135.1956],
  osaka:           [34.6937, 135.5022],
  kaohsiung:       [22.6273, 120.3014],
  keelung:         [25.1314, 121.7428],
  taichung:        [24.1477, 120.6736],
  singapore:       [1.2650,  103.8200],
  'port klang':    [3.0006,  101.3920],
  'tanjung pelepas':[1.3641, 103.5467],
  'port kelang':   [3.0006,  101.3920],
  manila:          [14.5995, 120.9842],
  laemchabang:     [13.0878, 100.8835],
  bangkok:         [13.7563, 100.5018],
  // Europe — North
  rotterdam:       [51.9225,  4.4792],
  antwerp:         [51.2600,  4.4024],
  hamburg:         [53.5511,  9.9937],
  bremerhaven:     [53.5395,  8.5810],
  felixstowe:      [51.9597,  1.3506],
  southampton:     [50.9097, -1.4044],
  'le havre':      [49.4944,  0.1079],
  zeebrugge:       [51.3306,  3.2094],
  gothenburg:      [57.7089, 11.9746],
  oslo:            [59.9139, 10.7522],
  copenhagen:      [55.6761, 12.5683],
  // Europe — South / Med
  piraeus:         [37.9473, 23.6363],
  thessaloniki:    [40.6401, 22.9444],
  istanbul:        [41.0082, 28.9784],
  mersin:          [36.8121, 34.6415],
  izmir:           [38.4192, 27.1287],
  aliaga:          [38.8000, 26.9660],
  gemlik:          [40.4279, 29.1515],
  ambarli:         [41.0057, 28.6948],
  iskenderun:      [36.5867, 36.1781],
  gebze:           [40.8023, 29.4369],
  valencia:        [39.4476, -0.3268],
  barcelona:       [41.3415,  2.1666],
  algeciras:       [36.1408, -5.4562],
  bilbao:          [43.3629, -3.0870],
  leghorn:         [43.5548, 10.3080],
  livorno:         [43.5548, 10.3080],
  genoa:           [44.4056,  8.9463],
  trieste:         [45.6495, 13.7768],
  'la spezia':     [44.0987,  9.8168],
  gioia:           [38.4433, 15.8988],
  salerno:         [40.6824, 14.7681],
  koper:           [45.5481, 13.7302],
  rijeka:          [45.3271, 14.4422],
  constanta:       [44.1733, 28.6383],
  odesa:           [46.4825, 30.7233],
  odessa:          [46.4825, 30.7233],
  chornomorsk:     [46.3044, 30.6556],
  novorossiysk:    [44.7235, 37.7731],
  marseille:       [43.2965,  5.3698],
  // Africa
  casablanca:      [33.5731, -7.5898],
  'tanger med':    [35.8801, -5.5070],
  tanger:          [35.7595, -5.8340],
  agadir:          [30.4278, -9.5981],
  algiers:         [36.7538,  3.0588],
  oran:            [35.6969, -0.6331],
  tunis:           [36.8065, 10.1815],
  bizerte:         [37.2744,  9.8739],
  rades:           [36.7667, 10.2667],
  tripoli:         [32.8872, 13.1913],
  benghazi:        [32.1167, 20.0667],
  misrata:         [32.3783, 15.0906],
  lagos:           [6.5244,   3.3792],
  'apapa':         [6.4500,   3.3667],
  'tin can':       [6.4459,   3.3415],
  mombasa:         [-4.0435, 39.6682],
  'dar es salaam': [-6.7924, 39.2083],
  djibouti:        [11.8251, 42.5903],
  'port sudan':    [19.6158, 37.2164],
  massawa:         [15.6100, 39.4500],
  assab:           [13.0092, 42.7381],
  durban:          [-29.8587, 31.0218],
  'cape town':     [-33.9249, 18.4241],
  'ngqura':        [-33.8241, 25.7000],
  // Americas
  santos:          [-23.9608, -46.3336],
  'buenos aires':  [-34.6037, -58.3816],
  valparaiso:      [-33.0472, -71.6127],
  callao:          [-12.0500, -77.1500],
  cartagena:       [10.3910, -75.4794],
  veracruz:        [19.1738, -96.1342],
  manzanillo:      [19.0531, -104.3157],
  'lázaro cárdenas':[17.9583, -102.2000],
  houston:         [29.7604, -95.3698],
  'new york':      [40.7128, -74.0060],
  'los angeles':   [33.7361, -118.2922],
  'long beach':    [33.7542, -118.2161],
  savannah:        [32.0809, -81.0912],
  oakland:         [37.8044, -122.2712],
  seattle:         [47.6062, -122.3321],
  vancouver:       [49.2827, -123.1207],
  'new orleans':   [29.9511, -90.0715],
  charleston:      [32.7765, -79.9311],
  norfolk:         [36.8508, -76.2859],
  // Australia
  sydney:          [-33.8688, 151.2093],
  melbourne:       [-37.8136, 144.9631],
  'port botany':   [-33.9500, 151.2333],
  fremantle:       [-32.0562, 115.7501],
  brisbane:        [-27.4698, 153.0251],
  // Fallback for very generic country-level hints
}

const norm = (s) => String(s || '')
  .toLowerCase()
  .trim()
  .replace(/^port of\s+/, '')
  .replace(/^port\s+/, '')
  .replace(/[.,;:()"]/g, '')
  .replace(/\s+/g, ' ')

export function resolvePort(name) {
  const k = norm(name)
  if (!k) return null
  if (PORT_LOOKUP[k]) return PORT_LOOKUP[k]
  // partial match — try first word
  const first = k.split(' ')[0]
  if (first && PORT_LOOKUP[first]) return PORT_LOOKUP[first]
  return null
}

export function portCoordsIndex(portsData) {
  // Build index: port name (lowercased) → [lat, lng] from the ports table,
  // falling back to hardcoded PORT_LOOKUP for anything missing.
  const idx = { ...PORT_LOOKUP }
  ;(portsData || []).forEach((p) => {
    if (p?.name && p?.lat != null && p?.lng != null) {
      idx[String(p.name).toLowerCase()] = [Number(p.lat), Number(p.lng)]
    }
  })
  return {
    lookup: idx,
    resolve(name) {
      const k = norm(name)
      if (!k) return null
      if (idx[k]) return idx[k]
      const first = k.split(' ')[0]
      if (first && idx[first]) return idx[first]
      return null
    },
  }
}
