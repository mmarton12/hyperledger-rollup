'use strinct';

const { Contract } = require('fabric-contract-api');

const shim = require('fabric-shim');
const util = require('util');

class RollupContract extends Contract {
    constructor() {
        super('Rollup');
    }

async modifyKeys(ctx, batchArray){

    // validate submitter to belong to Org1MSP
    const clientMSPID = ctx.clientIdentity.getMSPID();
    if (clientMSPID !== "Org1MSP") {
        throw new Error(
            "AUTHENTICATION_ERROR"
        );
    }

    try{
        const newBatch = JSON.parse(batchArray);

        for (let i = 0; i < newBatch.length; i++) {

            // If the update is deletion it is signalled with null value
            if(newBatch[i].value == null){
                await ctx.stub.deleteState(newBatch[i].key);
                console.log("Key " + newBatch[i].key + " deleted");
            }
            else {
                await ctx.stub.putState(newBatch[i].key, Buffer.from(JSON.stringify(newBatch[i].value)));
                console.log("Key " + newBatch[i].key + " updated to " + newBatch[i].value);
            }
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

}

    async lockKey(ctx, key) {

    // validate submitter to belong to Org1MSP
    const clientMSPID = ctx.clientIdentity.getMSPID();
    if (clientMSPID !== "Org1MSP") {
        throw new Error(
            "AUTHENTICATION_ERROR"
        );
    }

    const objectType = 'lock';
    const compositeKey = ctx.stub.createCompositeKey(objectType, key);
    await stub.putState(compositeKey, true);
    }

    async unlockKey(ctx, key) {

        // validate submitter to belong to Org1MSP
        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (clientMSPID !== "Org1MSP") {
            throw new Error(
                "AUTHENTICATION_ERROR"
            );
        }
    
        const objectType = 'lock';
        const compositeKey = ctx.stub.createCompositeKey(objectType, key);
        await stub.putState(compositeKey, false);
        }

    async isLocked(ctx, key) {
        const objectType = 'lock';
        const compositeKey = ctx.stub.createCompositeKey(objectType, key);
        const keyLocked = await stub.getState(compositeKey);
        
        return keyLocked;
    }

    async unknownTransaction(ctx) {
        throw new Error('You have asked to invoke a function that does not exist');
    }

};

module.exports = RollupContract;