const { Wallets, Gateway} = require('fabric-network');
const fs = require('fs');
const path = require('path');

const Client = require('fabric-client');
const winston = require('winston');

// Set the logging levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };
  
  // Set the logging colors
  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
  };
  
  // Create a logger
  const logger = winston.createLogger({
    levels: levels,
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    ),
    transports: [new winston.transports.Console()]
  });

const utf8Decoder = new TextDecoder();

const maxBatchSize = 20;
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

    logger.info('Token initialized')

    await contract.submitTransaction('modifyKeys', JSON.stringify(obj));

}

function balanceOf(account) {
    return balances(account);
}

function getName(){
    return name;
}

function getSymbol(){
    return symbol;
}

function totalSupply(){
    return totalSupply;
}


// Checks if a key is locked on the main chain
async function isLocked(key) {
    const state = await contract.evaluateTransaction('isLocked', key);
    return state;
}

async function mint(to, amount) {

    if(balances.has(to)) {  
            assert(isLocked(to))
        } else {
            await contract.submitTransaction('lockKey', to);
        }

    var newBalance = balances.has(to) ? (balances.get(to) + amount) : amount;
    balances.set(to, newBalance);
    modifiedBalances.set(to, newBalance);
    totalSupply += amount;

    logger.info('tokens minted to: ', to)
    logger.info('minted amount: ', amount);
    currentBatchSize++;
    checkBatchSize();
}

function burn(account, amount) {

    assert(isLocked(account));
    assert(balances(account) >= amount);

    var newBalance = balances(account) - amount;
    balances.set(account, newBalance);
    modifiedBalances.set(account, newBalance);
    totalSupply -= amount;

    logger.info('tokens burned from: ', account)
    logger.info('burned amount: ', amount);

    currentBatchSize++;
    checkBatchSize();
}

async function transfer(from, to, value){

    assert(balances(from) >= value);
    assert(isLocked(from));
    if(balances.has(to)){
        assert(isLocked(to))
    } else {
        await contract.submitTransaction('lockKey', to);
    }

    balances(from) -= value;
    balances(to) += value;

    logger.info('tokens transfered from: ', from)
    logger.info('tokens transfered to: ', to)
    logger.info('transfered amount: ', amount)
}

// Function for submitting rollup to main chain
async function submitBatch() {
    var obj = Object.fromEntries(modifiedBalances);

    await contract.submitTransaction('modifyKeys', JSON.stringify(obj));

    modifiedBalances.clear();

    logger.info('Batch submitted');
}


// Simple function checking if the batch size has been reached
function checkBatchSize() {
    if(currentBatchSize == batchSize) submitBatch();
}

async function main() {

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const connectionProfile = path.join(process.cwd(), 'connection.json');

    const connectionOptions = {
        wallet,
        identity: 'user1',
        discovery: { enable: true, asLocalhost: true},
    };

    const gateway = new Gateway();

    try{
        await gateway.connect(connectionProfile, connectionOptions);

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('RollupContract');

        initToken("TEST", "TST");
        mint('Org1MSP', 100);
        for (let index = 0; index < 20; index++) {
            transfer('Org1MSP', 'Org2MSP', 1);
            burn('Org2MSP', 1);
        }
        
    } finally {
        gateway.disconnect();
    }
}

main().catch((error) => {
    console.error(err);
    process.exit(1);
})