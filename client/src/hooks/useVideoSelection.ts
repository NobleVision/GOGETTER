import { useState, useCallback, useMemo } from "react";
import { VIDEO_CATEGORIES, VideoCategory } from "@/contexts/MediaContext";

// Video file mapping - maps video numbers to actual filenames
// These filenames are based on the files in client/public/video/
const VIDEO_FILES: Record<number, string> = {
  1: "1_cinematic_aerial_202601060059_9d29t.mp4",
  2: "2_closeup_of_202601060059_63jcj.mp4",
  3: "3_a_lone_202601060058_o2o2y.mp4",
  4: "4_abstract_visualization_202601060059_0g.mp4",
  5: "5_timelapse_of_202601060100_78n0h.mp4",
  6: "6_macro_shot_202601060059_hq09a.mp4",
  7: "7_firstperson_pov_202601060100_aesrj.mp4",
  8: "8_overhead_shot_202601060059_u4id0.mp4",
  9: "9_cinematic_slowmotion_202601060100_b8r.mp4",
  10: "10_wide_establishing_202601060100_4gy3w.mp4",
  11: "11_abstract_fluid_202601060100_7l7yf.mp4",
  12: "12_drone_shot_202601060100_qkoz4.mp4",
  13: "13_closeup_of_202601060100_v3kf0.mp4",
  14: "14_isometric_view_202601060100_479gl.mp4",
  15: "15_slowmotion_shot_202601060100_75dki.mp4",
  16: "16_camera_orbiting_202601060101_l1o2o.mp4",
  17: "17_splitscreen_transition_202601060101.mp4",
  18: "18_cinematic_reveal_202601060101_jcwzj.mp4",
  19: "19_underwaterstyle_shot_202601060101_7l.mp4",
  20: "20_timelapse_of_202601060101_cwwvy.mp4",
  21: "21_pov_of_202601060102_i3kk5.mp4",
  22: "22_abstract_compass_202601060117_78zac.mp4",
  23: "23_closeup_of_202601060102_n943b.mp4",
  24: "24_cinematic_shot_202601060102_h2bjp.mp4",
  25: "25_hands_cupping_202601060102_fpojr.mp4",
  26: "26_abstract_visualization_202601060102_y.mp4",
  27: "27_split_pathway_202601060102_7m351.mp4",
  28: "28_macro_shot_202601060102_3gdme.mp4",
  29: "29_timelapse_of_202601060103_etfeq.mp4",
  30: "30_crystal_ball_202601060103_ju3lc.mp4",
  31: "31_slot_machine_202601060103_dkdrs.mp4",
  32: "32_aerial_view_202601060105_igfsv.mp4",
  33: "33_closeup_of_202601060104_jj726.mp4",
  34: "34_seeds_of_202601060105_354e9.mp4",
  35: "35_treasure_chest_202601060105_gch3d.mp4",
  36: "36_infinite_scroll_202601060105_ho7uz.mp4",
  37: "37_closeup_of_202601060105_4rkdm.mp4",
  // Note: Video 38 is missing from the directory
  39: "39_abstract_radar_202601060105_z4xx8.mp4",
  40: "40_gold_silver_202601060105_a87zl.mp4",
  41: "41_macro_shot_202601060105_ryz0x.mp4",
  42: "42_assembly_line_202601060106_b4a43.mp4",
  43: "43_heat_map_202601060106_4tgzs.mp4",
  44: "44_closeup_of_202601060106_ln9s7.mp4",
  45: "45_star_rating_202601060106_41iz2.mp4",
  46: "46_periodic_table_202601060106_rrgvv.mp4",
  47: "47_price_tags_202601060106_b1ld3.mp4",
  48: "48_funnel_visualization_202601060106_692.mp4",
  49: "49_sidebyside_comparison_202601060107_.mp4",
  50: "50_stamp_of_202601060107_xpksw.mp4",
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

