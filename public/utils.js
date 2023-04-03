function generateColor() {
	const r = Math.floor(Math.random() * 250) + 5;
	const g = Math.floor(Math.random() * 250) + 5;
	const b = Math.floor(Math.random() * 250) + 5;

	document.cookie = `color=rgb(${r}, ${g}, ${b})`;
}

function handleAuth() {
	const password = prompt("Enter password");

	fetch(`https://${HOST}/auth`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ password }),
	}).then((res) => {
		if (res.ok) {
			return alert("Authenticated!");
		}
		alert("Wrong password!");
	});
}

function handleUserJoin(e) {
	e.preventDefault();

	const name = e.target.name.value;
	if (name?.trim() === "") return;

	fetch(`https://${HOST}/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ name }),
	}).then((res) => {
		if (res.ok) {
			join.style.display = "none";
			msgInp.style.display = "block";
			chatList.style.display = "block";
			openSocket();
			generateColor();
		} else {
			alert("Username already taken!");
		}
	});
}
