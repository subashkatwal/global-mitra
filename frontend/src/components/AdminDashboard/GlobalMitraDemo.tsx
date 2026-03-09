// /**
//  * GlobalMitra — DBSCAN Clustering Demo
//  * Hardcoded Kathmandu incident data · Full pipeline visualization
//  * Mirrors globalmitra_algorithm.py exactly
//  *
//  * Shows:
//  *  1. All 14 raw reports on a scatter plot (by GPS)
//  *  2. After time filter (3h window) — which reports survive
//  *  3. Cosine similarity heatmap (guide-weighted)
//  *  4. DBSCAN cluster output — Cluster A (Flood), Cluster B (Bridge), Noise
//  *  5. Verified / Possible alert cards
//  *  6. Pipeline parameter strip
//  */

// import { useState, useMemo } from 'react';
// import {
//   ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell, Legend,
// } from 'recharts';
// import {
//   Shield, AlertTriangle, Hash, BarChart2, MapPin,
//   Clock, Crosshair, ChevronRight, CheckCircle, Info,
// } from 'lucide-react';

// // ─── Pipeline Constants (exact match with algorithm.py) ───────────────────────
// const PIPELINE = {
//   TIME_WINDOW_HOURS:   3,
//   GEO_RADIUS_KM:       3.0,
//   MIN_CLUSTER_REPORTS: 3,
//   DBSCAN_EPS:          0.62,
//   DBSCAN_MIN_SAMPLES:  3,
//   GUIDE_WEIGHT:        1.5,
// };

// // ─── Hardcoded Reports (from Jupyter notebook) ────────────────────────────────
// const BASE_LAT = 27.7215;
// const BASE_LON = 85.3620;

// function offset(latM: number, lonM: number) {
//   const dLat = latM / 111000;
//   const dLon = lonM / (111000 * Math.cos((Math.PI / 180) * BASE_LAT));
//   return { lat: +(BASE_LAT + dLat).toFixed(6), lon: +(BASE_LON + dLon).toFixed(6) };
// }

// const NOW_MIN = 0; // minutes ago anchor

// interface Report {
//   id:          string;
//   description: string;
//   category:    string;
//   lat:         number;
//   lon:         number;
//   minutesAgo:  number;
//   role:        'Tourist' | 'Guide';
//   cluster:     'A' | 'B' | 'noise';
// }

