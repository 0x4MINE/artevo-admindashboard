import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Model } from "mongoose";

interface PeriodStats {
  today: number;
  week: number;
  month: number;
  year: number;
  overall: number;
}

export async function getStatsForModel(
  Model: Model<any>,
  field: string,
  dateField: string = "createdAt"
): Promise<PeriodStats> {
  const now = new Date();

  const periods: Record<string, Date> = {
    today: startOfDay(now),
    week: startOfWeek(now, { weekStartsOn: 6 }),
    month: startOfMonth(now),
    year: startOfYear(now),
  };

  // Base aggregation for overall
  const overallResult = await Model.aggregate([
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);

  const overall = overallResult[0]?.total || 0;

  const getTotalSince = async (since: Date) => {
    const result = await Model.aggregate([
      { $match: { [dateField]: { $gte: since } } },
      { $group: { _id: null, total: { $sum: `$${field}` } } },
    ]);
    return result[0]?.total || 0;
  };

  return {
    today: await getTotalSince(periods.today),
    week: await getTotalSince(periods.week),
    month: await getTotalSince(periods.month),
    year: await getTotalSince(periods.year),
    overall,
  };
}
