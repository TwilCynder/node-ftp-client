#! node

import cl from '@twilcynder/commandline'
import {Client} from 'basic-ftp'
import {executeRemote, logColor, FTPResponseResultHandler, checkArgs} from './helpers.js'
import {download, downloadDir, connect} from './ftp.js'

cl.takeMainModule();
cl.enableExit();
cl.enableList();

let client = new Client();

//------- Functions -------------

//------- >> Helper functions

//-------- >> Feature functions

//-------- CL Commands --------------

cl.commands = {
    connect: function(args){
        if (!checkArgs(args, 2, "host port"))
        connect(client, args[0], args[1], false);
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
            cl.stopLogging();
        });
    },

    download: async function([filename, path]){
        if (!checkArgs(arguments[0], 2, "remote_filename path")) return;
        return executeRemote( () => download(client, filename, path), FTPResponseResultHandler);
    },

    downloadDir: async function([path]){
        if (!checkArgs(arguments[0], 1, "local_path")) return;
        return executeRemote( () => downloadDir(client, path));
    }
}

//---------- main ------------------

if (process.argv.length > 2){
    if (process.argv.length < 4){
        console.error("Usage : node main.js [host port]");
        process.exit(1);
    }

    await connect(client, process.argv[2], process.argv[3]);
    console.log("Connected !");
}


cl.start();