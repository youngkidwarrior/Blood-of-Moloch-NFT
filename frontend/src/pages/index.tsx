import Head from "next/head";
import { Container, Text, Flex, Box } from "@chakra-ui/react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useAccount } from "wagmi";
import ChipScan from "@/components/ChipScan";
import ClaimNFTPanel from "@/components/ClaimNFTPanel";
import ConnectWallet from "@/components/ConnectWallet";
import React from "react";
import DrinkNFTPanel from "@/components/DrinkNFTPanel";

export default function Home() {
  const { address } = useAccount();

  return (
    <>
      <Container>
        <Flex direction="column" align="center" justify="center" m={8}>
          <Text fontSize="42px" as="h1" fontFamily="texturina">
            Blood of Moloch NFT
          </Text>
          <Flex direction="column" align="center" justify="center" m={8}>
            <Box mt={8} mb={4}>
              <ConnectWallet />
            </Box>
            {address && <ClaimNFTPanel />}
            {address && <DrinkNFTPanel />}
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
