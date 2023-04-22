import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    networks: {
        hardhat: {},
        gnosis: {
            url: "https://rpc.gnosischain.com",
            accounts: [process.env.PRIVATE_KEY ?? ""],
        },
    },
    etherscan: {
        customChains: [
            {
                network: "chiado",
                chainId: 10200,
                urls: {
                    //Blockscout
                    apiURL: "https://blockscout.com/gnosis/chiado/api",
                    browserURL: "https://blockscout.com/gnosis/chiado",
                },
            },
            {
                network: "gnosis",
                chainId: 100,
                urls: {
                    // 3) Select to what explorer verify the contracts
                    // Gnosisscan
                    apiURL: "https://api.gnosisscan.io/api",
                    browserURL: "https://gnosisscan.io/",
                    // Blockscout
                    //apiURL: "https://blockscout.com/xdai/mainnet/api",
                    //browserURL: "https://blockscout.com/xdai/mainnet",
                },
            },
        ],
        apiKey: {
            //4) Insert your Gnosisscan API key
            //blockscout explorer verification does not require keys
            chiado: process.env.GNOSIS_API_KEY ?? "",
            gnosis: process.env.GNOSIS_API_KEY ?? "",
        },
    },
};

export default config;
