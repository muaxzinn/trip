/**
 * Bangkok Trip Planner 2026 - Route Optimizer Module
 * Analyzes continuous travel sequences, minimizes backtracking, and evaluates alternate strategies.
 */

const RouteOptimizer = (() => {
  /**
   * Get the active itinerary for a specific day and hotel
   */
  function getDayPlan(dayNumber, hotelId, state) {
    const itineraries = state.itineraries;
    if (!itineraries || !itineraries.days) return null;

    const day = itineraries.days.find(d => d.dayNumber === dayNumber);
    if (!day) return null;

    // Day 4 has multi-plan strategies
    if (dayNumber === 4 && day.plans) {
      const activePlanId = state.userOverrides.day4PlanId || 'plan-a-cost';
      const selectedPlan = day.plans.find(p => p.planId === activePlanId) || day.plans[0];
      return {
        ...day,
        activePlan: selectedPlan,
        allPlans: day.plans,
        legs: getHotelLegsForDay4(hotelId, selectedPlan, state)
      };
    }

    // Days 1, 2, 3, 5
    let legs = [];
    if (day.hotelSpecificLegs && day.hotelSpecificLegs[hotelId]) {
      legs = [...day.hotelSpecificLegs[hotelId]];
    } else if (day.sharedAttractionSequence) {
      legs = formatDay3Sequence(hotelId, day.sharedAttractionSequence, state);
    }

    return {
      ...day,
      legs
    };
  }

  /**
   * Format Day 3 Phra Nakhon continuous sequence
   */
  function formatDay3Sequence(hotelId, sequence, state) {
    const hotel = (state.hotels || []).find(h => h.id === hotelId) || {};
    const costInfo = state.itineraries?.days?.find(d => d.dayNumber === 3)?.hotelSpecificCosts?.[hotelId];

    return [
      {
        segmentId: 'd3-start',
        time: '08:30 - 09:30',
        from: hotel.name || 'โรงแรมที่พัก',
        to: 'สถานี MRT สนามไชย (ทางออก 1 มิวเซียมสยาม)',
        mode: hotelId === 'hotel-ratchada' ? 'mrt_blue' : (hotelId === 'hotel-latphrao' ? 'mrt_yellow_transfer_blue' : 'bts_transfer_mrt'),
        modeLabel: hotelId === 'hotel-ratchada' ? 'MRT สายสีน้ำเงิน ตรงไม่ต้องต่อสาย' : 'รถไฟฟ้าต่อขบวน',
        fare: hotelId === 'hotel-ratchada' ? 43 : (hotelId === 'hotel-latphrao' ? 65 : 68),
        fareStatus: 'official_verified',
        distanceKm: hotelId === 'hotel-ratchada' ? 12 : (hotelId === 'hotel-latphrao' ? 18 : 16),
        notes: 'เริ่มต้นเข้าสู่ย่านเมืองเก่าพระนครอย่างรวดเร็วทางสถานีสนามไชย'
      },
      {
        segmentId: 'd3-pho',
        time: '09:30 - 11:30',
        from: 'MRT สนามไชย',
        to: 'วัดโพธิ์ (วัดพระเชตุพนฯ)',
        mode: 'walk',
        modeLabel: 'เดินเท้า',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 0.3,
        walkMinutes: 4,
        notes: 'สักการะพระนอน เจดีย์ 4 รัชกาล และจารึกนวดแผนไทย (คนไทยเข้าฟรี)'
      },
      {
        segmentId: 'd3-ferry-out',
        time: '11:45 - 12:00',
        from: 'วัดโพธิ์',
        to: 'ท่าเรือท่าเตียน -> วัดอรุณฯ',
        mode: 'river_cross_ferry',
        modeLabel: 'เรือข้ามฟากแม่น้ำเจ้าพระยา',
        fare: 5,
        fareStatus: 'official_verified',
        distanceKm: 0.5,
        travelMinutes: 5,
        notes: 'ข้ามแม่น้ำเจ้าพระยาไปฝั่งธนบุรี ค่าตั๋ว 5 บาท'
      },
      {
        segmentId: 'd3-arun',
        time: '12:00 - 13:30',
        from: 'ท่าวัดอรุณฯ',
        to: 'วัดอรุณราชวราราม (วัดแจ้ง)',
        mode: 'walk',
        modeLabel: 'เดินเท้า & ทานมื้อเที่ยง',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 0.2,
        notes: 'ชมพระปรางค์วัดอรุณริมแม่น้ำ ทานอาหารกลางวันแถววังเดิม (คนไทยเข้าฟรี)'
      },
      {
        segmentId: 'd3-ferry-back',
        time: '13:45 - 14:00',
        from: 'วัดอรุณฯ',
        to: 'ท่าเรือท่าเตียน (ฝั่งพระนคร)',
        mode: 'river_cross_ferry',
        modeLabel: 'เรือข้ามฟากแม่น้ำเจ้าพระยา',
        fare: 5,
        fareStatus: 'official_verified',
        distanceKm: 0.5,
        travelMinutes: 5,
        notes: 'ข้ามกลับมาฝั่งพระนคร เดินเท้าเลียบแม่น้ำสู่พระบรมมหาราชวัง'
      },
      {
        segmentId: 'd3-palace',
        time: '14:15 - 16:00',
        from: 'ท่าเตียน',
        to: 'วัดพระแก้ว และพระบรมมหาราชวัง',
        mode: 'walk',
        modeLabel: 'เดินเท้า',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 0.7,
        walkMinutes: 9,
        notes: 'สักการะพระแก้วมรกต ชมพระที่นั่งจักรีมหาปราสาท (แต่งกายสุภาพ ปิดจำหน่ายบัตร 15:30)'
      },
      {
        segmentId: 'd3-boat-ride',
        time: '16:15 - 17:30',
        from: 'วัดพระแก้ว',
        to: 'ท่าช้าง -> ล่องเรือด่วนเจ้าพระยาธงส้ม -> ท่าพระอาทิตย์',
        mode: 'chaophraya_boat_orange',
        modeLabel: 'เรือด่วนเจ้าพระยาธงส้ม',
        fare: 16,
        fareStatus: 'official_verified',
        distanceKm: 2.5,
        travelMinutes: 20,
        notes: 'เดิน 250 ม. ไปท่าช้าง ล่องเรือด่วนชมวิวสองฝั่งแม่น้ำเจ้าพระยา ลอดสะพานพระราม 8 ขึ้นท่าพระอาทิตย์'
      },
      {
        segmentId: 'd3-return',
        time: '18:30 - 19:30',
        from: 'ท่าพระอาทิตย์ / บางลำพู',
        to: hotel.name || 'โรงแรมที่พัก',
        mode: 'transit_return',
        modeLabel: 'เรือด่วนธงส้ม / MRT สนามไชย หรือ สามยอด',
        fare: hotelId === 'hotel-ratchada' ? 59 : (hotelId === 'hotel-latphrao' ? 81 : 84),
        fareStatus: 'official_verified',
        distanceKm: 14,
        notes: 'ทานอาหารเย็นย่านบางลำพู/ถนนพระอาทิตย์ แล้วเดินทางกลับโรงแรม (ขากลับ Infinite Ratchada มีตุ๊กตุ๊กรับฟรี)'
      }
    ];
  }

  /**
   * Format Day 4 legs based on active strategy
   */
  function getHotelLegsForDay4(hotelId, plan, state) {
    const hotel = (state.hotels || []).find(h => h.id === hotelId) || {};
    const cost = plan.estimatedTransitCosts?.[hotelId] || 175;

    return [
      {
        segmentId: 'd4-1',
        time: '08:00 - 09:30',
        from: hotel.name,
        to: 'สวนหลวง ร.๙ (King Rama IX Park)',
        mode: 'transit_to_park',
        modeLabel: hotelId === 'hotel-latphrao' ? 'MRT สีเหลืองตรง (ลาดพร้าว 83 -> สวนหลวง ร.๙)' : 'รถไฟฟ้า + รถสองแถว',
        fare: hotelId === 'hotel-latphrao' ? 45 : (hotelId === 'hotel-kaset' ? 62 : 55),
        fareStatus: 'calculated_verified',
        distanceKm: 16,
        notes: 'เดินทางรับลมหนาวช่วงเช้า สวนร่มรื่น ถ่ายรูปดอกไม้และหอรัชมงคล'
      },
      {
        segmentId: 'd4-2',
        time: '09:30 - 11:30',
        from: 'สวนหลวง ร.๙',
        to: 'กิจกรรมในสวนหลวง ร.๙',
        mode: 'walk',
        modeLabel: 'เดินชมสวนพฤกษศาสตร์',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 2.0,
        notes: 'ชมสวนนานาชาติ สระน้ำพุ และศาลาพิทักษ์ไทย (ค่าบัตรเข้าชม 10 บาท)'
      },
      {
        segmentId: 'd4-3',
        time: '11:45 - 13:00',
        from: 'สวนหลวง ร.๙',
        to: 'ตลาดสำเพ็ง (MRT สามยอด)',
        mode: 'cross_city_transit',
        modeLabel: 'สองแถว + MRT สายสีน้ำเงิน ตรงสู่สถานีสามยอด',
        fare: 53,
        fareStatus: 'calculated_verified',
        distanceKm: 18,
        notes: 'เดินทางต่อเนื่องข้ามเมือง ไม่แวะกลับโรงแรม พักผ่อนและตากแอร์บนรถไฟฟ้า ทานมื้อเที่ยง'
      },
      {
        segmentId: 'd4-4',
        time: '13:00 - 16:30',
        from: 'MRT สามยอด',
        to: 'ตลาดสำเพ็ง (ซอยวานิช 1)',
        mode: 'walk',
        modeLabel: 'เดินช้อปปิ้งตลาดสำเพ็ง',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 1.5,
        notes: 'เดินสำรวจสินค้าขายส่ง กิ๊ฟช็อป เครื่องประดับ ของใช้ แวะพักดื่มชา/กาแฟ'
      },
      {
        segmentId: 'd4-5',
        time: '16:45 - 20:00',
        from: 'ตลาดสำเพ็ง',
        to: 'ถนนเยาวราช (สตรีทฟู้ดไชน่าทาวน์)',
        mode: 'walk',
        modeLabel: 'เดินทะลุซอยเชื่อมสำเพ็งสู่เยาวราช',
        fare: 0,
        fareStatus: 'always_free',
        distanceKm: 0.4,
        walkMinutes: 5,
        notes: 'เดินเชื่อมเข้าสู่ถนนเยาวราช สตรีทฟู้ดเริ่มตั้งร้านคึกคัก ทานมื้อเย็นหลากหลายเมนู'
      },
      {
        segmentId: 'd4-6',
        time: '20:15 - 21:00',
        from: 'สถานี MRT วัดมังกร (BL29)',
        to: hotel.name,
        mode: 'mrt_return',
        modeLabel: hotelId === 'hotel-ratchada' ? 'MRT สายสีน้ำเงิน ตรงถึงห้วยขวาง (33บ.)' : 'MRT เชื่อมต่อสู่โรงแรม',
        fare: hotelId === 'hotel-ratchada' ? 33 : (hotelId === 'hotel-latphrao' ? 65 : 68),
        fareStatus: 'calculated_verified',
        distanceKm: 13,
        notes: 'ขึ้น MRT วัดมังกรใจกลางเยาวราช กลับโรงแรม พักผ่อนจบกิจกรรมอย่างราบรื่น'
      }
    ];
  }

  /**
   * Validate continuous travel rule: returns number of mid-day returns to hotel
   */
  function evaluateContinuousFlow(legs, hotelName) {
    if (!legs || legs.length < 2) return { midDayReturns: 0, status: 'optimal' };

    let midDayReturns = 0;
    // Check all legs except the final leg of the day
    for (let i = 0; i < legs.length - 1; i++) {
      if (legs[i].to === hotelName || legs[i].to.includes('โรงแรม')) {
        midDayReturns++;
      }
    }

    return {
      midDayReturns,
      status: midDayReturns === 0 ? 'continuous_optimal' : 'has_backtracking',
      message: midDayReturns === 0 
        ? 'เส้นทางต่อเนื่องสมบูรณ์: ไม่มีการเดินทางย้อนกลับโรงแรมระหว่างวัน' 
        : `พบการเดินทางกลับโรงแรมระหว่างวัน ${midDayReturns} ครั้ง`
    };
  }

  return {
    getDayPlan,
    evaluateContinuousFlow
  };
})();
