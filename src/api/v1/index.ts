import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, lt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db";
import { getPostRelations, serializePost } from "../../entities/status";
import { serializeTag } from "../../entities/tag";
import { type Variables, scopeRequired, tokenRequired } from "../../oauth";
import { bookmarks, likes } from "../../schema";
import accounts from "./accounts";
import apps from "./apps";
import featured_tags from "./featured_tags";
import follow_requests from "./follow_requests";
import instance from "./instance";
import lists from "./lists";
import markers from "./markers";
import media from "./media";
import notifications from "./notifications";
import polls from "./polls";
import statuses from "./statuses";
import tags from "./tags";
import timelines from "./timelines";

const app = new Hono<{ Variables: Variables }>();

app.route("/apps", apps);
app.route("/accounts", accounts);
app.route("/featured_tags", featured_tags);
app.route("/follow_requests", follow_requests);
app.route("/instance", instance);
app.route("/lists", lists);
app.route("/markers", markers);
app.route("/media", media);
app.route("/notifications", notifications);
app.route("/polls", polls);
app.route("/statuses", statuses);
app.route("/tags", tags);
app.route("/timelines", timelines);

app.get(
  "/preferences",
  tokenRequired,
  scopeRequired(["read:accounts"]),
  (c) => {
    return c.json({
      // TODO
      "posting:default:visibility": "public",
      "posting:default:sensitive": false,
      "posting:default:language": null,
      "reading:expand:media": "default",
      "reading:expand:spoilers": false,
    });
  },
);

app.get("/custom_emojis", async (c) => {
  const emojis = await db.query.customEmojis.findMany();
  return c.json(
    emojis.map((emoji) => ({
      shortcode: emoji.shortcode,
      url: emoji.url,
      static_url: emoji.url,
      visible_in_picker: true,
      category: emoji.category,
    })),
  );
});

app.get("/announcements", (c) => {
  return c.json([]);
});

app.get(
  "/favourites",
  tokenRequired,
  scopeRequired(["read:favourites"]),
  zValidator(
    "query",
    z.object({
      before: z.string().datetime().optional(),
      limit: z
        .string()
        .default("20")
        .transform((v) => Number.parseInt(v)),
    }),
  ),
  async (c) => {
    const owner = c.get("token").accountOwner;
    if (owner == null) {
      return c.json(
        { error: "This method requires an authenticated user" },
        422,
      );
    }
    const query = c.req.valid("query");
    const favourites = await db.query.likes.findMany({
      where: and(
        eq(likes.accountId, owner.id),
        query.before == null
          ? undefined
          : lt(likes.created, new Date(query.before)),
      ),
      with: {
        post: { with: getPostRelations(owner.id) },
      },
      orderBy: [desc(likes.created)],
      limit: query.limit,
    });
    return c.json(
      favourites.map((like) => serializePost(like.post, owner, c.req.url)),
      200,
      favourites.length < query.limit
        ? {}
        : {
            Link: `<${
              new URL(
                `?before=${encodeURIComponent(
                  favourites[favourites.length - 1].created.toISOString(),
                )}&limit=${query.limit}`,
                c.req.url,
              ).href
            }>; rel="next"`,
          },
    );
  },
);

app.get(
  "/bookmarks",
  tokenRequired,
  scopeRequired(["read:bookmarks"]),
  zValidator(
    "query",
    z.object({
      before: z.string().datetime().optional(),
      limit: z
        .string()
        .default("20")
        .transform((v) => Number.parseInt(v)),
    }),
  ),
  async (c) => {
    const owner = c.get("token").accountOwner;
    if (owner == null) {
      return c.json(
        { error: "This method requires an authenticated user" },
        422,
      );
    }
    const query = c.req.valid("query");
    const bookmarkList = await db.query.bookmarks.findMany({
      where: and(
        eq(bookmarks.accountOwnerId, owner.id),
        query.before == null
          ? undefined
          : lt(bookmarks.created, new Date(query.before)),
      ),
      with: {
        post: { with: getPostRelations(owner.id) },
      },
      orderBy: [desc(bookmarks.created)],
      limit: query.limit,
    });
    return c.json(
      bookmarkList.map((bm) => serializePost(bm.post, owner, c.req.url)),
      200,
      bookmarkList.length < query.limit
        ? {}
        : {
            Link: `<${
              new URL(
                `?before=${encodeURIComponent(
                  bookmarkList[bookmarkList.length - 1].created.toISOString(),
                )}&limit=${query.limit}`,
                c.req.url,
              ).href
            }>; rel="next"`,
          },
    );
  },
);

app.get(
  "/followed_tags",
  tokenRequired,
  scopeRequired(["read:follows"]),
  (c) => {
    const owner = c.get("token").accountOwner;
    if (owner == null) {
      return c.json(
        { error: "This method requires an authenticated user" },
        422,
      );
    }
    return c.json(
      owner.followedTags.map((tag) => serializeTag(tag, owner, c.req.url)),
    );
  },
);

export default app;
