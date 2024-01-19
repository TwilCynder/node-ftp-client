#! node

import cl from '@twilcynder/commandline'
import {Client} from 'basic-ftp'
import fs from 'fs'

const term_escape = '\x1b[';
const term_blue = `${term_escape}34m`;
const term_reset = `${term_escape}0m`;

cl.takeMainModule();
cl.enableExit();
cl.enableList();

let client = new Client();

//------- Functions -------------

async function connect(host, port, force = false){
    if (!client.closed){
        if (force){
            client.close();    
        } else {
            return 1;
        }
    }

    try {
        return await client.access({
            host, port
        });

    } catch (err){
        console.error("Could not connect to the server : ", err);
        return 2;
    }
}

function logColor(string, colorCode){
    colorCode = "" + colorCode;
    console.log(`${term_escape}${colorCode}m`+string+term_reset);
}

//-------- CL Commands --------------

cl.commands = {
    status: function(){
        if (client.closed) console.log("Not connected");
    },

    close: function(){
        client.close();
    },

    pwd: async function(){
        let result = await client.pwd();
        console.log(result);
        cl.stopLogging();
    },

    cd: async function([path]){
        let res = await client.cd(path);
        console.log(res);
        cl.stopLogging();
    },

    ls: async function(){
        let res = await client.list();
        for (let fileInfo of res){
            if (fileInfo.type == 2){
                logColor(fileInfo.name, 34);
            } else {
                console.log(fileInfo.name);
            }
        }
        cl.stopLogging();
    },


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