// const REPORTS: Report[] = [
//   // ── Cluster A: Flash Flood (Bagmati) ────────────────────────────────────
//   { id: 'R001', description: 'Flash flood at Bagmati river crossing. Road submerged under water, river overflowing the banks.', category: 'FLOOD',      minutesAgo: 20,  role: 'Tourist', cluster: 'A', ...offset(50, 30)   },
//   { id: 'R002', description: 'Flood warning Bagmati river. Road completely submerged, dangerous water levels rising fast.',     category: 'FLOOD',      minutesAgo: 35,  role: 'Tourist', cluster: 'A', ...offset(80, -20)  },
//   { id: 'R003', description: 'Bagmati river flooding road near crossing. Water submerged tarmac, avoid this flood zone.',       category: 'FLOOD',      minutesAgo: 45,  role: 'Guide',   cluster: 'A', ...offset(30, 60)   },
//   { id: 'R004', description: 'Severe flood at Bagmati crossing. River burst banks, road underwater. Flood rescue needed.',      category: 'FLOOD',      minutesAgo: 55,  role: 'Guide',   cluster: 'A', ...offset(-40, 50)  },
//   { id: 'R005', description: 'Bagmati river flood blocking road. Submerged vehicles visible, water still rising at crossing.',  category: 'FLOOD',      minutesAgo: 70,  role: 'Tourist', cluster: 'A', ...offset(10, -30)  },
//   // ── Cluster B: Bridge Collapse (Ring Road) ────────────────────────────────
//   { id: 'R006', description: 'Bridge broken on ring road crossing. Collapsed section blocks all traffic, danger for pedestrians.', category: 'ROAD_BLOCK', minutesAgo: 30, role: 'Guide',   cluster: 'B', ...offset(1200, -900)  },
//   { id: 'R007', description: 'Bridge collapsed at ring road crossing. Broken structure danger, crossing completely blocked.',      category: 'ROAD_BLOCK', minutesAgo: 50, role: 'Tourist', cluster: 'B', ...offset(1350, -800)  },
//   { id: 'R008', description: 'Serious bridge collapse ring road. Broken bridge crossing blocked, structure unsafe danger zone.',   category: 'ROAD_BLOCK', minutesAgo: 65, role: 'Tourist', cluster: 'B', ...offset(1100, -1000) },
//   { id: 'R009', description: 'Bridge broken and collapsed at crossing. Danger zone blocked, emergency services at bridge site.',   category: 'ROAD_BLOCK', minutesAgo: 80, role: 'Guide',   cluster: 'B', ...offset(1250, -850)  },
//   // ── Noise ─────────────────────────────────────────────────────────────────
//   { id: 'R010', description: 'Avalanche warning Langtang trail. Snow avalanche debris blocking trekking route near camp.',             category: 'LANDSLIDE', minutesAgo: 200, role: 'Tourist', cluster: 'noise', ...offset(3500, -4000)  },
//   { id: 'R011', description: 'Large landslide Langtang valley. Hillside collapsed onto trail, trekkers evacuated to base camp.',       category: 'LANDSLIDE', minutesAgo: 90,  role: 'Tourist', cluster: 'noise', ...offset(-5000, 2000)  },
//   { id: 'R012', description: 'Landslide blocking Nagarkot highway. Rocks and mud swept across road, route completely impassable.',     category: 'LANDSLIDE', minutesAgo: 100, role: 'Guide',   cluster: 'noise', ...offset(4000, 3500)   },
//   { id: 'R013', description: 'Rockfall and road damage Helambu valley. Boulders on trekking path, avalanche risk remains high.',       category: 'LANDSLIDE', minutesAgo: 110, role: 'Guide',   cluster: 'noise', ...offset(-6000, -5000) },
//   { id: 'R014', description: 'Glacier avalanche debris Gosaikunda route. Trail buried, trekking suspended until further notice.',      category: 'LANDSLIDE', minutesAgo: 170, role: 'Tourist', cluster: 'noise', ...offset(-4500, 6000)  },
// ];

// // ─── After 3h time filter ─────────────────────────────────────────────────────
// const FILTERED = REPORTS.filter(r => r.minutesAgo <= PIPELINE.TIME_WINDOW_HOURS * 60);
// const REMOVED  = REPORTS.filter(r => r.minutesAgo > PIPELINE.TIME_WINDOW_HOURS * 60);

// // ─── Colours ──────────────────────────────────────────────────────────────────
// const CLUSTER_COLOR = { A: '#E63946', B: '#2A9D8F', noise: '#9CA3AF' };
// const CLUSTER_LABEL = { A: 'Cluster A — Flash Flood', B: 'Cluster B — Broken Bridge', noise: 'Noise' };

// // ─── Similarity heatmap data (pre-computed from notebook diagnostics) ─────────
// // Rows/cols = filtered reports R001–R009 (noise excluded from main cluster analysis)
// const HEATMAP_REPORTS = FILTERED.filter(r => r.cluster !== 'noise');
// const HEATMAP: Record<string, Record<string, number>> = {
//   R001: { R001:1.00, R002:0.72, R003:0.81, R004:0.68, R005:0.77, R006:0.03, R007:0.03, R008:0.04, R009:0.02 },
//   R002: { R001:0.72, R002:1.00, R003:0.75, R004:0.73, R005:0.70, R006:0.03, R007:0.04, R008:0.03, R009:0.03 },
//   R003: { R001:0.81, R002:0.75, R003:1.00, R004:0.79, R005:0.82, R006:0.04, R007:0.03, R008:0.04, R009:0.03 },
//   R004: { R001:0.68, R002:0.73, R003:0.79, R004:1.00, R005:0.71, R006:0.03, R007:0.02, R008:0.03, R009:0.04 },
//   R005: { R001:0.77, R002:0.70, R003:0.82, R004:0.71, R005:1.00, R006:0.03, R007:0.03, R008:0.03, R009:0.02 },
//   R006: { R001:0.03, R002:0.03, R003:0.04, R004:0.03, R005:0.03, R006:1.00, R007:0.78, R008:0.82, R009:0.76 },
//   R007: { R001:0.03, R002:0.04, R003:0.03, R004:0.02, R005:0.03, R006:0.78, R007:1.00, R008:0.75, R009:0.73 },
//   R008: { R001:0.04, R002:0.03, R003:0.04, R004:0.03, R005:0.03, R006:0.82, R007:0.75, R008:1.00, R009:0.80 },
//   R009: { R001:0.02, R002:0.03, R003:0.03, R004:0.04, R005:0.02, R006:0.76, R007:0.73, R008:0.80, R009:1.00 },
// };

