/**
 * Bangkok Trip Planner 2026 - Main Application Controller
 * Connects all UI events, manages reactive rendering, and syncs data modules.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize state
  const state = await DataManager.init();

  // App Elements Cache
  const els = {
    // Top Nav
    savePlanBtn: document.getElementById('savePlanBtn'),
    resetPlanBtn: document.getElementById('resetPlanBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    importJsonInput: document.getElementById('importJsonInput'),
    importJsonBtn: document.getElementById('importJsonBtn'),
    printPlanBtn: document.getElementById('printPlanBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Hero / Dashboard
    heroActiveHotel: document.getElementById('heroActiveHotel'),
    heroGrandTotal: document.getElementById('heroGrandTotal'),
    heroPerPaxTotal: document.getElementById('heroPerPaxTotal'),
    heroPerDayTotal: document.getElementById('heroPerDayTotal'),
    bestValueHotelName: document.getElementById('bestValueHotelName'),
    bestConvenienceHotelName: document.getElementById('bestConvenienceHotelName'),

    // Hotel Cards Container
    hotelCardsContainer: document.getElementById('hotelCardsContainer'),

    // Daily Planner
    dayTabsContainer: document.getElementById('dayTabsContainer'),
    timelineContainer: document.getElementById('timelineContainer'),
    day4StrategyWrapper: document.getElementById('day4StrategyWrapper'),
    planAButton: document.getElementById('planAButton'),
    planBButton: document.getElementById('planBButton'),
    planCButton: document.getElementById('planCButton'),
    examInputsWrapper: document.getElementById('examInputsWrapper'),
    examStartTimeInput: document.getElementById('examStartTimeInput'),
    examEndTimeInput: document.getElementById('examEndTimeInput'),
    examBufferInput: document.getElementById('examBufferInput'),
    continuousStatusBadge: document.getElementById('continuousStatusBadge'),

    // Map Controls
    mapFilterPills: document.querySelectorAll('.map-filter-pill-btn'),

    // Nearby Places
    nearbySearchInput: document.getElementById('nearbySearchInput'),
    nearbyCategoryPills: document.querySelectorAll('#nearbyCategoryFilters .filter-pill'),
    nearbyDistanceFilter: document.getElementById('nearbyDistanceFilter'),
    nearbyCardsGrid: document.getElementById('nearbyCardsGrid'),

    // Budget Calculator
    budgetHotelLeeInput: document.getElementById('budgetHotelLeeInput'),
    budgetHotelRatchadaInput: document.getElementById('budgetHotelRatchadaInput'),
    budgetHotelKasetInput: document.getElementById('budgetHotelKasetInput'),
    budgetNightsInput: document.getElementById('budgetNightsInput'),
    budgetPaxInput: document.getElementById('budgetPaxInput'),
    budgetFoodDailyInput: document.getElementById('budgetFoodDailyInput'),
    budgetFoodDailyVal: document.getElementById('budgetFoodDailyVal'),
    budgetMealSplitPreview: document.getElementById('budgetMealSplitPreview'),
    budgetLaundryCyclesInput: document.getElementById('budgetLaundryCyclesInput'),
    budgetLaundryCostInput: document.getElementById('budgetLaundryCostInput'),
    budgetGrabFareInput: document.getElementById('budgetGrabFareInput'),
    tuktukToggleCheckbox: document.getElementById('tuktukToggleCheckbox'),
    copyBudgetSummaryBtn: document.getElementById('copyBudgetSummaryBtn'),
    budgetComparisonRows: document.getElementById('budgetComparisonRows'),

    // Scoring
    scoringCriteriaList: document.getElementById('scoringCriteriaList'),
    scoreWinnerBadge: document.getElementById('scoreWinnerBadge'),

    // Sources Table
    sourcesTableBody: document.getElementById('sourcesTableBody'),

    // Toast
    toastNotice: document.getElementById('toastNotice'),
    toastText: document.getElementById('toastText')
  };

  let currentActiveDay = 2; // Default to Day 2 (Exam day) for immediate review
  let activeNearbyCategory = 'all';

  // ------------------------------------------------------------------------
  // Initialize Map
  // ------------------------------------------------------------------------
  MapController.initMap('leafletMap');

  // ------------------------------------------------------------------------
  // Toast Helper
  // ------------------------------------------------------------------------
  function showToast(message) {
    if (!els.toastNotice || !els.toastText) return;
    els.toastText.textContent = message;
    els.toastNotice.classList.add('show');
    setTimeout(() => {
      els.toastNotice.classList.remove('show');
    }, 3200);
  }

  // ------------------------------------------------------------------------
  // 1. Render Hotel Cards
  // ------------------------------------------------------------------------
  function renderHotelCards() {
    if (!els.hotelCardsContainer) return;
    const comparison = BudgetCalculator.compareAllHotels(state);
    const scores = ScoreCalculator.calculateScores(state);

    els.hotelCardsContainer.innerHTML = '';

    (state.hotels || []).forEach(hotel => {
      const budget = comparison.hotels.find(h => h.hotelId === hotel.id) || {};
      const scoreObj = scores.finalScores[hotel.id] || { score: 7.5 };
      const isSelected = hotel.id === state.selectedHotelId;
      const isBestValue = hotel.id === comparison.lowestCostId;

      const card = document.createElement('div');
      card.className = `glass-card hotel-card ${isSelected ? 'selected' : ''}`;
      card.id = `card-${hotel.id}`;

      card.innerHTML = `
        <div class="hotel-card-header">
          <div>
            <div class="hotel-name">${hotel.name}</div>
            <div class="hotel-name-th">${hotel.nameTh}</div>
          </div>
          <div class="hotel-score-badge">
            <span class="hotel-score-label">คะแนนรวม</span>
            <span>${scoreObj.score}</span>
          </div>
        </div>

        <div class="hotel-price-box">
          <div>
            <div class="price-period">งบห้องรวม ${budget.nights} คืน</div>
            <div class="price-main">฿${Math.round(budget.roomCost).toLocaleString()}</div>
          </div>
          <div class="price-sub">
            <div>เฉลี่ย ฿${Math.round(budget.roomPerNight).toLocaleString()} / คืน</div>
            <div style="color:var(--text-dim); font-size:0.75rem;">งบรวมทั้งทริป: <strong style="color:var(--text-main);">฿${Math.round(budget.grandTotal).toLocaleString()}</strong></div>
          </div>
        </div>

        <div class="hotel-specs-list">
          <div class="spec-row">
            <span class="spec-icon">🚇</span>
            <div class="spec-content">
              <strong>สถานีใกล้สุด:</strong> <span>${hotel.nearestStation.name}</span>
              <div style="font-size:0.78rem; color:var(--text-dim);">ระยะเดิน ${hotel.nearestStation.distanceMeters} ม. (~${hotel.nearestStation.walkMinutes} นาที)</div>
            </div>
          </div>
          <div class="spec-row">
            <span class="spec-icon">🎓</span>
            <div class="spec-content">
              <strong>ไป ม.รามคำแหง:</strong> <span>~${hotel.transitToRamkhamhaeng.distanceKm} กม. (${hotel.transitToRamkhamhaeng.avgTravelTimeMinutes} นาที)</span>
            </div>
          </div>
          <div class="spec-row">
            <span class="spec-icon">🛺</span>
            <div class="spec-content">
              <strong>บริการรถรับส่ง:</strong> 
              <span>${hotel.tukTukService?.hasService ? 'มีรถตุ๊กตุ๊ก (สมมติฐานฟรีขากลับจาก MRT)' : 'ไม่มี (เดินหรือใช้รถสาธารณะ)'}</span>
            </div>
          </div>
        </div>

        <div class="hotel-pros-cons">
          <div style="font-weight:700; margin-bottom:4px; font-size:0.8rem; color:var(--emerald);">จุดเด่น:</div>
          <ul class="pros-list">
            ${hotel.pros.slice(0, 2).map(p => `<li>${p}</li>`).join('')}
          </ul>
          <div style="font-weight:700; margin:6px 0 4px 0; font-size:0.8rem; color:var(--amber);">ข้อพิจารณา:</div>
          <ul class="cons-list">
            ${hotel.cons.slice(0, 2).map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>

        <div class="hotel-footer-actions">
          <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} select-hotel-btn" data-hotel-id="${hotel.id}" style="flex:1;">
            ${isSelected ? '✓ โรงแรมที่เลือกอยู่' : 'เลือกโรงแรมนี้'}
          </button>
          <a href="${hotel.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-icon" title="ดูใน Google Maps">📍</a>
        </div>
      `;

      els.hotelCardsContainer.appendChild(card);
    });

    // Add click listeners to hotel selection buttons
    document.querySelectorAll('.select-hotel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-hotel-id');
        DataManager.setSelectedHotel(id);
        activeHotelFilter = id;
        updateAllViews();
        showToast(`เลือก ${state.hotels.find(h => h.id === id)?.name} สำเร็จ`);
      });
    });

    applyHotelFilter();
  }

  let activeHotelFilter = state.selectedHotelId || 'hotel-infinite-ratchada';

  function applyHotelFilter() {
    const isMobile = window.innerWidth < 992;
    document.querySelectorAll('.hotel-segment-btn').forEach(btn => {
      const filter = btn.getAttribute('data-hotel-filter');
      btn.classList.toggle('active', filter === activeHotelFilter);
    });

    (state.hotels || []).forEach(h => {
      const card = document.getElementById(`card-${h.id}`);
      if (!card) return;
      if (!isMobile || activeHotelFilter === 'all') {
        card.style.display = 'flex';
      } else {
        card.style.display = (h.id === activeHotelFilter) ? 'flex' : 'none';
      }
    });
  }

  // ------------------------------------------------------------------------
  // 2. Render Timeline & Day Planner
  // ------------------------------------------------------------------------
  function renderTimeline() {
    if (!els.timelineContainer) return;

    const dayPlan = RouteOptimizer.getDayPlan(currentActiveDay, state.selectedHotelId, state);
    const activeHotel = state.hotels.find(h => h.id === state.selectedHotelId);

    // Update Day Tabs active styling
    document.querySelectorAll('.day-tab-btn').forEach(btn => {
      const dayNum = Number(btn.getAttribute('data-day'));
      btn.classList.toggle('active', dayNum === currentActiveDay);
    });

    // Show/hide Day 4 strategy picker
    if (els.day4StrategyWrapper) {
      els.day4StrategyWrapper.style.display = currentActiveDay === 4 ? 'block' : 'none';
      if (currentActiveDay === 4) {
        const currentPlan = state.userOverrides.day4PlanId || 'plan-a-cost';
        [els.planAButton, els.planBButton, els.planCButton].forEach(btn => {
          if (btn) btn.classList.toggle('active', btn.getAttribute('data-plan-id') === currentPlan);
        });
      }
    }

    // Show/hide Day 2 exam inputs
    if (els.examInputsWrapper) {
      els.examInputsWrapper.style.display = currentActiveDay === 2 ? 'block' : 'none';
      if (currentActiveDay === 2) {
        if (els.examStartTimeInput) els.examStartTimeInput.value = state.userOverrides.examStartTime || '09:30';
        if (els.examEndTimeInput) els.examEndTimeInput.value = state.userOverrides.examEndTime || '12:00';
        if (els.examBufferInput) els.examBufferInput.value = state.userOverrides.examBufferMinutes || 45;
      }
    }

    // Evaluate continuous travel
    if (els.continuousStatusBadge && dayPlan && activeHotel) {
      const evalResult = RouteOptimizer.evaluateContinuousFlow(dayPlan.legs, activeHotel.name);
      els.continuousStatusBadge.textContent = evalResult.message;
      els.continuousStatusBadge.className = evalResult.status === 'continuous_optimal' 
        ? 'badge badge-verified' 
        : 'badge badge-estimated';
    }

    // Render Timeline Legs
    els.timelineContainer.innerHTML = '';

    if (!dayPlan || !dayPlan.legs || dayPlan.legs.length === 0) {
      els.timelineContainer.innerHTML = '<div style="color:var(--text-muted); padding:1rem;">ไม่มีข้อมูลการเดินทางสำหรับวันนี้</div>';
      return;
    }

    let dailyTotalFare = 0;

    dayPlan.legs.forEach((leg, idx) => {
      dailyTotalFare += Number(leg.fare || 0);
      const card = document.createElement('div');
      card.className = 'timeline-card';
      card.id = `leg-${leg.segmentId || idx}`;

      const statusBadge = leg.fareStatus === 'official_verified' 
        ? '<span class="badge badge-verified">อัตราทางการ</span>'
        : (leg.fareStatus === 'always_free' 
          ? '<span class="badge badge-verified">ฟรี</span>'
          : '<span class="badge badge-estimated">ประมาณการ</span>');

      card.innerHTML = `
        <div class="timeline-card-header">
          <span class="timeline-time">${leg.time || 'ตามกำหนด'}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">ช่วงที่ ${idx + 1} จาก ${dayPlan.legs.length}</span>
        </div>
        <div class="timeline-dest-title">${leg.from} ➔ ${leg.to}</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">
          ${leg.notes || ''}
        </div>
        <div class="timeline-transit-info">
          <span>วิธีการ: <strong>${leg.modeLabel || leg.mode}</strong></span>
          ${leg.distanceKm ? `<span>• ระยะทาง: <strong>${leg.distanceKm} กม.</strong></span>` : ''}
          ${leg.walkMinutes ? `<span>• เดิน: <strong>${leg.walkMinutes} นาที</strong></span>` : ''}
          <span>• ค่าโดยสาร: <strong class="timeline-fare-badge">฿${leg.fare}</strong></span>
          ${statusBadge}
        </div>
      `;

      els.timelineContainer.appendChild(card);
    });

    // Update Map with Day Route
    MapController.drawDayRoute(dayPlan, activeHotel, state.places);
  }

  // ------------------------------------------------------------------------
  // 3. Render Nearby Places Grid
  // ------------------------------------------------------------------------
  function renderNearbyPlaces() {
    if (!els.nearbyCardsGrid) return;

    const query = (els.nearbySearchInput?.value || '').toLowerCase().trim();
    const distanceLimit = Number(els.nearbyDistanceFilter?.value || 9999);
    const activeHotel = state.hotels.find(h => h.id === state.selectedHotelId);

    els.nearbyCardsGrid.innerHTML = '';

    const filtered = (state.places || []).filter(place => {
      // Hotel relation filter: If place has a specific hotel relation, match it
      if (place.hotelRelation && place.hotelRelation !== state.selectedHotelId) {
        return false;
      }

      // Category filter
      if (activeNearbyCategory === 'food' && !['food', 'food_halal', 'food_street'].includes(place.category)) return false;
      if (activeNearbyCategory === 'halal' && place.category !== 'food_halal') return false;
      if (activeNearbyCategory === 'laundry' && place.category !== 'laundry') return false;
      if (activeNearbyCategory === 'transit' && !['transit_station', 'transit_pier'].includes(place.category)) return false;
      if (activeNearbyCategory === '24h' && (!place.openHours || !place.openHours.includes('24'))) return false;

      // Distance filter
      if (place.distanceFromHotelMeters && place.distanceFromHotelMeters > distanceLimit) {
        return false;
      }

      // Text query
      if (query) {
        const text = `${place.name} ${place.nameEn || ''} ${place.address || ''} ${place.categoryLabel || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      els.nearbyCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          ไม่พบสถานที่ตามเงื่อนไขที่เลือก 
          <div style="margin-top:0.5rem;">
            <a href="https://www.google.com/maps/search/?api=1&query=restaurants+laundry+near+${encodeURIComponent(activeHotel?.name || 'Bangkok')}" 
               target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
               ค้นหาสดบน Google Maps ↗
            </a>
          </div>
        </div>
      `;
      return;
    }

    filtered.forEach(place => {
      const card = document.createElement('div');
      card.className = 'place-card';
      const statusBadge = place.coordinatesStatus === 'verified'
        ? '<span class="badge badge-verified">พิกัดยืนยันแล้ว</span>'
        : '<span class="badge badge-estimated">รอตรวจสอบ</span>';

      card.innerHTML = `
        <div>
          <div class="place-badge-type">${place.categoryLabel || place.category}</div>
          <div class="place-card-title">${place.name}</div>
          <div class="place-card-details">
            ${place.address ? `<div>📍 ${place.address}</div>` : ''}
            ${place.distanceFromHotelMeters ? `<div>🚶 ระยะจากโรงแรม: ${place.distanceFromHotelMeters} ม. (~${place.walkMinutes || 5} นาที)</div>` : ''}
            ${place.openHours ? `<div>🕒 ${place.openHours}</div>` : ''}
            ${place.priceLevel ? `<div>💰 ${place.priceLevel}</div>` : ''}
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
          ${statusBadge}
          <a href="${place.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">เปิดแผนที่ ↗</a>
        </div>
      `;
      els.nearbyCardsGrid.appendChild(card);
    });
  }

  // ------------------------------------------------------------------------
  // 4. Render Budget Comparison Table & Inputs
  // ------------------------------------------------------------------------
  function renderBudgetCalculator() {
    const comparison = BudgetCalculator.compareAllHotels(state);
    const overrides = state.userOverrides;

    // Sync input values
    if (els.budgetHotelLeeInput) els.budgetHotelLeeInput.value = overrides.hotelCustomPrices?.['hotel-latphrao'] ?? 4050;
    if (els.budgetHotelRatchadaInput) els.budgetHotelRatchadaInput.value = overrides.hotelCustomPrices?.['hotel-ratchada'] ?? 3480;
    if (els.budgetHotelKasetInput) els.budgetHotelKasetInput.value = overrides.hotelCustomPrices?.['hotel-kaset'] ?? 3120;
    if (els.budgetNightsInput) els.budgetNightsInput.value = overrides.nights || 4;
    if (els.budgetPaxInput) els.budgetPaxInput.value = overrides.pax || 1;
    if (els.budgetFoodDailyInput) {
      els.budgetFoodDailyInput.value = overrides.foodDaily || 180;
      if (els.budgetFoodDailyVal) els.budgetFoodDailyVal.textContent = overrides.foodDaily || 180;
    }
    if (els.budgetLaundryCyclesInput) els.budgetLaundryCyclesInput.value = overrides.laundryCycles || 1;
    if (els.budgetLaundryCostInput) els.budgetLaundryCostInput.value = overrides.laundryCostPerCycle || 110;
    if (els.budgetGrabFareInput) els.budgetGrabFareInput.value = overrides.grabFarePerTrip || 50;
    if (els.tuktukToggleCheckbox) els.tuktukToggleCheckbox.checked = overrides.infiniteRatchadaFreeTukTuk !== false;

    // Meal split preview
    const activeBudget = comparison.hotels.find(h => h.hotelId === state.selectedHotelId) || comparison.hotels[0];
    if (els.budgetMealSplitPreview && activeBudget.mealBreakdown) {
      els.budgetMealSplitPreview.innerHTML = `
        <span style="color:var(--text-muted); font-size:0.8rem;">
          ตัวอย่างแบ่งมื้อ: เช้า ฿${activeBudget.mealBreakdown.breakfast} • เที่ยง ฿${activeBudget.mealBreakdown.lunch} • เย็น ฿${activeBudget.mealBreakdown.dinner} • ว่าง/น้ำ ฿${activeBudget.mealBreakdown.snack} (รวม ฿${activeBudget.foodDaily}/วัน)
        </span>
      `;
    }

    // Render comparison rows
    if (els.budgetComparisonRows) {
      els.budgetComparisonRows.innerHTML = '';
      comparison.hotels.forEach(item => {
        const isWinner = item.hotelId === comparison.lowestCostId;
        const isSelected = item.hotelId === state.selectedHotelId;

        const tr = document.createElement('tr');
        tr.style.fontWeight = isSelected ? '700' : 'normal';
        if (isSelected) tr.style.background = 'rgba(6, 182, 212, 0.08)';

        tr.innerHTML = `
          <td>
            ${item.hotelName} ${isSelected ? '<span class="badge badge-verified" style="margin-left:4px;">เลือกอยู่</span>' : ''}
            ${isWinner ? '<span class="badge badge-verified" style="margin-left:4px;">ประหยัดเงินรวมสุด</span>' : ''}
          </td>
          <td>฿${Math.round(item.roomCost).toLocaleString()}</td>
          <td>฿${Math.round(item.publicTransitTotal).toLocaleString()}</td>
          <td>฿${Math.round(item.grabTotal).toLocaleString()}</td>
          <td>฿${Math.round(item.foodCost).toLocaleString()}</td>
          <td>฿${Math.round(item.laundryCost).toLocaleString()}</td>
          <td style="color:${isWinner ? 'var(--emerald)' : 'var(--text-main)'}; font-size:1.05rem;">
            ฿${Math.round(item.grandTotal).toLocaleString()}
          </td>
        `;
        els.budgetComparisonRows.appendChild(tr);
      });
    }

    // Update Hero Stats
    if (els.heroActiveHotel) els.heroActiveHotel.textContent = activeBudget.hotelName;
    if (els.heroGrandTotal) els.heroGrandTotal.textContent = `฿${Math.round(activeBudget.grandTotal).toLocaleString()}`;
    if (els.heroPerPaxTotal) els.heroPerPaxTotal.textContent = `฿${Math.round(activeBudget.perPaxTotal).toLocaleString()}`;
    if (els.heroPerDayTotal) els.heroPerDayTotal.textContent = `฿${Math.round(activeBudget.perDayTotal).toLocaleString()}`;

    const lowestCostHotel = state.hotels.find(h => h.id === comparison.lowestCostId);
    if (els.bestValueHotelName) els.bestValueHotelName.textContent = lowestCostHotel ? lowestCostHotel.name : 'Infinite Hotel @Kaset';
  }

  // ------------------------------------------------------------------------
  // 5. Render Scoring Model
  // ------------------------------------------------------------------------
  function renderScoring() {
    if (!els.scoringCriteriaList) return;

    const scores = ScoreCalculator.calculateScores(state);
    const criteria = scores.criteria;

    if (els.scoreWinnerBadge) {
      const winnerHotel = state.hotels.find(h => h.id === scores.winnerId);
      els.scoreWinnerBadge.textContent = winnerHotel ? `${winnerHotel.name} (${scores.finalScores[scores.winnerId].score}/10)` : '';
      if (els.bestConvenienceHotelName) {
        els.bestConvenienceHotelName.textContent = winnerHotel ? winnerHotel.name : 'Infinite Hotel @Ratchada';
      }
    }

    els.scoringCriteriaList.innerHTML = '';

    criteria.forEach(crit => {
      const critBox = document.createElement('div');
      critBox.className = 'criteria-item';

      const leeScore = state.scoring?.criteria?.find(c => c.id === crit.id)?.scores?.['hotel-latphrao']?.score || 7;
      const ratchadaScore = state.scoring?.criteria?.find(c => c.id === crit.id)?.scores?.['hotel-ratchada']?.score || 8;
      const kasetScore = state.scoring?.criteria?.find(c => c.id === crit.id)?.scores?.['hotel-kaset']?.score || 7;

      critBox.innerHTML = `
        <div class="criteria-header">
          <div>
            <span class="criteria-title">${crit.name}</span>
            <div style="font-size:0.75rem; color:var(--text-dim);">${crit.description}</div>
          </div>
          <div class="criteria-weight">น้ำหนัก: <span id="weight-val-${crit.id}">${crit.currentWeight}%</span></div>
        </div>
        <input type="range" class="form-range weight-slider" data-crit-id="${crit.id}" min="0" max="30" value="${crit.currentWeight}" style="width:100%; accent-color:var(--primary); cursor:pointer;">
        
        <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.4rem;">
          <div class="score-bar-row">
            <span>LEE Lat Phrao</span>
            <div class="score-progress-bg"><div class="score-progress-fill lee" style="width:${leeScore * 10}%"></div></div>
            <span style="font-weight:700;">${leeScore}/10</span>
          </div>
          <div class="score-bar-row">
            <span>Infinite Ratchada</span>
            <div class="score-progress-bg"><div class="score-progress-fill ratchada" style="width:${ratchadaScore * 10}%"></div></div>
            <span style="font-weight:700;">${ratchadaScore}/10</span>
          </div>
          <div class="score-bar-row">
            <span>Infinite Kaset</span>
            <div class="score-progress-bg"><div class="score-progress-fill kaset" style="width:${kasetScore * 10}%"></div></div>
            <span style="font-weight:700;">${kasetScore}/10</span>
          </div>
        </div>
      `;

      els.scoringCriteriaList.appendChild(critBox);
    });

    // Slider listeners
    document.querySelectorAll('.weight-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const critId = e.target.getAttribute('data-crit-id');
        const val = Number(e.target.value);
        const label = document.getElementById(`weight-val-${critId}`);
        if (label) label.textContent = `${val}%`;

        const newWeights = { ...(state.userOverrides.scoringWeights || {}) };
        newWeights[critId] = val;
        DataManager.updateOverrides({ scoringWeights: newWeights });
        
        // Re-render score badges & hotel cards without rebuilding slider list
        const updatedScores = ScoreCalculator.calculateScores(state);
        if (els.scoreWinnerBadge) {
          const winnerHotel = state.hotels.find(h => h.id === updatedScores.winnerId);
          els.scoreWinnerBadge.textContent = winnerHotel ? `${winnerHotel.name} (${updatedScores.finalScores[updatedScores.winnerId].score}/10)` : '';
        }
        renderHotelCards();
      });
    });
  }

  // ------------------------------------------------------------------------
  // 6. Render Data Sources Table
  // ------------------------------------------------------------------------
  function renderSources() {
    if (!els.sourcesTableBody) return;
    els.sourcesTableBody.innerHTML = '';

    (state.sources || []).forEach(src => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${src.name}</td>
        <td><span class="badge ${src.confidence === 'high' ? 'badge-verified' : 'badge-estimated'}">${src.confidence}</span></td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${src.description || ''}</td>
        <td style="font-family:var(--font-mono); font-size:0.8rem;">${src.checkedAt}</td>
        <td>
          <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">เปิดตรวจสอบ ↗</a>
        </td>
      `;
      els.sourcesTableBody.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------------
  // Master View Update
  // ------------------------------------------------------------------------
  function updateAllViews() {
    renderHotelCards();
    renderTimeline();
    renderBudgetCalculator();
    renderScoring();
    renderNearbyPlaces();
    MapController.renderPlaces(state, state.selectedHotelId, 'all');
  }

  // ------------------------------------------------------------------------
  // Event Listeners Setup
  // ------------------------------------------------------------------------

  // Day Tab Buttons
  document.querySelectorAll('.day-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentActiveDay = Number(e.currentTarget.getAttribute('data-day'));
      renderTimeline();
    });
  });

  // Day 4 Strategy Buttons
  [els.planAButton, els.planBButton, els.planCButton].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        const planId = e.currentTarget.getAttribute('data-plan-id');
        DataManager.updateOverrides({ day4PlanId: planId });
        updateAllViews();
        showToast(`สลับไปใช้ ${planId === 'plan-a-cost' ? 'แผน A (ประหยัดค่าเดินทาง)' : (planId === 'plan-b-time' ? 'แผน B (ลดเวลาเดินทาง)' : 'แผน C (สมดุล) ')}`);
      });
    }
  });

  // Day 2 Exam Inputs
  if (els.examStartTimeInput) {
    els.examStartTimeInput.addEventListener('change', (e) => {
      DataManager.updateOverrides({ examStartTime: e.target.value });
      renderTimeline();
    });
  }
  if (els.examEndTimeInput) {
    els.examEndTimeInput.addEventListener('change', (e) => {
      DataManager.updateOverrides({ examEndTime: e.target.value });
      renderTimeline();
    });
  }
  if (els.examBufferInput) {
    els.examBufferInput.addEventListener('change', (e) => {
      DataManager.updateOverrides({ examBufferMinutes: Number(e.target.value) });
      renderTimeline();
    });
  }

  // Budget Calculator Inputs
  const handleBudgetChange = () => {
    const customPrices = { ...(state.userOverrides.hotelCustomPrices || {}) };
    if (els.budgetHotelLeeInput) customPrices['hotel-latphrao'] = Number(els.budgetHotelLeeInput.value);
    if (els.budgetHotelRatchadaInput) customPrices['hotel-ratchada'] = Number(els.budgetHotelRatchadaInput.value);
    if (els.budgetHotelKasetInput) customPrices['hotel-kaset'] = Number(els.budgetHotelKasetInput.value);

    DataManager.updateOverrides({
      hotelCustomPrices: customPrices,
      nights: Number(els.budgetNightsInput?.value || 4),
      pax: Number(els.budgetPaxInput?.value || 1),
      foodDaily: Number(els.budgetFoodDailyInput?.value || 180),
      laundryCycles: Number(els.budgetLaundryCyclesInput?.value || 1),
      laundryCostPerCycle: Number(els.budgetLaundryCostInput?.value || 110),
      grabFarePerTrip: Number(els.budgetGrabFareInput?.value || 50),
      infiniteRatchadaFreeTukTuk: els.tuktukToggleCheckbox ? els.tuktukToggleCheckbox.checked : true
    });

    updateAllViews();
  };

  [
    els.budgetHotelLeeInput,
    els.budgetHotelRatchadaInput,
    els.budgetHotelKasetInput,
    els.budgetNightsInput,
    els.budgetPaxInput,
    els.budgetLaundryCyclesInput,
    els.budgetLaundryCostInput,
    els.budgetGrabFareInput
  ].forEach(input => {
    if (input) input.addEventListener('input', handleBudgetChange);
  });

  if (els.budgetFoodDailyInput) {
    els.budgetFoodDailyInput.addEventListener('input', (e) => {
      if (els.budgetFoodDailyVal) els.budgetFoodDailyVal.textContent = e.target.value;
      handleBudgetChange();
    });
  }

  if (els.tuktukToggleCheckbox) {
    els.tuktukToggleCheckbox.addEventListener('change', handleBudgetChange);
  }

  // Copy Budget Summary
  if (els.copyBudgetSummaryBtn) {
    els.copyBudgetSummaryBtn.addEventListener('click', () => {
      const comparison = BudgetCalculator.compareAllHotels(state);
      const active = comparison.hotels.find(h => h.hotelId === state.selectedHotelId);
      if (!active) return;

      const summaryText = `
สรุปงบประมาณการเดินทาง กรุงเทพฯ (28 พ.ย. - 2 ธ.ค. 2026)
โรงแรมที่เลือก: ${active.hotelName}
จำนวนคืน: ${active.nights} คืน | ผู้เดินทาง: ${active.pax} คน
1. ค่าห้องพัก: ฿${Math.round(active.roomCost).toLocaleString()}
2. ค่าเดินทางขนส่งสาธารณะ: ฿${Math.round(active.publicTransitTotal).toLocaleString()}
3. เงินสำรอง Grab: ฿${Math.round(active.grabTotal).toLocaleString()}
4. ค่าอาหาร (${active.days} วัน x ฿${active.foodDaily}): ฿${Math.round(active.foodCost).toLocaleString()}
5. ค่าบริการซัก-อบผ้า: ฿${Math.round(active.laundryCost).toLocaleString()}
-------------------------------------------
งบประมาณรวมสุทธิ: ฿${Math.round(active.grandTotal).toLocaleString()} (เฉลี่ย ฿${Math.round(active.perPaxTotal).toLocaleString()} / คน)
เงินมัดจำคีย์การ์ดสำรอง (ได้คืน): ฿${active.refundableDeposit}
คำนวณโดย: Bangkok Trip Planner 2026
      `.trim();

      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('คัดลอกสรุปงบประมาณลงคลิปบอร์ดแล้ว!');
      }).catch(() => {
        showToast('คัดลอกสำเร็จ');
      });
    });
  }

  // Nearby Search & Category Filters
  if (els.nearbySearchInput) {
    els.nearbySearchInput.addEventListener('input', renderNearbyPlaces);
  }
  if (els.nearbyDistanceFilter) {
    els.nearbyDistanceFilter.addEventListener('change', renderNearbyPlaces);
  }
  els.nearbyCategoryPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      els.nearbyCategoryPills.forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeNearbyCategory = e.currentTarget.getAttribute('data-cat') || 'all';
      renderNearbyPlaces();
    });
  });

  // Map Filter Pills
  els.mapFilterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      els.mapFilterPills.forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const cat = e.currentTarget.getAttribute('data-filter') || 'all';
      MapController.renderPlaces(state, state.selectedHotelId, cat);
    });
  });

  // Top Nav Actions
  if (els.savePlanBtn) {
    els.savePlanBtn.addEventListener('click', () => {
      DataManager.saveToLocalStorage();
      showToast('บันทึกแผนและงบประมาณลงเครื่องสำเร็จ!');
    });
  }

  if (els.resetPlanBtn) {
    els.resetPlanBtn.addEventListener('click', () => {
      if (confirm('คุณต้องการรีเซ็ตแผนและงบประมาณกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
        DataManager.resetToDefaults();
        updateAllViews();
        showToast('รีเซ็ตข้อมูลเป็นค่าเริ่มต้นแล้ว');
      }
    });
  }

  if (els.exportJsonBtn) {
    els.exportJsonBtn.addEventListener('click', () => {
      DataManager.exportJSON();
      showToast('ส่งออกไฟล์ JSON สำเร็จ');
    });
  }

  if (els.importJsonBtn && els.importJsonInput) {
    els.importJsonBtn.addEventListener('click', () => {
      els.importJsonInput.click();
    });

    els.importJsonInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = DataManager.importJSON(event.target.result);
        if (res.success) {
          updateAllViews();
          showToast('นำเข้าข้อมูล JSON สำเร็จ!');
        } else {
          alert(`เกิดข้อผิดพลาดในการนำเข้า: ${res.error}`);
        }
      };
      reader.readAsText(file);
    });
  }

  if (els.printPlanBtn) {
    els.printPlanBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Theme Toggle
  if (els.themeToggleBtn) {
    els.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      els.themeToggleBtn.textContent = next === 'light' ? '🌙' : '☀️';
      showToast(`เปลี่ยนเป็นธีม ${next === 'light' ? 'สว่าง (Light Mode)' : 'มืด (Dark Mode)'}`);
    });
  }

  // ------------------------------------------------------------------------
  // View Windows Switching (Desktop Tabs & Mobile Bottom Navigation)
  // ------------------------------------------------------------------------
  function switchView(viewId) {
    const targetEl = document.getElementById(viewId);
    if (!targetEl) return;

    // Toggle active views
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.remove('active');
    });
    targetEl.classList.add('active');

    // Update active states on nav items (both top and bottom)
    document.querySelectorAll('[data-view]').forEach(item => {
      const target = item.getAttribute('data-view');
      item.classList.toggle('active', target === viewId);
    });

    // Special trigger for Leaflet Map resizing
    if (viewId === 'view-map') {
      setTimeout(() => {
        MapController.invalidateMapSize();
      }, 60);
      MapController.renderPlaces(state, state.selectedHotelId, 'all');
      const activeHotel = state.hotels.find(h => h.id === state.selectedHotelId);
      const dayPlan = RouteOptimizer.getDayPlan(currentActiveDay, state.selectedHotelId, state);
      MapController.drawDayRoute(dayPlan, activeHotel, state.places);
    }

    // Scroll to top of window smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Attach click listener to all elements with [data-view]
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = e.currentTarget.getAttribute('data-view');
      if (targetView) {
        switchView(targetView);
      }
    });
  });

  // Hotel Segmented Tabs Switcher (One hotel card on mobile vs comparison)
  document.querySelectorAll('.hotel-segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.currentTarget.getAttribute('data-hotel-filter');
      activeHotelFilter = filter;
      if (filter !== 'all') {
        DataManager.setSelectedHotel(filter);
        updateAllViews();
        showToast(`เลือก ${state.hotels.find(h => h.id === filter)?.name}`);
      } else {
        applyHotelFilter();
      }
    });
  });

  window.addEventListener('resize', () => {
    applyHotelFilter();
  });

  // Map vs Places Directory Sub-Tabs
  const subTabMapBtn = document.getElementById('subTabMapBtn');
  const subTabPlacesBtn = document.getElementById('subTabPlacesBtn');
  const subViewMapSection = document.getElementById('subViewMapSection');
  const subViewPlacesSection = document.getElementById('subViewPlacesSection');

  if (subTabMapBtn && subTabPlacesBtn) {
    subTabMapBtn.addEventListener('click', () => {
      subTabMapBtn.classList.add('active');
      subTabPlacesBtn.classList.remove('active');
      if (subViewMapSection) subViewMapSection.style.display = 'block';
      if (subViewPlacesSection) subViewPlacesSection.style.display = 'none';
      setTimeout(() => {
        MapController.invalidateMapSize();
      }, 50);
    });

    subTabPlacesBtn.addEventListener('click', () => {
      subTabPlacesBtn.classList.add('active');
      subTabMapBtn.classList.remove('active');
      if (subViewMapSection) subViewMapSection.style.display = 'none';
      if (subViewPlacesSection) subViewPlacesSection.style.display = 'block';
    });
  }

  // Check URL Hash on initial load
  const hash = window.location.hash.replace('#', '');
  const hashMap = {
    'hotels': 'view-hotels',
    'planner': 'view-planner',
    'map': 'view-map',
    'budget': 'view-budget',
    'scoring': 'view-scoring'
  };
  if (hashMap[hash]) {
    switchView(hashMap[hash]);
  }

  // Initial Render
  updateAllViews();
  renderSources();
  console.log('Bangkok Trip Planner 2026 application successfully initialized with 5 distinct view windows.');
});
