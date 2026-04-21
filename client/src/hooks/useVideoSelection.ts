import { useCallback, useMemo, useState } from "react";
import { VIDEO_CATEGORIES, VideoCategory } from "@/contexts/MediaContext";

// Video file mapping - maps video numbers to actual filenames
// Files 1-50 now use the newly delivered 2026-04 B-roll set in client/public/video/
// Files 51-100 continue using the previously integrated library
const VIDEO_FILES: Record<number, string> = {
  1: "01_Futuristic_business_district_202604210254.mp4",
  2: "02_Dark_command-center_background_202604210255.mp4",
  3: "03_Glass_panels_revealing_202604210254.mp4",
  4: "04_Liquid-metal_data_waves_202604210254.mp4",
  5: "05_Futuristic_city_data_202604210254.mp4",
  6: "06_Operating_system_core_202604210254.mp4",
  7: "07_Emerald_energy_branching_202604210254.mp4",
  8: "08_Abstract_compass_rotating_202604210255.mp4",
  9: "09_Tunnel_of_floating_202604210255.mp4",
  10: "10_Map_grid_with_202604210255.mp4",
  11: "11_Founder_at_desk_202604210255.mp4",
  12: "12_Glowing_paths_splitting_202604210255.mp4",
  13: "13_Abstract_visualization_of_202604210255.mp4",
  14: "14_Futuristic_tabletop_with_202604210255.mp4",
  15: "15_Network_reorganizing_central_202604210255.mp4",
  16: "16_Vault_interior_with_202604210255.mp4",
  17: "17_Pricing_pillars_rising_202604210255.mp4",
  18: "18_Coins_transforming_into_202604210256.mp4",
  19: "19_Balance_beam_glass_202604210256.mp4",
  20: "20_Fuel_gauge_filling_202604210256.mp4",
  21: "21_Staircase_of_light_202604210256.mp4",
  22: "22_Streams_of_light_202604210256.mp4",
  23: "23_Market_signals_user_202604210256.mp4",
  24: "24_Ripples_spreading_across_202604210256.mp4",
  25: "25_Spotlight_illuminates_audience_202604210256.mp4",
  26: "26_Ranked_opportunity_capsules_202604210256.mp4",
  27: "27_Montage_of_industry_202604210256.mp4",
  28: "28_Futuristic_trading_floor_202604210256.mp4",
  29: "29_Dim_opportunity_lights_202604210256.mp4",
  30: "30_Abstract_heatmap_liquid_202604210256.mp4",
  31: "31_Editorial_studio_with_202604210256.mp4",
  32: "32_Luminous_words_forming_202604210257.mp4",
  33: "33_Newsroom_of_the_202604210257.mp4",
  34: "34_Scholar_meets_founder_202604210257.mp4",
  35: "35_Black_fluid_colliding_202604210257.mp4",
  36: "36_Particle_field_drifting_202604210257.mp4",
  37: "37_Dark_glass_geometry_202604210257.mp4",
  38: "38_Volumetric_fog_in_202604210257.mp4",
  39: "39_Liquid_chrome_ripples_202604210257.mp4",
  40: "40_Luminous_coordinates_forming_202604210257.mp4",
  41: "41_Cards_folding_backward_202604210257.mp4",
  42: "42_Abstract_light_bars_202604210257.mp4",
  43: "43_Transition_clip_neon_202604210258.mp4",
  44: "44_Transition_clip_teal_202604210258.mp4",
  45: "45_Panels_tilting_backward_202604210258.mp4",
  46: "46_Seed_growing_into_202604210258.mp4",
  47: "47_Assembly_line_glowing_202604210258.mp4",
  48: "48_Glass_bridge_from_202604210258.mp4",
  49: "49_Futuristic_handshake_symbolizing_202604210258.mp4",
  50: "50_Operating_system_core_202604210258.mp4",
  51: "51_wide_shot_202601060109_5hee6.mp4",
  52: "52_closeup_of_202601060109_ukgbi.mp4",
  53: "53_holographic_globe_202601060110_t4zqf.mp4",
  54: "54_timelapse_of_202601060110_cf2pw.mp4",
  55: "55_split_screen_202601060110_10rmd.mp4",
  56: "56_closeup_of_202601060110_zamft.mp4",
  57: "57_aerial_view_202601060110_ehb55.mp4",
  58: "58_robot_arms_202601060110_adzt7.mp4",
  59: "59_weather_radar_202601060110_3iq2q.mp4",
  60: "60_closeup_of_202601060110_du1y1.mp4",
  61: "61_security_camera_202601060110_61i0l.mp4",
  62: "62_pinball_machine_202601060111_6fp56.mp4",
  63: "63_orchestra_conductors_202601060111_o8.mp4",
  64: "64_closeup_of_202601060111_ly6p1.mp4",
  65: "65_air_traffic_202601060116_2v3p8.mp4",
  66: "66_greenhouse_with_202601060111_qvkcv.mp4",
  67: "67_stock_ticker_202601060111_xuhf0.mp4",
  68: "68_closeup_of_202601060111_gkmdn.mp4",
  69: "69_satellite_view_202601060116_fte6b.mp4",
  70: "70_night_vision_202601060111_9xqic.mp4",
  71: "71_humanoid_robot_202601060112_38w8v.mp4",
  72: "72_abstract_visualization_202601060112_k.mp4",
  73: "73_assembly_line_202601060112_1xa4c.mp4",
  74: "74_chess_pieces_202601060112_4eoan.mp4",
  75: "75_swarm_of_202601060116_dxit7.mp4",
  76: "76_closeup_of_202601060112_n23u6.mp4",
  77: "77_digital_assistant_202601060112_cdsc1.mp4",
  78: "78_timelapse_of_202601060113_olaya.mp4",
  79: "79_split_screen_202601060113_yncmc.mp4",
  80: "80_robot_and_202601060113_d4p1n.mp4",
  81: "81_factory_floor_202601060113_lnkyu.mp4",
  82: "82_ai_avatar_202601060116_zuub1.mp4",
  83: "83_multiple_ai_202601060113_3znit.mp4",
  84: "84_closeup_of_202601060113_9bgux.mp4",
  85: "85_transformation_sequence_202601060114.mp4",
  86: "86_piggy_bank_202601060114_1gns2.mp4",
  87: "87_fuel_gauge_202601060115_nn70o.mp4",
  88: "88_coins_being_202601060115_kvsfo.mp4",
  89: "89_leaky_bucket_202601060115_4mnuf.mp4",
  90: "90_balance_beam_202601060115_jreuk.mp4",
  91: "91_thermometer_showing_202601060115_p93r.mp4",
  92: "92_assembly_line_202601060115_vb6zf.mp4",
  93: "93_seeds_transforming_202601060115_95gv0.mp4",
  94: "94_bridge_being_202601060116_7tbyp.mp4",
  95: "95_vault_door_202601060116_bli5p.mp4",
  96: "96_handshake_between_202601060116_29ph1.mp4",
  97: "97_graduation_cap_202601060116_ougye.mp4",
  98: "98_gentle_particle_202601060116_6czrc.mp4",
  99: "99_abstract_liquid_202601060116_fxmus.mp4",
  100: "100_infinite_zoom_202601060116_94g5a.mp4",
};