// // ─── Similarity colour interpolation ─────────────────────────────────────────
// function simToColor(v: number): string {
//   // 0 → white, 1 → deep green
//   const r = Math.round(255 - v * 160);
//   const g = Math.round(255 - v * 50);
//   const b = Math.round(255 - v * 180);
//   return `rgb(${r},${g},${b})`;
// }

// // ─── Components ───────────────────────────────────────────────────────────────

// function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
//   return (
//     <div className="mb-8">
//       <div className="mb-3">
//         <h2 className="text-lg font-black text-gray-900">{title}</h2>
//         {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
//       </div>
//       {children}
//     </div>
//   );
// }

// function PipelineStrip() {
//   const items = [
//     { icon: Clock,     label: `${PIPELINE.TIME_WINDOW_HOURS}h window`,         tip: 'Reports older than 3h are excluded' },
//     { icon: Crosshair, label: `${PIPELINE.GEO_RADIUS_KM} km geo radius`,       tip: 'Haversine hard constraint' },
//     { icon: Hash,      label: `≥${PIPELINE.MIN_CLUSTER_REPORTS} → Verified`,   tip: 'Minimum reports to verify cluster' },
//     { icon: BarChart2, label: `ε=${PIPELINE.DBSCAN_EPS} DBSCAN`,               tip: 'Cosine distance threshold' },
//     { icon: Shield,    label: `Guide ${PIPELINE.GUIDE_WEIGHT}× weight`,        tip: 'Guide reports boost similarity' },
//   ];
//   return (
//     <div className="flex flex-wrap gap-2 mb-6">
//       {items.map(({ icon: Icon, label, tip }) => (
//         <div key={label} title={tip}
//           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold
//             bg-white text-gray-600 cursor-default select-none"
//           style={{ borderColor: '#CBD5E1' }}>
//           <Icon className="w-3.5 h-3.5 text-blue-500" /> {label}
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── Step 1: Raw GPS Scatter ───────────────────────────────────────────────────
// function RawScatterPlot() {
//   const data = REPORTS.map(r => ({
//     lon:   r.lon,
//     lat:   r.lat,
//     id:    r.id,
//     role:  r.role,
//     cluster: r.cluster,
//     stale: r.minutesAgo > PIPELINE.TIME_WINDOW_HOURS * 60,
//   }));

