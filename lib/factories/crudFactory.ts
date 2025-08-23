import connectDB from "../mongoConnect";



export const createOne = (Model: any) => async (data: any) => {
  try {
    await connectDB();
    const doc = await Model.create(data);

    const plainDoc = doc.toObject({ getters: true });
    plainDoc._id = plainDoc._id.toString(); 
    plainDoc.createdAt = plainDoc.createdAt?.toISOString?.();
    plainDoc.updatedAt = plainDoc.updatedAt?.toISOString?.();

    return { success: true, data: plainDoc };
  } catch (err) {
    console.error("❌ Error creating document:", err);
    return { success: false, error: "Failed to create document" };
  }
};

export const getAll = (Model: any) => async () => {
  try {
    await connectDB();
    const docs = await Model.find().lean();

    return docs.map((doc: any) => {
      const serializedDoc: any = { ...doc };

      if (doc._id) {
        serializedDoc._id = doc._id.toString();
      }

      if (doc.id) {
        serializedDoc.id = doc.id.toString();
      }

      if (doc.createdAt instanceof Date) {
        serializedDoc.createdAt = doc.createdAt.toISOString();
      }
      if (doc.updatedAt instanceof Date) {
        serializedDoc.updatedAt = doc.updatedAt.toISOString();
      }

      return serializedDoc;
    });
  } catch (err) {
    console.error("❌ Error fetching documents:", err);
    return [];
  }
};

export const getOne = (Model: any) => async (id: string) => {
  try {
    await connectDB();
    const doc = await Model.findById(id).lean();
    if (!doc) return null;

    return {
      ...doc,
      id: doc._id?.toString(),
      _id: undefined,
      __v: undefined,
      createdAt: doc.createdAt?.toISOString?.(),
      updatedAt: doc.updatedAt?.toISOString?.(),
    };
  } catch (err) {
    console.error("❌ Error fetching document:", err);
    return null;
  }
};

export const updateOne =
  (Model: any) => async (id: string, updates: Record<string, any>) => {
    try {
      await connectDB();
      const updatedDoc = await Model.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).lean();

      if (!updatedDoc) return { success: false, error: "Not found" };

      return {
        success: true,
        data: {
          ...updatedDoc,
          id: updatedDoc._id?.toString(),
          _id: undefined,
          __v: undefined,
          createdAt: updatedDoc.createdAt?.toISOString?.(),
          updatedAt: updatedDoc.updatedAt?.toISOString?.(),
        },
      };
    } catch (err) {
      console.error("❌ Error updating document:", err);
      return { success: false, error: "Failed to update document" };
    }
  };

export const deleteOne = (Model: any) => async (id: string) => {
  try {
    await connectDB();
    const deleted = await Model.findByIdAndDelete(id).lean();

    if (!deleted) return { success: false, error: "Not found" };

    return { success: true };
  } catch (err) {
    console.error("❌ Error deleting document:", err);
    return { success: false, error: "Failed to delete document" };
  }
};
