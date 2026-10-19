/**
 * Bangkok Trip Planner 2026 - Budget Calculator Module
 * Calculates comprehensive itemized and grand total budgets for all 3 hotels dynamically.
 */

const BudgetCalculator = (() => {
  /**
   * Calculate full budget for a given hotel and global overrides
   */
  function calculateHotelBudget(hotelId, state) {
    const overrides = state.userOverrides;
    const hotel = (state.hotels || []).find(h => h.id === hotelId) || {};
    const baseline = (state.budgetDefaults?.baselineModels?.[hotelId]) || {};

    // 1. Room Cost
    const defaultTotal = hotel.priceTotal || baseline.roomTotal4Nights || 3480;
    const customTotal = overrides.hotelCustomPrices?.[hotelId];
    const base4NightPrice = customTotal !== undefined ? Number(customTotal) : defaultTotal;
    const pricePerNight = base4NightPrice / 4;
    const nights = Number(overrides.nights || 4);
    const roomCost = pricePerNight * nights;

    // 2. Food Cost
    const pax = Number(overrides.pax || 1);
    const days = Number(overrides.days || 5);
    const foodDaily = Number(overrides.foodDaily || 180);
    const foodCost = foodDaily * days * pax;

    // Food meal breakdown (preview)
    const mealRatio = foodDaily / 180;
    const mealBreakdown = {
      breakfast: Math.round(40 * mealRatio),
      lunch: Math.round(70 * mealRatio),
      dinner: Math.round(60 * mealRatio),
      snack: Math.max(0, foodDaily - (Math.round(40 * mealRatio) + Math.round(70 * mealRatio) + Math.round(60 * mealRatio)))
    };

    // 3. Laundry Cost
    const laundryCycles = Number(overrides.laundryCycles || 1);
    const laundryCostPerCycle = Number(overrides.laundryCostPerCycle || 110);
    const laundryCost = laundryCycles * laundryCostPerCycle;

    // 4. Transit Cost (Calculated from Itinerary legs)
    const activeDay4Plan = overrides.day4PlanId || 'plan-a-cost';
    let transitDay2 = 0;
    let transitDay3 = 0;
    let transitDay4 = 0;

    if (hotelId === 'hotel-latphrao') {
      transitDay2 = 40;
      transitDay3 = 172;
      transitDay4 = activeDay4Plan === 'plan-b-time' ? 230 : (activeDay4Plan === 'plan-c-balanced' ? 195 : 175);
    } else if (hotelId === 'hotel-ratchada') {
      const freeTukTuk = overrides.infiniteRatchadaFreeTukTuk !== false;
      transitDay2 = freeTukTuk ? 100 : 130;
      transitDay3 = 128;
      transitDay4 = activeDay4Plan === 'plan-b-time' ? 220 : (activeDay4Plan === 'plan-c-balanced' ? 185 : 165);
    } else if (hotelId === 'hotel-kaset') {
      transitDay2 = 148;
      transitDay3 = 178;
      transitDay4 = activeDay4Plan === 'plan-b-time' ? 245 : (activeDay4Plan === 'plan-c-balanced' ? 195 : 185);
    }

    const publicTransitTotal = (transitDay2 + transitDay3 + transitDay4) * pax;

    // 5. Grab Cost / Reserve
    let defaultGrab = baseline.grabReserve ?? (hotelId === 'hotel-latphrao' ? 0 : (hotelId === 'hotel-ratchada' ? 150 : 100));
    const grabFare = Number(overrides.grabFarePerTrip || 50);
    const grabTotal = defaultGrab;

    // 6. Grand Total Net
    const grandTotal = roomCost + foodCost + laundryCost + publicTransitTotal + grabTotal;
    const perPaxTotal = grandTotal / pax;
    const perDayTotal = grandTotal / days;

    // 7. Refundable deposit (not counted in net expense)
    const refundableDeposit = Number(state.budgetDefaults?.defaultConfig?.keycardDepositRefundable || 500);

    return {
      hotelId,
      hotelName: hotel.name || baseline.hotelName,
      roomCost,
      roomPerNight: pricePerNight,
      foodCost,
      foodDaily,
      mealBreakdown,
      laundryCost,
      publicTransitTotal,
      transitBreakdown: {
        day2: transitDay2 * pax,
        day3: transitDay3 * pax,
        day4: transitDay4 * pax
      },
      grabTotal,
      grandTotal,
      perPaxTotal,
      perDayTotal,
      refundableDeposit,
      pax,
      nights,
      days
    };
  }

  /**
   * Compare all 3 hotels simultaneously
   */
  function compareAllHotels(state) {
    const ids = ['hotel-latphrao', 'hotel-ratchada', 'hotel-kaset'];
    const results = ids.map(id => calculateHotelBudget(id, state));
    
    // Sort to find lowest net cost
    const sorted = [...results].sort((a, b) => a.grandTotal - b.grandTotal);
    const lowestCostId = sorted[0].hotelId;

    return {
      hotels: results,
      lowestCostId,
      maxDifference: sorted[sorted.length - 1].grandTotal - sorted[0].grandTotal
    };
  }

  return {
    calculateHotelBudget,
    compareAllHotels
  };
})();
