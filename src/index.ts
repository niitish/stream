import fs from "fs";
import path from "path";
import fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { config } from "dotenv";

const PUBLIC = path.join(__dirname, "..", "public");
const INDEX = path.join(__dirname, "pages", "index.html");
const VIDEO = path.join(__dirname, "..", "videos", "src.mp4");
const ENV = path.join(__dirname, "..", ".env");
const CHUNK_SIZE = 10 ** 6;

config({ path: ENV });

const PASSWORD = process.env.PASSWORD;
const ENCKEY = process.env.ENCKEY;
const HOST = process.env.HOST;
const PORT = Number(process.env.PORT);

let users: string[] = []; // egregious practice, will replace it with redis	or something

const MSG_TYPES = {
	JOIN: "JOIN",
	LEAVE: "LEAVE",
	BAN: "BAN",
	MESSAGE: "MESSAGE",
};

type RegisterSchema = {
	name: string;
};

type AuthSchema = {
	password: string;
};

const app = fastify({ logger: false });

app.register(websocket);
app.register(fastifyStatic, {
	root: PUBLIC,
	prefix: "/static/",
});
app.register(fastifyCors, {
	origin: HOST,
	methods: ["GET", "POST"],
});
app.register(fastifyCookie, {
	secret: ENCKEY,
	parseOptions: {
		domain: HOST,
		sameSite: "lax",
		secure: "auto",
	},
});

app.register(async (fastify) => {
	fastify.get("/ws", { websocket: true }, (connection, req) => {
		const { socket } = connection;

		const name = req.cookies.name;
		if (!name) return socket.close(4000, "No cookie");

		const user = app.unsignCookie(name);
		if (!user.valid) return socket.close(4000, "Invalid cookie");

		const color = req.cookies.color;

		socket.onmessage = (message) => {
			console.log("Message received", message.data);
			const data = JSON.parse(message.data.toString());
			const { type, payload } = data;

			switch (type) {
				case MSG_TYPES.JOIN:
					break;
				case MSG_TYPES.LEAVE:
					break;
				case MSG_TYPES.BAN:
					break;
				case MSG_TYPES.MESSAGE:
					app.websocketServer.clients.forEach((client) => {
						if (client.readyState === 1) {
							client.send(
								JSON.stringify({
									type,
									payload: {
										name: user.value,
										color: color,
										message: payload,
									},
								})
							);
						}
					});
					break;
				default:
					break;
			}
		};
	});
});

app.get("/", (request, reply) => {
	fs.readFile(INDEX, async (err, data) => {
		if (err) {
		} else {
			reply.code(200).headers({
				"Content-Type": "text/html",
			});
			reply.send(data);
			return reply;
		}
	});
});

app.get("/video", async (request, reply) => {
	const range = request.headers.range;

	if (!range) {
		reply.code(400).send("I need a range!");
		return reply;
	}

	const stat = fs.statSync(VIDEO);
	const fileSize = stat.size;

	const start = +range.replace(/\D/g, "");
	const end = Math.min(start + CHUNK_SIZE, fileSize - 1);

	const file = fs.createReadStream(VIDEO, { start, end });
	const head = {
		"Content-Range": `bytes ${start}-${end}/${fileSize}`,
		"Accept-Ranges": "bytes",
		"Content-Length": end - start + 1,
		"Content-Type": "video/mp4",
	};

	reply.code(206).headers(head);
	reply.send(file);
	return reply;
});

app.post<{ Body: RegisterSchema }>("/register", async (request, reply) => {
	const { name } = request.body;

	if (!name) {
		reply.code(400).send("I need a username!");
		return reply;
	}

	if (users.includes(name))
		return reply.code(400).send("Choose a different username!");
	else users.push(name);

	return reply
		.status(200)
		.cookie("name", name, { signed: true })
		.send("Registered!");
});

app.post<{ Body: AuthSchema }>("/auth", async (request, reply) => {
	const { password } = request.body;

	if (!password) {
		reply.code(400).send("I need a password!");
		return reply;
	}

	if (password === PASSWORD) {
		return reply
			.status(200)
			.cookie("admin", "true", {
				signed: true,
			})
			.send("Hello admin!");
	} else {
		return reply.status(401).send("Wrong password!");
	}
});

const start = async () => {
	try {
		await app.listen({ port: PORT, host: "0.0.0.0" });
		console.log(app.server.address());
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