export function getVideoUrl(videoNumber: number): string {
  const filename = VIDEO_FILES[videoNumber];
  if (!filename) {
    console.warn(`Video ${videoNumber} not found, using fallback`);
    return `/video/${VIDEO_FILES[1]}`;
  }
  return `/video/${filename}`;
}

export function getRandomVideoFromCategory(category: VideoCategory): number {
  const { start, end } = VIDEO_CATEGORIES[category];
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

export function useVideoSelection(category: VideoCategory) {
  const [currentVideoNumber, setCurrentVideoNumber] = useState(() =>
    getRandomVideoFromCategory(category)
  );

  const videoUrl = useMemo(() => getVideoUrl(currentVideoNumber), [currentVideoNumber]);

  const selectRandomVideo = useCallback(() => {
    const newVideo = getRandomVideoFromCategory(category);
    setCurrentVideoNumber(newVideo);
    return newVideo;
  }, [category]);

  const selectNextVideo = useCallback(() => {
    const { start, end } = VIDEO_CATEGORIES[category];
    const next = currentVideoNumber >= end ? start : currentVideoNumber + 1;
    setCurrentVideoNumber(next);
    return next;
  }, [category, currentVideoNumber]);

  return {
    currentVideoNumber,
    videoUrl,
    selectRandomVideo,
    selectNextVideo,
    setCurrentVideoNumber,
  };
}
