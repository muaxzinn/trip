/**
 * Bangkok Trip Planner 2026 - Score Calculator Module
 * Multi-criteria 10-point weighted scoring model with dynamic weight customization.
 */

const ScoreCalculator = (() => {
  /**
   * Calculate weighted scores for all 3 hotels
   */
  function calculateScores(state) {
    const scoringData = state.scoring;
    if (!scoringData || !scoringData.criteria) {
      return {
        scores: { 'hotel-latphrao': 7.5, 'hotel-ratchada': 8.0, 'hotel-kaset': 7.5 },
        winner: 'hotel-ratchada'
      };
    }

    const criteriaList = scoringData.criteria;
    const userWeights = state.userOverrides.scoringWeights || {};

    const hotelTotals = {
      'hotel-latphrao': { weightedSum: 0, totalWeight: 0, breakdown: [] },
      'hotel-ratchada': { weightedSum: 0, totalWeight: 0, breakdown: [] },
      'hotel-kaset': { weightedSum: 0, totalWeight: 0, breakdown: [] }
    };

    criteriaList.forEach(crit => {
      const weight = userWeights[crit.id] !== undefined ? Number(userWeights[crit.id]) : Number(crit.weight);

      ['hotel-latphrao', 'hotel-ratchada', 'hotel-kaset'].forEach(hotelId => {
        const item = crit.scores[hotelId] || { score: 7.0, reason: '' };
        const score = Number(item.score);
        hotelTotals[hotelId].weightedSum += (score * weight);
        hotelTotals[hotelId].totalWeight += weight;
        hotelTotals[hotelId].breakdown.push({
          criterionId: crit.id,
          name: crit.name,
          weight,
          score,
          reason: item.reason
        });
      });
    });

    const finalScores = {};
    ['hotel-latphrao', 'hotel-ratchada', 'hotel-kaset'].forEach(hotelId => {
      const totWeight = hotelTotals[hotelId].totalWeight || 1;
      const finalVal = hotelTotals[hotelId].weightedSum / totWeight;
      finalScores[hotelId] = {
        score: Math.round(finalVal * 10) / 10,
        scoreRaw: finalVal,
        breakdown: hotelTotals[hotelId].breakdown
      };
    });

    // Determine winner
    let maxScore = -1;
    let winnerId = 'hotel-ratchada';
    Object.keys(finalScores).forEach(id => {
      if (finalScores[id].scoreRaw > maxScore) {
        maxScore = finalScores[id].scoreRaw;
        winnerId = id;
      }
    });

    return {
      finalScores,
      winnerId,
      criteria: criteriaList.map(c => ({
        id: c.id,
        name: c.name,
        currentWeight: userWeights[c.id] !== undefined ? Number(userWeights[c.id]) : Number(c.weight),
        description: c.description
      }))
    };
  }

  return {
    calculateScores
  };
})();
