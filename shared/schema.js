"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertProviderSchema = exports.insertJobSchema = exports.insertUserSchema = void 0;
const drizzle_zod_1 = require("drizzle-zod");
const schema_1 = require("../src/schema");
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.users);
exports.insertJobSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.jobs);
exports.insertProviderSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.providers);
