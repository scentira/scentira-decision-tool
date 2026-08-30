import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
 app_state: defineTable({key:v.string(),revision:v.number(),data:v.string()}).index('by_key',['key']),
 login_attempts: defineTable({key:v.string(),attempts:v.number(),until:v.number()}).index('by_key',['key']),
});
