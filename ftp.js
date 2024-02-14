import fs from 'fs'
import cl from '@twilcynder/commandline'

var current_connection = {
    host: null,
    port: null
}

/**
 * Connects to a host. If already connected, closes the connection and connects or fails, depending on the force argument
 * @param {string} host 
 * @param {number} port 
 * @param {boolean} force If true, will override any open connection. If false, the function fails if a connection is already open.
 * @returns 
 */
export async function connect(client, host, port, force = false){
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
    cl.stopLogging();
}