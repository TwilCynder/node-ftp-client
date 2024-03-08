import fs from 'fs'
import { Client } from 'basic-ftp';
import readline from 'readline'

export class FTPClient extends Client {
    constructor(){
        super()
        this.current_connection = {
            host: null,
            port: null
        };
    }

    async connect_(host, port, user, password, force = false){
        if (!this.closed){
            if (force){
                this.close();    
            } else {
                console.error("Already connected");
                return 1;
            }
        }
    
        try {
            let res = await super.access({
                host, port, user, password
            });
    
            this.current_connection = {host, port};
    
            return res;
        } catch (err){
            if (!this.closed) this.close();
            console.error("Could not connect to the server : ", err);
            return 2;
        }
    }

    getCurrentConnection(){
        return this.current_connection;
    }
}

function hiddenQuestion(query) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        const stdin = process.openStdin();
        function handler(char) {
            char = char + '';
            switch (char) {
              case '\n':
              case '\r':
              case '\u0004':
                stdin.pause();
                break;
              default:
                process.stdout.clearLine();
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(query + Array(rl.line.length + 1).join('*'));
                break;
            }
        };
        process.stdin.on('data', handler);
        rl.question(query, value => {
            rl.history = rl.history.slice(1);
            rl.close();
            process.stdin.off('data', handler)
            resolve(value);
        });
    });
} 

/**
 * Connects to a host. If already connected, closes the connection and connects or fails, depending on the force argument
 * @param {FTPClient} client 
 * @param {string} host 
 * @param {number} port 
 * @param {boolean} force If true, will override any open connection. If false, the function fails if a connection is already open.
 * @returns 
 */
export async function connect(client, host, port, username, force = false){
    let password;
    if (username){
        password = await hiddenQuestion("password : ");
    }

    return await client.connect_(host, port, username, password, force);
}

/**
 * Downloads the file named remote_filename (in the working directory) to path local_path. Assumes path does not point to a local directory.
 * @param {string} remote_filename 
 * @param {fs.PathLike} local_path 
 * @returns 
 */
function download_(client, remote_filename, local_path){
    let writeStream = fs.createWriteStream(local_path);
    return client.downloadTo(writeStream, remote_filename);
}

/**
 * Downloads the file named remote_filename (in the working directory) to local directory local_path. local_path must point to an existing directory.
 * @param {string} remote_filename 
 * @param {fs.PathLike} local_path 
 * @returns 
 */
function downloadToDir(client, remote_filename, local_path){
    local_path += "/" + remote_filename;
    return download_(client, remote_filename, local_path);
}

/**
 * Downloads the file named remote_filename (in the working directory) to path local_path (if local_path points to a directory, appends remote_filename to make the resulting file's path)
 * @param {string} remote_filename 
 * @param {fs.PathLike} local_path 
 */
export async function download(client, remote_filename, local_path){
    let stat;
    try {
        stat = fs.statSync(local_path);
    } catch {
        stat = null;
    }

    if (stat && stat.isDirectory()){
        return downloadToDir(client, remote_filename, local_path);
    }
    return download_(client, remote_filename, local_path);
}

/**
 * 
 * @param {fs.PathLike} local_path 
 * @param {RegExp} filter 
 */
export async function downloadDir(client, local_path, filter){
    let stat = fs.statSync(local_path);
    if (!stat.isDirectory()){
        console.error("local_path must be a directory");
        return;
    }

    console.log("Downloading contents of the remote working directory into", local_path);

    let res = await client.list();
    for (let fileInfo of res){
        if (fileInfo.type == 1){
            if (!filter || filter.test(fileInfo.name)){
                await downloadToDir(client, fileInfo.name, local_path);
            }
        }
    }

    console.log("Finished dowloading.");
}