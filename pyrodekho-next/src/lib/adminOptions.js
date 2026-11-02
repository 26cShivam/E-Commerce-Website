// Values the backend and public pages expect. Category and video type must
// match exactly, or the item won't show up on its page.
export const PRODUCT_CATEGORIES = [
  ["indoor", "Indoor"],
  ["outdoor", "Outdoor"],
  ["cracker", "Crackers"],
  ["mostSearched", "Most Searched"],
  ["smokeless", "Smokeless"],
  ["event", "Event"],
  ["club", "Club"],
  ["wedding", "Wedding"],
  ["stage", "Stage"],
  ["birthday", "Birthday"],
  ["fog", "Fog"],
];

export const VIDEO_TYPES = [
  ["home", "Home Page"],
  ["event", "Event / Wedding"],
  ["cracker", "Cracker Testing"],
];

export const TECHNICAL_FIELDS = [
  ["availability", "Availability"],
  ["delivery", "Delivery"],
  ["safety", "Safety"],
  ["spark", "Spark"],
  ["burnTime", "Burn Time"],
  ["sparkHeight", "Spark Height"],
  ["smoke", "Smoke"],
];

export const PRODUCT_STATUSES = [
  ["available", "Available"],
  ["out_of_stock", "Out of stock"],
];

// Products created before the status field existed have none and count as available
export const isOutOfStock = (item) => item.status === "out_of_stock";

export const labelFor = (options, value) =>
  options.find(([key]) => key === value)?.[1] || value;

// Products and videos created before soft delete have no isActive field
export const isActive = (item) => item.isActive !== false;
