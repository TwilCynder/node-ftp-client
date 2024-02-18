#! node

import cl from '@twilcynder/commandline'
import {executeRemote, logColor, FTPResponseResultHandler, checkArgs} from './helpers.js'
import {download, downloadDir, FTPClient} from './ftp.js'

cl.takeMainModule();
cl.enableExit();
cl.enableList();

let client = new FTPClient();

//------- Functions -------------

//------- >> Helper functions

//-------- >> Feature functions

//-------- CL Commands --------------

cl.commands = {
    connect: function(args){
        if (!checkArgs(args, 2, "host port")) return;
        client.connect_( args[0], args[1], false).then((res) => {
            if (!(res > 0)){
                console.log("Connection successful")
                console.log(res);
                cl.stopLogging();
            }
        })
    },

    status: function(){
        if (client.closed){
            console.log("Not connected");
        } else {
            let current_connection = client.getCurrentConnection();
            console.log(`Connected to ${current_connection.host}:${current_connection.port}`);
        }
       cl.stopLogging();
    },

    close: function(){
        client.close();
    },

    pwd: async function(){
        executeRemote(()=>client.pwd(), cl.logOnce);
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
        return executeRemote( async () => {
            await downloadDir(client, path);
            cl.stopLogging();
        });
    }
}

//---------- main ------------------

if (process.argv.length > 2){
    if (process.argv.length < 4){
        console.error("Usage : node main.js [host port]");
        process.exit(1);
    }

    await client.connect_(process.argv[2], process.argv[3]);
    console.log("Connected !");
}


cl.start();