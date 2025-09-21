"use server";
import mongoose from "mongoose";
import { createOne, deleteOne, getAll } from "../factories/crudFactory";
import { Proforma } from "../models/sellProformaModel";
import connectDB from "../mongoConnect";
import { BuyFact, BuyDetails } from "@/lib/models/buyFactureModel";

import { SellBon } from "../models/sellBonModel";
//SELL PROFORMA
export const getProformas = async () => {
  try {
    await connectDB();

    const proformas = await Proforma.find()
      .populate("clientId", "name email phone")
      .populate("userId", "name email")
      .populate("sellDetails")
      .sort({ createdAt: -1 })
      .lean();

    return proformas.map((p: any) => ({
      _id: p._id.toString(),
      sell_id: p.proformaId,
      date: p.date?.toISOString(),
      client_name: p.clientId?.name ?? "N/A",
      amount:
        p.sellDetails?.reduce((sum: number, s: any) => sum + s.price, 0) ?? 0,
      by: p.userId?.name ?? "System",
      isActive: true,
    }));
  } catch (error) {
    console.error("❌ Error fetching proformas:", error);
    return [];
  }
};

export const createProforma = createOne(Proforma);
export const deleteProforma = deleteOne(Proforma);
export async function getNextNumber(id: string) {
  const Counter = mongoose.connection.collection("counters");
  const counter = await Counter.findOne({ id });

  const nextSeq = counter ? counter.seq + 1 : 1;

  const year = new Date().getFullYear();
  const formatted = `${String(nextSeq).padStart(5, "0")}/${year}`;
  return formatted;
}

//SELL BON

// Get all Sell Bons
export const getSellBons = async () => {
  try {
    await connectDB();

    const bons = await SellBon.find()
      .populate("clientId", "name email phone")
      .populate("userId", "name email")
      .populate("sellDetails")
      .sort({ createdAt: -1 })
      .lean();

    return bons.map((b: any) => ({
      _id: b._id.toString(),
      sell_id: b.sellBonId,
      date: b.date?.toISOString(),
      client_name: b.clientId?.name ?? "N/A",
      amount:
        b.sellDetails?.reduce(
          (sum: number, s: any) => sum + s.price * s.quantity,
          0
        ) ?? 0,
      by: b.userId?.name ?? "System",
      isActive: true,
    }));
  } catch (error) {
    console.error("❌ Error fetching Sell Bons:", error);
    return [];
  }
};

// CRUD
export const createSellBon = createOne(SellBon);
export const deleteSellBon = deleteOne(SellBon);

// buy

// import { revalidatePath } from "next/cache";
// import { Product } from "../models/productModel";
// import { Lot } from "../models/lotModel";

// export interface CreateBuyTransactionData {
//   date: string;
//   userId: string;
//   suppId: string;
//   reglement: string;
//   originalCode?: string;
//   type: "purchase" | "return";
//   products: Array<{
//     prod_name: string;
//     quantity: number;
//     sellPrice: number;
//     buyPrice: number;
//   }>;
//   services: Array<{
//     name: string;
//     sellPrice: number;
//   }>;
// }

// export async function createBuyTransaction(data) {
//   try {
//     await connectDB();

//     if (!data.suppId) {
//       return { success: false, error: "Supplier is required" };
//     }

//     if (data.products.length === 0 && data.services.length === 0) {
//       return {
//         success: false,
//         error: "At least one product or service is required",
//       };
//     }

//     // 1. Create BuyFact
//     const newBuyFact = await BuyFact.create({
//       date: new Date(data.date),
//       userId: data.userId,
//       suppId: data.suppId,
//       reglement: data.reglement,
//       originalCode: data.originalCode || undefined,
//       type: data.type,
//     });

//     // 2. Handle Products / Create/Update Lots
//     for (const p of data.products) {
//       // Check if lot already exists for this product & supplier
//       let lot = await Lot.findOne({
//         prod_id: p.prod_oid || null,
//         supp_id: data.suppId,
//       });

//       if (lot) {
//         // Update existing lot
//         lot.quantity += p.quantity;
//         lot.buyPrice = p.buyPrice;
//         lot.sellPrice = p.sellPrice || lot.sellPrice;
//         await lot.save();

