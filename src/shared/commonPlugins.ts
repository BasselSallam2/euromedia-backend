// plugins/hashPassword.plugin.ts
import bcrypt from "bcryptjs";
import { Schema } from "mongoose";

export function hashPasswordPlugin(schema: Schema) {
  schema.pre("save", async function (next) {
    const doc = this as any;

    if (doc.isNew || doc.isModified("password")) {
      try {
        doc.password = await bcrypt.hash(doc.password, 12);
      } catch (err) {
        return next(err as any);
      }
    }

    next();
  });

  schema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate() as any;

    if (update.password) {
      try {
        update.password = await bcrypt.hash(update.password, 12);
      } catch (err) {
        return next(err as any);
      }
    }

    next();
  });

  schema.pre("updateOne", async function (next) {
    const update = this.getUpdate() as any;

    if (update.password) {
      try {
        update.password = await bcrypt.hash(update.password, 12);
      } catch (err) {
        return next(err as any);
      }
    }

    next();
  });
}

export function fixSoftDeleted(schema: Schema) {
  schema.pre(["find", "findOne", "countDocuments"], function (next) {
    this.where({ deleted: false });
    this.select("-deleted");
    next();
  });
}

interface SoftDeleteOptions {
  flag: string;      
  targets: string[];  
  prefix?: string;   
}

export function softDeletePlugin(schema: Schema, options: SoftDeleteOptions) {
  const flag = options.flag || "deleted";
  const targets = options.targets || [];
  const prefix = options.prefix || `${new Date().toISOString()}_deleted_`;

  schema.pre("save", function (next) {
    if (this.isModified(flag) && this[flag] === true) {
      targets.forEach((field) => {
        if (this[field]) {
          this[field] = `${prefix}${this[field]}`;
        }
      });
    }
    next();
  });

schema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  if (update?.[flag] === true || update?.$set?.[flag] === true) {
    const doc = await this.model.findOne(this.getQuery()); 

    if (doc) {
      targets.forEach((field) => {
        const currentValue = doc[field];
        if (currentValue && !currentValue.startsWith(prefix)) {
          if (!update.$set) update.$set = {};
          update.$set[field] = `${prefix}${currentValue}`;
        }
      });
    }
  }

  next();
});

}

export function autoIncrementPlugin(schema: Schema, options: { field: string; startAt?: number }) {
  const field = options.field;
  const startAt = options.startAt || 1;

  schema.pre("save", async function (next) {
    const doc = this as any;

    if (doc.isNew && !doc[field]) {
      try {
        // Find the highest value for the field and increment it
        const highestDoc = await (this.constructor as any).findOne({ deleted: false })
          .sort({ [field]: -1 })
          .select(field)
          .lean()
          .exec();

        const nextValue = highestDoc && highestDoc[field]
          ? highestDoc[field] + 1
          : startAt;

        doc[field] = nextValue;
      } catch (err) {
        return next(err as any);
      }
    }

    next();
  });
}






