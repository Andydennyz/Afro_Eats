/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as bookmarks from "../bookmarks.js";
import type * as comments from "../comments.js";
import type * as communitySubmissions from "../communitySubmissions.js";
import type * as emails from "../emails.js";
import type * as foodDb from "../foodDb.js";
import type * as http from "../http.js";
import type * as postLikes from "../postLikes.js";
import type * as posts from "../posts.js";
import type * as seo from "../seo.js";
import type * as social from "../social.js";
import type * as storage from "../storage.js";
import type * as subscribers from "../subscribers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  bookmarks: typeof bookmarks;
  comments: typeof comments;
  communitySubmissions: typeof communitySubmissions;
  emails: typeof emails;
  foodDb: typeof foodDb;
  http: typeof http;
  postLikes: typeof postLikes;
  posts: typeof posts;
  seo: typeof seo;
  social: typeof social;
  storage: typeof storage;
  subscribers: typeof subscribers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