//         // Update stock in Product
//         await Product.findByIdAndUpdate(p.prod_oid, {
//           $inc: { quantity: p.quantity },
//         });
//       } else {
//         // Create new lot
//         lot = await Lot.create({
//           prod_id: p.prod_oid,
//           supp_id: data.suppId,
//           quantity: p.quantity,
//           buyPrice: p.buyPrice,
//           sellPrice: p.sellPrice || 0,
//           date: new Date(),
//           isActive: true,
//         });

//         // Update stock in Product
//         await Product.findByIdAndUpdate(p.prod_oid, {
//           $inc: { quantity: p.quantity },
//         });
//       }

//       // Create BuyDetail for this product
//       await BuyDetails.create({
//         buyFactId: newBuyFact._id,
//         name: p.prod_name,
//         quantity: p.quantity,
//         price: p.buyPrice,
//         type: "product",
//       });
//     }

//     // 3. Handle Services
//     for (const s of data.services) {
//       await BuyDetails.create({
//         buyFactId: newBuyFact._id,
//         name: s.name,
//         quantity: 1,
//         price: s.buyPrice,
//         type: "service",
//       });
//     }

//     // Revalidate pages
//     revalidatePath("/dashboard/buy/transactions");

//     return {
//       success: true,
//       buyFactId: newBuyFact.buyFactId,
//       _id: newBuyFact._id.toString(),
//       message: "Purchase transaction saved successfully",
//     };
//   } catch (error) {
//     console.error("❌ Error creating buy transaction:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to create transaction",
//     };
//   }
// }
// export async function getBuyTransactionById(id: string) {
//   try {
//     await connectDB();

//     const transaction = await BuyFact.findById(id)
//       .populate("buyDetails")
//       .populate("suppId")
//       .populate("userId");

//     if (!transaction) {
//       return { success: false, error: "Transaction not found" };
//     }

//     return {
//       success: true,
//       data: JSON.parse(JSON.stringify(transaction)),
//     };
//   } catch (error: any) {
//     console.error("Error fetching transaction:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to fetch transaction",
//     };
//   }
// }

// export async function getBuyTransactionByBuyFactId(buyFactId: number) {
//   try {
//     await connectDB();

//     const transaction = await BuyFact.findOne({ buyFactId })
//       .populate("buyDetails")
//       .populate("suppId")
//       .populate("userId");

//     if (!transaction) {
//       return { success: false, error: "Transaction not found" };
//     }

//     return {
//       success: true,
//       data: JSON.parse(JSON.stringify(transaction)),
//     };
//   } catch (error: any) {
//     console.error("Error fetching transaction:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to fetch transaction",
//     };
//   }
// }

// export const getBuyBons = async () => {
//   try {
//     await connectDB();

//     const bons = await BuyFact.find({ type: "purchase" })
//       .populate("buyDetails")
//       .populate("suppId", "name phone email")
//       .populate("userId", "name email")
//       .sort({ createdAt: -1 })
//       .lean();

//     console.log(bons);
//     return bons.map((b: any) => ({
//       _id: b._id.toString(),
//       buy_id: b.buyFactId,
//       date: b.date?.toISOString(),
//       supplier_name: b.suppId?.name ?? "N/A",
//       amount:
//         b.buyDetails?.reduce(
//           (sum: number, s: any) => sum + s.price * s.quantity,
//           0
//         ) ?? 0,
//       by: b.userId?.name ?? "System",
//       isActive: true,
//     }));
//   } catch (error) {
//     console.error("❌ Error fetching Buy Bons:", error);
//     return [];
//   }
// };

// export async function getBuyReturns() {
//   await connectDB();
//   try {
//     const returns = await BuyFact.find({ type: "return" })
//       .populate("buyDetails")
//       .populate("suppId", "name phone email")
//       .populate("userId", "name email")
//       .sort({ date: -1 })
//       .lean();

//     return returns.map((r: any) => ({
//       _id: r._id,
//       return_id: r.buyFactId,
//       date: r.date,
//       supplier_name: r.suppId?.name ?? "Unknown",
//       amount:
//         r.buyDetails?.reduce(
//           (sum: number, d: any) => sum + d.price * d.quantity,
//           0
//         ) ?? 0,
//       by: r.userId?.username ?? "System",
//       originalCode: r.originalCode ?? "-",
//     }));
//   } catch (error) {
//     console.error("Error fetching buy returns:", error);
//     throw new Error("Failed to fetch buy returns");
//   }
// }

