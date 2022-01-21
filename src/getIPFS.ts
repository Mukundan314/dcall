import { create, IPFS } from "ipfs-core";

const ipfs = create({
  config: {
    Addresses: {
      Swarm: [
        "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
        "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
        "/dns4/calm-castle-31280.herokuapp.com/tcp/443/wss/p2p-webrtc-star",
      ],
    },
  },
});

export default function getIPFS(): Promise<IPFS> {
  return ipfs;
}
