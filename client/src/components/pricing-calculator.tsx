import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";

interface PricingCalculatorProps {
  onPriceChange?: (price: number, propertyType: string, windowCount: number) => void;
}

export default function PricingCalculator({ onPriceChange }: PricingCalculatorProps) {
  const [propertyType, setPropertyType] = useState<string>("house");
  const [windowCount, setWindowCount] = useState<number>(10);
  const [price, setPrice] = useState<number>(15);
  const [pricingTiers, setPricingTiers] = useState<string>("");

  const calculatePrice = (type: string, count: number) => {
    let calculatedPrice = 0;
    let tiers = "";

    switch (type) {
      case "house":
        if (count <= 10) {
          calculatedPrice = 15;
        } else if (count <= 20) {
          calculatedPrice = 25;
        } else {
          calculatedPrice = 35 + (count - 20) * 1.5;
        }
        tiers = "House: ≤10 windows = £15, 11-20 = £25, 21+ = £35 + £1.50/extra";
        break;
      case "flat":
        if (count <= 6) {
          calculatedPrice = 12;
        } else {
          calculatedPrice = 18 + (count - 6) * 1.0;
        }
        tiers = "Flat: ≤6 windows = £12, 7+ = £18 + £1.00/extra";
        break;
      case "commercial":
        if (count <= 20) {
          calculatedPrice = 50;
        } else {
          calculatedPrice = 80 + (count - 20) * 2.0;
        }
        tiers = "Commercial: ≤20 windows = £50, 21+ = £80 + £2.00/extra";
        break;
    }

    setPrice(calculatedPrice);
    setPricingTiers(tiers);
    onPriceChange?.(calculatedPrice, type, count);
  };

  useEffect(() => {
    calculatePrice(propertyType, windowCount);
  }, [propertyType, windowCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-primary" />
          Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="propertyType">Property Type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger data-testid="select-property-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="windowCount">Number of Windows</Label>
          <Input
            id="windowCount"
            type="number"
            min="1"
            value={windowCount}
            onChange={(e) => setWindowCount(parseInt(e.target.value) || 0)}
            data-testid="input-window-count"
          />
        </div>

        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="text-center">
            <span className="text-2xl font-bold text-primary" data-testid="text-calculated-price">
              £{price.toFixed(2)}
            </span>
            <p className="text-sm text-muted-foreground mt-1">Estimated Price</p>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            <div className="font-medium">Pricing Tiers:</div>
            <div data-testid="text-pricing-tiers">{pricingTiers}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