import { revalidatePath } from "next/cache";
import { Product } from "../models/productModel";
import { Lot } from "../models/lotModel";
import FilterState from "@/types/FilterState";

export interface CreateBuyTransactionData {
  date: string;
  userId: string;
  suppId: string;
  reglement: string;
  originalCode?: string;
  type: "purchase" | "return";
  products: Array<{
    prod_name: string;
    prod_oid?: string;
    lot_id?: string;
    quantity: number;
    sellPrice?: number;
    buyPrice: number;
    return_reason?: string;
  }>;
  services: Array<{
    name: string;
    buyPrice: number;
    return_reason?: string;
  }>;
}

export async function createBuyTransaction(data: CreateBuyTransactionData) {
  try {
    await connectDB();

    if (!data.suppId) {
      return { success: false, error: "Supplier is required" };
    }

    if (data.products.length === 0 && data.services.length === 0) {
      return {
        success: false,
        error: "At least one product or service is required",
      };
    }

    // 1. Create BuyFact
    const newBuyFact = await BuyFact.create({
      date: new Date(data.date),
      userId: data.userId,
      suppId: data.suppId,
      reglement: data.reglement,
      originalCode: data.originalCode || undefined,
      type: data.type,
    });

    // 2. Handle Products
    if (data.type === "purchase") {
      await handlePurchaseProducts(data, newBuyFact._id);
    } else if (data.type === "return") {
      await handleReturnProducts(data, newBuyFact._id);
    }

    // 3. Handle Services
    for (const s of data.services) {
      await BuyDetails.create({
        buyFactId: newBuyFact._id,
        name: s.name,
        quantity: 1,
        price: s.buyPrice,
        type: "service",
        tva: 0, // Add default TVA
      });
    }

    // Revalidate pages
    revalidatePath("/dashboard/buy/transactions");
    revalidatePath("/dashboard/buy/returns");

    return {
      success: true,
      buyFactId: newBuyFact.buyFactId,
      _id: newBuyFact._id.toString(),
      message: `${
        data.type === "purchase" ? "Purchase" : "Return"
      } transaction saved successfully`,
    };
  } catch (error) {
    console.error("❌ Error creating buy transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to create transaction",
    };
  }
}

async function handlePurchaseProducts(
  data: CreateBuyTransactionData,
  buyFactId: string
) {
  for (const p of data.products) {
    // Check if lot already exists for this product & supplier
    let lot = await Lot.findOne({
      prod_id: p.prod_oid || null,
      supp_id: data.suppId,
    });

    if (lot) {
      // Update existing lot
      lot.quantity += p.quantity;
      lot.buyPrice = p.buyPrice;
      lot.sellPrice = p.sellPrice || lot.sellPrice;
      await lot.save();

      // Update stock in Product
      if (p.prod_oid) {
        await Product.findByIdAndUpdate(p.prod_oid, {
          $inc: { quantity: p.quantity },
        });
      }
    } else {
      // Create new lot
      lot = await Lot.create({
        prod_id: p.prod_oid,
        supp_id: data.suppId,
        quantity: p.quantity,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice || 0,
        date: new Date(),
        isActive: true,
      });

      // Update stock in Product
      if (p.prod_oid) {
        await Product.findByIdAndUpdate(p.prod_oid, {
          $inc: { quantity: p.quantity },
        });
      }
    }

    // Create BuyDetail for this product
    await BuyDetails.create({
      buyFactId: buyFactId,
      name: p.prod_name,
      quantity: p.quantity,
      price: p.buyPrice,
      type: "product",
      tva: 0, // Add default TVA
    });
  }
}

