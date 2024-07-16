// TODO: get rid of this spurious module

let IS_DEPLOYED: boolean = true;
let ACCOUNT_ID: string;
if (process.env.STAGE && process.env.STAGE === 'local') {
  IS_DEPLOYED = false;
  ACCOUNT_ID = '123456789012'
}
else {
  ACCOUNT_ID = process.env.ACCOUNT_ID || 'N/A';
}

const SERVICE: string = process.env.SERVICE || 'N/A';
const STAGE: string = process.env.STAGE  || 'local';
const REGION: string  = process.env.REGION || 'N/A';

export default {
    IS_DEPLOYED,
    SERVICE,
    STAGE,
    ACCOUNT_ID,
    REGION
};