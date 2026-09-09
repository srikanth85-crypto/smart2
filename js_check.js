


/* =========================================================================
   FLOODSAFE CHENNAI â€” DEMO DATA
   All figures below are illustrative demo data for prototype purposes.
   ========================================================================= */

// factors are 0-100 "risk" scores (higher = worse), rainfall_mm is raw display value
const AREAS = [
  {id:"velachery",     name:"Velachery",     lat:12.9756, lng:80.2201, rainfall_mm:82, elevation_risk:90, waterlogging_risk:90, historical_risk:91},
  {id:"pallikaranai",  name:"Pallikaranai",  lat:12.9394, lng:80.2183, rainfall_mm:78, elevation_risk:88, waterlogging_risk:92, historical_risk:85},
  {id:"tambaram",      name:"Tambaram",      lat:12.9249, lng:80.1000, rainfall_mm:70, elevation_risk:75, waterlogging_risk:80, historical_risk:78},
  {id:"saidapet",      name:"Saidapet",      lat:13.0206, lng:80.2229, rainfall_mm:60, elevation_risk:65, waterlogging_risk:70, historical_risk:68},
  {id:"guindy",        name:"Guindy",        lat:13.0067, lng:80.2206, rainfall_mm:55, elevation_risk:60, waterlogging_risk:58, historical_risk:60},
  {id:"kodambakkam",   name:"Kodambakkam",   lat:13.0524, lng:80.2231, rainfall_mm:50, elevation_risk:55, waterlogging_risk:52, historical_risk:50},
  {id:"madipakkam",    name:"Madipakkam",    lat:12.9616, lng:80.1988, rainfall_mm:48, elevation_risk:50, waterlogging_risk:55, historical_risk:52},
  {id:"adyar",         name:"Adyar",         lat:13.0012, lng:80.2565, rainfall_mm:40, elevation_risk:45, waterlogging_risk:42, historical_risk:40},
  {id:"sholinganallur",name:"Sholinganallur",lat:12.9010, lng:80.2279, rainfall_mm:38, elevation_risk:40, waterlogging_risk:45, historical_risk:42},
  {id:"porur",         name:"Porur",         lat:13.0359, lng:80.1567, rainfall_mm:35, elevation_risk:38, waterlogging_risk:40, historical_risk:36},
  {id:"perungudi",     name:"Perungudi",     lat:12.9634, lng:80.2422, rainfall_mm:42, elevation_risk:44, waterlogging_risk:46, historical_risk:44},
  {id:"ambattur",      name:"Ambattur",      lat:13.1143, lng:80.1548, rainfall_mm:25, elevation_risk:30, waterlogging_risk:28, historical_risk:25},
  {id:"anna_nagar",    name:"Anna Nagar",    lat:13.0850, lng:80.2101, rainfall_mm:22, elevation_risk:25, waterlogging_risk:24, historical_risk:20},
  {id:"t_nagar",       name:"T. Nagar",      lat:13.0418, lng:80.2341, rainfall_mm:28, elevation_risk:32, waterlogging_risk:30, historical_risk:29},
  {id:"royapettah",    name:"Royapettah",    lat:13.0537, lng:80.2646, rainfall_mm:20, elevation_risk:22, waterlogging_risk:20, historical_risk:18},
];

const HOSPITALS = [
  {name:"Government General Hospital", area:"Royapettah", lat:13.0827, lng:80.2707, addr:"Park Town, Chennai", contact:"044-2530 5000"},
  {name:"Chennai Government Multi-Super Speciality Hospital", area:"Anna Nagar", lat:13.0790, lng:80.2135, addr:"Anna Nagar, Chennai", contact:"044-2670 1000"},
  {name:"Government Hospital, Tambaram", area:"Tambaram", lat:12.9270, lng:80.1150, addr:"Tambaram, Chennai", contact:"044-2226 1000"},
  {name:"K.K. Nagar Government Hospital", area:"Kodambakkam", lat:13.0392, lng:80.2075, addr:"K.K. Nagar, Chennai", contact:"044-2472 1000"},
  {name:"Voluntary Health Services Hospital", area:"Adyar", lat:12.9950, lng:80.2450, addr:"Taramani, Chennai", contact:"044-2254 1500"},
];
const AMBULANCE = [
  {name:"108 Ambulance Point â€” Velachery", area:"Velachery", lat:12.9800, lng:80.2180, addr:"Velachery Main Rd", contact:"108"},
  {name:"108 Ambulance Point â€” Guindy", area:"Guindy", lat:13.0090, lng:80.2180, addr:"Guindy Industrial Estate", contact:"108"},
  {name:"108 Ambulance Point â€” Tambaram", area:"Tambaram", lat:12.9230, lng:80.1050, addr:"GST Road, Tambaram", contact:"108"},
  {name:"108 Ambulance Point â€” Anna Nagar", area:"Anna Nagar", lat:13.0870, lng:80.2160, addr:"2nd Avenue, Anna Nagar", contact:"108"},
];
const FIRE = [
  {name:"Tambaram Fire Station", area:"Tambaram", lat:12.9300, lng:80.1100, addr:"GST Road, Tambaram", contact:"101"},
  {name:"Adyar Fire Station", area:"Adyar", lat:13.0060, lng:80.2570, addr:"LB Road, Adyar", contact:"101"},
  {name:"Anna Nagar Fire Station", area:"Anna Nagar", lat:13.0900, lng:80.2050, addr:"Anna Nagar West", contact:"101"},
];
const RELIEF = [
  {name:"Velachery Community Relief Centre", area:"Velachery", lat:12.9790, lng:80.2230, addr:"Velachery, Chennai", contact:"â€”"},
  {name:"Pallikaranai Relief Centre", area:"Pallikaranai", lat:12.9410, lng:80.2200, addr:"Pallikaranai, Chennai", contact:"â€”"},
  {name:"Madipakkam School Relief Centre", area:"Madipakkam", lat:12.9630, lng:80.2020, addr:"Madipakkam, Chennai", contact:"â€”"},
];

/* =========================================================================
   RISK ENGINE  (transparent weighted scoring model â€” MVP; architecture
   allows this function to be swapped for a trained ML model later)
   ========================================================================= */
function computeRisk(area){
  const score = (area.rainfall_mm * 0.40) + (area.elevation_risk * 0.20) +
                (area.waterlogging_risk * 0.20) + (area.historical_risk * 0.20);
  return Math.round(score * 10) / 10;
}
function classify(score){
  if(score >= 71) return "SEVERE";
  if(score >= 51) return "HIGH";
  if(score >= 31) return "MODERATE";
  return "LOW";
}
function riskColor(level){
  return {LOW:"var(--low)", MODERATE:"var(--moderate)", HIGH:"var(--high)", SEVERE:"var(--severe)"}[level];
}
function riskClass(level){ return "risk-" + level.toLowerCase(); }
function roadRisk(area){ return Math.round((area.waterlogging_risk + area.historical_risk) / 2); }
function recommendedAction(level){
  return {
    SEVERE:"Avoid unnecessary travel. Use the AI Safe Route before heading out, and monitor official alerts closely.",
    HIGH:"Travel with caution. Check the recommended safe route before departing and avoid known low-lying roads.",
    MODERATE:"Conditions are manageable but can change quickly. Minor delays possible on low-lying stretches.",
    LOW:"Normal travel conditions. No significant flood risk detected at this time."
  }[level];
}

AREAS.forEach(a => { a.score = computeRisk(a); a.level = classify(a.score); a.road_risk = roadRisk(a); });

/* =========================================================================
   ROUTE ENGINE (demo distance model â€” no external routing API required;
   falls back to this deterministic model if OSRM is unavailable)
   ========================================================================= */
function haversine(lat1,lon1,lat2,lon2){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function buildRoutes(fromPt, toPt, fromRisk, toRisk){
  const straight = haversine(fromPt.lat, fromPt.lng, toPt.lat, toPt.lng);
  const shortestDistance = Math.max(1.2, straight * 1.15);
  const shortestRisk = Math.round((fromRisk + toRisk) / 2 + Math.max(fromRisk,toRisk)*0.15);
  const shortestRiskClamped = Math.min(100, shortestRisk);
  const congestionFactor = shortestRiskClamped > 60 ? 2.1 : shortestRiskClamped > 40 ? 1.5 : 1.15;
  const shortestTime = Math.round((shortestDistance / 28) * 60 * congestionFactor);

  const aiDistance = Math.round(shortestDistance * (1.25 + (shortestRiskClamped/300)) * 10) / 10;
  const aiRisk = Math.max(10, Math.round(shortestRiskClamped * 0.45));
  const aiTime = Math.round((aiDistance / 30) * 60 * 1.1);

  return {
    shortest:{ distance: Math.round(shortestDistance*10)/10, time: shortestTime, risk: shortestRiskClamped, level: classify(shortestRiskClamped) },
    ai:{ distance: aiDistance, time: aiTime, risk: aiRisk, level: classify(aiRisk) }
  };
}

/* =========================================================================
   MAP
   ========================================================================= */
const map = L.map('map', {scrollWheelZoom:false}).setView([13.02, 80.21], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'&copy; OpenStreetMap contributors', maxZoom:18
}).addTo(map);
const routeMap = L.map('route-map', {scrollWheelZoom:false}).setView([13.02, 80.21], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'&copy; OpenStreetMap contributors', maxZoom:18
}).addTo(routeMap);
const routeLayer = L.layerGroup().addTo(routeMap);
let responderMap = null;

const riskLayer = L.layerGroup().addTo(map);
const hospLayer = L.layerGroup().addTo(map);
const ambLayer = L.layerGroup();
const fireLayer = L.layerGroup();
const reliefLayer = L.layerGroup();

function markerHtml(color, icon){
  return `<div style="background:${color};width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid rgba(255,255,255,0.85);box-shadow:0 2px 6px rgba(0,0,0,0.5);">${icon||''}</div>`;
}
function colorFor(level){
  return {LOW:"#4FAE7B", MODERATE:"#E4C247", HIGH:"#EC8C3F", SEVERE:"#E15C50"}[level];
}

AREAS.forEach(area => {
  const icon = L.divIcon({html: markerHtml(colorFor(area.level)), className:'', iconSize:[22,22]});
  const m = L.marker([area.lat, area.lng], {icon}).addTo(riskLayer);
  m.bindPopup(`<div class="popup-title">${area.name}</div>Risk: <b>${area.score}/100</b> â€” ${area.level}`);
  m.on('click', () => selectArea(area.id));
  area._marker = m;
});
function addFacilityMarkers(list, layer, icon, color){
  list.forEach(f=>{
    const m = L.marker([f.lat,f.lng], {icon: L.divIcon({html:markerHtml(color, icon), className:'', iconSize:[20,20]})}).addTo(layer);
    m.bindPopup(`<div class="popup-title">${f.name}</div>${f.addr}<br/>Contact: ${f.contact}`);
  });
}
addFacilityMarkers(HOSPITALS, hospLayer, "ðŸ¥", "#3C7A8C");
addFacilityMarkers(AMBULANCE, ambLayer, "ðŸš‘", "#B4553F");
addFacilityMarkers(FIRE, fireLayer, "ðŸš’", "#B4553F");
addFacilityMarkers(RELIEF, reliefLayer, "ðŸ«", "#5E8C5E");

document.querySelectorAll('.toggle-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    const layerName = chip.dataset.layer;
    const map_ = {risk:riskLayer, hospitals:hospLayer, ambulance:ambLayer, fire:fireLayer, relief:reliefLayer}[layerName];
    if(chip.classList.contains('on')){ map.removeLayer(map_); chip.classList.remove('on'); }
    else { map_.addTo(map); chip.classList.add('on'); }
  });
});

/* =========================================================================
   AREA DETAIL + FORECAST
   ========================================================================= */
let selectedAreaId = null;
function selectArea(id){
  selectedAreaId = id;
  const area = AREAS.find(a=>a.id===id);
  const el = document.getElementById('area-detail');
  el.innerHTML = `
    <h4>${area.name}</h4>
    <div class="score-row">
      <span class="score-num" style="color:${riskColor(area.level)}">${area.score}</span>
      <span class="risk-badge ${riskClass(area.level)}">${area.level}</span>
    </div>
    <div class="factor-row"><span class="fname">Rainfall</span><span class="fval">${area.rainfall_mm} mm</span></div>
    <div class="factor-row"><span class="fname">Elevation risk</span><span class="fval">${area.elevation_risk}/100</span></div>
    <div class="factor-row"><span class="fname">Waterlogging</span><span class="fval">${area.waterlogging_risk}/100</span></div>
    <div class="factor-row"><span class="fname">Historical flood risk</span><span class="fval">${area.historical_risk}/100</span></div>
    <div class="factor-row"><span class="fname">Road risk</span><span class="fval">${area.road_risk}/100</span></div>
    <div class="recommend-box"><b>Recommendation:</b> ${recommendedAction(area.level)}</div>
  `;
  renderForecast(area);
}
function renderForecast(area){
  const row = document.getElementById('forecast-row');
  row.innerHTML = '';
  const now = new Date();
  const hours = [0,1,2,3].map(offset=>{
    const seed = (area.rainfall_mm + offset*13) % 17;
    const pct = Math.min(97, Math.max(5, Math.round(area.score * (0.55 + offset*0.16) + seed*0.6)));
    const h = new Date(now.getTime() + offset*3600000);
    return {label: offset===0 ? 'Now' : h.getHours().toString().padStart(2,'0')+':00', pct};
  });
  hours.forEach(h=>{
    const wrap = document.createElement('div'); wrap.className='fbar-wrap';
    wrap.innerHTML = `<div class="fbar-pct">${h.pct}%</div><div class="fbar" style="height:${Math.max(6,h.pct)}px;"></div><div class="fbar-label">${h.label}</div>`;
    row.appendChild(wrap);
  });
}
selectArea('velachery');

/* =========================================================================
   DASHBOARD STATS
   ========================================================================= */
function renderStats(){
  const avgRain = Math.round(AREAS.reduce((s,a)=>s+a.rainfall_mm,0)/AREAS.length);
  const avgRisk = Math.round(AREAS.reduce((s,a)=>s+a.score,0)/AREAS.length);
  const zones = AREAS.filter(a=>a.level==='HIGH'||a.level==='SEVERE').length;
  document.getElementById('stat-rain').textContent = avgRain + ' mm';
  document.getElementById('stat-risk').textContent = avgRisk;
  document.getElementById('stat-zones').textContent = zones;
}
renderStats();

function tickClock(){
  const now = new Date();
  document.getElementById('clock-line').textContent = now.toLocaleString('en-IN', {weekday:'short', hour:'2-digit', minute:'2-digit'}) + ' Â· Chennai';
}
tickClock(); setInterval(tickClock, 30000);

/* =========================================================================
   NAVIGATION
   ========================================================================= */
function goToView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  document.querySelectorAll('.bottom-nav button').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  if(name==='dashboard'){ setTimeout(()=>map.invalidateSize(), 50); }
  if(name==='route'){ setTimeout(()=>routeMap.invalidateSize(), 50); }
}
document.querySelectorAll('.nav-item, .bottom-nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>goToView(btn.dataset.view));
});

/* =========================================================================
   SAFE ROUTE + EMERGENCY MODE
   ========================================================================= */