//   return (
//     <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E2E8F0' }}>
//       <div className="flex items-center gap-2 mb-4">
//         <MapPin className="w-4 h-4 text-blue-500" />
//         <span className="text-sm font-bold text-gray-800">All 14 Reports — GPS Coordinates</span>
//         <span className="ml-auto text-xs text-gray-400">Boudhanath area, Kathmandu</span>
//       </div>
//       <ResponsiveContainer width="100%" height={320}>
//         <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
//           <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
//           <XAxis dataKey="lon" name="Longitude" domain={['auto','auto']}
//             tickFormatter={v => v.toFixed(3)} tick={{ fontSize: 11 }}
//             label={{ value: 'Longitude', position: 'insideBottom', offset: -10, fontSize: 12 }} />
//           <YAxis dataKey="lat" name="Latitude" domain={['auto','auto']}
//             tickFormatter={v => v.toFixed(3)} tick={{ fontSize: 11 }}
//             label={{ value: 'Latitude', angle: -90, position: 'insideLeft', fontSize: 12 }} />
//           <Tooltip
//             content={({ active, payload }) => {
//               if (!active || !payload?.[0]) return null;
//               const d = payload[0].payload;
//               return (
//                 <div className="bg-white border rounded-xl shadow-lg p-3 text-xs max-w-xs"
//                   style={{ borderColor: '#E2E8F0' }}>
//                   <p className="font-black mb-1" style={{ color: CLUSTER_COLOR[d.cluster as keyof typeof CLUSTER_COLOR] }}>
//                     {d.id} [{d.role}] {d.stale ? '⚠ STALE' : ''}
//                   </p>
//                   <p className="text-gray-500">{d.lat.toFixed(5)}, {d.lon.toFixed(5)}</p>
//                 </div>
//               );
//             }}
//           />
//           <Scatter data={data} isAnimationActive>
//             {data.map((d, i) => (
//               <Cell key={i}
//                 fill={d.stale ? '#D1D5DB' : CLUSTER_COLOR[d.cluster as keyof typeof CLUSTER_COLOR]}
//                 opacity={d.stale ? 0.4 : 0.9}
//                 stroke={d.role === 'Guide' ? '#000' : 'transparent'}
//                 strokeWidth={1.5}
//               />
//             ))}
//           </Scatter>
//         </ScatterChart>
//       </ResponsiveContainer>
//       {/* legend */}
//       <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs text-gray-600">
//         {Object.entries(CLUSTER_COLOR).map(([k, c]) => (
//           <span key={k} className="flex items-center gap-1.5">
//             <span className="w-3 h-3 rounded-full" style={{ background: c }} />
//             {CLUSTER_LABEL[k as keyof typeof CLUSTER_LABEL]}
//           </span>
//         ))}
//         <span className="flex items-center gap-1.5">
//           <span className="w-3 h-3 rounded-full border border-black bg-gray-300" />
//           Guide (bordered)
//         </span>
//         <span className="flex items-center gap-1.5">
//           <span className="w-3 h-3 rounded-full bg-gray-300 opacity-40" />
//           Stale (removed by 3h filter)
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─── Step 2: Time Filter Result ────────────────────────────────────────────────
// function TimeFilterStep() {
//   return (
//     <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E2E8F0' }}>
//       <div className="flex items-center gap-2 mb-4">
//         <Clock className="w-4 h-4 text-blue-500" />
//         <span className="text-sm font-bold text-gray-800">
//           After {PIPELINE.TIME_WINDOW_HOURS}h Time Window Filter
//         </span>
//       </div>
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div className="rounded-xl border p-4 text-center bg-green-50" style={{ borderColor: '#BBF7D0' }}>
//           <p className="text-3xl font-black text-green-700">{FILTERED.length}</p>
//           <p className="text-xs text-green-600 font-semibold mt-1">Reports kept</p>
//         </div>
//         <div className="rounded-xl border p-4 text-center bg-gray-50" style={{ borderColor: '#E2E8F0' }}>
//           <p className="text-3xl font-black text-gray-400">{REMOVED.length}</p>
//           <p className="text-xs text-gray-500 font-semibold mt-1">Stale (removed)</p>
//         </div>
//       </div>
//       <div className="space-y-1">
//         {REPORTS.map(r => {
//           const kept = r.minutesAgo <= PIPELINE.TIME_WINDOW_HOURS * 60;
//           return (
//             <div key={r.id}
//               className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
//                 kept ? 'bg-green-50' : 'bg-gray-50 opacity-60'
//               }`}>
//               <span className={`w-2 h-2 rounded-full flex-shrink-0 ${kept ? 'bg-green-500' : 'bg-gray-400'}`} />
//               <span className="font-mono font-bold" style={{ color: CLUSTER_COLOR[r.cluster] }}>{r.id}</span>
//               <span className="text-gray-600">{r.minutesAgo} min ago</span>
//               <span className="ml-auto font-semibold" style={{ color: r.role === 'Guide' ? '#7C3AED' : '#6B7280' }}>
//                 {r.role}
//               </span>
//               {!kept && <span className="text-gray-400">REMOVED</span>}
//             </div>
//           );
//         })}
//       </div>
//       <p className="text-xs text-gray-400 mt-3">
//         R010 (200 min) and R014 (170 min) fall outside the {PIPELINE.TIME_WINDOW_HOURS}h={PIPELINE.TIME_WINDOW_HOURS * 60} min window.
//       </p>
//     </div>
//   );
// }

