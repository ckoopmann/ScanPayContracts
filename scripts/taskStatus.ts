import { GelatoRelay, CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";

async function main() {
    const relay = new GelatoRelay();
    const taskId =
        "0xba140a83274696da403340f1d8127bef98262781a1b2720a1e697c3ac918f9df";
    const taskStatus = await relay.getTaskStatus(taskId);
    console.log(taskStatus);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
