import { CalendarIcon, Check, RotateCcw } from "lucide-react";
import moment from "moment";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  CURRENCIES,
  DATE_PRESETS,
  DISPUTE_STATUSES,
  getDateRangeFromPreset,
  SANE_DEFAULT_FILTERS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type TransactionFilters,
} from "./shared";

interface TransactionFiltersDrawerProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  children: React.ReactNode;
}

// Compact section
function FilterSection({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </h4>
        {badge && badge > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

function FilterContent({
  filters,
  setFilters,
  onReset,
  onApply,
}: {
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const { t } = useTranslation();
  const handleDatePresetChange = (preset: string) => {
    const datePreset = preset as TransactionFilters["datePreset"];
    const dateRange = getDateRangeFromPreset(datePreset, filters);
    setFilters({
      ...filters,
      datePreset,
      dateRange,
    });
  };

  const handleCustomDateChange = (type: "from" | "to", date?: Date) => {
    setFilters({
      ...filters,
      datePreset: "custom",
      dateRange: {
        ...filters.dateRange,
        [type]: date,
      },
    });
  };

  const getAppliedFiltersCount = () => {
    let count = 0;
    const isSameAsDefaultTypes =
      filters.types.length === SANE_DEFAULT_FILTERS.types.length &&
      filters.types.every((type) => SANE_DEFAULT_FILTERS.types.includes(type));
    if (!isSameAsDefaultTypes) count++;

    const isSameAsDefaultStatuses =
      filters.statuses.length === SANE_DEFAULT_FILTERS.statuses.length &&
      filters.statuses.every((status) =>
        SANE_DEFAULT_FILTERS.statuses.includes(status),
      );
    if (!isSameAsDefaultStatuses) count++;

    const isSameAsDefaultCurrencies =
      filters.currencies.length === SANE_DEFAULT_FILTERS.currencies.length &&
      filters.currencies.every((currency) =>
        SANE_DEFAULT_FILTERS.currencies.includes(currency),
      );
    if (!isSameAsDefaultCurrencies) count++;

    const isSameAsDefaultDisputeStatuses =
      filters.disputeStatuses.length ===
        SANE_DEFAULT_FILTERS.disputeStatuses.length &&
      filters.disputeStatuses.every((status) =>
        SANE_DEFAULT_FILTERS.disputeStatuses.includes(status),
      );
    if (!isSameAsDefaultDisputeStatuses) count++;

    if (filters.datePreset !== SANE_DEFAULT_FILTERS.datePreset) count++;
    return count;
  };

  const appliedFiltersCount = getAppliedFiltersCount();
  const hasFilters = appliedFiltersCount > 0;

  return (
    <div className="flex h-full max-h-[80vh] flex-col">
      <DrawerHeader className="pb-3">
        <div className="flex items-center justify-between">
          <DrawerTitle className="font-semibold text-base">
            {t("FILTERS")}
          </DrawerTitle>
          <DrawerDescription className="hidden text-muted-foreground text-xs">
            {t("FILTERS_DESCRIPTION")}
          </DrawerDescription>
          {hasFilters && (
            <Badge variant="secondary" className="h-4 px-1.5 text-xs">
              {appliedFiltersCount}
            </Badge>
          )}
        </div>
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4 pb-2">
          {/* Types */}
          <FilterSection
            title={t("FILTER_TYPES")}
            badge={
              filters.types.length !== SANE_DEFAULT_FILTERS.types.length
                ? filters.types.length
                : undefined
            }>
            <ToggleGroup
              type="multiple"
              value={filters.types}
              onValueChange={(values) =>
                setFilters({
                  ...filters,
                  types: values as typeof filters.types,
                })
              }
              className="justify-start">
              {TRANSACTION_TYPES.map((type) => (
                <ToggleGroupItem
                  key={type.value}
                  value={type.value}
                  size="sm"
                  className="text-xs">
                  {t(type.labelKey)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FilterSection>

          {/* Status */}
          <FilterSection
            title={t("FILTER_STATUS")}
            badge={
              filters.statuses.length !== SANE_DEFAULT_FILTERS.statuses.length
                ? filters.statuses.length
                : undefined
            }>
            <ToggleGroup
              type="multiple"
              value={filters.statuses}
              onValueChange={(values) =>
                setFilters({
                  ...filters,
                  statuses: values as typeof filters.statuses,
                })
              }
              className="flex-wrap justify-start">
              {TRANSACTION_STATUSES.map((status) => (
                <ToggleGroupItem
                  key={status.value}
                  value={status.value}
                  size="sm"
                  className="text-xs">
                  {t(status.labelKey)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FilterSection>

          {/* Date */}
          <FilterSection title={t("FILTER_PERIOD")}>
            <div className="space-y-2">
              <RadioGroup
                value={filters.datePreset}
                onValueChange={handleDatePresetChange}
                className="space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  {DATE_PRESETS.map((preset) => (
                    <div key={preset.value} className="flex items-center">
                      <RadioGroupItem
                        value={preset.value}
                        id={preset.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={preset.value}
                        className="flex h-7 w-full cursor-pointer items-center justify-center rounded border border-input bg-background px-2 font-medium text-xs transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                        {t(preset.labelKey)}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center">
                  <RadioGroupItem
                    value="custom"
                    id="custom"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="custom"
                    className="flex h-7 w-full cursor-pointer items-center justify-center rounded border border-input bg-background px-2 font-medium text-xs transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                    {t("CUSTOM")}
                  </Label>
                </div>
              </RadioGroup>

              {filters.datePreset === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7 justify-start px-2 text-left text-xs",
                          !filters.dateRange.from && "text-muted-foreground",
                        )}>
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {filters.dateRange.from
                          ? moment(filters.dateRange.from).format("MMM D")
                          : t("FROM")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) =>
                          handleCustomDateChange("from", date)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7 justify-start px-2 text-left text-xs",
                          !filters.dateRange.to && "text-muted-foreground",
                        )}>
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {filters.dateRange.to
                          ? moment(filters.dateRange.to).format("MMM D")
                          : t("TO")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => handleCustomDateChange("to", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </motion.div>
              )}
            </div>
          </FilterSection>

          {/* Currency */}
          <FilterSection
            title={t("FILTER_CURRENCY")}
            badge={
              filters.currencies.length !==
              SANE_DEFAULT_FILTERS.currencies.length
                ? filters.currencies.length
                : undefined
            }>
            <ToggleGroup
              type="multiple"
              value={filters.currencies}
              onValueChange={(values) =>
                setFilters({
                  ...filters,
                  currencies: values as typeof filters.currencies,
                })
              }
              className="justify-start">
              {CURRENCIES.map((currency) => (
                <ToggleGroupItem
                  key={currency.value}
                  value={currency.value}
                  size="sm"
                  className="text-xs">
                  {currency.value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FilterSection>

          {/* Disputes */}
          <FilterSection
            title={t("FILTER_DISPUTES")}
            badge={
              filters.disputeStatuses.length !==
              SANE_DEFAULT_FILTERS.disputeStatuses.length
                ? filters.disputeStatuses.length
                : undefined
            }>
            <ToggleGroup
              type="multiple"
              value={filters.disputeStatuses}
              onValueChange={(values) =>
                setFilters({
                  ...filters,
                  disputeStatuses: values as typeof filters.disputeStatuses,
                })
              }
              className="flex-wrap justify-start">
              {DISPUTE_STATUSES.map((dispute) => (
                <ToggleGroupItem
                  key={dispute.value}
                  value={dispute.value}
                  size="sm"
                  className="text-xs">
                  {t(dispute.labelKey)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FilterSection>
        </div>
      </div>

      <DrawerFooter className="pt-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            className="h-8 flex-1 bg-transparent text-xs"
            disabled={!hasFilters}>
            <RotateCcw className="mr-1 h-3 w-3" />
            {t("RESET")}
          </Button>
          <Button onClick={onApply} className="h-8 flex-1 text-xs">
            <Check className="mr-1 h-3 w-3" />
            {t("APPLY")}
            {hasFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                {appliedFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </DrawerFooter>
    </div>
  );
}

export function TransactionFiltersDrawer({
  filters: initialFilters,
  onFiltersChange,
  children,
}: TransactionFiltersDrawerProps) {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleReset = () => {
    const resetFilters = { ...SANE_DEFAULT_FILTERS };
    resetFilters.dateRange = getDateRangeFromPreset(
      resetFilters.datePreset,
      resetFilters,
    );
    setFilters(resetFilters);
  };

  const handleApply = () => {
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFilters(initialFilters);
    }
  };

  return (
    <Drawer autoFocus open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <FilterContent
          filters={filters}
          setFilters={setFilters}
          onReset={handleReset}
          onApply={handleApply}
        />
      </DrawerContent>
    </Drawer>
  );
}
