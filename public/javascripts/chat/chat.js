const selfId = document.querySelector("main").getAttribute("selfId");

const newMsgInput = document.querySelector("#newMsgInput");
const btnSend = document.querySelector("#btnSendMsg");

newMsgInput.addEventListener("input", () => {
    if (newMsgInput.value.length > 0) {
        btnSend.classList.replace("btnDark2", "btnAccent");
    } else {
        btnSend.classList.replace("btnAccent", "btnDark2");
    }
});

const socket = io();
const messages = document.querySelector("#messages");

btnSend.addEventListener("click", () => {
    sendMsg();
});

let newMsgFocus = false;
newMsgInput.addEventListener("focus", () => {
    newMsgFocus = true;
});
newMsgInput.addEventListener("blur", () => {
    newMsgFocus = false;
});

document.addEventListener("keydown", (event) => {
    if (event.key == "Enter" && newMsgFocus) {
        sendMsg();
    }
});

function sendMsg() {
    const newMsg = newMsgInput.value;
    if (newMsgInput.value.replace(/\s/g, "") !== "" && btnSend.getAttribute("idReceiver")) {
        socket.emit("sendMsg", selfId, btnSend.getAttribute("idReceiver"), newMsgInput.value);

        newMsgInput.value = "";
        btnSend.classList.replace("btnAccent", "btnDark2");

        messages.innerHTML += `<span class="sender">${newMsg}</span>`;
    }
}