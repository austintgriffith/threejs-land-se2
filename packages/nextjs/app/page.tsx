"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import ThreeScene from "~~/components/ThreeScene";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Small header with connected address */}
      <div className="absolute top-0 right-0 p-4 z-10 bg-base-100 bg-opacity-70 rounded-bl-lg">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-sm">Connected:</p>
          <Address address={connectedAddress} size="sm" />
        </div>
      </div>

      {/* Full-screen ThreeScene */}
      <div className="w-full h-full absolute inset-0">
        <ThreeScene />
      </div>

      {/* Rest of content removed to make ThreeScene take up the whole screen */}
    </div>
  );
};

export default Home;
