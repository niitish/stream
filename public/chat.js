const MSG_TYPES = {
	JOIN: "JOIN",
	BAN: "BAN",
	MESSAGE: "MESSAGE",
	AUTH: "AUTH",
};

const HOST = window.location.host;

const join = document.getElementById("join");
const msgInp = document.getElementById("msgInp");
const chatList = document.getElementById("chatList");

let WS;

function openSocket() {
	WS = new WebSocket(`ws://${HOST}/ws`);

	WS.onopen = () => {
		console.log("Connected to the server");
	};

	WS.onclose = () => {
		console.log("Disconnected from the server");
	};

	WS.onmessage = (e) => {
		const { type, payload } = JSON.parse(e.data);
		console.log(type, payload);

		addMessage(type, payload);
	};
}

function addMessage(type, payload) {
	const li = document.createElement("li");

	switch (type) {
		case MSG_TYPES.JOIN:
			li.innerHTML = `<span style="color: ${payload.color}">${payload.name}</span> joined the chat`;
			chatList.appendChild(li);
			break;

		case MSG_TYPES.BAN:
			li.innerHTML = `<span style="color: ${payload.color}">${payload.name}</span> was banned from the chat`;
			chatList.appendChild(li);
			break;

		case MSG_TYPES.MESSAGE:
			const { name, message, color } = payload;
			li.innerHTML = `<span style="color: ${color}">${name}</span> ${message}`;
			chatList.appendChild(li);
			break;
	}
}

function handlePostMessage(e) {
	e.preventDefault();
	const input = e.target.msg.value;

	if (input?.trim() === "") return;

	WS?.send(JSON.stringify({ type: MSG_TYPES.MESSAGE, payload: input }));
	e.target.msg.value = "";
}
