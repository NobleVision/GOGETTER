import { useState, useCallback, useMemo } from "react";
import { VIDEO_CATEGORIES, VideoCategory } from "@/contexts/MediaContext";

// Video file mapping - maps video numbers to actual filenames
// These filenames are based on the files in dist/public/videos/
const VIDEO_FILES: Record<number, string> = {
  1: "1_cinematic_aerial_202601051149_kjdxs.mp4",
  2: "2_closeup_of_202601051150_z1nu6.mp4",
  3: "3_a_lone_202601051151_boyun.mp4",
  4: "4_abstract_visualization_202601051155_sa.mp4",
  5: "5_timelapse_of_202601051158_dkk8i.mp4",
  6: "6_macro_shot_202601051158_32qjg.mp4",
  7: "7_firstperson_pov_202601051158_eydus.mp4",
  8: "8_overhead_shot_202601051158_a1w7v.mp4",
  9: "9_cinematic_slowmotion_202601051158_3gi.mp4",
  10: "10_wide_establishing_202601051158_od6sc.mp4",
  11: "11_abstract_fluid_202601051221_n3eoe.mp4",
  12: "12_drone_shot_202601051221_0ydfp.mp4",
  13: "13_closeup_of_202601051221_o3wf5.mp4",
  14: "14_isometric_view_202601051221_sp51g.mp4",
  15: "15_slowmotion_shot_202601051221_m07i9.mp4",
  16: "16_camera_orbiting_202601051222_06nt1.mp4",
  17: "17_splitscreen_transition_202601051306.mp4",
  18: "18_cinematic_reveal_202601051307_mvqq7.mp4",
  19: "19_underwaterstyle_shot_202601051307_x3.mp4",
  20: "20_timelapse_of_202601051309_4xw4c.mp4",
  21: "21_pov_of_202601051309_5uspf.mp4",
  22: "22_abstract_compass_202601051307_0lh8w.mp4",
  23: "23_closeup_of_202601051307_kxrdb.mp4",
  24: "24_cinematic_shot_202601051307_toptc.mp4",
  25: "25_hands_cupping_202601051307_146i8.mp4",
  26: "26_abstract_visualization_202601051308_p.mp4",
  27: "27_split_pathway_202601051310_eu3o7.mp4",
  28: "28_macro_shot_202601051309_ijkxq.mp4",
  29: "29_timelapse_of_202601051309_s0ah6.mp4",
  30: "30_crystal_ball_202601051310_6y24x.mp4",
  31: "31_slot_machine_202601051310_xjzq9.mp4",
  32: "32_aerial_view_202601051310_mw4h0.mp4",
  33: "33_closeup_of_202601051309_7xrgv.mp4",
  34: "34_seeds_of_202601051310_uu2lj.mp4",
  35: "35_treasure_chest_202601051310_uvh8b.mp4",
  36: "36_infinite_scroll_202601051310_50m7i.mp4",
  37: "37_closeup_of_202601051308_t6ngv.mp4",
  38: "38_holographic_sorting_202601051309_b6hf.mp4",
  39: "39_abstract_radar_202601051309_ayqts.mp4",
  40: "40_gold_silver_202601051309_r3xup.mp4",
  41: "41_macro_shot_202601051308_vdzpg.mp4",
  42: "42_assembly_line_202601051309_tk97b.mp4",
  43: "43_heat_map_202601051310_npsvd.mp4",
  44: "44_closeup_of_202601051309_hevl4.mp4",
  45: "45_star_rating_202601051309_zgqix.mp4",
  46: "46_periodic_table_202601051309_8npe7.mp4",
  47: "47_price_tags_202601051309_khu98.mp4",
  48: "48_funnel_visualization_202601051309_we4.mp4",
  49: "49_sidebyside_comparison_202601051309_.mp4",
  50: "50_stamp_of_202601051309_6843w.mp4",
  51: "51_wide_shot_202601051321_5f2uv.mp4",
  52: "52_closeup_of_202601051309_7ido2.mp4",
  53: "53_holographic_globe_202601051339_5zbl5.mp4",
  54: "54_timelapse_of_202601051339_de86k.mp4",
  55: "55_split_screen_202601051343_3vizr.mp4",
  56: "56_closeup_of_202601051343_h0961.mp4",
  57: "57_aerial_view_202601051347_80ae9.mp4",
  58: "58_robot_arms_202601051347_jdbn5.mp4",
  59: "59_weather_radar_202601051347_jfyxu.mp4",
  60: "60_closeup_of_202601051344_nu8lo.mp4",
  61: "61_security_camera_202601051346_ruj76.mp4",
  62: "62_pinball_machine_202601051347_x64i5.mp4",
  63: "63_orchestra_conductors_202601051346_li.mp4",
  64: "64_closeup_of_202601051345_vntlg.mp4",
  65: "65_air_traffic_202601052304_a32vt.mp4",
  66: "66_greenhouse_with_202601051347_92dog.mp4",
  67: "67_stock_ticker_202601051348_m3kek.mp4",
  68: "68_closeup_of_202601051345_a31ve.mp4",
  69: "69_satellite_view_202601052304_1woxe.mp4",
  70: "70_night_vision_202601051346_6a5h2.mp4",
  71: "71_humanoid_robot_202601051345_ki6cy.mp4",
  72: "72_abstract_visualization_202601051402_0.mp4",
  73: "73_assembly_line_202601051402_t6ef3.mp4",
  74: "74_chess_pieces_202601051402_i1llf.mp4",
  75: "75_swarm_of_202601052304_dn3b3.mp4",
  76: "76_closeup_of_202601051402_9ezzn.mp4",
  77: "77_digital_assistant_202601051403_va6h7.mp4",
  78: "78_timelapse_of_202601051403_ox3qw.mp4",
  79: "79_split_screen_202601051403_zdtn5.mp4",
  80: "80_robot_and_202601051402_cfcbt.mp4",
  81: "81_factory_floor_202601051433_du0h3.mp4",
  82: "82_ai_avatar_202601052304_oes5g.mp4",
  83: "83_multiple_ai_202601051403_8epq7.mp4",
  84: "84_closeup_of_202601051429_9fi3w.mp4",
  85: "85_transformation_sequence_202601051429.mp4",
  86: "86_piggy_bank_202601051429_0r09f.mp4",
  87: "87_fuel_gauge_202601051430_3veka.mp4",
  88: "88_coins_being_202601051430_227t3.mp4",
  89: "89_leaky_bucket_202601051430_eufkp.mp4",
  90: "90_balance_beam_202601051430_o77ni.mp4",
  91: "91_thermometer_showing_202601051430_hwhi.mp4",
  92: "92_assembly_line_202601051430_cqocm.mp4",
  93: "93_seeds_transforming_202601051431_0s4ap.mp4",
  94: "94_bridge_being_202601052305_hst89.mp4",
  95: "95_vault_door_202601051431_9rt7m.mp4",
  96: "96_handshake_between_202601051431_jitti.mp4",
  97: "97_graduation_cap_202601051431_1fplt.mp4",
  98: "98_gentle_particle_202601051431_a1g9s.mp4",
  99: "99_abstract_liquid_202601051431_a139k.mp4",
  100: "100_infinite_zoom_202601051431_wvpl8.mp4",
};

export function getVideoUrl(videoNumber: number): string {
  const filename = VIDEO_FILES[videoNumber];
  if (!filename) {
    console.warn(`Video ${videoNumber} not found, using fallback`);
    return `/videos/${VIDEO_FILES[1]}`;
  }
  return `/videos/${filename}`;
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

