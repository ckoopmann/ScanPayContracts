import { ethers } from "hardhat";
import { Signer, BigNumberish } from "ethers";
import { GelatoRelay, CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import {
    ScanPay,
    ScanPay__factory,
    IERC20Permit,
    IERC20Permit__factory,
} from "../typechain-types";

async function main() {
    // target contract address
    const scanPayAddress = "0xe5759060F3a09ED499b3097014A16D60A4eD6040";
    const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
    const amountToTransfer = ethers.utils.parseUnits("0.25", 6);
    const receiver = "0x60890A74D244269F2feb888201A879b578082f97";

    const [signer] = await ethers.getSigners();
    const result = await getPermitSignature(
        signer,
        usdcAddress,
        scanPayAddress,
        amountToTransfer,
        600
    );

    const usdcContract = IERC20Permit__factory.connect(usdcAddress, signer);
    const { data: permitCalldata } =
        await usdcContract.populateTransaction.permit(
            signer.address,
            scanPayAddress,
            amountToTransfer,
            result.deadline ?? ethers.constants.MaxUint256,
            result.v,
            result.r,
            result.s
        );
    console.log("Permit Calldata", permitCalldata);

    const scanPayContract = ScanPay__factory.connect(scanPayAddress, signer);
    const { data: scanPayCalldata } = await scanPayContract.populateTransaction.settlePayment(
        usdcAddress,
        signer.address,
        receiver,
        amountToTransfer,
        permitCalldata ?? "0x"
    );

    console.log("ScanPay Calldata", scanPayCalldata);

    const { chainId } = (await signer.provider?.getNetwork()) ?? { chainId: -1 };
    console.log("ChainId", chainId);

    const relay = new GelatoRelay();

    // populate the relay SDK request body
    const request: CallWithSyncFeeRequest = {
        chainId,
        target: scanPayAddress,
        data: scanPayCalldata ?? "0x",
        feeToken: usdcAddress,
        isRelayContext: true,
    };

    // send relayRequest to Gelato Relay API
    const relayResponse = await relay.callWithSyncFee(request);
    console.log("Relay Response", relayResponse);
}

function getTokenAbi() {
    return [
        "function nonces(address) view returns (uint256)",
        "function name() view returns (string)",
        "function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external",
        "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    ];
}

function getTokenContract(tokenAddress: string) {
    return ethers.getContractAt(getTokenAbi(), tokenAddress);
}

export async function getSignatureData(signer: Signer, tokenAddress: string) {
    const provider = signer.provider;
    const token = await getTokenContract(tokenAddress);
    const owner = await signer.getAddress();
    console.log("getSignatureData Getting Nonce Data", { owner });
    const [nonce, name, version] = await Promise.all([
        token.nonces(owner),
        token.name(),
        "1",
    ]);
    console.log("getSignatureData Getting chainId");
    const { chainId } = (await provider?.getNetwork()) ?? { chainId: -1 };
    console.log("getSignatureData Returning: ", {
        nonce,
        name,
        version,
        chainId,
    });
    return { nonce, name, version, chainId };
}

export async function getPermitSignature(
    signer: Signer,
    tokenAddress: string,
    spender: string,
    value: BigNumberish,
    relativeDeadline: number
) {
    console.log("Getting permit signature", {
        tokenAddress,
        spender,
        value,
        relativeDeadline,
    });
    const deadline = await signer.provider
        ?.getBlock("latest")
        .then((block) => block.timestamp + relativeDeadline);

    const owner = await signer.getAddress();
    const { nonce, name, version, chainId } = await getSignatureData(
        signer,
        tokenAddress
    );

    console.log("signTypedData", {
        owner,
        spender,
        value,
        nonce,
        deadline,
    });
    const typedSignature = await signer._signTypedData(
        {
            name,
            version,
            chainId,
            verifyingContract: tokenAddress,
        },
        {
            Permit: [
                {
                    name: "owner",
                    type: "address",
                },
                {
                    name: "spender",
                    type: "address",
                },
                {
                    name: "value",
                    type: "uint256",
                },
                {
                    name: "nonce",
                    type: "uint256",
                },
                {
                    name: "deadline",
                    type: "uint256",
                },
            ],
        },
        {
            owner,
            spender,
            value,
            nonce,
            deadline,
        }
    );
    console.log("splitSignature");

    const signature = ethers.utils.splitSignature(typedSignature);
    return {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline,
        sender: owner,
    };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