const DESTINATIONS = [...AREAS.map(a=>({id:a.id, name:a.name})), ...HOSPITALS.map((h,i)=>({id:'hosp_'+i, name:'ðŸ¥ '+h.name}))];
function pointFor(id){
  const area = AREAS.find(a=>a.id===id);
  if(area) return {lat:area.lat, lng:area.lng, risk: area.road_risk};
  const hosp = HOSPITALS[parseInt(id.replace('hosp_',''))];
  const hospArea = AREAS.find(a=>a.name===hosp.area);
  return {lat:hosp.lat, lng:hosp.lng, risk: hospArea ? hospArea.road_risk : 40};
}
function populateSelect(sel, defaultToIdx){
  sel.innerHTML = DESTINATIONS.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
  sel.selectedIndex = defaultToIdx;
}
populateSelect(document.getElementById('route-from'), 0);
populateSelect(document.getElementById('route-to'), DESTINATIONS.length-1);
populateSelect(document.getElementById('em-from'), 0);
populateSelect(document.getElementById('em-to'), DESTINATIONS.length-1);

function routePoints(fromPt, toPt, safer){
  const midLat = (fromPt.lat + toPt.lat) / 2;
  const midLng = (fromPt.lng + toPt.lng) / 2;
  const bend = safer ? 0.018 : -0.012;
  return [[fromPt.lat, fromPt.lng], [midLat + bend, midLng - bend], [toPt.lat, toPt.lng]];
}
function routeMarker(label, color){
  return L.divIcon({html:`<div style="background:${color};width:24px;height:24px;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.55);color:#fff;font:700 11px var(--font-mono);display:flex;align-items:center;justify-content:center;">${label}</div>`, className:'', iconSize:[24,24], iconAnchor:[12,12]});
}
function renderRouteMap(fromPt, toPt, fromName, toName){
  routeLayer.clearLayers();
  routeMap.invalidateSize();
  const safePoints = routePoints(fromPt, toPt, true);
  const shortestPoints = routePoints(fromPt, toPt, false);
  L.polyline(shortestPoints, {color:'#E15C50', weight:5, opacity:.72, dashArray:'8 8'}).bindPopup(`<b>Shortest route</b><br>${fromName} to ${toName}`).addTo(routeLayer);
  L.polyline(safePoints, {color:'#57A6B8', weight:7, opacity:.95}).bindPopup(`<b>AI Safe Route</b><br>${fromName} to ${toName}`).addTo(routeLayer);
  L.marker([fromPt.lat, fromPt.lng], {icon:routeMarker('A','#3C7A8C')}).bindPopup(`<b>Start</b><br>${fromName}`).addTo(routeLayer);
  L.marker([toPt.lat, toPt.lng], {icon:routeMarker('B','#B4553F')}).bindPopup(`<b>Destination</b><br>${toName}`).addTo(routeLayer);
  routeMap.fitBounds(L.latLngBounds(safePoints.concat(shortestPoints)), {padding:[30,30]});
  document.getElementById('route-map-status').textContent = `${fromName} â†’ ${toName}`;
}

function renderRouteResult(containerId, fromId, toId, isEmergency){
  const fromPt = pointFor(fromId), toPt = pointFor(toId);
  const fromName = DESTINATIONS.find(d=>d.id===fromId).name;
  const toName = DESTINATIONS.find(d=>d.id===toId).name;
  const routes = buildRoutes(fromPt, toPt, fromPt.risk, toPt.risk);
  const c = document.getElementById(containerId);
  const emergencyNote = isEmergency ? `<div class="recommend-box" style="margin-bottom:14px;border-color:var(--severe);">Priority order: <b>Flood safety â†’ Road accessibility â†’ Facility proximity â†’ Distance</b>.</div>` : '';
  c.innerHTML = `
    ${emergencyNote}
    <div class="disclaimer" style="margin-top:14px;">Routing from <b>${fromName}</b> to <b>${toName}</b>.</div>
    <div class="route-compare">
      <div class="route-card">
        <h5>ðŸ“ Shortest Route</h5>
        <div class="route-stat"><span>Distance</span><span>${routes.shortest.distance} km</span></div>
        <div class="route-stat"><span>Est. time</span><span>${routes.shortest.time} min</span></div>
        <div class="route-stat"><span>Flood risk</span><span class="risk-badge ${riskClass(routes.shortest.level)}">${routes.shortest.level}</span></div>
        <div class="route-explain">${routes.shortest.level==='HIGH'||routes.shortest.level==='SEVERE' ? 'âš ï¸ Shorter distance, but passes through flood-prone / waterlogged stretches. AVOID if possible.' : 'Acceptable flood exposure for this distance.'}</div>
      </div>
      <div class="route-card ai">
        <h5>ðŸŸ¢ AI Safe Route ${isEmergency ? '(Emergency)' : ''}</h5>
        <div class="route-stat"><span>Distance</span><span>${routes.ai.distance} km</span></div>
        <div class="route-stat"><span>Est. time</span><span>${routes.ai.time} min</span></div>
        <div class="route-stat"><span>Flood risk</span><span class="risk-badge ${riskClass(routes.ai.level)}">${routes.ai.level}</span></div>
        <div class="route-explain">Recommended route selected by balancing flood risk, road accessibility and reasonable travel distance â€” about ${Math.max(0,Math.round((routes.ai.distance-routes.shortest.distance)*10)/10)} km further, but ${Math.max(0, routes.shortest.risk-routes.ai.risk)} points lower flood risk.</div>
      </div>
    </div>
  `;
  renderRouteMap(fromPt, toPt, fromName, toName);
}
document.getElementById('route-go').addEventListener('click', ()=>{
  renderRouteResult('route-results', document.getElementById('route-from').value, document.getElementById('route-to').value, false);
});
document.getElementById('em-go').addEventListener('click', ()=>{
  renderRouteResult('em-results', document.getElementById('em-from').value, document.getElementById('em-to').value, true);
});
renderRouteResult('route-results', document.getElementById('route-from').value, document.getElementById('route-to').value, false);

/* Emergency mode toggle */
const emBtn = document.getElementById('emergency-toggle');
const emBanner = document.getElementById('emergency-banner');
emBtn.addEventListener('click', ()=>{
  const active = emBtn.classList.toggle('active');
  emBanner.classList.toggle('on', active);
  emBtn.textContent = active ? 'âœ• Exit Emergency Mode' : 'ðŸ†˜ Emergency Mode';
  if(active) goToView('emergency');
});

/* =========================================================================
   FACILITIES LIST VIEW
   ========================================================================= */
function renderFacilityList(containerId, list, icon){
  document.getElementById(containerId).innerHTML = list.map(f=>`
    <div class="facility-row">
      <div><span class="fic">${icon}</span><span class="fname2">${f.name}</span><span class="faddr">${f.addr} Â· near ${f.area}</span></div>
      <div style="color:var(--text-low);font-family:var(--font-mono);font-size:11.5px;">${f.contact}</div>
    </div>
  `).join('');
}
renderFacilityList('list-hospitals', HOSPITALS, 'ðŸ¥');
renderFacilityList('list-ambulance', AMBULANCE, 'ðŸš‘');
renderFacilityList('list-fire', FIRE, 'ðŸš’');
renderFacilityList('list-relief', RELIEF, 'ðŸ«');

/* =========================================================================
   USSD SIMULATION
   ========================================================================= */
const ussdScreen = document.getElementById('ussd-screen');
let ussdState = 'idle';
function ussdPrint(text){ ussdScreen.textContent = text; }
function ussdMenu(){
  ussdState = 'menu';
  ussdPrint("FloodSafe *123#\n\n1. Flood Risk\n2. Safe Route\n3. Emergency Help\n4. Nearby Hospital\n5. Safety Tips\n\nReply with a number.");
}
function ussdHandle(input){
  input = input.trim();
  if(input === '*123#'){ ussdMenu(); return; }
  if(ussdState === 'menu'){
    const refArea = AREAS.find(a=>a.id==='velachery');
    if(input==='1'){ ussdState='result'; ussdPrint(`Flood Risk â€” ${refArea.name}\n\nYour selected area has ${refArea.level} flood risk (${refArea.score}/100).\n${recommendedAction(refArea.level)}\n\n0. Back to menu`); }
    else if(input==='2'){ ussdState='result'; ussdPrint(`Safe Route\n\nOpen the Safe Route section in the app for a full comparison, or call 112 for urgent routing help.\n\n0. Back to menu`); }
    else if(input==='3'){ ussdState='result'; ussdPrint(`Emergency Help\n\n112 - National Emergency\n108 - Ambulance\n101 - Fire & Rescue\n\n0. Back to menu`); }
    else if(input==='4'){ ussdState='result'; ussdPrint(`Nearby Hospital\n\n${HOSPITALS[0].name}\n${HOSPITALS[0].addr}\nContact: ${HOSPITALS[0].contact}\n\n0. Back to menu`); }
    else if(input==='5'){ ussdState='result'; ussdPrint(`Safety Tips\n\n- Avoid walking/driving through moving water\n- Keep phone charged\n- Move valuables to higher ground\n- Follow official alerts\n\n0. Back to menu`); }
    else { ussdPrint("Invalid option.\n\nDial *123# to restart."); ussdState='idle'; }
  } else if(ussdState === 'result'){
    if(input==='0'){ ussdMenu(); } else { ussdPrint("Dial *123# to restart."); ussdState='idle'; }
  } else {
    ussdPrint("Dial *123# to begin.");
  }
}
document.getElementById('ussd-send').addEventListener('click', ()=>{
  const val = document.getElementById('ussd-input').value;
  if(val){ ussdHandle(val); document.getElementById('ussd-input').value=''; }
});
document.querySelectorAll('.ussd-key').forEach(k=>{
  k.addEventListener('click', ()=> ussdHandle(k.dataset.key));
});

/* =========================================================================
   FLOOD REPORT BOT
   ========================================================================= */
const departmentMap = {
  road_flood: { department: 'Public Works Department', priority: 'High', issue: 'Flooded Road / Waterlogged Street' },
  bike_accident: { department: 'Emergency Medical Services', priority: 'Critical', issue: 'Flood-Related Accident / Rescue Needed' },
  wire_cut: { department: 'Electricity Board + Fire Rescue', priority: 'Critical', issue: 'Live Wire in Flood Water' }
};

function nearestAreaFromCoordinates(lat, lng){
  let nearest = AREAS[0];
  let shortest = Number.POSITIVE_INFINITY;
  for(const area of AREAS){
    const dist = Math.hypot(area.lat - lat, area.lng - lng);
    if(dist < shortest){ shortest = dist; nearest = area; }
  }
  return nearest;
}

function getCurrentLocationContext(){
  return new Promise((resolve) => {
    if(!navigator || !navigator.geolocation){
      const fallback = AREAS.find(a => a.id === 'velachery') || AREAS[0];
      resolve({ lat: fallback.lat, lng: fallback.lng, area: fallback.name, source: 'fallback' });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const area = nearestAreaFromCoordinates(pos.coords.latitude, pos.coords.longitude);
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        area: area.name,
        source: 'gps'
      });
    }, () => {
      const fallback = AREAS.find(a => a.id === 'velachery') || AREAS[0];
      resolve({ lat: fallback.lat, lng: fallback.lng, area: fallback.name, source: 'fallback' });
    }, { timeout: 5000, enableHighAccuracy: false });
  });
}

function sendFloodReport(reportType, labelText){
  const dept = departmentMap[reportType];
  getCurrentLocationContext().then((location) => {
    const area = AREAS.find(a => a.name.toLowerCase() === location.area.toLowerCase()) || AREAS[0];
    const reportPayload = {
      report_type: reportType,
      description: `${labelText} near ${area.name} in Chennai`,
      area_id: area.id,
      latitude: Number(location.lat),
      longitude: Number(location.lng),
      priority: dept.priority
    };

    fetch('http://localhost:8000/api/flood-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || 'Could not save report');
      }
      const output = document.getElementById('report-output');
      output.innerHTML = `
        <strong>Emergency report accepted.</strong><br>
        <strong>Type:</strong> ${labelText}<br>
        <strong>Department:</strong> ${data.department}<br>
        <strong>Priority:</strong> ${data.priority}<br>
        <strong>Area:</strong> ${data.area_name}<br>
        <strong>Location:</strong> ${data.location.latitude}, ${data.location.longitude}<br>
        <strong>Status:</strong> ${data.status}<br>
        <strong>Dispatch:</strong> Report sent to ${data.department} with caller location shared.
      `;
      document.getElementById('report-chat-output').innerHTML = `Bot: Report recorded for ${data.department}. The incident has been saved to the FloodSafe database and routed with location data.`;
      console.log('Flood emergency report sent:', data);
    })
    .catch((error) => {
      document.getElementById('report-output').innerHTML = `<strong>Local fallback:</strong> ${labelText}<br><strong>Department:</strong> ${dept.department}<br><strong>Warning:</strong> ${error.message}. The report was generated locally but not stored because the backend is unavailable.`;
      document.getElementById('report-chat-output').innerHTML = `Bot: I could not reach the backend, so I kept the report locally. Please ensure the API is running on localhost:8000.`;
    });
  });
}

function getDepartmentFromText(text){
  const lowered = text.toLowerCase();
  if (lowered.includes('wire') || lowered.includes('electric') || lowered.includes('cable')) return 'wire_cut';
  if (lowered.includes('accident') || lowered.includes('bike') || lowered.includes('injury')) return 'bike_accident';
  return 'road_flood';
}

function handleReportChatMessage() {
  const input = document.getElementById('report-chat-input');
  const text = input.value.trim();
  if (!text) return;

  const output = document.getElementById('report-chat-output');
  const reportType = getDepartmentFromText(text);
  const label = {
    road_flood: 'Road is fully flooded',
    bike_accident: 'Bike accident due to flood',
    wire_cut: 'Power line / wire is in water'
  }[reportType];

  output.innerHTML = `User: ${text}<br>Bot: I am creating a ${label.toLowerCase()} report and routing it to the correct emergency team.`;
  input.value = '';
  sendFloodReport(reportType, label);
}

document.getElementById('report-chat-send').addEventListener('click', handleReportChatMessage);
document.getElementById('report-chat-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleReportChatMessage();
});

document.querySelectorAll('.report-option').forEach((button) => {
  button.addEventListener('click', () => sendFloodReport(button.dataset.report, button.dataset.label));
});

/* =========================================================================
   AI FLOOD ASSISTANT (rule-based fallback â€” always available, no LLM key needed)
   ========================================================================= */
