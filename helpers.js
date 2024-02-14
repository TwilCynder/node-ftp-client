import cl from "@twilcynder/commandline"

const term_escape = '\x1b[';
const term_blue = `${term_escape}34m`;
const term_reset = `${term_escape}0m`;

export function logColor(string, colorCode){
    colorCode = "" + colorCode;
    console.log(`${term_escape}${colorCode}m`+string+term_reset);
}

/**
 * @param {import('basic-ftp').FTPResponse} res 
 */
export function FTPResponseResultHandler(res){
    console.log(`Remote (status : ${res.code}) : ${res.message}`);
    cl.stopLogging();
}

export function checkArgs(args, expectedN, message){
    if (args.length < expectedN) {
        console.warn("Usage :", message);
        return false;
    } 
    return true;
}

export async function executeRemote(f, resultHandler){
    try {
        let res = await f();
        if (res && resultHandler) resultHandler(res);
        return res; 
    } catch (err){
        console.error("Remote : Error :", err);
    }
    cl.stopLogging();
}