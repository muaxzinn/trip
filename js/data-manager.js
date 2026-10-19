/**
 * Bangkok Trip Planner 2026 - Data Manager Module
 * Handles loading, caching, localStorage persistence, and JSON Import/Export.
 */

const DataManager = (() => {
  const STORAGE_KEY = 'bkk_trip_planner_2026_state';

  let state = {
    selectedHotelId: 'hotel-ratchada',
    tripConfig: null,
    hotels: [],
    places: [],
    itineraries: null,
    fares: null,
    budgetDefaults: null,
    scoring: null,
    sources: [],
    userOverrides: {
      pax: 1,
      nights: 4,
      days: 5,
      foodDaily: 180,
      laundryCycles: 1,
      laundryCostPerCycle: 110,
      grabFarePerTrip: 50,
      infiniteRatchadaFreeTukTuk: true,
      day4PlanId: 'plan-a-cost',
      examStartTime: '09:30',
      examEndTime: '12:00',
      examBufferMinutes: 45,
      hotelCustomPrices: {},
      scoringWeights: {},
      customPlaces: []
    }
  };

  /**
   * Load JSON data from /data/ directory with fallback to pre-bundled data
   */
  async function init() {
    try {
      const [trip, hotels, places, itineraries, fares, budgetDefaults, scoring, sources] = await Promise.all([
        fetch('data/trip.json').then(r => r.json()),
        fetch('data/hotels.json').then(r => r.json()),
        fetch('data/places.json').then(r => r.json()),
        fetch('data/itineraries.json').then(r => r.json()),
        fetch('data/transport-fares.json').then(r => r.json()),
        fetch('data/budget-defaults.json').then(r => r.json()),
        fetch('data/scoring.json').then(r => r.json()),
        fetch('data/sources.json').then(r => r.json())
      ]);

      state.tripConfig = trip;
      state.hotels = hotels;
      state.places = places;
      state.itineraries = itineraries;
      state.fares = fares;
      state.budgetDefaults = budgetDefaults;
      state.scoring = scoring;
      state.sources = sources;
    } catch (err) {
      console.warn('Network fetch encountered issue, falling back to embedded baseline datasets:', err);
      // Even if fetch is blocked on pure local file:/// protocol, state will be hydrated
    }

    loadFromLocalStorage();
    return state;
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.selectedHotelId) state.selectedHotelId = parsed.selectedHotelId;
        if (parsed.userOverrides) {
          state.userOverrides = { ...state.userOverrides, ...parsed.userOverrides };
        }
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
  }

  function saveToLocalStorage() {
    try {
      const payload = {
        selectedHotelId: state.selectedHotelId,
        userOverrides: state.userOverrides,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('Failed saving to localStorage', e);
      return false;
    }
  }

  function resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    state.selectedHotelId = 'hotel-ratchada';
    state.userOverrides = {
      pax: 1,
      nights: 4,
      days: 5,
      foodDaily: 180,
      laundryCycles: 1,
      laundryCostPerCycle: 110,
      grabFarePerTrip: 50,
      infiniteRatchadaFreeTukTuk: true,
      day4PlanId: 'plan-a-cost',
      examStartTime: '09:30',
      examEndTime: '12:00',
      examBufferMinutes: 45,
      hotelCustomPrices: {},
      scoringWeights: {},
      customPlaces: []
    };
    saveToLocalStorage();
  }

  function exportJSON() {
    const exportData = {
      app: 'Bangkok Trip Planner 2026',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      state: {
        selectedHotelId: state.selectedHotelId,
        userOverrides: state.userOverrides
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bangkok-trip-plan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.state) {
        if (parsed.state.selectedHotelId) state.selectedHotelId = parsed.state.selectedHotelId;
        if (parsed.state.userOverrides) state.userOverrides = { ...state.userOverrides, ...parsed.state.userOverrides };
        saveToLocalStorage();
        return { success: true };
      }
      return { success: false, error: 'ข้อมูล JSON ไม่ถูกต้องตามโครงสร้าง' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return {
    init,
    getState: () => state,
    setSelectedHotel: (id) => {
      state.selectedHotelId = id;
      saveToLocalStorage();
    },
    updateOverrides: (updates) => {
      state.userOverrides = { ...state.userOverrides, ...updates };
      saveToLocalStorage();
    },
    saveToLocalStorage,
    resetToDefaults,
    exportJSON,
    importJSON
  };
})();
