const socket = io();
tippy('#microphone-btn', {
    content: "Turn off microphone",
    arrow: false,
});
tippy('#camera-btn', {
    content: "Turn off video",
    arrow: false,
});
tippy('#message-btn', {
    content: "Message",
    arrow: false,
});
tippy('#screen-btn', {
    content: "Share screen",
    arrow: false

});
tippy('#record-btn', {
    content: "Record",
    arrow: false

});
tippy('#call-btn', {
    content: "Leave call",
    arrow: false
});

const videoChatForm = document.getElementById('video-chat-from');
const videoChatRooms = document.getElementById('video-chat-rooms');
const userVideo = document.getElementById('video-container2');
const peerVideo = document.getElementById('video-container');

const video_chat = document.getElementById('video-div');
const mute_button = document.getElementById('microphone-btn');
const videoButton = document.getElementById('camera-btn');
const LeaveRoomButton = document.getElementById('call-btn');
const mesgBtn = document.getElementById('send-button');
const chatInputBox = document.getElementById('message-input');

const MessageBody = document.querySelector('#chat-container');
const screenShareBtn = document.querySelector('#screen-btn');
const recordBtn = document.querySelector('#record-btn');
const fileInput = document.getElementById('file-input');

let roomName;
let creator = false;
let muteFlag = true;
let videoMuteFlag = true;
let mesgFlag = true;
let userStream;
let mediaRecorder;
let recordFlag = true;
let recordedChunks = [];

let iceServers = {
    iceServers: [
        { urls: 'stun:stun.1.google.com:19302' },
    ],
};

let rtcPeerConnection = new RTCPeerConnection(iceServers);
let dataChannel = rtcPeerConnection.createDataChannel('myDataChannel');

const urlArr = window.location.href.split('/');
const meeting_code = urlArr[urlArr.length - 1];
roomName = meeting_code;
socket.emit('join', roomName);

mesgBtn.addEventListener('click', () => {
    let inputValue = chatInputBox.value;
    if (inputValue !== '') {
        const messageType = isLink(inputValue) ? "link" : 'Text';
        const data = {
            type: messageType,
            content: inputValue,
        }
        displayData(data, "outgoing");
        chatInputBox.value = "";
        dataChannel.send(JSON.stringify(data));
    };
});

chatInputBox.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        let inputValue = chatInputBox.value;
        if (inputValue !== '') {
            const messageType = isLink(inputValue) ? "link" : 'Text';
            const data = {
                type: messageType,
                content: inputValue,
            }
            displayData(data, "outgoing");
            chatInputBox.value = "";
            dataChannel.send(JSON.stringify(data));
        };
    };
});

recordBtn.addEventListener('click', () => {
    if (recordFlag) {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(userStream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            };
        };
        mediaRecorder.start();
        recordFlag = false;
    } else {
        mediaRecorder.stop();
        mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(recordedChunks, { type: 'video/mp4' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(recordedBlob);
            downloadLink.download = 'recorded-video.mp4';
            downloadLink.textContent = 'Download Recorded Video';

            document.getElementById('btn-div').appendChild(downloadLink);
            recordFlag = true;
        };
    };
});

let screenflag = true;
const screenICon = document.getElementById('Screen');

screenShareBtn.addEventListener('click', async () => {
    if (screenflag) {
        screenICon.classList.remove('bi-display');
        screenICon.classList.add('bi-display-fill');
        screenflag = false;
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        userVideo.srcObject = stream;
        stream.getVideoTracks()[0].onended = async () => {
            userVideo.srcObject = userStream;
            rtcPeerConnection.getSenders().forEach(sender => {
                const track = sender.track;
                if (track && track.kind === 'video') {
                    rtcPeerConnection.removeTrack(sender);
                };
            });
            userStream.getVideoTracks().forEach(videoTrack => {
                rtcPeerConnection.addTrack(videoTrack, userStream);
            });
            const offer = await rtcPeerConnection.createOffer();
            await rtcPeerConnection.setLocalDescription(offer);
            socket.emit('screenOffer', offer, roomName);
        };
        const offer = await createOffer(stream);
        socket.emit('screenOffer', offer, roomName);
    } else {
        screenICon.classList.remove('bi-display-fill');
        screenICon.classList.add('bi-display');
        screenflag = true;
    };
});

async function createOffer(stream) {
    stream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, stream));
    const offer = await rtcPeerConnection.createOffer();
    await rtcPeerConnection.setLocalDescription(offer);
    return offer;
};

socket.on('screenOffer', async (offer) => {
    rtcPeerConnection.setRemoteDescription(offer);
    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);
    socket.emit('answer', answer, roomName);
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
});

