<script lang="ts">
import { defineComponent } from "vue";
import getIPFS from "@/getIPFS";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export default defineComponent({
  name: "Room",
  props: {
    id: String,
  },
  data() {
    return {
      localStream: new MediaStream(),
      connections: new Map<string, RTCPeerConnection>(),
      makingOffer: new Map<string, boolean>(),
      unsubscribe: () => {
        /* noop */
      },
    };
  },
  computed: {
    topic() {
      return `dcall-${this.id}`;
    },
  },
  watch: {
    topic: {
      immediate: true,
      handler(val: string) {
        this.unsubscribe();

        const promise = getIPFS().then(async (ipfs) => {
          await ipfs.pubsub.subscribe(val, this.handlePubsubMessage);
          const interval = setInterval(async () => {
            const peers = await ipfs.pubsub.peers(val);
            peers
              .filter(this.notConnected)
              .map((peer) => this.connect(peer, true));
          }, 5000);

          return () => {
            clearInterval(interval);
            return ipfs.pubsub.unsubscribe(val, this.handlePubsubMessage);
          };
        });

        this.unsubscribe = () => promise.then((unsubscribe) => unsubscribe());
      },
    },
  },
  mounted() {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      .then((stream) => {
        stream.getTracks().forEach((track) => this.localStream.addTrack(track));
      })
      .catch(console.error);
  },
  unmounted() {
    this.unsubscribe();
  },
  methods: {
    async handlePubsubMessage({
      from,
      data,
    }: {
      from: string;
      data: Uint8Array;
    }) {
      const ipfs = await getIPFS();
      const { id } = await ipfs.id();

      const { target, candidate, description } = JSON.parse(
        decoder.decode(data)
      );

      if (target === id) {
        let peerConnection = this.connections.get(from);
        if (peerConnection === undefined) {
          peerConnection = this.connect(from, false);
        }

        if (description) {
          const polite = target < id;
          const offerCollision =
            description.type === "offer" &&
            (this.makingOffer.get(from) ||
              peerConnection.signalingState !== "stable");

          if (!polite && offerCollision) {
            return;
          }

          await peerConnection.setRemoteDescription(description);
          if (description.type === "offer") {
            await peerConnection.setLocalDescription();
            await ipfs.pubsub.publish(
              this.topic,
              encoder.encode(
                JSON.stringify({
                  target: from,
                  description: peerConnection.localDescription,
                })
              )
            );
          }
        } else if (candidate) {
          await peerConnection.addIceCandidate(candidate);
        }
      }
    },
    notConnected(peer: string) {
      return ["disconnected", "failed", "closed", undefined].includes(
        this.connections.get(peer)?.connectionState
      );
    },
    connect(target: string, offer: boolean) {
      const peerConnection = new RTCPeerConnection();

      this.connections.get(target)?.close();
      this.connections.set(target, peerConnection);

      // Close and retry if we could not connect in 5 seconds
      setTimeout(() => {
        if (peerConnection.connectionState !== "connected") {
          peerConnection.close();
        }
      }, 5000);

      peerConnection.addEventListener("negotiationneeded", async () => {
        this.makingOffer.set(target, true);
        const ipfs = await getIPFS();
        await peerConnection.setLocalDescription();
        await ipfs.pubsub.publish(
          this.topic,
          encoder.encode(
            JSON.stringify({
              target,
              description: peerConnection.localDescription,
            })
          )
        );
        this.makingOffer.set(target, false);
      });

      peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
        const ipfs = await getIPFS();
        await ipfs.pubsub.publish(
          this.topic,
          encoder.encode(JSON.stringify({ target, candidate }))
        );
      });

      peerConnection.addEventListener("connectionstatechange", () => {
        if (
          ["disconnected", "failed", "closed"].includes(
            peerConnection.connectionState
          )
        ) {
          // TODO: handle disconnect
        }
      });

      if (offer) {
        this.localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track));
      }

      // TODO: add track if it was added to localStream
      // TODO: remove track if it was removed from localStream

      return peerConnection;
    },
  },
});
</script>

<template #default>
  <div class="room">
    <p>room id: {{ id }}</p>
    <video :srcObject="localStream" muted autoplay></video>
  </div>
</template>
