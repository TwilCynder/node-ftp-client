#! node

import cl from '@twilcynder/commandline'
import {Client, FTPError} from 'basic-ftp'
import fs from 'fs'

const term_escape = '\x1b[';
const term_blue = `${term_escape}34m`;
const term_reset = `${term_escape}0m`;

cl.takeMainModule();
cl.enableExit();
cl.enableList();

let client = new Client();

let current_connection = {
    host: null,
    port: null
}

//------- Functions -------------

/**
 * Connects to a host. If already connected, closes the connection and connects or fails, depending on the force argument
 * @param {string} host 
 * @param {number} port 
 * @param {boolean} force If true, will override any open connection. If false, the function fails if a connection is already open.
 * @returns 
 */
async function connect(host, port, force = false){
    if (!client.closed){
        if (force){
            client.close();    
        } else {
            console.error("Already connected");
            return 1;
        }
    }

    try {
        let res = await client.access({
            host, port
        });

        current_connection = {host, port};

        return res;
    } catch (err){
        console.error("Could not connect to the server : ", err);
        return 2;
    }
}

function logColor(string, colorCode){
    colorCode = "" + colorCode;
    console.log(`${term_escape}${colorCode}m`+string+term_reset);
}

/**
 * @param {import('basic-ftp').FTPResponse} res 
 */
function FTPResponseResultHandler(res){
    console.log(`Remote (status : ${res.code}) : ${res.message}`);
}

async function executeRemote(f, resultHandler){
    try {
        let res = await f();
        if (res && resultHandler) resultHandler(res); 
    } catch (err){
        console.error("Remote : Error :", err);
    }
    cl.stopLogging();
}

function checkArgs(args, expectedN, message){
    if (args.length < expectedN) {
        console.warn("Usage :", message);
        return false;
    } 
    return true;
}

//-------- CL Commands --------------

cl.commands = {
    connect: function(args){
        if (!checkArgs(args, 2, "host port"))
        connect(args[0], args[1], false);
    },

    status: function(){
        console.log(client.closed ? "Not connected" : `Connected to ${current_connection.host}:${current_connection.port}`);
    },

    close: function(){
        client.close();
    },

    pwd: async function(){
        executeRemote(()=>client.pwd(), console.log);
    },

    cd: async function([path]){
        if (!checkArgs(arguments[0], 1, "path")) return;
        executeRemote(() => client.cd(path), FTPResponseResultHandler);
    },

    ls: async function(){
        await executeRemote(async () => {
            let res = await client.list();
            for (let fileInfo of res){
                if (fileInfo.type == 2){
                    logColor(fileInfo.name, 34);
                } else {
                    console.log(fileInfo.name);
                }
            }
        });
    },

    download: async function([filename, path]){
        if (!checkArgs(arguments[0], 2, "remote_filename path")) return;
        let writeStream = fs.createWriteStream(path);
        await executeRemote( () => client.downloadTo(writeStream, filename), FTPResponseResultHandler);
    }
}

//---------- main ------------------

if (process.argv.length > 2){
    if (process.argv.length < 4){
        console.error("Usage : node main.js [host port]");
        process.exit(1);
    }

    await connect(process.argv[2], process.argv[3]);
    console.log("Connected !");
}


cl.start();