// // ─── Step 3: Similarity Heatmap ────────────────────────────────────────────────
// function SimilarityHeatmap() {
//   const ids = HEATMAP_REPORTS.map(r => r.id);

//   return (
//     <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E2E8F0' }}>
//       <div className="flex items-center gap-2 mb-1">
//         <BarChart2 className="w-4 h-4 text-blue-500" />
//         <span className="text-sm font-bold text-gray-800">TF-IDF Cosine Similarity Matrix (Guide {PIPELINE.GUIDE_WEIGHT}× weighted)</span>
//       </div>
//       <p className="text-xs text-gray-400 mb-4">
//         Darker = more similar. Guide-involved pairs are multiplied by {PIPELINE.GUIDE_WEIGHT}× (capped at 1.0).
//         Cross-cluster pairs (A vs B) are near 0 — confirmed different incidents.
//       </p>
//       <div className="overflow-x-auto">
//         <table className="text-[10px] border-separate border-spacing-1">
//           <thead>
//             <tr>
//               <th className="w-8" />
//               {ids.map(id => (
//                 <th key={id} className="w-10 text-center font-bold"
//                   style={{ color: CLUSTER_COLOR[HEATMAP_REPORTS.find(r => r.id === id)!.cluster] }}>
//                   {id}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {ids.map(rowId => (
//               <tr key={rowId}>
//                 <td className="font-bold text-right pr-1"
//                   style={{ color: CLUSTER_COLOR[HEATMAP_REPORTS.find(r => r.id === rowId)!.cluster] }}>
//                   {rowId}
//                 </td>
//                 {ids.map(colId => {
//                   const v = HEATMAP[rowId]?.[colId] ?? 0;
//                   return (
//                     <td key={colId}
//                       title={`${rowId} ↔ ${colId}: ${v.toFixed(2)}`}
//                       className="w-10 h-8 rounded text-center font-bold cursor-default"
//                       style={{ background: simToColor(v), color: v > 0.5 ? '#fff' : '#374151' }}>
//                       {v.toFixed(2)}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
//         <span>Low</span>
//         {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
//           <span key={v} className="w-6 h-3 rounded" style={{ background: simToColor(v) }} />
//         ))}
//         <span>High</span>
//       </div>
//     </div>
//   );
// }

// // ─── Step 4: DBSCAN Result Scatter ────────────────────────────────────────────
// function DBSCANResultPlot() {
//   const data = FILTERED.map(r => ({
//     lon:     r.lon,
//     lat:     r.lat,
//     id:      r.id,
//     role:    r.role,
//     cluster: r.cluster,
//   }));

//   // Centroids
//   const clusterA = FILTERED.filter(r => r.cluster === 'A');
//   const clusterB = FILTERED.filter(r => r.cluster === 'B');
//   const centA = {
//     lat: clusterA.reduce((s, r) => s + r.lat, 0) / clusterA.length,
//     lon: clusterA.reduce((s, r) => s + r.lon, 0) / clusterA.length,
//   };
//   const centB = {
//     lat: clusterB.reduce((s, r) => s + r.lat, 0) / clusterB.length,
//     lon: clusterB.reduce((s, r) => s + r.lon, 0) / clusterB.length,
//   };

