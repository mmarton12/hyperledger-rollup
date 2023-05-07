import * as grpc from '@grpc/grpc-js';
import * as crypto from 'crypto';
import { connect, Identity, signers } from '@hyperledger/fabric-gateway';
import { promises as fs } from 'fs';
import { TextDecoder } from 'util';
import { ChaincodeEventsBuilder } from '@hyperledger/fabric-gateway/dist/chaincodeeventsbuilder';
import { request } from 'http';
import { assert } from 'console';

const utf8Decoder = new TextDecoder();

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

const batchSize = 5;
var currentBatchSize = 0;
var modifiedBalances = new Map();

var balances = new Map();
var totalSupply = 0;
var name;
var symbol;


// Initialize token
async function initToken(_name, _symbol){
    name = _name;
    symbol = _symbol;
}

function balanceOf(account) {
    return balances(account);
}

// Checks if a key is locked on the main chain
async function isLocked(key) {
    const state = await contract.submitTransaction('isLocked', key);
    return state;
}

async function mint(to, amount) {
    // TODO: access check

    if(balances.has(to)) {  
            assert(isLocked(to))
        } else {
            await contract.submitTransaction('lockKey', to);
        }

    var newBalance = balances.has(to) ? (balances.get(to) + amount) : amount;
    balances.set(to, newBalance);
    modifiedBalances.set(to, newBalance);
    totalSupply += amount;
    currentBatchSize++;
    checkBatchSize();
}

function burn(account, amount) {
    // TODO: access check

    assert(isLocked(account));
    assert(balances(account) >= amount);

    var newBalance = balances(account) - amount;
    balances.set(account, newBalance);
    modifiedBalances.set(account, newBalance);
    totalSupply -= amount;

    currentBatchSize++;
    checkBatchSize();
}

async 
async function transfer(from, to, value){
    // TODO: access check

    assert(balances(from) >= value);
    assert(isLocked(from));
    if(balances.has(to)){
        assert(isLocked(to))
    } else {
        await contract.submitTransaction('lockKey', to);
    }

    balances(from) -= value;
    balances(to) += value;
}

// Function for submitting rollup to main chain
async function submitBatch() {
    var obj = Object.fromEntries(modifiedBalances);

    await contract.submitTransaction('modifyKeys', JSON.stringify(obj));

    modifiedBalances.clear();
}


// Simple function checking if the batch size has been reached
function checkBatchSize() {
    if(currentBatchSize == batchSize) submitBatch();
}

async function main() {

    // TODO: path to certificate
    const credentials = await fs.readFile('path/to/certificate.pem');
    const identity = { mspId: 'myorg', credentials};

    // TODO: path to PKpem
    const privateKeyPem = await fs.readFile('path/to/privateKey.pem');
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signer = signer.newPrivateKeySigner(privateKey);

    // TODO: modify address
    const client = new grpc.Client('gateway.example.org:1337', grpc.credentials.createInsecure());

    const gateway = connect({ identity, signer, client });

    try {

        try {
            // TODO: channel and contract name
            const network = gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);

        } finally {
            gateway.close();
            client.close();
        }

        
    } catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);        
    }
}