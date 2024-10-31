import { Hono } from "hono";
import accounts from "./accounts";
import emojis from "./emojis";
import home from "./home";
import login from "./login";
import profile from "./profile";
import setup from "./setup";
import tags from "./tags";

const page = new Hono();

page.route("/", home);
page.route("/:handle{@[^/]+}", profile);
page.route("/login", login);
page.route("/setup", setup);
page.route("/accounts", accounts);
page.route("/emojis", emojis);
page.route("/tags", tags);

export default page;