//   return (
//     <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E2E8F0' }}>
//       <div className="flex items-center gap-2 mb-4">
//         <Shield className="w-4 h-4 text-blue-500" />
//         <span className="text-sm font-bold text-gray-800">
//           DBSCAN Output (eps={PIPELINE.DBSCAN_EPS}, min_samples={PIPELINE.DBSCAN_MIN_SAMPLES})
//         </span>
//       </div>
//       <ResponsiveContainer width="100%" height={300}>
//         <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
//           <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
//           <XAxis dataKey="lon" name="Longitude" domain={['auto','auto']}
//             tickFormatter={v => v.toFixed(3)} tick={{ fontSize: 11 }}
//             label={{ value: 'Longitude', position: 'insideBottom', offset: -10, fontSize: 12 }} />
//           <YAxis dataKey="lat" name="Latitude" domain={['auto','auto']}
//             tickFormatter={v => v.toFixed(3)} tick={{ fontSize: 11 }}
//             label={{ value: 'Latitude', angle: -90, position: 'insideLeft', fontSize: 12 }} />
//           <Tooltip
//             content={({ active, payload }) => {
//               if (!active || !payload?.[0]) return null;
//               const d = payload[0].payload;
//               return (
//                 <div className="bg-white border rounded-xl shadow-lg p-3 text-xs"
//                   style={{ borderColor: '#E2E8F0' }}>
//                   <p className="font-black mb-1" style={{ color: CLUSTER_COLOR[d.cluster as keyof typeof CLUSTER_COLOR] }}>
//                     {d.id} [{d.role}]
//                   </p>
//                   <p className="text-gray-500">{CLUSTER_LABEL[d.cluster as keyof typeof CLUSTER_LABEL]}</p>
//                 </div>
//               );
//             }}
//           />
//           <Scatter data={data} isAnimationActive>
//             {data.map((d, i) => (
//               <Cell key={i}
//                 fill={CLUSTER_COLOR[d.cluster as keyof typeof CLUSTER_COLOR]}
//                 stroke={d.role === 'Guide' ? '#000' : 'transparent'}
//                 strokeWidth={2}
//                 opacity={d.cluster === 'noise' ? 0.45 : 0.9}
//               />
//             ))}
//           </Scatter>
//         </ScatterChart>
//       </ResponsiveContainer>

//       {/* centroid markers */}
//       <div className="grid grid-cols-2 gap-3 mt-4">
//         {[
//           { label: 'Cluster A Centroid', color: CLUSTER_COLOR.A, lat: centA.lat, lon: centA.lon },
//           { label: 'Cluster B Centroid', color: CLUSTER_COLOR.B, lat: centB.lat, lon: centB.lon },
//         ].map(c => (
//           <div key={c.label} className="rounded-xl border p-3 text-xs"
//             style={{ borderColor: c.color + '60', background: c.color + '10' }}>
//             <p className="font-black mb-1" style={{ color: c.color }}>★ {c.label}</p>
//             <p className="font-mono text-gray-600">{c.lat.toFixed(5)}, {c.lon.toFixed(5)}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Step 5: Verified Cluster Cards ──────────────────────────────────────────
// function VerifiedCards() {
//   const clusters = [
//     {
//       id: 'A',
//       label: 'Flash Flood at Bagmati Crossing',
//       category: 'FLOOD',
//       reports: FILTERED.filter(r => r.cluster === 'A'),
//       verified: true,
//       confidence: 0.56,
//       keywords: ['flood', 'bagmati', 'road', 'river', 'submerged'],
//     },
//     {
//       id: 'B',
//       label: 'Broken Bridge on Ring Road',
//       category: 'ROAD_BLOCK',
//       reports: FILTERED.filter(r => r.cluster === 'B'),
//       verified: true,
//       confidence: 0.50,
//       keywords: ['bridge', 'collapsed', 'ring', 'broken', 'danger'],
//     },
//   ];

//   const noise = FILTERED.filter(r => r.cluster === 'noise');