const translations = {
  en: {
    brandTitle: 'FloodSafe Chennai',
    brandSubtitle: 'Predict. Navigate. Stay Safe.',
    systemActive: 'System Active',
    demoData: 'DEMO DATA',
    emergencyToggle: 'ðŸ†˜ Emergency Mode',
    overview: 'Overview',
    plan: 'Plan',
    emergency: 'Emergency',
    navDashboard: 'ðŸ“Š &nbsp;Dashboard',
    navRoute: 'ðŸ§­ &nbsp;Safe Route',
    navFacilities: 'ðŸ¥ &nbsp;Facilities',
    navEmergency: 'ðŸ†˜ &nbsp;Emergency Mode',
    navHelplines: 'ðŸ“ž &nbsp;Helplines',
    navUssd: 'ðŸ“± &nbsp;USSD Access',
    sidebarFoot: 'All flood, weather &amp; facility data shown is illustrative demo data for this prototype. No live API keys required â€” the app runs fully offline-safe.',
    dashboardTitle: 'Chennai Flood Overview',
    avgRainfallLabel: 'CITYWIDE AVG RAINFALL',
    avgRainfallSub: 'mm, last hour',
    floodRiskLabel: 'CITYWIDE FLOOD RISK',
    floodRiskSub: '/100 weighted score',
    highSevereLabel: 'HIGH / SEVERE ZONES',
    highSevereSub: 'of 15 tracked areas',
    safeRoutesLabel: 'SAFE ROUTES AVAILABLE',
    safeRoutesSub: 'to major hospitals',
    mapTitle: 'ðŸ—ºï¸ Chennai Flood Risk Map',
    mapSubtitle: '15 monitored areas',
    riskZones: 'Risk Zones',
    hospitalsFilter: 'ðŸ¥ Hospitals',
    ambulanceFilter: 'ðŸš‘ Ambulance',
    fireFilter: 'ðŸš’ Fire Stations',
    reliefFilter: 'ðŸ« Relief Centres',
    legendLow: 'Low',
    legendModerate: 'Moderate',
    legendHigh: 'High',
    legendSevere: 'Severe',
    areaDetailTitle: 'ðŸ“ Area Detail',
    areaDetailEmpty: 'Click any marker on the map to see its flood-risk breakdown.',
    forecastTitle: 'ðŸ“ˆ Next 3 Hours â€” Flood Risk',
    forecastDisclaimer: 'Predicted flood risk â€” not a guaranteed forecast. Select an area above to update.',
    safeRouteTitle: 'ðŸ§­ Flood-Aware Safe Route',
    safeRouteText: 'FloodSafe compares a synthetic demo route using flood-risk data. It is not turn-by-turn navigation; verify roads and follow official emergency instructions.',
    fromLabel: 'From',
    toLabel: 'To',
    findRoutes: 'Find Routes',
    routeMapTitle: 'ðŸ—ºï¸ Route on map',
    routeMapStatus: 'Choose locations to preview',
    aiSafeRoute: 'AI Safe Route',
    shortestRoute: 'Shortest Route',
    startPoint: 'Start',
    destinationPoint: 'Destination',
    facilitiesTitle: 'ðŸ¥ Nearby Emergency Facilities',
    facilitiesText: 'Hospitals, ambulance points, fire stations and relief centres across Chennai (demo dataset â€” structured so real open-data sources can replace it).',
    emergencyTitle: 'ðŸ†˜ Emergency Route Assistant',
    emergencyText: 'When activated, routing always prioritizes flood safety â†’ road accessibility â†’ facility proximity â†’ distance, in that order.',
    startingLocation: 'Starting location',
    destinationHospital: 'Destination / Hospital',
    getEmergencyRoute: 'Get Emergency Route',
    emergencyDisclaimer: 'Demo route geometry is illustrative, not turn-by-turn navigation. Follow official emergency instructions and road closures. In a real emergency, call 112 immediately.',
    helplinesTitle: 'ðŸ“ž Emergency Helplines',
    helplinesText: 'Tap a number to call directly on mobile devices.',
    ussdTitle: 'ðŸ“± Low-Connectivity / USSD Assistance',
    ussdText: 'A realistic simulation of emergency access over a basic feature phone when data connectivity is unavailable. This demo simulates the flow â€” no real telecom gateway is used.',
    ussdPrompt: 'Dial *123# to begin.',
    ussdPlaceholder: 'Type *123# then reply',
    sendButton: 'Send',
    quickCheckRisk: 'Check Flood Risk',
    quickSafeRoute: 'Find Safe Route',
    quickEmergencyHelp: 'Emergency Help',
    quickHospitals: 'Nearby Hospitals',
    quickSafetyTips: 'Flood Safety Tips',
    chatPlaceholder: 'Ask e.g. Is Velachery safe?',
    loginTitle: 'Sign in to FloodSafe',
    loginCopy: 'Choose the workspace you need for this session.',
    loginEmail: 'Work email or phone',
    loginPassword: 'Password',
    continueText: 'Continue to FloodSafe',
    loginNote: 'Prototype access: any valid-looking email and password are accepted. Responder workspaces contain demo operational data.'
  },
  ta: {
    brandTitle: 'à®ªà¯à®©à¯à®©à®¿à®¯à®•à¯ à®šà¯†à®©à¯à®©à¯ˆ',
    brandSubtitle: 'à®®à¯à®©à¯à®•à¯‚à®Ÿà¯à®Ÿà®¿à®¯à¯‡ à®¤à¯†à®°à®¿à®¨à¯à®¤à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®• à®ªà®¯à®£à®®à¯ à®šà¯†à®¯à¯à®•.',
    systemActive: 'à®šà®¿à®¸à¯à®Ÿà®®à¯ à®šà¯†à®¯à®²à¯à®ªà®¾à®Ÿà¯à®Ÿà®¿à®²à¯',
    demoData: 'à®Ÿà¯†à®®à¯‹ à®¤à®°à®µà¯',
    emergencyToggle: 'ðŸ†˜ à®…à®µà®šà®° à®ªà®¯à®©à¯à®®à¯à®±à¯ˆ',
    overview: 'à®•à®£à¯à®£à¯‹à®Ÿà¯à®Ÿà®®à¯',
    plan: 'à®¤à®¿à®Ÿà¯à®Ÿà®®à¯',
    emergency: 'à®…à®µà®šà®°à®®à¯',
    navDashboard: 'ðŸ“Š &nbsp;à®Ÿà®¾à®·à¯à®ªà¯‹à®°à¯à®Ÿà¯',
    navRoute: 'ðŸ§­ &nbsp;à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®ªà®¾à®¤à¯ˆ',
    navFacilities: 'ðŸ¥ &nbsp;à®®à¯ˆà®¯à®™à¯à®•à®³à¯',
    navEmergency: 'ðŸ†˜ &nbsp;à®…à®µà®šà®° à®ªà®¯à®©à¯à®®à¯à®±à¯ˆ',
    navHelplines: 'ðŸ“ž &nbsp;à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®Žà®£à¯à®•à®³à¯',
    navUssd: 'ðŸ“± &nbsp;USSD à®…à®£à¯à®•à®²à¯',
    sidebarFoot: 'à®•à®¾à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®®à¯ à®µà¯†à®³à¯à®³à®®à¯, à®µà®¾à®©à®¿à®²à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®µà®šà®¤à®¿ à®¤à®°à®µà¯à®•à®³à¯ à®…à®©à¯ˆà®¤à¯à®¤à¯à®®à¯ à®®à®¾à®¤à®¿à®°à®¿ à®Ÿà¯†à®®à¯‹ à®¤à®°à®µà¯. à®¨à¯‡à®°à®Ÿà®¿ API à®µà®¿à®šà¯ˆà®•à®³à¯ à®¤à¯‡à®µà¯ˆà®¯à®¿à®²à¯à®²à¯ˆ â€” à®ªà®¯à®©à¯à®ªà®¾à®Ÿà¯ à®®à¯à®´à¯à®µà®¤à¯à®®à¯ à®†à®ƒà®ªà¯à®²à¯ˆà®©à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®• à®‡à®¯à®™à¯à®•à¯à®•à®¿à®±à®¤à¯.',
    dashboardTitle: 'à®šà¯†à®©à¯à®©à¯ˆ à®µà¯†à®³à¯à®³ à®•à®£à¯à®£à¯‹à®Ÿà¯à®Ÿà®®à¯',
    avgRainfallLabel: 'à®®à¯Šà®¤à¯à®¤ à®šà®°à®¾à®šà®°à®¿ à®®à®´à¯ˆ',
    avgRainfallSub: 'à®®à®¿à®®à¯€, à®•à®Ÿà®¨à¯à®¤ à®®à®£à®¿à®¨à¯‡à®°à®®à¯',
    floodRiskLabel: 'à®®à¯Šà®¤à¯à®¤ à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯',
    floodRiskSub: '/100 à®Žà®Ÿà¯ˆà®ªà¯‹à®Ÿà®ªà¯à®ªà®Ÿà¯à®Ÿ à®®à®¤à®¿à®ªà¯à®ªà¯†à®£à¯',
    highSevereLabel: 'à®‰à®¯à®°à¯ / à®•à®Ÿà¯à®®à¯ˆà®¯à®¾à®© à®ªà®•à¯à®¤à®¿à®•à®³à¯',
    highSevereSub: '15 à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®ªà®•à¯à®¤à®¿à®•à®³à®¿à®²à¯',
    safeRoutesLabel: 'à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®ªà®¾à®¤à¯ˆà®•à®³à¯',
    safeRoutesSub: 'à®®à¯à®•à¯à®•à®¿à®¯ à®®à®°à¯à®¤à¯à®¤à¯à®µà®®à®©à¯ˆà®•à®³à¯à®•à¯à®•à¯',
    mapTitle: 'ðŸ—ºï¸ à®šà¯†à®©à¯à®©à¯ˆ à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯ à®µà®°à¯ˆà®ªà®Ÿà®®à¯',
    mapSubtitle: '15 à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®ªà®•à¯à®¤à®¿à®•à®³à¯',
    riskZones: 'à®†à®ªà®¤à¯à®¤à¯ à®®à®£à¯à®Ÿà®²à®™à¯à®•à®³à¯',
    hospitalsFilter: 'ðŸ¥ à®®à®°à¯à®¤à¯à®¤à¯à®µà®®à®©à¯ˆà®•à®³à¯',
    ambulanceFilter: 'ðŸš‘ à®†à®®à¯à®ªà¯à®²à®©à¯à®¸à¯',
    fireFilter: 'ðŸš’ à®¤à¯€à®¯à®£à¯ˆà®ªà¯à®ªà¯ à®¨à®¿à®²à¯ˆà®¯à®™à¯à®•à®³à¯',
    reliefFilter: 'ðŸ« à®¨à®¿à®µà®¾à®°à®£ à®®à¯ˆà®¯à®™à¯à®•à®³à¯',
    legendLow: 'à®•à¯à®±à¯ˆà®µà¯',
    legendModerate: 'à®®à®¿à®¤à®®à®¾à®©à®¤à¯',
    legendHigh: 'à®‰à®¯à®°à¯',
    legendSevere: 'à®•à®Ÿà¯à®®à¯ˆà®¯à®¾à®©',
    areaDetailTitle: 'ðŸ“ à®ªà®•à¯à®¤à®¿ à®µà®¿à®µà®°à®®à¯',
    areaDetailEmpty: 'à®µà®°à¯ˆà®ªà®Ÿà®¤à¯à®¤à®¿à®²à¯ à®Žà®¨à¯à®¤ à®®à®¾à®°à¯à®•à¯à®•à®°à¯à®®à¯ à®•à®¿à®³à®¿à®•à¯ à®šà¯†à®¯à¯à®¯à®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®…à®¤à®©à¯ à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯ à®ªà®•à¯à®ªà¯à®ªà®¾à®¯à¯à®µà¯ à®•à®¾à®£à¯à®ªÐ¸Ñ‚ÑÑ.',
    forecastTitle: 'ðŸ“ˆ à®…à®Ÿà¯à®¤à¯à®¤ 3 à®®à®£à®¿ à®¨à¯‡à®°à®®à¯ â€” à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯',
    forecastDisclaimer: 'à®®à¯à®©à¯à®•à®£à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯ â€” à®‰à®±à¯à®¤à®¿ à®šà¯†à®¯à¯à®¯à®ªà¯à®ªà®Ÿà¯à®Ÿ à®®à¯à®©à¯à®©à®±à®¿à®µà®¿à®ªà¯à®ªà¯ à®…à®²à¯à®². à®®à¯‡à®²à¯‡ à®’à®°à¯ à®ªà®•à¯à®¤à®¿à®¯à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯.',
    safeRouteTitle: 'ðŸ§­ à®µà¯†à®³à¯à®³-à®…à®±à®¿à®µà¯à®³à¯à®³ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®ªà®¾à®¤à¯ˆ',
    safeRouteText: 'FloodSafe à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯ à®¤à®°à®µà¯à®•à®³à®¿à®©à¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆà®¯à®¿à®²à¯ à®®à®¾à®¤à®¿à®°à®¿ à®ªà®¾à®¤à¯ˆà®¯à¯ˆ à®’à®ªà¯à®ªà®¿à®Ÿà¯à®•à®¿à®±à®¤à¯. à®‡à®¤à¯ à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà¯à®®à¯ à®ªà®¾à®¤à¯ˆ à®…à®²à¯à®²; à®šà®¾à®²à¯ˆà®•à®³à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®¤à¯à®¤à¯ à®…à®¤à®¿à®•à®¾à®°à®ªà¯à®ªà¯‚à®°à¯à®µ à®…à®µà®šà®° à®…à®±à®¿à®µà¯à®±à¯à®¤à¯à®¤à®²à¯à®•à®³à¯ˆ à®ªà®¿à®©à¯à®ªà®±à¯à®±à®µà¯à®®à¯.',
    fromLabel: 'à®®à¯à®¤à®²à¯',
    toLabel: 'à®•à¯à®•à¯',
    findRoutes: 'à®ªà®¾à®¤à¯ˆà®•à®³à¯ˆ à®•à®£à¯à®Ÿà®±à®¿',
    routeMapTitle: 'ðŸ—ºï¸ à®µà®°à¯ˆà®ªà®Ÿà®¤à¯à®¤à®¿à®²à¯ à®ªà®¾à®¤à¯ˆ',
    routeMapStatus: 'à®®à¯à®©à¯à®©à¯‹à®Ÿà¯à®Ÿà®¤à¯à®¤à®¿à®±à¯à®•à®¾à®• à®‡à®Ÿà®™à¯à®•à®³à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯',
    aiSafeRoute: 'AI à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®ªà®¾à®¤à¯ˆ',
    shortestRoute: 'à®•à¯à®±à¯à®•à®¿à®¯ à®ªà®¾à®¤à¯ˆ',
    startPoint: 'à®¤à¯Šà®Ÿà®•à¯à®•à®®à¯',
    destinationPoint: 'à®‡à®²à®•à¯à®•à¯',
    facilitiesTitle: 'ðŸ¥ à®…à®°à¯à®•à®¿à®²à¯à®³à¯à®³ à®…à®µà®šà®° à®µà®šà®¤à®¿à®•à®³à¯',
    facilitiesText: 'à®šà¯†à®©à¯à®©à¯ˆà®¯à®¿à®²à¯ à®®à®°à¯à®¤à¯à®¤à¯à®µà®®à®©à¯ˆà®•à®³à¯, à®†à®®à¯à®ªà¯à®²à®©à¯à®¸à¯ à®ªà¯à®³à¯à®³à®¿à®•à®³à¯, à®¤à¯€à®¯à®£à¯ˆà®ªà¯à®ªà¯ à®¨à®¿à®²à¯ˆà®¯à®™à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®µà®¾à®°à®£ à®®à¯ˆà®¯à®™à¯à®•à®³à¯ (à®Ÿà¯†à®®à¯‹ à®¤à®°à®µà¯).',
    emergencyTitle: 'ðŸ†˜ à®…à®µà®šà®° à®ªà®¾à®¤à¯ˆ à®‰à®¤à®µà®¿à®¯à®¾à®³à®°à¯',
    emergencyText: 'à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®¤à¯à®¤à®ªà¯à®ªà®Ÿà¯à®®à¯ à®ªà¯‹à®¤à¯, à®ªà®¾à®¤à¯ˆ à®Žà®ªà¯à®ªà¯‹à®¤à¯à®®à¯ à®µà¯†à®³à¯à®³ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ â†’ à®šà®¾à®²à¯ˆ à®…à®£à¯à®•à®²à¯ â†’ à®µà®šà®¤à®¿ à®…à®°à¯à®•à®¾à®®à¯ˆ â†’ à®¤à¯‚à®°à®®à¯ à®Žà®©à¯à®± à®µà®°à®¿à®šà¯ˆà®¯à®¿à®²à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®®à¯.',
    startingLocation: 'à®ªà¯à®±à®ªà¯à®ªà®Ÿà¯à®®à¯ à®‡à®Ÿà®®à¯',
    destinationHospital: 'à®‡à®²à®•à¯à®•à¯ / à®®à®°à¯à®¤à¯à®¤à¯à®µà®®à®©à¯ˆ',
    getEmergencyRoute: 'à®…à®µà®šà®° à®ªà®¾à®¤à¯ˆà®¯à¯ˆà®ªà¯ à®ªà¯†à®±à¯à®•',
    emergencyDisclaimer: 'à®Ÿà¯†à®®à¯‹ à®ªà®¾à®¤à¯ˆ à®œà®¿à®¯à¯‹à®®à¯†à®Ÿà¯à®°à®¿ à®®à®¾à®¤à®¿à®°à®¿à®¯à®¾à®•à¯à®®à¯; à®‡à®¤à¯ à®¤à¯à®²à¯à®²à®¿à®¯à®®à®¾à®© à®ªà®¯à®£ à®µà®´à®¿ à®…à®²à¯à®². à®…à®¤à®¿à®•à®¾à®°à®ªà¯à®ªà¯‚à®°à¯à®µ à®…à®µà®šà®° à®…à®±à®¿à®µà¯à®±à¯à®¤à¯à®¤à®²à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®šà®¾à®²à¯ˆ à®®à¯‚à®Ÿà®²à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®ªà®¿à®©à¯à®ªà®±à¯à®±à®µà¯à®®à¯. à®‰à®£à¯à®®à¯ˆà®¯à®¾à®© à®…à®µà®šà®°à®¤à¯à®¤à®¿à®©à¯ à®ªà¯‹à®¤à¯ 112 à® à®…à®´à¯ˆà®•à¯à®•à®µà¯à®®à¯.',
    helplinesTitle: 'ðŸ“ž à®…à®µà®šà®° à®‰à®¤à®µà®¿ à®Žà®£à¯à®•à®³à¯',
    helplinesText: 'à®®à¯Šà®ªà¯ˆà®²à¯ à®šà®¾à®¤à®©à®™à¯à®•à®³à®¿à®²à¯ à®¨à¯‡à®°à®Ÿà®¿à®¯à®¾à®• à®…à®´à¯ˆà®•à¯à®• à®Žà®£à¯à®•à®³à¯ˆ à®¤à¯Šà®Ÿà®µà¯à®®à¯.',
    ussdTitle: 'ðŸ“± à®•à¯à®±à¯ˆà®¨à¯à®¤ à®‡à®£à¯ˆà®ªà¯à®ªà¯ / USSD à®‰à®¤à®µà®¿',
    ussdText: 'à®¤à®°à®µà¯ à®‡à®£à¯ˆà®ªà¯à®ªà¯ à®‡à®²à¯à®²à®¾à®¤ à®ªà¯‹à®¤à¯ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿à®¯à®¿à®²à¯ à®…à®µà®šà®° à®…à®£à¯à®•à®²à¯à®•à¯à®•à®¾à®© à®¯à®¤à®¾à®°à¯à®¤à¯à®¤à®®à®¾à®© à®‰à®°à¯à®µà®•à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®¤à®²à¯.',
    ussdPrompt: '*123# à®Ÿà®¯à®²à¯ à®šà¯†à®¯à¯à®¤à¯ à®¤à¯Šà®Ÿà®™à¯à®•à®µà¯à®®à¯.',
    ussdPlaceholder: '*123# à®‰à®³à¯à®³à®¿à®Ÿà¯à®Ÿà¯ à®ªà®¤à®¿à®²à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯',
    sendButton: 'à®…à®©à¯à®ªà¯à®ªà¯',
    quickCheckRisk: 'à®µà¯†à®³à¯à®³ à®†à®ªà®¤à¯à®¤à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯',
    quickSafeRoute: 'à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®ªà®¾à®¤à¯ˆ à®¤à¯‡à®Ÿà¯',
    quickEmergencyHelp: 'à®…à®µà®šà®° à®‰à®¤à®µà®¿',
    quickHospitals: 'à®…à®°à¯à®•à®¿à®²à¯à®³à¯à®³ à®®à®°à¯à®¤à¯à®¤à¯à®µà®®à®©à¯ˆà®•à®³à¯',
    quickSafetyTips: 'à®µà¯†à®³à¯à®³ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯ à®•à¯à®±à®¿à®ªà¯à®ªà¯à®•à®³à¯',
    chatPlaceholder: 'à®Ž.g. à®µà¯‡à®³à®šà¯à®šà¯‡à®°à®¿ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®©à®¤à®¾?',
    loginTitle: 'FloodSafe-à®•à¯à®•à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆà®•',
    loginCopy: 'à®‡à®¨à¯à®¤ à®…à®®à®°à¯à®µà¯à®•à¯à®•à¯ à®¤à¯‡à®µà¯ˆà®¯à®¾à®© à®ªà®£à®¿à®¯à®¿à®Ÿà®¤à¯à®¤à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯.',
    loginEmail: 'à®µà¯‡à®²à¯ˆ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®²à¯à®²à®¤à¯ à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿',
    loginPassword: 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯',
    continueText: 'FloodSafe-à®•à¯à®•à¯ à®¤à¯Šà®Ÿà®°à¯à®•',
    loginNote: 'à®®à®¾à®¤à®¿à®°à®¿ à®…à®£à¯à®•à®²à¯: à®à®¤à¯‡à®©à¯à®®à¯ à®šà®°à®¿à®¯à®¾à®© à®µà®Ÿà®¿à®µ email à®…à®²à¯à®²à®¤à¯ password à®à®±à¯à®±à¯à®•à¯à®•à¯Šà®³à¯à®³à®ªà¯à®ªà®Ÿà¯à®®à¯. à®ªà®¤à®¿à®²à®³à®¿à®ªà¯à®ªà¯‹à®°à¯ à®ªà®£à®¿à®¯à®¿à®Ÿà®™à¯à®•à®³à¯ à®®à®¾à®¤à®¿à®°à®¿ à®šà¯†à®¯à®²à¯à®ªà®¾à®Ÿà¯à®Ÿà¯ à®¤à®°à®µà¯ˆà®•à¯ à®•à¯Šà®£à¯à®Ÿà®¿à®°à¯à®•à¯à®•à¯à®®à¯.'
  },
  ml: {
    brandTitle: 'à´«àµà´²à´¡àµà´¸àµ‡à´«àµ à´šàµ†à´¨àµà´¨àµˆ',
    brandSubtitle: 'à´®àµà´®àµà´ªàµ‡ à´•à´£à´•àµà´•à´¾à´•àµà´•à´¿, à´¸àµà´°à´•àµà´·à´¿à´¤à´®à´¾à´¯à´¿ à´ªàµ‹à´µàµà´•.',
    systemActive: 'à´¸à´¿à´¸àµà´±àµà´±à´‚ à¦¸à¦•àµà´°à´¿à´¯à´‚',
    demoData: 'à´¡àµ†à´®àµ‹ à´¡à´¾à´±àµà´±',
    emergencyToggle: 'ðŸ†˜ à®…à®µà´¸à´° à´®àµ‹à´¡àµ',
    overview: 'à´…à´µà´²àµ‹à´•à´¨à´‚',
    plan: 'à´ªàµà´²à´¾àµ»',
    emergency: 'à´…à´µà´¸à´°à´‚',
    navDashboard: 'ðŸ“Š &nbsp;à´¡à´¾à´·àµà´¬àµ‹àµ¼à´¡àµ',
    navRoute: 'ðŸ§­ &nbsp;à´¸àµà´°à´•àµà´·à´¿à´¤ à´µà´´à´¿',
    navFacilities: 'ðŸ¥ &nbsp;à´¸àµ—à´•à´°àµà´¯à´™àµà´™àµ¾',
    navEmergency: 'ðŸ†˜ &nbsp;à´…à´µà´¸à´° à´®àµ‹à´¡àµ',
    navHelplines: 'ðŸ“ž &nbsp;à´¹àµ†àµ½à´ªàµà´²àµˆà´¨àµà´•àµ¾',
    navUssd: 'ðŸ“± &nbsp;USSD à´†à´•àµà´¸à´¸àµ',
    sidebarFoot: 'à´•à´¾à´£à´¿à´•àµà´•àµà´¨àµà´¨ à´µàµ†à´³àµà´³à´•àµà´•àµ†à´Ÿàµà´Ÿàµ, à´•à´¾à´²à´¾à´µà´¸àµà´¥, à´¸àµ—à´•à´°àµà´¯ à´¡à´¾à´±àµà´±à´•àµ¾ à´Žà´²àµà´²à´¾à´‚ à´¡àµ†à´®àµ‹ à´®à´¾à´¤àµƒà´•à´¯à´¿àµ½ à´¨àµ½à´•à´¿à´¯à´µà´¯à´¾à´£àµ. à´¨àµ‡à´°à´¿à´Ÿàµà´Ÿàµà´³àµà´³ API à´•àµ€à´•àµ¾ à´µàµ‡à´£àµà´Ÿ; à´†à´ªàµà´ªàµ à´“à´«àµà´²àµˆà´¨à´¿à´²à´¾à´£àµ.',
    dashboardTitle: 'à´šàµ†à´¨àµà´¨àµˆ à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´µà´²àµ‹à´•à´¨à´‚',
    avgRainfallLabel: 'à´®àµŠà´¤àµà´¤à´‚ à´¶à´°à´¾à´¶à´°à´¿ à´®à´´',
    avgRainfallSub: 'à´®à´¿à´®àµ€, à´•à´´à´¿à´žàµà´ž à´®à´£à´¿à´•àµà´•àµ‚àµ¼',
    floodRiskLabel: 'à´®àµŠà´¤àµà´¤à´‚ à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿà´‚',
    floodRiskSub: '/100 à´­à´¾à´°à´‚ à´šàµ‡àµ¼à´¤àµà´¤ à´¸àµà´•àµ‹àµ¼',
    highSevereLabel: 'à´‰à´¯àµ¼à´¨àµà´¨ / à´—àµà´°àµà´¤à´° à´®àµ‡à´–à´²à´•àµ¾',
    highSevereSub: '15 à´¨à´¿à´°àµ€à´•àµà´·à´¿à´•àµà´•à´ªàµà´ªàµ†à´Ÿàµà´Ÿ à´ªàµà´°à´¦àµ‡à´¶à´™àµà´™à´³à´¿àµ½',
    safeRoutesLabel: 'à´¸àµà´°à´•àµà´·à´¿à´¤ à´µà´´à´¿à´•àµ¾ à´‰à´£àµà´Ÿàµ',
    safeRoutesSub: 'à´ªàµà´°à´§à´¾à´¨ à´†à´¶àµà´ªà´¤àµà´°à´¿à´•à´³à´¿à´²àµ‡à´•àµà´•àµ',
    mapTitle: 'ðŸ—ºï¸ à´šàµ†à´¨àµà´¨àµˆ à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿ à´­àµ‚à´ªà´Ÿà´‚',
    mapSubtitle: '15 à´¨à´¿à´°àµ€à´•àµà´·à´¿à´•àµà´•à´ªàµà´ªàµ†à´Ÿàµà´Ÿ à´ªàµà´°à´¦àµ‡à´¶à´™àµà´™àµ¾',
    riskZones: 'à´…à´ªà´•à´Ÿ à´®àµ‡à´–à´²à´•àµ¾',
    hospitalsFilter: 'ðŸ¥ à´†à´¶àµà´ªà´¤àµà´°à´¿à´•àµ¾',
    ambulanceFilter: 'ðŸš‘ à´†à´‚à´¬àµà´²àµ»à´¸àµ',
    fireFilter: 'ðŸš’ à´…à´—àµà´¨à´¿à´¶à´®à´¨ à´¸àµ‡à´¨',
    reliefFilter: 'ðŸ« à´°à´•àµà´·à´¾ à´•àµ‡à´¨àµà´¦àµà´°à´™àµà´™àµ¾',
    legendLow: 'à´•àµà´±à´µàµ',
    legendModerate: 'à´‡à´Ÿà´¤àµà´¤à´°à´‚',
    legendHigh: 'à´‰à´¯àµ¼à´¨àµà´¨',
    legendSevere: 'à´—àµà´°àµà´¤à´°à´®à´¾à´£àµ',
    areaDetailTitle: 'ðŸ“ à´ªàµà´°à´¦àµ‡à´¶ à´µà´¿à´¶à´¦à´¾à´‚à´¶à´™àµà´™àµ¾',
    areaDetailEmpty: 'à´­àµ‚à´ªà´Ÿà´¤àµà´¤à´¿àµ½ à´à´¤àµ†à´™àµà´•à´¿à´²àµà´‚ à´®à´¾àµ¼à´•àµà´•à´±à´¿àµ½ à´•àµà´²à´¿à´•àµà´•àµ à´šàµ†à´¯àµà´¯àµà´®àµà´ªàµ‹àµ¾ à´…à´¤à´¿à´¨àµà´±àµ† à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿ à´µà´¿à´¶à´•à´²à´¨à´‚ à´•à´¾à´£à´¾à´‚.',
    forecastTitle: 'ðŸ“ˆ à´…à´Ÿàµà´¤àµà´¤ 3 à´®à´£à´¿à´•àµà´•àµ‚àµ¼ â€” à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿà´‚',
    forecastDisclaimer: 'à´®àµà´¨àµ à´ªàµà´°à´µà´šà´¨à´‚ â€” à´‰à´±à´ªàµà´ªàµà´³àµà´³ à´ªàµà´°à´µà´šà´¨à´‚ à´…à´²àµà´². à´®àµà´•à´³à´¿àµ½ à´ªàµà´°à´¦àµ‡à´¶à´‚ à´¤à´¿à´°à´žàµà´žàµ†à´Ÿàµà´•àµà´•àµà´•.',
    safeRouteTitle: 'ðŸ§­ à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´•-à´…à´±à´¿à´µàµà´³àµà´³ à´¸àµà´°à´•àµà´·à´¿à´¤ à´µà´´à´¿à´¯',
    safeRouteText: 'FloodSafe à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿ à´¡à´¾à´±àµà´±à´¯àµ† à´…à´Ÿà´¿à´¸àµà´¥à´¾à´¨à´®à´¾à´•àµà´•à´¿ à´’à´°àµ à´¡àµ†à´®àµ‹ à´±àµ‹à´¡àµ comparaÃ§Ã£o à´šàµ†à´¯àµà´¯àµà´¨àµà´¨àµ. à´‡à´¤àµ à´Ÿàµ‡àµº-à´¬àµˆ-à´Ÿàµ‡àµº à´¨à´¾à´µà´¿à´—àµ‡à´·àµ» à´…à´²àµà´²; à´±àµ‹à´¡àµà´•àµ¾ à´ªà´°à´¿à´¶àµ‹à´§à´¿à´šàµà´šàµ à´”à´¦àµà´¯àµ‹à´—à´¿à´• à´®àµà´¨àµà´¨à´±à´¿à´¯à´¿à´ªàµà´ªàµà´•àµ¾ à´ªà´¾à´²à´¿à´•àµà´•àµà´•.',
    fromLabel: 'à´¤àµà´Ÿà´•àµà´•à´‚',
    toLabel: 'à´•àµ‚à´Ÿàµà´Ÿà´‚',
    findRoutes: 'à´µà´´à´¿à´•àµ¾ à´•à´£àµà´Ÿàµ†à´¤àµà´¤àµà´•',
    routeMapTitle: 'ðŸ—ºï¸ à´­àµ‚à´ªà´Ÿà´¤àµà´¤à´¿à´²àµ† à´µà´´à´¿',
    routeMapStatus: 'à´®àµàµ»à´•àµ‚àµ¼ à´•à´¾à´£à´¾àµ» à´¸àµà´¥à´²à´™àµà´™àµ¾ à´¤à´¿à´°à´žàµà´žàµ†à´Ÿàµà´•àµà´•àµà´•',
    aiSafeRoute: 'AI à´¸àµà´°à´•àµà´·à´¿à´¤ à´µà´´à´¿',
    shortestRoute: 'à´šàµ†à´±àµà´¤à´¾à´¯ à´µà´´à´¿à´¯',
    startPoint: 'à´†à´°à´‚à´­à´‚',
    destinationPoint: 'à´²à´•àµà´·àµà´¯à´‚',
    facilitiesTitle: 'ðŸ¥ à¤¨à¤¿à¤•à¤Ÿà¤¤à¤® à®…à®µà®šà®° à´¸àµ—à´•à´°àµà´¯à´™àµà´™àµ¾',
    facilitiesText: 'à´šàµ†à´¨àµà´¨àµˆà´¯à´¿àµ½ à´†à´¶àµà´ªà´¤àµà´°à´¿à´•àµ¾, à´†à´‚à´¬àµà´²àµ»à´¸àµ à´ªàµ‹à´¯à´¿àµ»àµà´±àµà´•àµ¾, à´…à´—àµà´¨à´¿à´¶à´®à´¨ à´¸àµ‡à´¨à´¾ à®¨à®¿à®²à¯ˆà®¯à´™àµà´™àµ¾, à´°à´•àµà´·à´¾ à´•àµ‡à´¨àµà´¦àµà´°à´™àµà´™àµ¾ (à´¡àµ†à´®àµ‹ à´¡à´¾à´±àµà´±).',
    emergencyTitle: 'ðŸ†˜ à®…à®µà´¸à´° à´±àµ‚à´Ÿàµà´Ÿàµ à´…à´¸à´¿à´¸àµà´±àµà´±à´¨àµà´±àµ',
    emergencyText: 'à´¸à´œàµ€à´µà´®à´¾à´•àµà´•àµà´®àµà´ªàµ‹àµ¾, à´±àµ‚à´Ÿàµà´Ÿà´¿à´‚à´—àµ à´Žà´ªàµà´ªàµ‹àµ¾ à´šàµ†à´¯àµà´¯à´¾à´¨àµà´‚ à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´¸àµà´°à´•àµà´· â†’ à´±àµ‹à´¡àµ à´ªàµà´°à´µàµ‡à´¶à´¨à´‚ â†’ à´¸àµ—à´•à´°àµà´¯ à´¸à´®àµ€à´ªà´¸àµà´¥à´¾à´¨à´‚ â†’ à´¦àµ‚à´°à´‚ à´Žà´¨àµà´¨ à´•àµà´°à´®à´¤àµà´¤à´¿àµ½ prioritized à´†à´£àµ.',
    startingLocation: 'à´ªàµà´±à´ªàµà´ªàµ†à´Ÿàµà´¨àµà´¨ à´¸àµà´¥à´²à´‚',
    destinationHospital: 'à´²à´•àµà´·àµà´¯à´‚ / à´†à´¶àµà´ªà´¤àµà´°à´¿',
    getEmergencyRoute: 'à´…à´µà´¸à´° à´µà´´à´¿à´¯ à´šàµ‡àµ¼à´•àµà´•àµà´•',
    emergencyDisclaimer: 'à´¡àµ†à´®àµ‹ à´±àµ‚à´Ÿàµà´Ÿà´¿à´‚à´—à´¿à´¨àµà´±àµ† à´œà´¿à´¯àµ‹à´®àµ†à´Ÿàµà´°à´¿ à´’à´°àµ à´®à´¾à´¤àµƒà´• à´®à´¾à´¤àµà´°à´®à´¾à´£àµ; à´Ÿàµ‡àµº-à´¬àµˆ-à´Ÿàµ‡àµº à´¨à´¾à´µà´¿à´—àµ‡à´·àµ» à´…à´²àµà´². à´”à´¦àµà´¯àµ‹à´—à´¿à´• à´¨à´¿àµ¼à´¦àµà´¦àµ‡à´¶à´™àµà´™àµ¾ à´ªà´¾à´²à´¿à´•àµà´•àµà´•. à´¯à´¥à´¾àµ¼à´¤àµà´¥ à´…à´µà´¸à´°à´¤àµà´¤à´¿àµ½ 112-à´¨àµ à´µà´¿à´³à´¿à´•àµà´•àµà´•.',
    helplinesTitle: 'ðŸ“ž à´…à´µà´¸à´° à´¹àµ†àµ½à´ªàµà´²àµˆà´¨àµà´•àµ¾',
    helplinesText: 'à´®àµŠà´¬àµˆàµ½ à´‰à´ªà´•à´°à´£à´™àµà´™à´³à´¿àµ½ à´¨àµ‡à´°à´¿à´Ÿàµà´Ÿàµ à´µà´¿à´³à´¿à´•àµà´•à´¾àµ» à´¨à´®àµà´ªà´±àµà´•àµ¾ à´Ÿà´¾à´ªàµà´ªàµà´šàµ†à´¯àµà´¯àµà´•.',
    ussdTitle: 'ðŸ“± à´•àµà´±à´žàµà´ž à´•à´£à´•àµà´±àµà´±à´¿à´µà´¿à´±àµà´±à´¿ / USSD à´¸à´¹à´¾à´¯à´‚',
    ussdText: 'à´¡à´¾à´±àµà´± à´•à´£à´•àµà´±àµà´±à´¿à´µà´¿à´±àµà´±à´¿ à´‡à´²àµà´²à´¾à´¤àµà´¤à´ªàµà´ªàµ‹àµ¾ à´«àµ€à´šàµà´šàµ¼ à´«àµ‹à´£à´¿àµ½ à´¸à´¿à´®àµà´²àµ‡à´±àµà´±àµ à´šàµ†à´¯àµà´¯àµà´¨àµà´¨ à´…à´µà´¸à´° à´†à´•àµà´¸à´¸àµ.',
    ussdPrompt: '*123# à´¡à´¯àµ½ à´šàµ†à´¯àµà´¯àµ‚.',
    ussdPlaceholder: '*123# à´Ÿàµˆà´ªàµà´ªàµ à´šàµ†à´¯àµà´¤àµ à´®à´±àµà´ªà´Ÿà´¿ à´¨àµ½à´•àµ‚',
    sendButton: 'à´…à´¯à´¯àµà´•àµà´•àµà´•',
    quickCheckRisk: 'à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´…à´ªà´•à´Ÿà´‚ à´ªà´°à´¿à´¶àµ‹à´§à´¿à´•àµà´•àµà´•',
    quickSafeRoute: 'à´¸àµà´°à´•àµà´·à´¿à´¤ à´µà´´à´¿à´¯ à´•à´£àµà´Ÿàµ†à´¤àµà´¤àµà´•',
    quickEmergencyHelp: 'à´…à´µà´¸à´° à´¸à´¹à´¾à´¯à´‚',
    quickHospitals: 'à´…à´Ÿàµà´¤àµà´¤àµà´³àµà´³ à´†à´¶àµà´ªà´¤àµà´°à´¿à´•àµ¾',
    quickSafetyTips: 'à´µàµ†à´³àµà´³à´ªàµà´ªàµŠà´•àµà´• à´¸àµà´°à´•àµà´·à´¾ à´¸àµ‚à´šà´•à´™àµà´™àµ¾',
    chatPlaceholder: 'à´‰à´¦à´¾: à´µàµ‡à´³à´šàµ‡à´°à´¿ à´¸àµà´°à´•àµà´·à´¿à´¤à´®à´¾à´£àµ‹?',
    loginTitle: 'FloodSafe-à´²àµ‡à´•àµà´•àµ à´¸àµˆàµ» à´‡àµ» à´šàµ†à´¯àµà´¯àµà´•',
    loginCopy: 'à´ˆ à´¸àµ†à´·à´¨à´¿à´¨àµà´³àµà´³ à´µàµ¼à´•àµà´•àµà´¸àµà´ªàµ‡à´¸àµ à´¤à´¿à´°à´žàµà´žàµ†à´Ÿàµà´•àµà´•àµà´•.',
    loginEmail: 'à´µàµ¼à´•àµà´•àµ à´‡à´®àµ†à´¯à´¿àµ½ à´…à´²àµà´²àµ†à´™àµà´•à´¿àµ½ à´«àµ‹àµº',
    loginPassword: 'à´ªà´¾à´¸àµà´µàµ‡à´¡àµ',
    continueText: 'FloodSafe-à´²àµ‡à´•àµà´•àµ à´¤àµà´Ÿà´°àµà´•',
    loginNote: 'à´¡àµ†à´®àµ‹ à´†à´•àµà´¸à´¸àµ: à´à´¤àµ†à´™àµà´•à´¿à´²àµà´‚ à´¶à´°à´¿à´¯à´¾à´¯ à´‡à´®àµ†à´¯à´¿àµ½/à´ªà´¾à´¸àµà´µàµ‡à´¡àµ à´¸àµà´µàµ€à´•à´°à´¿à´•àµà´•àµà´‚. à´±à´¸àµà´ªàµ‹à´£àµà´Ÿàµ¼ à´µàµ¼à´•àµà´•àµà´¸àµà´ªàµ‡à´¸àµà´•àµ¾à´•àµà´•àµ à´¡àµ†à´®àµ‹ à´“à´ªàµà´ªà´±àµ‡à´·àµ» à´¡à´¾à´±àµà´± à´‰à´£àµà´Ÿà´¾à´•àµà´‚.'
  },
  hi: {
    brandTitle: 'à¤«à¥à¤²à¤¡à¤¸à¥‡à¤« à¤šà¥‡à¤¨à¥à¤¨à¤ˆ',
    brandSubtitle: 'à¤ªà¤¹à¤²à¥‡ à¤œà¤¾à¤¨à¥‡à¤‚, à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¯à¤¾à¤¤à¥à¤°à¤¾ à¤•à¤°à¥‡à¤‚à¥¤',
    systemActive: 'à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤¸à¤•à¥à¤°à¤¿à¤¯',
    demoData: 'à¤¡à¥‡à¤®à¥‹ à¤¡à¥‡à¤Ÿà¤¾',
    emergencyToggle: 'ðŸ†˜ à¤†à¤ªà¤¾à¤¤ à¤®à¥‹à¤¡',
    overview: 'à¤…à¤µà¤²à¥‹à¤•à¤¨',
    plan: 'à¤¯à¥‹à¤œà¤¨à¤¾',
    emergency: 'à¤†à¤ªà¤¾à¤¤à¤•à¤¾à¤²',
    navDashboard: 'ðŸ“Š &nbsp;à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡',
    navRoute: 'ðŸ§­ &nbsp;à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤®à¤¾à¤°à¥à¤—',
    navFacilities: 'ðŸ¥ &nbsp;à¤¸à¥à¤µà¤¿à¤§à¤¾à¤à¤',
    navEmergency: 'ðŸ†˜ &nbsp;à¤†à¤ªà¤¾à¤¤ à¤®à¥‹à¤¡',
    navHelplines: 'ðŸ“ž &nbsp;à¤¹à¥‡à¤²à¥à¤ªà¤²à¤¾à¤‡à¤¨',
    navUssd: 'ðŸ“± &nbsp;USSD à¤à¤•à¥à¤¸à¥‡à¤¸',
    sidebarFoot: 'à¤¦à¤¿à¤–à¤¾à¤ à¤—à¤ à¤¬à¤¾à¤¢à¤¼, à¤®à¥Œà¤¸à¤® à¤”à¤° à¤¸à¥à¤µà¤¿à¤§à¤¾ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¤­à¥€ à¤¡à¥‡à¤®à¥‹ à¤¡à¥‡à¤Ÿà¤¾ à¤¹à¥ˆà¤‚à¥¤ à¤•à¥‹à¤ˆ à¤²à¤¾à¤‡à¤µ API key à¤†à¤µà¤¶à¥à¤¯à¤• à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ â€” à¤à¤ª à¤ªà¥‚à¤°à¥€ à¤¤à¤°à¤¹ à¤‘à¤«à¤²à¤¾à¤‡à¤¨ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¹à¥ˆà¥¤',
    dashboardTitle: 'à¤šà¥‡à¤¨à¥à¤¨à¤ˆ à¤¬à¤¾à¤¢à¤¼ à¤…à¤µà¤²à¥‹à¤•à¤¨',
    avgRainfallLabel: 'à¤¸à¤­à¥€ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥‹à¤‚ à¤•à¥€ à¤”à¤¸à¤¤ à¤µà¤°à¥à¤·à¤¾',
    avgRainfallSub: 'à¤®à¤¿à¤®à¥€, à¤ªà¤¿à¤›à¤²à¥‡ à¤˜à¤‚à¤Ÿà¥‡',
    floodRiskLabel: 'à¤¸à¤­à¥€ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥‹à¤‚ à¤•à¥€ à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤®',
    floodRiskSub: '/100 à¤­à¤¾à¤°à¤¿à¤¤ à¤¸à¥à¤•à¥‹à¤°',
    highSevereLabel: 'à¤‰à¤šà¥à¤š / à¤—à¤‚à¤­à¥€à¤° à¤•à¥à¤·à¥‡à¤¤à¥à¤°',
    highSevereSub: '15 à¤Ÿà¥à¤°à¥ˆà¤• à¤•à¤¿à¤ à¤—à¤ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥‹à¤‚ à¤®à¥‡à¤‚',
    safeRoutesLabel: 'à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤®à¤¾à¤°à¥à¤— à¤‰à¤ªà¤²à¤¬à¥à¤§',
    safeRoutesSub: 'à¤®à¥à¤–à¥à¤¯ à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤',
    mapTitle: 'ðŸ—ºï¸ à¤šà¥‡à¤¨à¥à¤¨à¤ˆ à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤® à¤¨à¤•à¥à¤¶à¤¾',
    mapSubtitle: '15 à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤•à¥à¤·à¥‡à¤¤à¥à¤°',
    riskZones: 'à¤œà¥‹à¤–à¤¿à¤® à¤•à¥à¤·à¥‡à¤¤à¥à¤°',
    hospitalsFilter: 'ðŸ¥ à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²',
    ambulanceFilter: 'ðŸš‘ à¤à¤®à¥à¤¬à¥à¤²à¥‡à¤‚à¤¸',
    fireFilter: 'ðŸš’ à¤…à¤—à¥à¤¨à¤¿à¤¶à¤®à¤¨',
    reliefFilter: 'ðŸ« à¤°à¤¾à¤¹à¤¤ à¤•à¥‡à¤‚à¤¦à¥à¤°',
    legendLow: 'à¤•à¤®',
    legendModerate: 'à¤®à¤§à¥à¤¯à¤®',
    legendHigh: 'à¤‰à¤šà¥à¤š',
    legendSevere: 'à¤—à¤‚à¤­à¥€à¤°',
    areaDetailTitle: 'ðŸ“ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤µà¤¿à¤µà¤°à¤£',
    areaDetailEmpty: 'à¤¨à¤•à¥à¤¶à¥‡ à¤ªà¤° à¤•à¤¿à¤¸à¥€ à¤®à¤¾à¤°à¥à¤•à¤° à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚, à¤¤à¥‹ à¤‰à¤¸à¤•à¤¾ à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤® à¤µà¤¿à¤µà¤°à¤£ à¤¦à¤¿à¤–à¥‡à¤—à¤¾à¥¤',
    forecastTitle: 'ðŸ“ˆ à¤…à¤—à¤²à¥‡ 3 à¤˜à¤‚à¤Ÿà¥‡ â€” à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤®',
    forecastDisclaimer: 'à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤® â€” à¤¨à¤¿à¤¶à¥à¤šà¤¿à¤¤ à¤ªà¥‚à¤°à¥à¤µà¤¾à¤¨à¥à¤®à¤¾à¤¨ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤ à¤Šà¤ªà¤° à¤¸à¥‡ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤šà¥à¤¨à¥‡à¤‚à¥¤',
    safeRouteTitle: 'ðŸ§­ à¤¬à¤¾à¤¢à¤¼-à¤šà¥‡à¤¤à¤¨ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤®à¤¾à¤°à¥à¤—',
    safeRouteText: 'FloodSafe à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤® à¤¡à¥‡à¤Ÿà¤¾ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤¸à¤¿à¤‚à¤¥à¥‡à¤Ÿà¤¿à¤• à¤¡à¥‡à¤®à¥‹ à¤°à¥‹à¤¡ à¤•à¥€ à¤¤à¥à¤²à¤¨à¤¾ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤¯à¤¹ à¤Ÿà¤°à¥à¤¨-à¤¬à¤¾à¤¯-à¤Ÿà¤°à¥à¤¨ à¤¨à¥‡à¤µà¤¿à¤—à¥‡à¤¶à¤¨ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ; à¤¸à¤¡à¤¼à¤•à¥‡à¤‚ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤†à¤ªà¤¾à¤¤ à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶à¥‹à¤‚ à¤•à¤¾ à¤ªà¤¾à¤²à¤¨ à¤•à¤°à¥‡à¤‚à¥¤',
    fromLabel: 'à¤¸à¥‡',
    toLabel: 'à¤¤à¤•',
    findRoutes: 'à¤®à¤¾à¤°à¥à¤— à¤–à¥‹à¤œà¥‡à¤‚',
    routeMapTitle: 'ðŸ—ºï¸ à¤¨à¤•à¥à¤¶à¥‡ à¤ªà¤° à¤®à¤¾à¤°à¥à¤—',
    routeMapStatus: 'à¤ªà¥‚à¤°à¥à¤µà¤¾à¤µà¤²à¥‹à¤•à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¥à¤¥à¤¾à¤¨ à¤šà¥à¤¨à¥‡à¤‚',
    aiSafeRoute: 'AI à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤®à¤¾à¤°à¥à¤—',
    shortestRoute: 'à¤¸à¤¬à¤¸à¥‡ à¤›à¥‹à¤Ÿà¤¾ à¤®à¤¾à¤°à¥à¤—',
    startPoint: 'à¤¶à¥à¤°à¥‚',
    destinationPoint: 'à¤—à¤‚à¤¤à¤µà¥à¤¯',
    facilitiesTitle: 'ðŸ¥ à¤†à¤¸-à¤ªà¤¾à¤¸ à¤•à¥€ à¤†à¤ªà¤¾à¤¤ à¤¸à¥à¤µà¤¿à¤§à¤¾à¤à¤',
    facilitiesText: 'à¤šà¥‡à¤¨à¥à¤¨à¤ˆ à¤®à¥‡à¤‚ à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤², à¤à¤®à¥à¤¬à¥à¤²à¥‡à¤‚à¤¸ à¤ªà¥‰à¤‡à¤‚à¤Ÿ, à¤…à¤—à¥à¤¨à¤¿à¤¶à¤®à¤¨ à¤¸à¥à¤Ÿà¥‡à¤¶à¤¨ à¤”à¤° à¤°à¤¾à¤¹à¤¤ à¤•à¥‡à¤‚à¤¦à¥à¤° (à¤¡à¥‡à¤®à¥‹ à¤¡à¥‡à¤Ÿà¤¾).',
    emergencyTitle: 'ðŸ†˜ à¤†à¤ªà¤¾à¤¤ à¤®à¤¾à¤°à¥à¤— à¤¸à¤¹à¤¾à¤¯à¤•',
    emergencyText: 'à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥‹à¤¨à¥‡ à¤ªà¤° à¤®à¤¾à¤°à¥à¤— à¤¹à¤®à¥‡à¤¶à¤¾ à¤‡à¤¸ à¤•à¥à¤°à¤® à¤®à¥‡à¤‚ à¤šà¥à¤¨à¤¾ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆ: à¤¬à¤¾à¤¢à¤¼ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ â†’ à¤¸à¤¡à¤¼à¤• à¤ªà¤¹à¥à¤‚à¤š â†’ à¤¸à¥à¤µà¤¿à¤§à¤¾ à¤¨à¤¿à¤•à¤Ÿà¤¤à¤¾ â†’ à¤¦à¥‚à¤°à¥€à¥¤',
    startingLocation: 'à¤ªà¥à¤°à¤¸à¥à¤¥à¤¾à¤¨ à¤¸à¥à¤¥à¤¾à¤¨',
    destinationHospital: 'à¤—à¤‚à¤¤à¤µà¥à¤¯ / à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²',
    getEmergencyRoute: 'à¤†à¤ªà¤¾à¤¤ à¤®à¤¾à¤°à¥à¤— à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¤°à¥‡à¤‚',
    emergencyDisclaimer: 'à¤¡à¥‡à¤®à¥‹ à¤®à¤¾à¤°à¥à¤— à¤œà¥à¤¯à¤¾à¤®à¤¿à¤¤à¤¿ à¤•à¥‡à¤µà¤² à¤‰à¤¦à¤¾à¤¹à¤°à¤£ à¤¹à¥ˆ; à¤¯à¤¹ à¤Ÿà¤°à¥à¤¨-à¤¬à¤¾à¤¯-à¤Ÿà¤°à¥à¤¨ à¤¨à¥‡à¤µà¤¿à¤—à¥‡à¤¶à¤¨ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤†à¤ªà¤¾à¤¤ à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶à¥‹à¤‚ à¤”à¤° à¤¸à¤¡à¤¼à¤• à¤¬à¤‚à¤¦à¥‹à¤‚ à¤•à¤¾ à¤ªà¤¾à¤²à¤¨ à¤•à¤°à¥‡à¤‚à¥¤ à¤µà¤¾à¤¸à¥à¤¤à¤µà¤¿à¤• à¤†à¤ªà¤¾à¤¤ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤®à¥‡à¤‚ 112 à¤ªà¤° à¤•à¥‰à¤² à¤•à¤°à¥‡à¤‚à¥¤',
    helplinesTitle: 'ðŸ“ž à¤†à¤ªà¤¾à¤¤à¤•à¤¾à¤²à¥€à¤¨ à¤¹à¥‡à¤²à¥à¤ªà¤²à¤¾à¤‡à¤¨',
    helplinesText: 'à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤ªà¤° à¤¸à¥€à¤§à¥‡ à¤•à¥‰à¤² à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¨à¤‚à¤¬à¤° à¤ªà¤° à¤Ÿà¥ˆà¤ª à¤•à¤°à¥‡à¤‚à¥¤',
    ussdTitle: 'ðŸ“± à¤•à¤®-à¤•à¤¨à¥‡à¤•à¥à¤Ÿà¤¿à¤µà¤¿à¤Ÿà¥€ / USSD à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾',
    ussdText: 'à¤œà¤¬ à¤¡à¥‡à¤Ÿà¤¾ à¤•à¤¨à¥‡à¤•à¥à¤Ÿà¤¿à¤µà¤¿à¤Ÿà¥€ à¤¨ à¤¹à¥‹, à¤¤à¥‹ à¤¬à¥‡à¤¸à¤¿à¤• à¤«à¥€à¤šà¤° à¤«à¥‹à¤¨ à¤ªà¤° à¤†à¤ªà¤¾à¤¤ à¤à¤•à¥à¤¸à¥‡à¤¸ à¤•à¤¾ à¤¯à¤¥à¤¾à¤°à¥à¤¥à¤µà¤¾à¤¦à¥€ à¤…à¤¨à¥à¤•à¤°à¤£à¥¤',
    ussdPrompt: '*123# à¤¡à¤¾à¤¯à¤² à¤•à¤°à¤•à¥‡ à¤¶à¥à¤°à¥‚ à¤•à¤°à¥‡à¤‚à¥¤',
    ussdPlaceholder: '*123# à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤‚',
    sendButton: 'à¤­à¥‡à¤œà¥‡à¤‚',
    quickCheckRisk: 'à¤¬à¤¾à¤¢à¤¼ à¤œà¥‹à¤–à¤¿à¤® à¤œà¤¾à¤à¤šà¥‡à¤‚',
    quickSafeRoute: 'à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤®à¤¾à¤°à¥à¤— à¤–à¥‹à¤œà¥‡à¤‚',
    quickEmergencyHelp: 'à¤†à¤ªà¤¾à¤¤ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾',
    quickHospitals: 'à¤¨à¤œà¤¼à¤¦à¥€à¤•à¥€ à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²',
    quickSafetyTips: 'à¤¬à¤¾à¤¢à¤¼ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤¸à¥à¤à¤¾à¤µ',
    chatPlaceholder: 'à¤‰à¤¦à¤¾. à¤µà¥‡à¤²à¤¾à¤šà¥‡à¤°à¤¿ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¹à¥ˆ?',
    loginTitle: 'FloodSafe à¤®à¥‡à¤‚ à¤¸à¤¾à¤‡à¤¨ à¤‡à¤¨ à¤•à¤°à¥‡à¤‚',
    loginCopy: 'à¤‡à¤¸ à¤¸à¤¤à¥à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤µà¤°à¥à¤•à¤¸à¥à¤ªà¥‡à¤¸ à¤šà¥à¤¨à¥‡à¤‚à¥¤',
    loginEmail: 'à¤•à¤¾à¤°à¥à¤¯ à¤ˆà¤®à¥‡à¤² à¤¯à¤¾ à¤«à¥‹à¤¨',
    loginPassword: 'à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡',
    continueText: 'FloodSafe à¤®à¥‡à¤‚ à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤‚',
    loginNote: 'à¤¡à¥‡à¤®à¥‹ à¤à¤•à¥à¤¸à¥‡à¤¸: à¤•à¥‹à¤ˆ à¤­à¥€ à¤¸à¤¹à¥€ à¤¸à¥à¤µà¤°à¥‚à¤ª à¤ˆà¤®à¥‡à¤² à¤¯à¤¾ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¸à¥à¤µà¥€à¤•à¤¾à¤° à¤•à¤¿à¤¯à¤¾ à¤œà¤¾à¤à¤—à¤¾à¥¤ à¤°à¤¿à¤¸à¥à¤ªà¥‰à¤‚à¤¸à¤° à¤µà¤°à¥à¤•à¤¸à¥à¤ªà¥‡à¤¸ à¤®à¥‡à¤‚ à¤¡à¥‡à¤®à¥‹ à¤‘à¤ªà¤°à¥‡à¤¶à¤¨ à¤¡à¥‡à¤Ÿà¤¾ à¤¹à¥‹à¤—à¤¾à¥¤'
  },
  te: {
    brandTitle: 'à°«à±à°²à°¡à±â€Œà°¸à±‡à°«à± à°šà±†à°¨à±à°¨à±ˆ',
    brandSubtitle: 'à°®à±à°‚à°¦à±‡ à°¤à±†à°²à±à°¸à±à°•à±Šà°¨à°¿,.Safe à°…à°¯à°¿à°¨ à°®à°¾à°°à±à°—à°‚à°²à±‹ à°ªà±à°°à°¯à°¾à°£à°¿à°‚à°šà°‚à°¡à°¿.',
    systemActive: 'à°¸à°¿à°¸à±à°Ÿà°‚ à°¸à°•à±à°°à°¿à°¯à°‚à°—à°¾ à°‰à°‚à°¦à°¿',
    demoData: 'à°¡à±†à°®à±‹ à°¡à±‡à°Ÿà°¾',
    emergencyToggle: 'ðŸ†˜ à°…à°¤à±à°¯à°µà°¸à°° à°®à±‹à°¡à±',
    overview: 'à°…à°µà°²à±‹à°•à°¨à°‚',
    plan: 'à°ªà±à°°à°£à°¾à°³à°¿à°•',
    emergency: 'à°…à°¤à±à°¯à°µà°¸à°°',
    navDashboard: 'ðŸ“Š &nbsp;à°¡à°¾à°·à±â€Œà°¬à±‹à°°à±à°¡à±',
    navRoute: 'ðŸ§­ &nbsp;à°¸à±à°°à°•à±à°·à°¿à°¤ à°®à°¾à°°à±à°—à°‚',
    navFacilities: 'ðŸ¥ &nbsp;à°¸à±Œà°•à°°à±à°¯à°¾à°²à±',
    navEmergency: 'ðŸ†˜ &nbsp;à°…à°¤à±à°¯à°µà°¸à°° à°®à±‹à°¡à±',
    navHelplines: 'ðŸ“ž &nbsp;à°¹à±†à°²à±à°ªà±â€Œà°²à±ˆà°¨à±â€Œà°²à±',
    navUssd: 'ðŸ“± &nbsp;USSD à°¯à°¾à°•à±à°¸à±†à°¸à±',
    sidebarFoot: 'à°šà±‚à°ªà°¿à°‚à°šà±‡ à°µà°°à°¦à°²à±, à°µà°¾à°¤à°¾à°µà°°à°£à°‚ à°®à°°à°¿à°¯à± à°¸à±Œà°•à°°à±à°¯ à°¡à±‡à°Ÿà°¾ à°…à°¨à±à°¨à±€ à°¡à±†à°®à±‹ à°¡à±‡à°Ÿà°¾ à°®à°¾à°¤à±à°°à°®à±‡. à°ªà±à°°à°¤à±à°¯à°•à±à°· API à°•à±€à°²à± à°…à°µà°¸à°°à°‚ à°²à±‡à°¦à±; à°†à°ªà± à°ªà±‚à°°à±à°¤à°¿à°—à°¾ à°†à°«à±â€Œà°²à±ˆà°¨à±â€Œà°²à±‹ à°ªà°¨à°¿à°šà±‡à°¸à±à°¤à±à°‚à°¦à°¿.',
    dashboardTitle: 'à°šà±†à°¨à±à°¨à±ˆ à°µà°°à°¦ à°…à°µà°²à±‹à°•à°¨à°‚',
    avgRainfallLabel: 'à°®à±Šà°¤à±à°¤à°‚ à°¸à°°à°¾à°¸à°°à°¿ à°µà°°à±à°·à°‚',
    avgRainfallSub: 'mm, à°—à°¤ à°—à°‚à°Ÿ',
    floodRiskLabel: 'à°®à±Šà°¤à±à°¤à°‚ à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦à°‚',
    floodRiskSub: '/100 à°¬à°°à±à°µà± à°—à°² à°¸à±à°•à±‹à°°à±',
    highSevereLabel: 'à°‰à°¨à±à°¨à°¤ / à°¤à±€à°µà±à°°à°®à±ˆà°¨ à°œà±‹à°¨à±à°²à±',
    highSevereSub: '15 à°…à°¨à±à°¸à°°à°¿à°‚à°šà°¬à°¡à±à°¤à±à°¨à±à°¨ à°ªà±à°°à°¾à°‚à°¤à°¾à°²à°²à°²à±‹',
    safeRoutesLabel: 'à°¸à±à°°à°•à±à°·à°¿à°¤ à°®à°¾à°°à±à°—à°¾à°²à± à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹',
    safeRoutesSub: 'à°ªà±à°°à°§à°¾à°¨ à°†à°¸à±à°ªà°¤à±à°°à±à°²à°•à±',
    mapTitle: 'ðŸ—ºï¸ à°šà±†à°¨à±à°¨à±ˆ à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦ à°ªà°Ÿà°‚',
    mapSubtitle: '15 à°ªà°°à±à°¯à°µà±‡à°•à±à°·à°¿à°‚à°šà°¬à°¡à±à°¤à±à°¨à±à°¨ à°ªà±à°°à°¾à°‚à°¤à°¾à°²à±',
    riskZones: 'à°ªà±à°°à°®à°¾à°¦ à°œà±‹à°¨à±à°²à±',
    hospitalsFilter: 'ðŸ¥ à°†à°¸à±à°ªà°¤à±à°°à±à°²à±',
    ambulanceFilter: 'ðŸš‘ à°…à°‚à°¬à±à°²à±†à°¨à±à°¸à±',
    fireFilter: 'ðŸš’ à°…à°—à±à°¨à°¿à°®à°¾à°ªà°• à°•à±‡à°‚à°¦à±à°°à°¾à°²à±',
    reliefFilter: 'ðŸ« à°¸à°¹à°¾à°¯ à°•à±‡à°‚à°¦à±à°°à°¾à°²à±',
    legendLow: 'à°¤à°•à±à°•à±à°µ',
    legendModerate: 'à°®à°§à±à°¯à°¸à±à°¥à°¾à°¯à°¿',
    legendHigh: 'à°‰à°¨à±à°¨à°¤à°‚',
    legendSevere: 'à°¤à±€à°µà±à°°à°®à±ˆà°¨',
    areaDetailTitle: 'ðŸ“ à°ªà±à°°à°¾à°‚à°¤ à°µà°¿à°µà°°à°¾à°²à±',
    areaDetailEmpty: 'à°ªà°Ÿà°‚à°²à±‹à°¨à°¿ à°Žà°²à°¾à°‚à°Ÿà°¿ à°®à°¾à°°à±à°•à°°à±â€Œà°ªà±ˆ à°•à±à°²à°¿à°•à± à°šà±‡à°¸à±à°¤à±‡ à°† à°ªà±à°°à°¾à°‚à°¤à°‚ à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦à°‚ à°µà°¿à°µà°°à°¾à°²à± à°•à°¨à°¬à°¡à°¤à°¾à°¯à°¿.',
    forecastTitle: 'ðŸ“ˆ à°¤à°°à±à°µà°¾à°¤ 3 à°—à°‚à°Ÿà°²à± â€” à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦à°‚',
    forecastDisclaimer: 'à°…à°‚à°šà°¨à°¾ à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦à°‚ â€” à°–à°šà±à°šà°¿à°¤à°®à±ˆà°¨ à°…à°‚à°šà°¨à°¾ à°•à°¾à°¦à±. à°ªà±ˆà°¨ à°ªà±à°°à°¾à°‚à°¤à°¾à°¨à±à°¨à°¿ à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿.',
    safeRouteTitle: 'ðŸ§­ à°µà°°à°¦-à°®à°¤à°¿à°¨ à°¸à±à°°à°•à±à°·à°¿à°¤ à°®à°¾à°°à±à°—à°‚',
    safeRouteText: 'FloodSafe à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦ à°¡à±‡à°Ÿà°¾ à°†à°§à°¾à°°à°‚à°—à°¾ à°¸à°¿à°‚à°¥à°Ÿà°¿à°•à± à°¡à±†à°®à±‹ à°®à°¾à°°à±à°—à°¾à°¨à±à°¨à°¿ à°¸à°°à°¿à°ªà±‹à°²à±à°¸à±à°¤à±à°‚à°¦à°¿. à°‡à°¦à°¿ à°Ÿà°°à±à°¨à±-à°¬à±ˆ-à°Ÿà°°à±à°¨à± à°¨à°¾à°µà°¿à°—à±‡à°·à°¨à± à°•à°¾à°¦à±; à°°à±‹à°¡à±à°²à°¨à± à°ªà°°à°¿à°¶à±€à°²à°¿à°‚à°šà°¿ à°…à°§à°¿à°•à°¾à°°à°¿à°• à°…à°¤à±à°¯à°µà°¸à°° à°¸à±‚à°šà°¨à°²à°¨à± à°ªà°¾à°Ÿà°¿à°‚à°šà°‚à°¡à°¿.',
    fromLabel: 'à°¨à±à°‚à°¡à°¿',
    toLabel: 'à°•à±',
    findRoutes: 'à°®à°¾à°°à±à°—à°¾à°²à°¨à± à°•à°¨à±à°—à±Šà°¨à°‚à°¡à°¿',
    routeMapTitle: 'ðŸ—ºï¸ à°ªà°Ÿà°‚à°²à±‹ à°®à°¾à°°à±à°—à°‚',
    routeMapStatus: 'à°ªà±à°°à±€à°µà±à°¯à±‚à°¤à±‹à°¸à°‚ à°¸à±à°¥à°²à°¾à°²à°¨à± à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿',
    aiSafeRoute: 'AI à°¸à±à°°à°•à±à°·à°¿à°¤ à°®à°¾à°°à±à°—à°‚',
    shortestRoute: 'à°šà°¿à°¨à±à°¨ à°®à°¾à°°à±à°—à°‚',
    startPoint: 'à°ªà±à°°à°¾à°°à°‚à°­à°‚',
    destinationPoint: 'à°—à°®à±à°¯à°‚',
    facilitiesTitle: 'ðŸ¥ à°¸à°®à±€à°ª à°…à°¤à±à°¯à°µà°¸à°° à°¸à±Œà°•à°°à±à°¯à°¾à°²à±',
    facilitiesText: 'à°šà±†à°¨à±à°¨à±ˆà°²à±‹ à°†à°¸à±à°ªà°¤à±à°°à±à°²à±, à°…à°‚à°¬à±à°²à±†à°¨à±à°¸à± à°ªà°¾à°¯à°¿à°‚à°Ÿà±à°²à±, à°…à°—à±à°¨à°¿à°®à°¾à°ªà°• à°•à±‡à°‚à°¦à±à°°à°¾à°²à± à°®à°°à°¿à°¯à± à°¸à°¹à°¾à°¯ à°•à±‡à°‚à°¦à±à°°à°¾à°²à± (à°¡à±†à°®à±‹ à°¡à±‡à°Ÿà°¾).',
    emergencyTitle: 'ðŸ†˜ à°…à°¤à±à°¯à°µà°¸à°° à°®à°¾à°°à±à°— à°¸à°¹à°¾à°¯à°•à°‚',
    emergencyText: 'à°¯à°¾à°•à±à°Ÿà°¿à°µà±‡à°Ÿà± à°šà±‡à°¯à°¬à°¡à°¿à°¨à°ªà±à°ªà±à°¡à±, à°®à°¾à°°à±à°—à°‚ à°Žà°²à±à°²à°ªà±à°ªà±à°¡à±‚ à°µà°°à°¦ à°­à°¦à±à°°à°¤ â†’ à°°à±‹à°¡à± à°¯à°¾à°•à±à°¸à±†à°¸à± â†’ à°¸à±Œà°•à°°à±à°¯ à°¸à°®à±€à°ªà°‚ â†’ à°¦à±‚à°°à°‚ à°•à±à°°à°®à°‚à°²à±‹ à°Žà°‚à°šà±à°•à±‹à°¬à°¡à±à°¤à±à°‚à°¦à°¿.',
    startingLocation: 'à°ªà±à°°à°¾à°°à°‚à°­ à°¸à±à°¥à°²à°‚',
    destinationHospital: 'à°—à°®à±à°¯à°‚ / à°†à°¸à±à°ªà°¤à±à°°à°¿',
    getEmergencyRoute: 'à°…à°¤à±à°¯à°µà°¸à°° à°®à°¾à°°à±à°—à°¾à°¨à±à°¨à°¿ à°ªà±Šà°‚à°¦à°‚à°¡à°¿',
    emergencyDisclaimer: 'à°¡à±†à°®à±‹ à°®à°¾à°°à±à°—à°‚ à°œà°¿à°¯à±‹à°®à±€à°Ÿà±à°°à±€ à°‰à°¦à°¾à°¹à°°à°£ à°®à°¾à°¤à±à°°à°®à±‡; à°‡à°¦à°¿ à°Ÿà°°à±à°¨à±-à°¬à±ˆ-à°Ÿà°°à±à°¨à± à°¨à°¾à°µà°¿à°—à±‡à°·à°¨à± à°•à°¾à°¦à±. à°…à°§à°¿à°•à°¾à°°à°¿à°• à°…à°¤à±à°¯à°µà°¸à°° à°¸à±‚à°šà°¨à°²à°¨à± à°®à°°à°¿à°¯à± à°°à±‹à°¡à±à°¡à± à°¬à°‚à°¦à±€à°²à°¨à± à°ªà°¾à°Ÿà°¿à°‚à°šà°‚à°¡à°¿. à°¨à°¿à°œà°®à±ˆà°¨ à°…à°¤à±à°¯à°µà°¸à°°à°‚à°²à±‹ 112à°•à± à°•à°¾à°²à± à°šà±‡à°¯à°‚à°¡à°¿.',
    helplinesTitle: 'ðŸ“ž à°…à°¤à±à°¯à°µà°¸à°° à°¹à±†à°²à±à°ªà±â€Œà°²à±ˆà°¨à±â€Œà°²à±',
    helplinesText: 'à°®à±Šà°¬à±ˆà°²à± à°ªà°°à°¿à°•à°°à°‚à°²à±‹ à°¨à±‡à°°à±à°—à°¾ à°•à°¾à°²à± à°šà±‡à°¯à°¡à°¾à°¨à°¿à°•à°¿ à°¨à°‚à°¬à°°à±â€Œà°ªà±ˆ à°Ÿà±à°¯à°¾à°ªà± à°šà±‡à°¯à°‚à°¡à°¿.',
    ussdTitle: 'ðŸ“± à°¤à°•à±à°•à±à°µ à°•à°¨à±†à°•à±à°Ÿà°¿à°µà°¿à°Ÿà±€ / USSD à°¸à°¹à°¾à°¯à°‚',
    ussdText: 'à°¡à±‡à°Ÿà°¾ à°•à°¨à±†à°•à±à°Ÿà°¿à°µà°¿à°Ÿà±€ à°²à±‡à°•à±à°‚à°¡à°¾ à°ªà±à°°à°¾à°¥à°®à°¿à°• à°«à±€à°šà°°à±â€Œ à°«à±‹à°¨à±â€Œà°²à±‹ à°…à°¤à±à°¯à°µà°¸à°° à°¯à°¾à°•à±à°¸à±†à°¸à± à°•à±‹à°¸à°‚ à°µà°¾à°¸à±à°¤à°µà°¿à°• à°¸à°¿à°®à±à°¯à±à°²à±‡à°·à°¨à±.',
    ussdPrompt: '*123# à°¡à°¯à°²à± à°šà±‡à°¸à°¿ à°ªà±à°°à°¾à°°à°‚à°­à°¿à°‚à°šà°‚à°¡à°¿.',
    ussdPlaceholder: '*123# à°Ÿà±†à±–à°ªà± à°šà±‡à°¸à°¿ à°¸à±à°ªà°‚à°¦à°¿à°‚à°šà°‚à°¡à°¿',
    sendButton: 'à°ªà°‚à°ªà±',
    quickCheckRisk: 'à°µà°°à°¦ à°ªà±à°°à°®à°¾à°¦à°¾à°¨à±à°¨à°¿ à°ªà°°à±€à°•à±à°·à°¿à°‚à°šà°‚à°¡à°¿',
    quickSafeRoute: 'à°¸à±à°°à°•à±à°·à°¿à°¤ à°®à°¾à°°à±à°—à°¾à°¨à±à°¨à°¿ à°•à°¨à±à°—à±Šà°¨à°‚à°¡à°¿',
    quickEmergencyHelp: 'à°…à°¤à±à°¯à°µà°¸à°° à°¸à°¹à°¾à°¯à°‚',
    quickHospitals: 'à°¸à°®à±€à°ª à°†à°¸à±à°ªà°¤à±à°°à±à°²à±',
    quickSafetyTips: 'à°µà°°à°¦ à°­à°¦à±à°°à°¤ à°¸à±‚à°šà°¨à°²à±',
    chatPlaceholder: 'à°‰à°¦à°¾. à°µà°¾à°²à°¾à°šà±‡à°°à°¿ à°¸à±à°°à°•à±à°·à°¿à°¤à°®à±‡à°¨à°¾?',
    loginTitle: 'FloodSafeà°²à±‹ à°¸à±ˆà°¨à± à°‡à°¨à± à°šà±‡à°¯à°‚à°¡à°¿',
    loginCopy: 'à°ˆ à°¸à±†à°·à°¨à± à°•à±‹à°¸à°‚ à°µà°°à±à°•à±â€Œà°¸à±à°ªà±‡à°¸à±â€Œà°¨à± à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿.',
    loginEmail: 'à°•à°¾à°°à±à°¯ à°‡à°®à±†à°¯à°¿à°²à± à°²à±‡à°¦à°¾ à°«à±‹à°¨à±',
    loginPassword: 'à°ªà°¾à°¸à±à°µà°°à±à°¡à±',
    continueText: 'FloodSafeà°•à± à°•à±Šà°¨à°¸à°¾à°—à°‚à°¡à°¿',
    loginNote: 'à°¡à±†à°®à±‹ à°¯à°¾à°•à±à°¸à±†à°¸à±: à°à°¦à±ˆà°¨à°¾ à°¸à°°à±ˆà°¨ à°ªà°¦à±à°§à°¤à°¿ à°‡à°®à±†à°¯à°¿à°²à± à°²à±‡à°¦à°¾ à°ªà°¾à°¸à±à°µà°°à±à°¡à±â€Œà°¨à± à°¸à±à°µà±€à°•à°°à°¿à°‚à°šà°¬à°¡à±à°¤à±à°‚à°¦à°¿. à°°à±†à°¸à±à°ªà°¾à°¨à±à°¡à°°à± à°µà°°à±à°•à±â€Œà°¸à±à°ªà±‡à°¸à±â€Œà°²à±‹ à°¡à±†à°®à±‹ à°†à°ªà°°à±‡à°·à°¨à± à°¡à±‡à°Ÿà°¾ à°‰à°‚à°Ÿà±à°‚à°¦à°¿.'
  }
};

