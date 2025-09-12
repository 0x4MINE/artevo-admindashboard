export interface ReturnProduct {
  _id?: string;
  prod_id: string;
  prod_name: string;
  prod_oid?: string;
  lot_id: string;
  original_quantity: number;
  return_quantity: number;
  buyPrice: number;
  return_reason: string;
}

export interface ReturnService {
  _id?: string;
  serv_id: string;
  name: string;
  buyPrice: number;
  tva: number;
  return_reason: string;
}

export interface ReturnTransaction {
  _id?: string;
  return_id: string;
  date: string;
  supplier_name: string;
  amount: number;
  by: string;
  originalCode: string;
  supp_id: string;
}

export interface CreateReturnData {
  date: string;
  userId: string;
  suppId: string;
  reglement: string;
  originalCode: string;
  type: "return";
  products: Array<{
    lot_id: string;
    prod_name: string;
    prod_oid?: string;
    quantity: number;
    buyPrice: number;
    return_reason: string;
  }>;
  services: Array<{
    name: string;
    buyPrice: number;
    return_reason: string;
  }>;
}