//   return (
//     <div className="space-y-4">
//       {clusters.map(c => (
//         <div key={c.id}
//           className="rounded-2xl border p-5"
//           style={{ background: '#FFF5F5', borderColor: '#FECACA' }}>
//           <div className="flex items-start gap-3 mb-3">
//             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 flex-shrink-0">
//               <Shield className="w-5 h-5 text-red-600" />
//             </div>
//             <div>
//               <p className="text-[11px] font-black uppercase tracking-widest text-red-600">
//                 🚨 Verified Incident — Cluster {c.id}
//               </p>
//               <p className="font-bold text-gray-800 text-sm mt-0.5">{c.label}</p>
//             </div>
//           </div>
//           <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
//             <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {c.reports.length} reports</span>
//             <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {Math.round(c.confidence * 100)}% confidence</span>
//             <span className="flex items-center gap-1">
//               <Shield className="w-3 h-3 text-purple-500" /> {c.reports.filter(r => r.role === 'Guide').length} guide(s) boosted ×{PIPELINE.GUIDE_WEIGHT}
//             </span>
//           </div>
//           <div className="flex flex-wrap gap-1.5 mb-3">
//             {c.keywords.map(k => (
//               <span key={k} className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-white"
//                 style={{ borderColor: '#FECACA', color: '#475569' }}>
//                 {k}
//               </span>
//             ))}
//           </div>
//           <div className="space-y-1">
//             {c.reports.map(r => (
//               <div key={r.id} className="flex items-center gap-2 text-xs">
//                 <span className="font-mono font-bold text-gray-700">{r.id}</span>
//                 <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
//                   r.role === 'Guide' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'
//                 }`}>{r.role}</span>
//                 <span className="text-gray-500 flex-1 truncate">{r.description.slice(0, 70)}…</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* noise */}
//       <div className="rounded-2xl border p-4 bg-gray-50" style={{ borderColor: '#E2E8F0' }}>
//         <p className="text-xs font-bold text-gray-500 mb-2">
//           Noise (label = -1) — {noise.length} report(s) not clustered
//         </p>
//         <div className="flex flex-wrap gap-1.5">
//           {noise.map(r => (
//             <span key={r.id}
//               className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border bg-white text-gray-500"
//               style={{ borderColor: '#E2E8F0' }}>
//               {r.id}
//             </span>
//           ))}
//         </div>
//         <p className="text-[11px] text-gray-400 mt-2">
//           These reports are too geographically scattered or textually dissimilar to form a cluster.
//         </p>
//       </div>
//     </div>
//   );
// }

// // ─── Summary Table ─────────────────────────────────────────────────────────────
// function SummaryTable() {
//   const rows = [
//     { param: 'TIME_WINDOW_HOURS',   old: '6',    now: '3',    reason: 'Flash floods resolve quickly. Stale reports add false positives.' },
//     { param: 'DBSCAN_MIN_SAMPLES',  old: '2',    now: '3',    reason: 'Aligns core-point requirement with MIN_CLUSTER_REPORTS (≥3 = Verified).' },
//     { param: 'GUIDE_WEIGHT',        old: '1.0',  now: '1.5',  reason: 'Licensed local experts. Cosine similarity boosted 1.5× for guide pairs.' },
//   ];
//   return (
//     <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
//       <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E2E8F0' }}>
//         <Info className="w-4 h-4 text-blue-500" />
//         <span className="text-sm font-bold text-gray-800">Algorithm Parameter Changes</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead className="bg-slate-50">
//             <tr>
//               {['Parameter', 'Old', 'New', 'Rationale'].map(h => (
//                 <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={r.param} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
//                 <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{r.param}</td>
//                 <td className="px-4 py-3 text-xs text-gray-400 line-through">{r.old}</td>
//                 <td className="px-4 py-3 text-xs font-bold text-green-700">{r.now}</td>
//                 <td className="px-4 py-3 text-xs text-gray-600">{r.reason}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ────────────────────────────────────────────────────────────

// type Step = 'raw' | 'filter' | 'similarity' | 'dbscan' | 'verified';

// const STEPS: { id: Step; label: string; icon: typeof Shield }[] = [
//   { id: 'raw',        label: '1. Raw Reports',    icon: MapPin       },
//   { id: 'filter',     label: '2. Time Filter',    icon: Clock        },
//   { id: 'similarity', label: '3. Similarity',     icon: BarChart2    },
//   { id: 'dbscan',     label: '4. DBSCAN',         icon: Crosshair    },
//   { id: 'verified',   label: '5. Alerts',         icon: Shield       },
// ];