const chunkSize = 1024 * 64;
async function sendFileChunks(file, dataChannel) {
    for (let i = 0; i < Math.ceil(file.size / chunkSize); i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const reader = new FileReader();
        var chunkData = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(chunk);
        });
    };
    dataChannel.send(chunkData);
    return chunkData;
};

fileInput.addEventListener('change', (event) => {
    let selectedFile = event.target.files[0];

    // sendFileChunks(selectedFile, dataChannel)
    //     .then((chunkData) => {
    //         console.log('File sent successfully!');
    //         console.log(chunkData);
    //         displayImage(chunkData, 'outgoing', selectedFile.type);
    //     })
    //     .catch(error => console.error('Error sending file:', error));

    const reader = new FileReader();
    reader.onloadend = () => {
        const imageBlob = new Blob([reader.result], { type: selectedFile.type });
        const imageURl = URL.createObjectURL(imageBlob);

        console.log(imageURl);
        // displayImage(imageURl, 'outgoing');
        // const blob = new Blob([arrayBuffer], { type: selectedFile.type });
        // const blobUrl = URL.createObjectURL(blob);
        // let fileObject = { name: selectedFile.name, data: blobUrl, type: selectedFile.type.split('/')[0] };

        // console.log(fileObject);

        // if (fileObject.type === 'application' || fileObject.type === 'text') {
        //     displayFile(fileObject, 'outgoing');
        // }
        // else if (fileObject.type === 'image') {
        //     displayImage(fileObject, 'outgoing');
        // }
        // else if (fileObject.type === 'video') {
        //     displayAudioVideo(fileObject, 'outgoing');
        // }
        // else if (fileObject.type === 'audio') {
        //     displayAudioVideo(fileObject, 'outgoing');
        // };
        dataChannel.send(imageURl);
    };
    reader.readAsArrayBuffer(selectedFile);
});

rtcPeerConnection.ondatachannel = event => {
    const dataChannel = event.channel;
    dataChannel.onmessage = event => {
        console.log(event.data);

        displayImage(event.data, 'incoming');
        // const messageObj = JSON.parse(event.data);
        // console.log(messageObj);

        // if (messageObj.type === 'link' || messageObj.type === 'Text') {
        //     displayData(messageObj, "incoming");
        // }
        // else if (messageObj.type === 'application' || messageObj.type === 'text') {
        //     displayFile(messageObj, 'incoming');
        // }
        // else if (messageObj.type === 'image') {
        //     displayImage(messageObj, 'incoming');
        // }
        // else if (messageObj.type === 'video') {
        //     displayAudioVideo(messageObj, 'incoming');
        // }
        // else if (messageObj.type === 'audio') {
        //     displayAudioVideo(messageObj, 'incoming');
        // }
        // else if (messageObj.type === 'user') {
        //     setLogo(messageObj.name);
        // };
    };
};

let micFlag = true;
const micIcon = document.getElementById('Mic');

document.getElementById('microphone-btn').addEventListener('click', () => {
    const tippyTooltip = document.querySelector('.tippy-content');

    if (micFlag) {
        userStream.getTracks()[0].enabled = false;
        micIcon.classList.remove('bi-mic-fill');
        micIcon.classList.add('bi-mic-mute-fill');
        document.getElementById('microphone-btn').classList.add('bg-danger');
        if (tippyTooltip) {
            tippyTooltip.innerHTML = "Turn on microphone";
        }
        micFlag = false;
    } else {
        userStream.getTracks()[0].enabled = true;
        micIcon.classList.remove('bi-mic-mute-fill');
        document.getElementById('microphone-btn').classList.remove('bg-danger');
        micIcon.classList.add('bi-mic-fill');
        if (tippyTooltip) {
            tippyTooltip.innerHTML = "Turn off microphone";
        }
        micFlag = true;
    }
});

function setLogo(userName) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;

    const context = canvas.getContext('2d');
    context.fillStyle = '#2c3e50';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '150px Arial';
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(userName.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2);

    const logoUrl = canvas.toDataURL();
    const video = document.getElementById('video-container');
    video.poster = logoUrl;
};

function createBlankVideoStream(userName) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext('2d');
    context.fillStyle = '#2c3e50';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '150px Arial';
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(userName.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2);

    const stream = canvas.captureStream();
    return new MediaStream([stream.getTracks()[0]]);
};

socket.on('video-off', async (offer) => {
    rtcPeerConnection.setRemoteDescription(offer);
    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);
    socket.emit('answer', answer, roomName);
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
});

let videoFlag = true;
const videoIcon = document.getElementById('Video');