const langButton = document.getElementById('lang-button');
const langMenu = document.getElementById('lang-menu');
const langOptions = document.querySelectorAll('.lang-option');
let currentLanguage = 'en';

function applyTranslations(lang){
  currentLanguage = lang;
  const dict = translations[lang] || translations.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = dict[key];
    if (value) el.innerHTML = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const value = dict[key];
    if (value) el.placeholder = value;
  });
  const currentLabel = langButton.textContent.trim();
  langButton.textContent = 'ðŸŒ ' + (lang === 'ta' ? 'à®¤à®®à®¿à®´à¯' : lang === 'ml' ? 'à´®à´²à´¯à´¾à´³à´‚' : lang === 'hi' ? 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' : lang === 'te' ? 'à°¤à±†à°²à±à°—à±' : 'EN');
  langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === lang));
  langMenu.classList.add('hidden');
  langButton.setAttribute('aria-expanded', 'false');
  document.documentElement.lang = lang;
}

langButton.addEventListener('click', ()=>{
  const hidden = langMenu.classList.toggle('hidden');
  langButton.setAttribute('aria-expanded', String(!hidden));
});

langOptions.forEach(option => {
  option.addEventListener('click', () => applyTranslations(option.dataset.lang));
});

const chatFab = document.getElementById('chat-fab');
const chatPanel = document.getElementById('chat-panel');
const chatBody = document.getElementById('chat-body');
chatFab.addEventListener('click', ()=>{
  chatPanel.classList.toggle('hidden');
  if(chatBody.children.length===0){ addMsg('bot', "Hi, I'm the FloodSafe AI Assistant. Ask me things like \"Is Velachery safe?\" or tap a quick action below."); }
});
document.getElementById('chat-close').addEventListener('click', ()=>chatPanel.classList.add('hidden'));

