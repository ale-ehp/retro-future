// boulevard-constants.js — exact boulevard map dimensions from tron-boulevard-map-walk.html.
// Pure value constants only (literals + arithmetic on other constants here). The runtime/derived
// boulevard extents that read controlEls (MAIN_BUILDING_Z_MIN/MAX, MAX_MAIN_BUILDING_Z_EXTENT,
// MAX_DYNAMIC_ROAD_HALF, DYNAMIC_ROAD_MAX_LENGTH) stay in main.js and import from here.
export const GRID_BLOCK = 12;
export const MAIN_ROAD_WIDTH = 88;
export const SIDE_ROAD_LENGTH = 40;
export const SIDE_ROAD_X = 64;
export const SIDE_BUILDING_X = 96;
export const SIDE_ROAD_WIDTH = GRID_BLOCK * 2;
export const SIDE_BUILDING_BASE = GRID_BLOCK * 6;
export const SIDE_BUILDING_GAP = GRID_BLOCK * 2;
export const SIDE_BUILDING_SPACING = SIDE_BUILDING_BASE + SIDE_BUILDING_GAP;
export const SIDE_FACADE_LED_REFERENCE_HEIGHT = GRID_BLOCK * 11;
export const SIDE_BUILDING_MIN_CLEARANCE = SIDE_BUILDING_GAP;
export const BRIDGE_BUILDING_CLEARANCE = 6;
export const BRIDGE_INNER_BUILDING_FACE_X = SIDE_BUILDING_X - SIDE_BUILDING_BASE / 2;
export const BRIDGE_HALF_SPAN = BRIDGE_INNER_BUILDING_FACE_X - BRIDGE_BUILDING_CLEARANCE;
export const MAIN_ROAD_BASE_LENGTH = 560;
export const START_SIDE_EXTENSION = GRID_BLOCK * 10;
export const MAIN_ROAD_LENGTH = MAIN_ROAD_BASE_LENGTH + START_SIDE_EXTENSION;
export const MAIN_ROAD_Z = START_SIDE_EXTENSION / 2;
export const MAIN_BUILDING_BASE = 100;
export const MAIN_BUILDING_Z = -301;
export const laneZ = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map(s => s * SIDE_BUILDING_SPACING);
export const crossStreetZ = [];
export const STREET_EDGE_WIDTH_DEFAULT = 0;
export const STREET_EDGE_WIDTH_MAX = 0;
export const MAX_BUILDING_AXIS_SCALE = 8;
export const MAX_BOULEVARD_WIDTH_SCALE = 3;
export const MAX_DYNAMIC_ROAD_MARGIN = GRID_BLOCK * 8;
export const MAIN_BUILDING_SIDE_HEX_EXTENSION_ROWS = 8;
export const CROSS_STREET_EDGE_WIDTH_MAX = 0;
export const DEFAULT_BASE_PAD_Y = 0.76;
export const DEFAULT_BASE_PAD_THICKNESS = 0.28;
