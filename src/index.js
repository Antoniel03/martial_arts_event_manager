import express, { json } from "express";
const app = express();
import { createServer } from "node:http";
const server = createServer(app);
import { Server } from "socket.io";
const io = new Server(server);
import { fightsRouter } from "./modules/routes/fights.js";
import { athletesRouter } from "./modules/routes/athletes.js";
import { tournamentsRouter } from "./modules/routes/tournaments.js";

import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(json());
app.use(express.urlencoded({ extended: true }));

app.use("/fights", fightsRouter(io));
app.use("/athletes", athletesRouter);
app.use("/tournaments", tournamentsRouter());

app.get("/", (req, res) => {
  res.status(200).render("index");
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