function addMsg(role, text){
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function findAreaInText(text){
  const t = text.toLowerCase();
  return AREAS.find(a => t.includes(a.name.toLowerCase()) || t.includes(a.id.replace('_',' ')));
}

function reportIntentFromText(text){
  const t = text.toLowerCase();
  if(t.includes('wire') || t.includes('electric') || t.includes('current') || t.includes('power line')) return 'wire_cut';
  if(t.includes('accident') || t.includes('bike') || t.includes('injury') || t.includes('crash')) return 'bike_accident';
  if(t.includes('flooded road') || t.includes('road is full') || t.includes('water on road') || t.includes('waterlogged')) return 'road_flood';
  return null;
}

function submitAssistantReport(reportType, message){
  const area = findAreaInText(message) || AREAS.find(a => a.id === 'velachery') || AREAS[0];
  const department = departmentMap[reportType];
  const locationPromise = getCurrentLocationContext();
  return locationPromise.then(location => fetch(`${API_BASE}/api/flood-reports`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      report_type: reportType,
      description: message,
      area_id: area.id,
      latitude: Number(location.lat),
      longitude: Number(location.lng),
      priority: department.priority
    })
  })).then(async response => {
    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.detail || 'The report could not be stored');
    return `Emergency report #${data.id} is recorded and routed to ${data.department}. Status: ${data.status}. Location shared for ${data.area_name}.`;
  });
}