// export default function GlobalMitraDemo() {
//   const [step, setStep] = useState<Step>('raw');

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 sm:p-8"
//       style={{ fontFamily: "'Inter','DM Sans',system-ui,sans-serif" }}>
//       <div className="max-w-4xl mx-auto">

//         {/* Header */}
//         <div className="mb-6">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
//               <Shield className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-black text-gray-900">GlobalMitra — DBSCAN Demo</h1>
//               <p className="text-sm text-gray-500">
//                 14 hardcoded Kathmandu reports · TF-IDF + Haversine + Guide 1.5× boost
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Pipeline strip */}
//         <PipelineStrip />

//         {/* Step nav */}
//         <div className="flex flex-wrap gap-2 mb-6">
//           {STEPS.map(s => {
//             const Icon = s.icon;
//             return (
//               <button key={s.id}
//                 onClick={() => setStep(s.id)}
//                 className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
//                   border transition-all ${step === s.id
//                     ? 'text-white shadow-sm'
//                     : 'bg-white text-gray-600 hover:bg-gray-50'}`}
//                 style={step === s.id
//                   ? { background: '#2563EB', borderColor: '#2563EB' }
//                   : { borderColor: '#E2E8F0' }}>
//                 <Icon className="w-3.5 h-3.5" /> {s.label}
//               </button>
//             );
//           })}
//         </div>

//         {/* Step content */}
//         {step === 'raw'        && (
//           <Section title="Step 1 — All 14 Raw Reports" subtitle="Before any time or geo filtering. Each dot = one incident report from Kathmandu area.">
//             <RawScatterPlot />
//           </Section>
//         )}
//         {step === 'filter' && (
//           <Section title="Step 2 — 3h Time Window Filter" subtitle={`Only reports submitted in the last ${PIPELINE.TIME_WINDOW_HOURS}h are passed to DBSCAN. R010 (200 min) and R014 (170 min) are removed.`}>
//             <TimeFilterStep />
//           </Section>
//         )}
//         {step === 'similarity' && (
//           <Section title="Step 3 — TF-IDF Cosine Similarity + Guide Boost" subtitle="Intra-cluster pairs score >0.65. Cross-cluster pairs score <0.05. Guide pairs multiplied ×1.5.">
//             <SimilarityHeatmap />
//           </Section>
//         )}
//         {step === 'dbscan' && (
//           <Section title={`Step 4 — DBSCAN (eps=${PIPELINE.DBSCAN_EPS}, min_samples=${PIPELINE.DBSCAN_MIN_SAMPLES})`} subtitle="Two clear clusters emerge. Noise points are isolated reports that don't share enough textual+spatial similarity.">
//             <DBSCANResultPlot />
//           </Section>
//         )}
//         {step === 'verified' && (
//           <Section title="Step 5 — Verified Incidents + Alert Broadcast" subtitle={`Clusters with ≥${PIPELINE.MIN_CLUSTER_REPORTS} reports are marked VERIFIED and trigger auto AlertBroadcast.`}>
//             <VerifiedCards />
//           </Section>
//         )}

//         {/* Summary table always visible */}
//         <div className="mt-8">
//           <SummaryTable />
//         </div>

//         {/* Final summary bar */}
//         <div className="mt-6 rounded-2xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
//           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Pipeline Summary</p>
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//             {[
//               { label: 'Raw Reports',      value: REPORTS.length,      color: '#6B7280' },
//               { label: 'After 3h Filter',  value: FILTERED.length,     color: '#3B82F6' },
//               { label: 'Clusters Found',   value: 2,                   color: '#2A9D8F' },
//               { label: 'Verified',         value: 2,                   color: '#DC2626' },
//             ].map(s => (
//               <div key={s.label} className="text-center p-3 rounded-xl bg-slate-50">
//                 <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
//                 <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }