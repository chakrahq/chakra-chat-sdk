import type { WhatsAppSessionPayload, WhatsappWebRtcSession } from "../../types/calling.js";

export type { WhatsAppSessionPayload, WhatsappWebRtcSession };

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

let remoteAudioElement: HTMLAudioElement | null = null;

function assertBrowserEnvironment() {
  if (typeof RTCPeerConnection === "undefined") {
    throw new Error(
      "WebRTC is not available in this environment. Use a browser or a WebRTC-capable runtime.",
    );
  }
}

function getRemoteAudioElement(): HTMLAudioElement {
  if (!remoteAudioElement && typeof document !== "undefined") {
    remoteAudioElement = document.createElement("audio");
    remoteAudioElement.autoplay = true;
    remoteAudioElement.setAttribute("playsinline", "true");
    remoteAudioElement.style.display = "none";
    document.body.appendChild(remoteAudioElement);
  }

  if (!remoteAudioElement) {
    throw new Error("Remote audio playback is only supported in browser environments.");
  }

  return remoteAudioElement;
}

function attachRemoteAudioPlayback(peerConnection: RTCPeerConnection) {
  if (typeof document === "undefined") {
    return;
  }

  const audioEl = getRemoteAudioElement();
  const remoteStream = new MediaStream();

  peerConnection.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => {
      if (!remoteStream.getTracks().includes(track)) {
        remoteStream.addTrack(track);
      }
    });
    audioEl.srcObject = remoteStream;
    audioEl.play().catch(() => {
      // Accept click is a user gesture; ignore autoplay failures.
    });
  };
}

async function waitForIceGatheringComplete(pc: RTCPeerConnection, timeoutMs = 8000) {
  if (pc.iceGatheringState === "complete") {
    return;
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    }, timeoutMs);

    const onChange = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

function waitForConnection(peerConnection: RTCPeerConnection, timeoutMs = 15000): Promise<void> {
  const isConnected = () =>
    peerConnection.connectionState === "connected" ||
    peerConnection.iceConnectionState === "connected" ||
    peerConnection.iceConnectionState === "completed";

  if (isConnected()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("WebRTC connection was not established before accept"));
    }, timeoutMs);

    const onConnectionStateChange = () => {
      if (peerConnection.connectionState === "failed") {
        cleanup();
        reject(new Error("WebRTC connection failed"));
        return;
      }

      if (isConnected()) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      peerConnection.removeEventListener("connectionstatechange", onConnectionStateChange);
      peerConnection.removeEventListener("iceconnectionstatechange", onConnectionStateChange);
    };

    peerConnection.addEventListener("connectionstatechange", onConnectionStateChange);
    peerConnection.addEventListener("iceconnectionstatechange", onConnectionStateChange);
  });
}

function buildSessionPayload(
  peerConnection: RTCPeerConnection,
  sdpType: "offer" | "answer",
  cachedPayload?: WhatsAppSessionPayload,
): WhatsAppSessionPayload {
  if (cachedPayload) {
    return cachedPayload;
  }

  const localDescription = peerConnection.localDescription;
  if (!localDescription?.sdp) {
    throw new Error("Could not read local WebRTC description");
  }

  return {
    sdp_type: sdpType,
    sdp: localDescription.sdp,
  };
}

async function attachLocalAudioTrack(
  peerConnection: RTCPeerConnection,
  localStream: MediaStream,
  holdLocalAudio: boolean,
) {
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) {
    throw new Error("No microphone audio track available");
  }

  audioTrack.enabled = !holdLocalAudio;

  const audioTransceiver = peerConnection
    .getTransceivers()
    .find((transceiver) => transceiver.mid !== null || transceiver.receiver.track.kind === "audio");

  if (audioTransceiver) {
    audioTransceiver.direction = "sendrecv";
    await audioTransceiver.sender.replaceTrack(audioTrack);
    return;
  }

  peerConnection.addTrack(audioTrack, localStream);
}

type SessionOptions = {
  holdLocalAudio?: boolean;
};

function createSessionHelpers(
  peerConnection: RTCPeerConnection,
  localStream: MediaStream,
  sdpType: "offer" | "answer",
): Pick<
  WhatsappWebRtcSession,
  "getSessionPayload" | "applyRemoteSession" | "waitForConnection" | "enableLocalAudio" | "close"
> {
  let cachedPayload: WhatsAppSessionPayload | undefined;

  return {
    getSessionPayload: () => {
      cachedPayload = buildSessionPayload(peerConnection, sdpType, cachedPayload);
      return cachedPayload;
    },
    applyRemoteSession: async (remote) => {
      await peerConnection.setRemoteDescription({
        type: remote.sdp_type,
        sdp: remote.sdp,
      });
    },
    waitForConnection: (timeoutMs) => waitForConnection(peerConnection, timeoutMs),
    enableLocalAudio: async () => {
      const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack) {
        return;
      }

      audioTrack.enabled = true;

      const audioSender = peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === "audio" || sender.track === null);

      if (audioSender) {
        await audioSender.replaceTrack(audioTrack);
      }

      peerConnection.getTransceivers().forEach((transceiver) => {
        if (transceiver.sender.track?.kind === "audio" || transceiver.mid !== null) {
          transceiver.direction = "sendrecv";
        }
      });
    },
    close: () => {
      localStream.getTracks().forEach((track) => track.stop());
      peerConnection.close();
    },
  };
}

export async function createOutboundOfferSession(
  options: SessionOptions = {},
): Promise<WhatsappWebRtcSession> {
  assertBrowserEnvironment();

  const { holdLocalAudio = false } = options;
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  attachRemoteAudioPlayback(peerConnection);
  await attachLocalAudioTrack(peerConnection, localStream, holdLocalAudio);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await waitForIceGatheringComplete(peerConnection);

  return {
    peerConnection,
    localStream,
    ...createSessionHelpers(peerConnection, localStream, "offer"),
  };
}

export async function createInboundAnswerSession(
  remoteOffer: WhatsAppSessionPayload,
  options: SessionOptions = {},
): Promise<WhatsappWebRtcSession> {
  assertBrowserEnvironment();

  const { holdLocalAudio = true } = options;
  const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  attachRemoteAudioPlayback(peerConnection);

  await peerConnection.setRemoteDescription({
    type: remoteOffer.sdp_type,
    sdp: remoteOffer.sdp,
  });

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  await attachLocalAudioTrack(peerConnection, localStream, holdLocalAudio);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  await waitForIceGatheringComplete(peerConnection);

  return {
    peerConnection,
    localStream,
    ...createSessionHelpers(peerConnection, localStream, "answer"),
  };
}