async function handleReturnProducts(
  data: CreateBuyTransactionData,
  buyFactId: string
) {
  for (const p of data.products) {
    // For returns, we need to reduce stock
    if (p.lot_id) {
      // Find the specific lot
      const lot = await Lot.findById(p.lot_id);
      if (lot) {
        if (lot.quantity < p.quantity) {
          throw new Error(
            `Insufficient quantity in lot ${p.lot_id}. Available: ${lot.quantity}, Requested: ${p.quantity}`
          );
        }

        // Reduce lot quantity
        lot.quantity -= p.quantity;
        await lot.save();

        // Reduce product stock
        if (p.prod_oid) {
          await Product.findByIdAndUpdate(p.prod_oid, {
            $inc: { quantity: -p.quantity },
          });
        }
      }
    } else if (p.prod_oid) {
      // Find any lot for this product from this supplier
      const lot = await Lot.findOne({
        prod_id: p.prod_oid,
        supp_id: data.suppId,
        quantity: { $gte: p.quantity },
      });

      if (lot) {
        lot.quantity -= p.quantity;
        await lot.save();

        // Reduce product stock
        await Product.findByIdAndUpdate(p.prod_oid, {
          $inc: { quantity: -p.quantity },
        });
      } else {
        throw new Error(`Insufficient stock for product ${p.prod_name}`);
      }
    }

    // Create BuyDetail for this return (negative quantity to indicate return)
    await BuyDetails.create({
      buyFactId: buyFactId,
      name: p.prod_name,
      quantity: p.quantity, // Keep positive for reporting, but handle as return in business logic
      price: p.buyPrice,
      type: "product",
      tva: 0,
    });
  }
}

export async function getBuyTransactionById(id: string) {
  try {
    await connectDB();

    const transaction = await BuyFact.findById(id)
      .populate("buyDetails")
      .populate("suppId")
      .populate("userId");

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(transaction)),
    };
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction",
    };
  }
}

// Add the missing getBuyFactById function
export async function getBuyFactById(id: string) {
  try {
    await connectDB();

    const buyFact = await BuyFact.findById(id)
      .populate({
        path: "buyDetails",
        select: "name quantity price type tva",
      })
      .populate("suppId", "name")
      .populate("userId", "name")
      .lean();

    if (!buyFact) {
      return null;
    }

    // Calculate total
    const total =
      buyFact.buyDetails?.reduce(
        (sum: number, detail: any) => sum + detail.price * detail.quantity,
        0
      ) || 0;

    return {
      ...buyFact,
      _id: buyFact._id.toString(),
      total,
    };
  } catch (error) {
    console.error("Error fetching buy fact:", error);
    throw new Error("Failed to fetch buy fact");
  }
}

export async function getBuyTransactionByBuyFactId(buyFactId: number) {
  try {
    await connectDB();

    const transaction = await BuyFact.findOne({ buyFactId })
      .populate("buyDetails")
      .populate("suppId")
      .populate("userId");

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(transaction)),
    };
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction",
    };
  }
}

// Get purchase transactions only (for selecting original bills in returns)
export async function getPurchaseTransactions(supplierId?: string) {
  try {
    await connectDB();

    const query: any = { type: "purchase" };
    if (supplierId) {
      query.suppId = supplierId;
    }

    const transactions = await BuyFact.find(query)
      .populate("suppId", "name")
      .populate("buyDetails")
      .sort({ createdAt: -1 })
      .lean();

    return transactions.map((t: any) => ({
      _id: t._id.toString(),
      buyFactId: t.buyFactId,
      date: t.date,
      supplierName: t.suppId?.name || "Unknown",
      total:
        t.buyDetails?.reduce(
          (sum: number, detail: any) => sum + detail.price * detail.quantity,
          0
        ) || 0,
    }));
  } catch (error) {
    console.error("Error fetching purchase transactions:", error);
    throw new Error("Failed to fetch purchase transactions");
  }
}

export const getBuyBons = async () => {
  try {
    await connectDB();

    const bons = await BuyFact.find({ type: "purchase" })
      .populate("buyDetails")
      .populate("suppId", "name phone email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return bons.map((b: any) => ({
      _id: b._id.toString(),
      buy_id: b.buyFactId,
      date: b.date?.toISOString(),
      supplier_name: b.suppId?.name ?? "N/A",
      amount:
        b.buyDetails?.reduce(
          (sum: number, s: any) => sum + s.price * s.quantity,
          0
        ) ?? 0,
      by: b.userId?.name ?? "System",
      isActive: true,
    }));
  } catch (error) {
    console.error("❌ Error fetching Buy Bons:", error);
    return [];
  }
};

