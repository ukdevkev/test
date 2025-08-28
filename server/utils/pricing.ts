export function calculatePrice(propertyType: string, windowCount: number): number {
  switch (propertyType) {
    case "house":
      if (windowCount <= 10) {
        return 15;
      } else if (windowCount <= 20) {
        return 25;
      } else {
        return 35 + (windowCount - 20) * 1.5;
      }

    case "flat":
      if (windowCount <= 6) {
        return 12;
      } else {
        return 18 + (windowCount - 6) * 1.0;
      }

    case "commercial":
      if (windowCount <= 20) {
        return 50;
      } else {
        return 80 + (windowCount - 20) * 2.0;
      }

    default:
      return 0;
  }
}

export function getPricingTiers(propertyType: string): string {
  switch (propertyType) {
    case "house":
      return "House: ≤10 windows = £15, 11-20 = £25, 21+ = £35 + £1.50/extra";
    case "flat":
      return "Flat: ≤6 windows = £12, 7+ = £18 + £1.00/extra";
    case "commercial":
      return "Commercial: ≤20 windows = £50, 21+ = £80 + £2.00/extra";
    default:
      return "";
  }
}