document.getElementById('camera-btn').addEventListener('click', async () => {

    const loginUser = await fetch('https://192.168.50.158:3000/get-cookie');
    const data = await loginUser.json();
    const tippyTooltip = document.querySelector('.tippy-content');

    if (videoFlag) {
        userStream.getTracks()[1].enabled = false;
        videoIcon.classList.remove('bi-camera-video');
        videoIcon.classList.add('bi-camera-video-off');
        document.getElementById('camera-btn').classList.add('bg-danger');
        if (tippyTooltip) {
            tippyTooltip.innerHTML = "Turn on video";
        };
        let Stream = createBlankVideoStream(data.name);
        userVideo.srcObject = Stream;

        const offer = await createOffer(Stream);
        socket.emit('video-off', offer, roomName);

        console.log({ name: data.name, type: 'user' }, 'localvideo side');
        videoFlag = false;

        if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ name: data.name, type: 'user' }));
        };

    } else {
        userStream.getTracks()[1].enabled = true;
        videoIcon.classList.remove('bi-camera-video-off');
        document.getElementById('camera-btn').classList.remove('bg-danger')
        videoIcon.classList.add('bi-camera-video');
        if (tippyTooltip) {
            tippyTooltip.innerHTML = "Turn off video";
        };
        userVideo.srcObject = userStream;
        rtcPeerConnection.getSenders().forEach(sender => {
            const track = sender.track;
            if (track && track.kind === 'video') {
                rtcPeerConnection.removeTrack(sender);
            };
        });
        userStream.getVideoTracks().forEach(videoTrack => {
            rtcPeerConnection.addTrack(videoTrack, userStream);
        });
        const offer = await rtcPeerConnection.createOffer();
        await rtcPeerConnection.setLocalDescription(offer);
        socket.emit('video-off', offer, roomName);

        videoFlag = true;
    };
});

let mesgflag = true;
const mesgICon = document.getElementById('Mesg');
document.getElementById('message-btn').addEventListener('click', () => {
    if (mesgflag) {
        mesgICon.classList.remove('bi-chat-left-text');
        mesgICon.classList.add('bi-chat-left-text-fill');
        mesgflag = false;
    } else {
        mesgICon.classList.remove('bi-chat-left-text-fill');
        mesgICon.classList.add('bi-chat-left-text');
        mesgflag = true;
    };
});

document.querySelector('.btn-close').addEventListener('click', () => {
    mesgICon.classList.remove('bi-chat-left-text-fill');
    mesgICon.classList.add('bi-chat-left-text');
    mesgflag = true;
});

let recordflag = true;
const recordICon = document.getElementById('Record');

document.getElementById('record-btn').addEventListener('click', () => {
    if (recordflag) {
        recordICon.classList.remove('bi-record-btn');
        recordICon.classList.add('bi-record-btn-fill');
        recordflag = false;
    }
    else {
        recordICon.classList.remove('bi-record-btn-fill');
        recordICon.classList.add('bi-record-btn');
        recordflag = true;
    };
});

async function initializeUserMedia() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 1280, height: 720 } });
        userStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = () => userVideo.play();

        if (!creator) {
            socket.emit('ready', roomName);
        };
    } catch (error) {
        console.error(error);
        alert("You can't access media");
    };
};

socket.on('created', () => {
    creator = true;
    initializeUserMedia();
});

socket.on('joined', () => {
    creator = false;
    initializeUserMedia();
});

socket.on('full', () => {
    alert("Room is full You can't join the room");
});

socket.on('ready', () => {
    if (creator) {
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        userStream.getTracks().forEach(track => {
            rtcPeerConnection.addTrack(track, userStream);
        });
        rtcPeerConnection.createOffer(
            (offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit('offer', offer, roomName);
            },
            (error) => {
                console.log(error);
            }
        );
    };
});

socket.on('candidate', (candidate) => {
    let iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on('offer', (offer) => {
    if (!creator) {
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        userStream.getTracks().forEach(track => {
            rtcPeerConnection.addTrack(track, userStream);
        });
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            (answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit('answer', answer, roomName);
            },
            (error) => {
                console.log(error);
            }
        );
    };
});

socket.on('answer', (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
});

LeaveRoomButton.addEventListener('click', () => {
    socket.emit('leave', roomName);

    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
    };
    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    };
    if (rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    };
});

socket.on('leave', () => {
    creator = true;
    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    };
    if (rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    };
});

function OnIceCandidateFunction(event) {
    if (event.candidate) {
        socket.emit('candidate', event.candidate, roomName);
    };
};

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = () => peerVideo.play();
};

function isLink(message) {
    const urlPattern = /^(http|https):\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(\/\S*)?$/;
    return urlPattern.test(message);
};