export async function getBuyReturns() {
  try {
    await connectDB();

    const returns = await BuyFact.find({ type: "return" })
      .populate("buyDetails")
      .populate("suppId", "name phone email")
      .populate("userId", "name email")
      .sort({ date: -1 })
      .lean();

    return returns.map((r: any) => ({
      _id: r._id.toString(),
      return_id: r.buyFactId,
      date: r.date,
      supplier_name: r.suppId?.name ?? "Unknown",
      amount:
        r.buyDetails?.reduce(
          (sum: number, d: any) => sum + d.price * d.quantity,
          0
        ) ?? 0,
      by: r.userId?.name ?? "System",
      originalCode: r.originalCode ?? "-",
    }));
  } catch (error) {
    console.error("Error fetching buy returns:", error);
    throw new Error("Failed to fetch buy returns");
  }
}

//Pagination
export const getPaginatedSellBons = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  try {
    await connectDB();
    const skip = (page - 1) * limit;
    const match: any = {};

    // --- Date range (boundless, include end day) ---
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const dateFilter: any = {};
      if (filters.dateRange[0])
        dateFilter.$gte = new Date(filters.dateRange[0]);
      if (filters.dateRange[1]) {
        const end = new Date(filters.dateRange[1]);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      match.date = dateFilter;
    }

    // NOTE: Do NOT put `amount` into initial match because it's computed later.

    // --- Aggregation pipeline ---
    const pipeline: any[] = [
      { $match: match },

      // client join
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      // details join
      {
        $lookup: {
          from: "sellbdetails",
          localField: "_id",
          foreignField: "sellBonId",
          as: "details",
        },
      },

      // compute total amount, client_name, itemCount
      {
        $addFields: {
          amount: {
            $sum: {
              $map: {
                input: "$details",
                as: "detail",
                in: { $multiply: ["$$detail.price", "$$detail.quantity"] },
              },
            },
          },
          client_name: { $ifNull: ["$client.name", "Walk-in Customer"] },
          itemCount: { $size: "$details" },
        },
      },
    ];

    // --- Search (after amount/client_name exists) ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            // numeric sellBonId search, fallback to -1 so it doesn't match strings
            { sellBonId: isNaN(Number(searchTerm)) ? -1 : Number(searchTerm) },
            { client_name: { $regex: searchTerm, $options: "i" } },
          ],
        },
      });
    }

    // --- Apply amount filter AFTER it's calculated ---
    if (filters.amountRange) {
      pipeline.push({
        $match: {
          amount: {
            $gte: filters.amountRange[0],
            $lte: filters.amountRange[1],
          },
        },
      });
    }

    // --- Sorting & pagination ---
    pipeline.push({ $sort: { date: -1 } }, { $skip: skip }, { $limit: limit });

    // --- Query + count ---
    const [sellBons, total] = await Promise.all([
      SellBon.aggregate(pipeline),
      SellBon.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = total[0]?.count || 0;

    // --- Serialize safely ---
    const serializedSellBons = sellBons.map((bon: any) => ({
      _id: bon._id.toString(),
      sellBonId: bon.sellBonId ?? 0,
      date: bon.date ? bon.date.toISOString() : null,
      amount: bon.amount ?? 0,
      client_name: bon.client_name ?? "Walk-in Customer",
      itemCount: bon.itemCount ?? 0,
      userId: bon.userId?.toString() || null,
      client: bon.client
        ? {
            _id: bon.client._id?.toString(),
            client_id: bon.client.client_id || "",
            name: bon.client.name || "",
            email: bon.client.email || "",
            phone: bon.client.phone || "",
          }
        : null,
      clientId: bon.clientId?.toString() || null,
      details:
        bon.details?.map((detail: any) => ({
          _id: detail._id?.toString(),
          name: detail.name || "",
          quantity: detail.quantity || 0,
          price: detail.price || 0,
          tva: detail.tva || 0,
          type: detail.type || "product",
          total: (detail.quantity || 0) * (detail.price || 0),
          createdAt: detail.createdAt
            ? new Date(detail.createdAt).toISOString()
            : null,
          updatedAt: detail.updatedAt
            ? new Date(detail.updatedAt).toISOString()
            : null,
        })) || [],
      createdAt: bon.createdAt ? new Date(bon.createdAt).toISOString() : null,
      updatedAt: bon.updatedAt ? new Date(bon.updatedAt).toISOString() : null,
    }));

    return {
      sellBons: serializedSellBons,
      total: totalCount,
    };
  } catch (error: any) {
    console.error("❌ Error in getPaginatedSellBons:", error);
    throw new Error("Failed to fetch paginated sell bons");
  }
};
export const getPaginatedProformas = async (
  page: number = 1,
  limit: number = 5,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  try {
    await connectDB();
    const skip = (page - 1) * limit;
    const match: any = {};

    // --- Date range (boundless, include end day) ---
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const dateFilter: any = {};
      if (filters.dateRange[0])
        dateFilter.$gte = new Date(filters.dateRange[0]);
      if (filters.dateRange[1]) {
        const end = new Date(filters.dateRange[1]);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      match.date = dateFilter;
    }

    // --- Aggregation pipeline ---
    const pipeline: any[] = [
      { $match: match },

      // client join
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      // user join to get creator name
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // proforma details join
      {
        $lookup: {
          from: "sellpdetails",
          localField: "_id",
          foreignField: "proformaId",
          as: "details",
        },
      },

      // compute total amount, client_name, itemCount, by
      {
        $addFields: {
          amount: {
            $sum: {
              $map: {
                input: "$details",
                as: "detail",
                in: { $multiply: ["$$detail.price", "$$detail.quantity"] },
              },
            },
          },
          client_name: { $ifNull: ["$client.name", "Walk-in Customer"] },
          itemCount: { $size: "$details" },
          by: { $ifNull: ["$user.name", "System"] }, // Derive from user lookup
        },
      },
    ];

    // --- Search (after amount/client_name/by exists) ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            // Search by numeric proformaId
            { proformaId: isNaN(Number(searchTerm)) ? -1 : Number(searchTerm) },
            { client_name: { $regex: searchTerm, $options: "i" } },
            { by: { $regex: searchTerm, $options: "i" } },
          ],
        },
      });
    }

    // --- Apply amount filter AFTER it's calculated ---
    if (filters.amountRange) {
      pipeline.push({
        $match: {
          amount: {
            $gte: filters.amountRange[0],
            $lte: filters.amountRange[1],
          },
        },
      });
    }

    // --- Sorting & pagination ---
    pipeline.push({ $sort: { date: -1 } }, { $skip: skip }, { $limit: limit });

    // --- Query + count ---
    const [proformas, total] = await Promise.all([
      Proforma.aggregate(pipeline),
      Proforma.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = total[0]?.count || 0;

    // --- Serialize safely ---
    const serializedProformas = proformas.map((proforma: any) => ({
      _id: proforma._id?.toString() || "",
      proformaId: proforma.proformaId || 0, // Use numeric proformaId
      sell_id: proforma.proformaId || 0, // For compatibility with existing component
      date: proforma.date ? proforma.date.toISOString() : null,
      amount: proforma.amount ?? 0,
      client_name: proforma.client_name || "Walk-in Customer",
      itemCount: proforma.itemCount ?? 0,
      by: proforma.by || "System", // Now derived from user lookup
      userId: proforma.userId?.toString() || null,

      // User info (from lookup)
      user: proforma.user
        ? {
            _id: proforma.user._id?.toString() || "",
            name: proforma.user.name || "",
            email: proforma.user.email || "",
          }
        : null,

      client: proforma.client
        ? {
            _id: proforma.client._id?.toString() || "",
            client_id: proforma.client.client_id || "",
            name: proforma.client.name || "",
            email: proforma.client.email || "",
            phone: proforma.client.phone || "",
          }
        : null,
      clientId: proforma.clientId?.toString() || null,

      details:
        proforma.details?.map((detail: any) => ({
          _id: detail._id?.toString() || "",
          name: detail.name || "",
          quantity: detail.quantity || 0,
          price: detail.price || 0,
          tva: detail.tva || 0,
          type: detail.type || "product",
          total: (detail.quantity || 0) * (detail.price || 0),
          createdAt: detail.createdAt
            ? new Date(detail.createdAt).toISOString()
            : null,
          updatedAt: detail.updatedAt
            ? new Date(detail.updatedAt).toISOString()
            : null,
        })) || [],

      createdAt: proforma.createdAt
        ? new Date(proforma.createdAt).toISOString()
        : null,
      updatedAt: proforma.updatedAt
        ? new Date(proforma.updatedAt).toISOString()
        : null,
    }));

    return {
      proformas: serializedProformas,
      total: totalCount,
    };
  } catch (error: any) {
    console.error("❌ Error in getPaginatedProformas:", error);
    throw new Error("Failed to fetch paginated proformas");
  }
};
export const getPaginatedBuyFacts = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  try {
    await connectDB();
    const skip = (page - 1) * limit;
    const match: any = {};

    // --- Date range (boundless, include end day) ---
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const dateFilter: any = {};
      if (filters.dateRange[0])
        dateFilter.$gte = new Date(filters.dateRange[0]);
      if (filters.dateRange[1]) {
        const end = new Date(filters.dateRange[1]);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      match.date = dateFilter;
    }

    // NOTE: Do NOT put `amount` into initial match because it's computed later.

    // --- Aggregation pipeline ---
    const pipeline: any[] = [
      { $match: match },

      // supplier join
      {
        $lookup: {
          from: "suppliers",
          localField: "suppId",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },

      // buy details join
      {
        $lookup: {
          from: "buydetails",
          localField: "_id",
          foreignField: "buyFactId",
          as: "details",
        },
      },

      // compute total amount, supplier_name, itemCount
      {
        $addFields: {
          amount: {
            $sum: {
              $map: {
                input: "$details",
                as: "detail",
                in: { $multiply: ["$$detail.price", "$$detail.quantity"] },
              },
            },
          },
          supplier_name: { $ifNull: ["$supplier.name", "Unknown Supplier"] },
          itemCount: { $size: "$details" },
        },
      },
    ];

    // --- Search (after amount/supplier_name exists) ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            // numeric buyFactId search, fallback to -1 so it doesn't match strings
            { buyFactId: isNaN(Number(searchTerm)) ? -1 : Number(searchTerm) },
            { supplier_name: { $regex: searchTerm, $options: "i" } },
            { reglement: { $regex: searchTerm, $options: "i" } },
            { type: { $regex: searchTerm, $options: "i" } },
          ],
        },
      });
    }

    // --- Apply amount filter AFTER it's calculated ---
    if (filters.amountRange) {
      pipeline.push({
        $match: {
          amount: {
            $gte: filters.amountRange[0],
            $lte: filters.amountRange[1],
          },
        },
      });
    }

    // --- Sorting & pagination ---
    pipeline.push({ $sort: { date: -1 } }, { $skip: skip }, { $limit: limit });

    // --- Query + count ---
    const [buyFacts, total] = await Promise.all([
      BuyFact.aggregate(pipeline),
      BuyFact.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = total[0]?.count || 0;

    // --- Serialize safely ---
    const serializedBuyFacts = buyFacts.map((fact: any) => ({
      _id: fact._id.toString(),
      buyFactId: fact.buyFactId ?? 0,
      date: fact.date ? fact.date.toISOString() : null,
      amount: fact.amount ?? 0,
      supplier_name: fact.supplier_name ?? "Unknown Supplier",
      reglement: fact.reglement ?? "",
      type: fact.type ?? "purchase",
      itemCount: fact.itemCount ?? 0,
      originalCode: fact.originalCode ?? "",
      userId: fact.userId?.toString() || null,
      supplier: fact.supplier
        ? {
            _id: fact.supplier._id?.toString(),
            supp_id: fact.supplier.supp_id || "",
            name: fact.supplier.name || "",
            email: fact.supplier.email || "",
            phone: fact.supplier.phone || "",
            address: fact.supplier.address || "",
          }
        : null,
      suppId: fact.suppId?.toString() || null,
      details:
        fact.details?.map((detail: any) => ({
          _id: detail._id?.toString(),
          name: detail.name || "",
          quantity: detail.quantity || 0,
          price: detail.price || 0,
          tva: detail.tva || 0,
          type: detail.type || "product",
          total: (detail.quantity || 0) * (detail.price || 0),
          createdAt: detail.createdAt
            ? new Date(detail.createdAt).toISOString()
            : null,
          updatedAt: detail.updatedAt
            ? new Date(detail.updatedAt).toISOString()
            : null,
        })) || [],
      createdAt: fact.createdAt ? new Date(fact.createdAt).toISOString() : null,
      updatedAt: fact.updatedAt ? new Date(fact.updatedAt).toISOString() : null,
    }));

    return {
      buyFacts: serializedBuyFacts,
      total: totalCount,
    };
  } catch (error: any) {
    console.error("❌ Error in getPaginatedBuyFacts:", error);
    throw new Error("Failed to fetch paginated buy facts");
  }
};