function assistantReply(text){
  const t = text.toLowerCase();
  const mentionedArea = findAreaInText(text);
  const reportType = reportIntentFromText(text);

  if(reportType){
    const reportLabels = {
      road_flood: 'flooded road',
      bike_accident: 'flood-related accident',
      wire_cut: 'live wire or electrical hazard'
    };
    submitAssistantReport(reportType, text)
      .then(reply => addMsg('bot', reply))
      .catch(() => addMsg('bot', 'I could not reach the FloodSafe server, so this report was not stored. Please call 112 for immediate danger or start the backend on localhost:8000.'));
    return `I identified this as a ${reportLabels[reportType]} report. I am checking your location and sending it to the responsible emergency department now.`;
  }

  if(mentionedArea && (t.includes('safe') || t.includes('risk') || t.includes('flood'))){
    return `${mentionedArea.name} currently has a ${mentionedArea.level.toLowerCase()} flood-risk score (${mentionedArea.score}/100). ${recommendedAction(mentionedArea.level)}`;
  }
  if(t.includes('emergency') || t.includes('help') && !t.includes('hospital')){
    return "For immediate danger, call 112 (National Emergency), 108 (Ambulance) or 101 (Fire). You can also open Emergency Mode in the sidebar for a prioritized safe route.";
  }
  if(t.includes('hospital')){
    return `Nearby hospitals include ${HOSPITALS[0].name} and ${HOSPITALS[1].name}. Open Facilities in the sidebar for the full list, or Safe Route to get directions.`;
  }
  if(t.includes('route')){
    return "Please open Safe Route and enter your starting location and destination. I'll compare the shortest route against an AI-recommended safer route using flood-risk data.";
  }
  if(t.includes('tip') || t.includes('safety')){
    return "Quick tips: avoid walking or driving through moving water, keep your phone charged, move valuables to higher ground, and follow official alerts closely during heavy rain.";
  }
  if(mentionedArea){
    return `${mentionedArea.name}: risk score ${mentionedArea.score}/100 (${mentionedArea.level}). Rainfall ${mentionedArea.rainfall_mm}mm, waterlogging ${mentionedArea.waterlogging_risk}/100.`;
  }
  return "I can help with flood risk by area, safe routes, nearby hospitals, emergency help, or safety tips â€” try asking about a specific area like \"Is Adyar safe?\", or tap a quick action below.";
}