function displayData(data, Type) {
    if (data.type === 'link') {
        const mesgDiv = document.createElement('div');
        const linkElement = document.createElement('a');

        linkElement.href = data.content;
        linkElement.textContent = data.content;
        linkElement.style.color = 'blue';
        linkElement.target = '_blank';
        mesgDiv.classList.add(`${Type}`);

        mesgDiv.style.float = "left";
        mesgDiv.style.textAlign = 'left';
        mesgDiv.style.clear = "both";
        mesgDiv.style.paddingBottom = '10px';
        mesgDiv.style.wordBreak = 'break-all';
        mesgDiv.style.width = '94%';
        mesgDiv.style.display = 'block';

        if (Type === "incoming") {
            mesgDiv.style.float = "right";
            mesgDiv.style.textAlign = 'right';
            mesgDiv.style.clear = "both";
            mesgDiv.style.paddingBottom = '10px';
            mesgDiv.style.wordBreak = 'break-all';
            mesgDiv.style.width = '85%';
            mesgDiv.style.display = 'block';
        }
        mesgDiv.appendChild(linkElement);
        MessageBody.appendChild(mesgDiv);

    } else if (data.type === "Text") {
        const mesgDiv = document.createElement('div');
        mesgDiv.classList.add(`${Type}`);

        mesgDiv.style.float = "left";
        mesgDiv.style.clear = "both";
        mesgDiv.style.wordBreak = 'break-all';

        if (Type === "incoming") {
            mesgDiv.style.float = "right";
            mesgDiv.style.clear = "both";
            mesgDiv.style.wordBreak = 'break-all';
        }
        mesgDiv.innerHTML = `<p>${data.content}</p>`;
        MessageBody.appendChild(mesgDiv);
    };
};

function displayFile(fileData, type) {
    const receivedFileName = fileData.name;
    const receivedFileData = fileData.data;

    const messageDiv = document.createElement('div');
    const itag = document.createElement('i');
    const downloadLink = document.createElement('a');

    itag.classList.add('fa-lg', 'bi', 'bi-file-earmark-fill', 'text-dark');
    messageDiv.classList.add('p-1', 'mb-2');
    downloadLink.classList.add('text-dark', 'text-decoration-none');

    messageDiv.classList.add(`${type}`);
    downloadLink.href = receivedFileData;
    downloadLink.download = receivedFileName;
    downloadLink.textContent = ` ${receivedFileName}`;
    messageDiv.appendChild(itag);

    messageDiv.style.float = "left";
    messageDiv.style.clear = "both";

    if (type === 'incoming') {
        messageDiv.style.float = "right";
        messageDiv.style.clear = "both";
    };
    messageDiv.appendChild(downloadLink);
    MessageBody.appendChild(messageDiv);
};

function displayImage(imageData, type,) {
    const imgDiv = document.createElement('div');
    const imageElement = document.createElement('img');

    // var arrayBufferView = new Uint8Array(imageData);
    // imageData.mime = imageData.mime || 'image/jpeg';
    // var blob = new Blob([arrayBufferView], { type: imageData.mime });
    // var urlCreator = window.URL || window.webkitURL;
    // var imageUrl = urlCreator.createObjectURL(blob);

    imageElement.src = imageData;

    imageElement.style.width = '100px';
    // imageElement.style.objectFit = 'cover';
    // imageElement.classList.add('mb-3');
    // imageElement.style.display = 'block';
    // imageElement.style.float = 'left';
    // imageElement.style.clear = 'both';

    if (type === 'incoming') {
        imageElement.style.float = 'right';
        imageElement.style.display = 'block';
        imageElement.style.clear = 'both';
    };
    imgDiv.appendChild(imageElement);
    MessageBody.appendChild(imgDiv);
};

function displayAudioVideo(data, type) {
    if (data.type === 'video') {
        const videoDiv = document.createElement('div');
        const videoTag = document.createElement('video');
        const sourceTag = document.createElement('source');

        videoTag.controls = true;
        let videoUrl = data.data;

        sourceTag.src = videoUrl;
        sourceTag.type = 'video/mp4';
        videoTag.style.width = '50%';
        videoDiv.style.float = 'left';
        videoDiv.style.display = 'flex';
        videoDiv.style.justifyContent = 'start';
        videoDiv.style.marginBottom = '8%';
        videoDiv.style.marginTop = '7%';

        if (type === 'incoming') {
            videoDiv.style.float = 'right';
            videoDiv.style.display = 'flex';
            videoDiv.style.justifyContent = 'end';
        };
        videoTag.appendChild(sourceTag);
        videoDiv.appendChild(videoTag);

        MessageBody.appendChild(videoDiv);

    } else {
        const audioDiv = document.createElement('div');
        const audioTag = document.createElement('audio');

        audioTag.controls = true;
        audioTag.src = data.data
        audioTag.style.width = '100%'

        audioDiv.appendChild(audioTag);

        MessageBody.appendChild(audioDiv);
    };
};