function sendChat(text){
  if(!text || !text.trim()) return;
  addMsg('user', text);
  setTimeout(()=> addMsg('bot', assistantReply(text)), 300);
}
document.getElementById('chat-send').addEventListener('click', ()=>{
  const input = document.getElementById('chat-input');
  sendChat(input.value); input.value='';
});
document.getElementById('chat-input').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ const input=e.target; sendChat(input.value); input.value=''; }
});
document.querySelectorAll('.qchip').forEach(chip=>{
  chip.addEventListener('click', ()=> sendChat(chip.dataset.q));
});

/* =========================================================================
   ROLE-BASED ACCESS
   ========================================================================= */
let selectedRole = 'resident';
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app');
const responderApp = document.getElementById('responder-app');
const API_BASE = localStorage.getItem('floodsafe_api_base') || 'http://localhost:8000';
document.querySelectorAll('.role-option').forEach(option=>{
  option.addEventListener('click', ()=>{
    selectedRole = option.dataset.role;
    document.querySelectorAll('.role-option').forEach(item=>item.classList.toggle('selected', item===option));
  });
});

function renderResponderMap(role){
  const isFire = role === 'fire';
  const queueAreas = isFire ? ['Pallikaranai','Tambaram','Velachery'] : ['Velachery','Pallikaranai','Guindy'];
  const facilities = isFire ? FIRE.concat(RELIEF.slice(0,2)) : HOSPITALS.slice(0,3).concat(AMBULANCE.slice(0,2));
  const startArea = AREAS.find(area=>area.name===queueAreas[0]);
  const destination = isFire ? FIRE[0] : HOSPITALS[0];
  const start = {lat:startArea.lat,lng:startArea.lng};
  const destinationPoint = {lat:destination.lat,lng:destination.lng};
  const toCoordinate = point => ol.proj.fromLonLat([point.lng, point.lat]);
  const safeRoute = routePoints(start, destinationPoint, true).map(point=>ol.proj.fromLonLat([point[1],point[0]]));
  const shortestRoute = routePoints(start, destinationPoint, false).map(point=>ol.proj.fromLonLat([point[1],point[0]]));
  const routeFeatures = [
    new ol.Feature({geometry:new ol.geom.LineString(shortestRoute), kind:'shortest'}),
    new ol.Feature({geometry:new ol.geom.LineString(safeRoute), kind:'safe'}),
    new ol.Feature({geometry:new ol.geom.Point(toCoordinate(start)), kind:'start'}),
    new ol.Feature({geometry:new ol.geom.Point(toCoordinate(destinationPoint)), kind:'destination'})
  ];
  facilities.forEach(item=>routeFeatures.push(new ol.Feature({geometry:new ol.geom.Point(toCoordinate(item)), kind:'facility'})));
  queueAreas.forEach(areaName=>{
    const area = AREAS.find(item=>item.name===areaName);
    if(area) routeFeatures.push(new ol.Feature({geometry:new ol.geom.Point(toCoordinate(area)), kind:'rescue'}));
  });
  const vectorSource = new ol.source.Vector({features:routeFeatures});
  const vectorLayer = new ol.layer.Vector({source:vectorSource, style:feature=>{
    const kind = feature.get('kind');
    if(kind==='safe') return new ol.style.Style({stroke:new ol.style.Stroke({color:'#57A6B8',width:5})});
    if(kind==='shortest') return new ol.style.Style({stroke:new ol.style.Stroke({color:'#E15C50',width:3,lineDash:[10,8]})});
    const colors = {start:'#3C7A8C',destination:'#B4553F',facility:'#4FAE7B',rescue:'#E4C247'};
    return new ol.style.Style({image:new ol.style.Circle({radius:kind==='rescue'?7:6,fill:new ol.style.Fill({color:colors[kind] || '#57A6B8'}),stroke:new ol.style.Stroke({color:'#fff',width:2})})});
  }});
  if(responderMap){ responderMap.setTarget(null); }
  responderMap = new ol.Map({target:'responder-map',layers:[new ol.layer.Tile({source:new ol.source.OSM()}),vectorLayer],view:new ol.View({center:ol.proj.fromLonLat([80.21,13.02]),zoom:11})});
  responderMap.getView().fit(vectorSource.getExtent(), {padding:[24,24,24,24], maxZoom:13, duration:250});
  document.getElementById('responder-map-status').textContent = `${isFire ? 'Rescue' : 'Medical'} route Â· OpenStreetMap`;
}

function renderResponderWorkspace(role){
  const isFire = role === 'fire';
  const queue = isFire ? [
    {title:'Rescue support requested', detail:'Pallikaranai Â· 3 people reported near submerged lane', priority:'CRITICAL', area:'Pallikaranai'},
    {title:'Road access check', detail:'Tambaram Â· waterlogged stretch near GST Road', priority:'HIGH', area:'Tambaram'},
    {title:'Evacuation support', detail:'Velachery Â· community relief centre needs field check', priority:'HIGH', area:'Velachery'}
  ] : [
    {title:'Medical evacuation request', detail:'Velachery Â· patient awaiting transfer to Government General Hospital', priority:'CRITICAL', area:'Velachery'},
    {title:'Assisted pickup', detail:'Pallikaranai Â· family of four at a waterlogged junction', priority:'HIGH', area:'Pallikaranai'},
    {title:'Standby coverage', detail:'Guindy Â· ambulance point available for next dispatch', priority:'MEDIUM', area:'Guindy'}
  ];
  const locations = isFire ? FIRE.map(item=>({name:item.name, detail:item.addr, icon:'ðŸš’'})).concat(RELIEF.slice(0,2).map(item=>({name:item.name, detail:'Relief centre Â· '+item.addr, icon:'ðŸ«'}))) : HOSPITALS.slice(0,3).map(item=>({name:item.name, detail:'Receiving facility Â· '+item.addr, icon:'ðŸ¥'})).concat(AMBULANCE.slice(0,2).map(item=>({name:item.name, detail:'Staging point Â· '+item.addr, icon:'ðŸš‘'})));
  document.getElementById('responder-title').textContent = isFire ? 'Fire & rescue operations' : 'Ambulance dispatch view';
  document.getElementById('responder-subtitle').textContent = isFire ? 'Rescue requests, fire stations and relief centres ordered for field response.' : 'Medical rescue requests, hospitals and staging points ordered for field response.';
  document.getElementById('responder-role').textContent = isFire ? 'FIRE & RESCUE UNIT' : 'AMBULANCE UNIT';
  document.getElementById('responder-stats').innerHTML = `
    <div class="responder-stat"><b>${queue.length}</b><span>Open assignments</span></div>
    <div class="responder-stat"><b>${AREAS.filter(area=>area.level==='SEVERE').length}</b><span>Severe risk zones</span></div>
    <div class="responder-stat"><b>${locations.length}</b><span>Safety locations</span></div>`;
  document.getElementById('rescue-queue').innerHTML = queue.map((item,index)=>`
    <div class="ops-row"><div><h4>${index+1}. ${item.title}</h4><p>${item.detail}</p><span class="location-chip">ðŸ“ ${item.area}</span></div><div class="ops-meta"><div class="priority">${item.priority}</div><span class="risk-badge ${riskClass(AREAS.find(area=>area.name===item.area)?.level || 'HIGH')}" style="margin-top:6px">${AREAS.find(area=>area.name===item.area)?.level || 'HIGH'}</span></div></div>`).join('');
  document.getElementById('safety-locations').innerHTML = locations.map(item=>`<div class="ops-row"><div><h4>${item.icon} ${item.name}</h4><p>${item.detail}</p></div><span class="location-chip">OPEN</span></div>`).join('');
}

async function authenticateWithApi(email, password){
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 600);
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, password}), signal:controller.signal
  });
  clearTimeout(timeout);
  if(!response.ok){ throw new Error('Invalid email or password'); }
  return response.json();
}

function openWorkspace(role){
  if(role === 'resident'){
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    setTimeout(()=>map.invalidateSize(), 50);
    return;
  }
  renderResponderWorkspace(role);
  authScreen.classList.add('hidden');
  responderApp.classList.remove('hidden');
  setTimeout(()=>renderResponderMap(role), 60);
}

document.getElementById('login-form').addEventListener('submit', async event=>{
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try{
    const session = await authenticateWithApi(email, password);
    localStorage.setItem('floodsafe_access_token', session.access_token);
    const returnedRole = session.user.role === 'fire_rescue' ? 'fire' : session.user.role === 'ambulance' ? 'ambulance' : 'resident';
    openWorkspace(returnedRole);
  } catch(error){
    if(location.protocol !== 'file:'){
      window.alert(error.message || 'Unable to sign in.');
      return;
    }
    openWorkspace(selectedRole);
  }
});
document.getElementById('responder-logout').addEventListener('click', ()=>{
  responderApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  localStorage.removeItem('floodsafe_access_token');
});

